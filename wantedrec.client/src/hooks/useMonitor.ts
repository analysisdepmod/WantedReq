// ═══════════════════════════════════════════════════════
//  src/hooks/useMonitor.ts
//  هوك المراقبة المباشرة — local devices + recognition
// ═══════════════════════════════════════════════════════
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCameras } from '../api/camerasApi';
import { identifyFace } from '../api/recognitionApi';
import type { CameraDto, LiveRecognitionResultDto } from '../types/camera.types';
import { detectCameraKind } from '../types/camera.types';

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
    const [localDevices, setLocalDevices] = useState<MediaDeviceInfo[]>([]);
    const [devicesReady, setDevicesReady] = useState(false);
    const [feedStates, setFeedStates] = useState<Partial<Record<number, CameraFeedState>>>({});
    const [events, setEvents] = useState<RecognitionEvent[]>([]);
    const [deviceMapping, setDeviceMapping] = useState<Record<number, string>>({});
    const [totalKnown, setTotalKnown] = useState(0);
    const [totalFrames, setTotalFrames] = useState(0);

    // ── جلب الأجهزة المحلية ───────────────────────────────
    useEffect(() => {
        (async () => {
            try {
                const tmp = await navigator.mediaDevices.getUserMedia({ video: true });
                tmp.getTracks().forEach(t => t.stop());

                const all = await navigator.mediaDevices.enumerateDevices();
                setLocalDevices(all.filter(d => d.kind === 'videoinput'));
            } catch {
                // user denied
            } finally {
                setDevicesReady(true);
            }
        })();
    }, []);

    // ── جلب الكاميرات النشطة ──────────────────────────────
    const {
        data: cameras = [],
        isLoading,
        refetch,
    } = useQuery<CameraDto[]>({
        queryKey: ['cameras-active'],
        queryFn: () => getCameras({ isActive: true }),
        enabled: devicesReady,
        refetchInterval: 60_000,
    });

    const localCameras = useMemo(
        () =>
            cameras
                .filter(c => detectCameraKind(c) === 'local')
                .sort((a, b) => a.cameraId - b.cameraId),
        [cameras]
    );

    // ── مطابقة device لكل كاميرا محلية ───────────────────
    const getDeviceId = useCallback(
        (cam: CameraDto): string | null => {
            if (deviceMapping[cam.cameraId]) return deviceMapping[cam.cameraId];

            if (cam.localDeviceIndex !== undefined && cam.localDeviceIndex !== null) {
                return localDevices[cam.localDeviceIndex]?.deviceId ?? null;
            }

            const idx = localCameras.findIndex(c => c.cameraId === cam.cameraId);
            return localDevices[idx]?.deviceId ?? null;
        },
        [deviceMapping, localDevices, localCameras]
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