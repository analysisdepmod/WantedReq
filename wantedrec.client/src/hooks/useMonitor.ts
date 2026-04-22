import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCameras } from '../api/camerasApi';
import type { CameraDto, LiveRecognitionResultDto } from '../types/camera.types';
import { detectCameraKind } from '../types/camera.types';

const STORAGE_KEY = 'current_device_id';

const getCurrentDeviceId = (): number | null => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = Number(raw);
    return Number.isNaN(parsed) ? null : parsed;
};

export interface CameraFeedState {
    cameraId: number;
    result: LiveRecognitionResultDto | null;
    pending: boolean;
    frames: number;
    error?: string;
}

export interface RecognitionEvent {
    id: string;
    cameraId: number;
    cameraName: string;
    personId: number;
    personName: string;
    score: number;
    isMatch: boolean;
    isSuspect: boolean;
    imageBase64?: string;
    timestamp: Date;
}

export function useMonitor(intervalSec = 3) {
    const [currentDeviceId, setCurrentDeviceId] = useState<number | null>(() => getCurrentDeviceId());
    const [localDevices, setLocalDevices] = useState<MediaDeviceInfo[]>([]);
    const [devicesReady, setDevicesReady] = useState(false);
    const [feedStates, setFeedStates] = useState<Partial<Record<number, CameraFeedState>>>({});
    const [events, setEvents] = useState<RecognitionEvent[]>([]);
    const [deviceMapping, setDeviceMapping] = useState<Record<number, string>>({});
    const [totalKnown, setTotalKnown] = useState(0);
    const [totalFrames, setTotalFrames] = useState(0);

    // ── مزامنة الجهاز الحالي من localStorage ───────────────
    useEffect(() => {
        const syncCurrentDevice = () => setCurrentDeviceId(getCurrentDeviceId());

        window.addEventListener('storage', syncCurrentDevice);
        window.addEventListener('focus', syncCurrentDevice);

        return () => {
            window.removeEventListener('storage', syncCurrentDevice);
            window.removeEventListener('focus', syncCurrentDevice);
        };
    }, []);

    // ── جلب الأجهزة المحلية بعد طلب إذن الكامرة ────────────
    useEffect(() => {
        let disposed = false;

        const loadDevices = async () => {
            try {
                const tmp = await navigator.mediaDevices.getUserMedia({ video: true });
                tmp.getTracks().forEach(t => t.stop());

                const all = await navigator.mediaDevices.enumerateDevices();
                const videoInputs = all.filter(d => d.kind === 'videoinput');

                if (!disposed) {
                    // نحافظ على ترتيب المتصفح نفسه لأن localDeviceIndex يعتمد عليه
                    setLocalDevices(videoInputs);
                }
            } catch {
                if (!disposed) {
                    setLocalDevices([]);
                }
            } finally {
                if (!disposed) {
                    setDevicesReady(true);
                }
            }
        };

        loadDevices();

        const mediaDevices = navigator.mediaDevices;
        if (mediaDevices?.addEventListener) {
            mediaDevices.addEventListener('devicechange', loadDevices);
        }

        return () => {
            disposed = true;
            if (mediaDevices?.removeEventListener) {
                mediaDevices.removeEventListener('devicechange', loadDevices);
            }
        };
    }, []);

    // ── حذف أي mappings قديمة لم تعد موجودة ───────────────
    useEffect(() => {
        setDeviceMapping(prev => {
            const validIds = new Set(localDevices.map(d => d.deviceId));
            const next: Record<number, string> = {};
            let changed = false;

            Object.entries(prev).forEach(([cameraId, deviceId]) => {
                if (validIds.has(deviceId)) {
                    next[Number(cameraId)] = deviceId;
                } else {
                    changed = true;
                }
            });

            return changed ? next : prev;
        });
    }, [localDevices]);

    // ── جلب الكامرات النشطة الخاصة بالجهاز الحالي ──────────
    const {
        data: cameras = [],
        isLoading,
        refetch,
    } = useQuery<CameraDto[]>({
        queryKey: ['cameras-active', currentDeviceId],
        queryFn: () => getCameras({ isActive: true }),
        enabled: devicesReady,
        refetchInterval: 60_000,
    });

    const localCameras = useMemo(
        () =>
            cameras
                .filter(c => detectCameraKind(c) === 'local')
                .sort((a, b) => {
                    const ai = a.localDeviceIndex ?? Number.MAX_SAFE_INTEGER;
                    const bi = b.localDeviceIndex ?? Number.MAX_SAFE_INTEGER;
                    return ai - bi;
                }),
        [cameras]
    );

    // ── مطابقة deviceId لكل كاميرا محلية ───────────────────
    const getDeviceId = useCallback(
        (cam: CameraDto): string | null => {
            const mappedDeviceId = deviceMapping[cam.cameraId];
            if (mappedDeviceId && localDevices.some(d => d.deviceId === mappedDeviceId)) {
                return mappedDeviceId;
            }

            if (cam.localDeviceIndex !== undefined && cam.localDeviceIndex !== null) {
                if (cam.localDeviceIndex >= 0 && cam.localDeviceIndex < localDevices.length) {
                    return localDevices[cam.localDeviceIndex]?.deviceId ?? null;
                }
            }

            return null;
        },
        [deviceMapping, localDevices]
    );

    // ── تحديث حالة كاميرا واحدة ──────────────────────────
    const updateFeed = useCallback((cameraId: number, patch: Partial<CameraFeedState>) => {
        setFeedStates(prev => {
            const current = prev[cameraId];

            return {
                ...prev,
                [cameraId]: {
                    result: current?.result ?? null,
                    pending: current?.pending ?? false,
                    frames: current?.frames ?? 0,
                    ...current,
                    ...patch,
                    cameraId,
                },
            };
        });
    }, []);

    // ── callback عند كل تعرف ناجح ─────────────────────────
    const onRecognized = useCallback((cam: CameraDto, result: LiveRecognitionResultDto) => {
        const newEvents: RecognitionEvent[] = result.faces
            .filter(f => f.isKnown && f.person)
            .map(f => ({
                id: `${cam.cameraId}-${f.person!.personId}-${Date.now()}`,
                cameraId: cam.cameraId,
                cameraName: cam.name,
                personId: f.person!.personId,
                personName: f.name,
                score: f.score,
                isMatch: true,
                isSuspect: f.person!.hasSuspectRecord ?? false,
                imageBase64: f.primaryImageBase64,
                timestamp: new Date(),
            }));

        if (newEvents.length > 0) {
            setEvents(prev => [...newEvents, ...prev].slice(0, 100));
            setTotalKnown(t => t + newEvents.length);
        }

        setTotalFrames(t => t + 1);
    }, []);

    return {
        currentDeviceId,
        localDevices,
        devicesReady,
        cameras,
        isLoading,
        refetch,
        localCameras,
        getDeviceId,
        feedStates,
        updateFeed,
        onRecognized,
        events,
        totalKnown,
        totalFrames,
        deviceMapping,
        setDeviceMapping,
        intervalSec,
    };
}