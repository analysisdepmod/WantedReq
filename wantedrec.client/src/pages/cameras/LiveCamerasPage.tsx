import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Typography, Space, Spin, Tag, Badge, Tooltip, Button, Select, Alert } from 'antd';
import {
    VideoCameraOutlined,
    ThunderboltOutlined,
    HomeOutlined,
    WifiOutlined,
    ReloadOutlined,
    SettingOutlined,
    LinkOutlined,
    WarningOutlined,
} from '@ant-design/icons';
import { useMonitor } from '../../hooks/useMonitor';
import { identifyFace } from '../../api/recognitionApi';
import { snapshotUrl } from '../../api/camerasApi';
import type { CameraDto, LiveRecognitionResultDto } from '../../types/camera.types';
import { detectCameraKind } from '../../types/camera.types';

const { Text } = Typography;
const STORAGE_KEY = 'current_device_id';

const CSS = `
  @keyframes pulse {
    0%,100% { box-shadow:0 0 0 0 rgba(22,163,74,.6); }
    60%      { box-shadow:0 0 0 8px rgba(22,163,74,0); }
  }
  @keyframes scan {
    0%   { top:0%; opacity:.8; }
    100% { top:100%; opacity:0; }
  }
  @keyframes suspectFlash {
    0%,100% { border-color:#fca5a5; }
    50%      { border-color:#dc2626; box-shadow:0 0 20px rgba(220,38,38,.4); }
  }
  .cam-panel { transition:border-color .3s,box-shadow .3s; }
  .cam-panel.suspect { animation:suspectFlash 1s infinite; }
`;

const getCurrentDeviceId = (): number | null => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = Number(raw);
    return Number.isNaN(parsed) ? null : parsed;
};

const getLocalDeviceLabel = (d: MediaDeviceInfo, index: number) =>
    d.label?.trim() || `كاميرا ${index}`;

// ── ThreatLevel ──────────────────────────────────────────
function ThreatBadge({ level }: { level: 'clear' | 'detected' | 'suspect' }) {
    const map = {
        clear: { label: 'آمن', color: '#16a34a', bg: '#dcfce7', border: '#bbf7d0' },
        detected: { label: 'تعرف', color: '#d97706', bg: '#fef3c7', border: '#fde68a' },
        suspect: { label: '⚠ مشتبه', color: '#dc2626', bg: '#fee2e2', border: '#fca5a5' },
    };
    const m = map[level];

    return (
        <span
            style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 20,
                color: m.color,
                background: m.bg,
                border: `1px solid ${m.border}`,
            }}
        >
            {m.label}
        </span>
    );
}

// ═══════════════════════════════════════════════════════
//  LocalCameraPanel
// ═══════════════════════════════════════════════════════
function LocalCameraPanel({
    camera,
    deviceId,
    deviceLabel,
    intervalSec,
    onRecognized,
}: {
    camera: CameraDto;
    deviceId: string | null;
    deviceLabel?: string | null;
    intervalSec: number;
    onRecognized: (cam: CameraDto, result: LiveRecognitionResultDto) => void;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const isRunning = useRef(false);

    const [ready, setReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<LiveRecognitionResultDto | null>(null);
    const [pending, setPending] = useState(false);
    const [frames, setFrames] = useState(0);

    const capture = useCallback(async () => {
        if (isRunning.current) return;

        const v = videoRef.current;
        const c = canvasRef.current;
        if (!v || !c || v.readyState < 2) return;

        isRunning.current = true;
        setPending(true);

        try {
            c.width = v.videoWidth || 640;
            c.height = v.videoHeight || 480;
            c.getContext('2d')?.drawImage(v, 0, 0);

            const blob = await new Promise<Blob | null>(r => c.toBlob(r, 'image/jpeg', 0.82));
            if (!blob) return;

            const data = await identifyFace(
                new File([blob], 'f.jpg', { type: 'image/jpeg' }),
                camera.cameraId
            );

            setResult(data);
            setFrames(f => f + 1);

            if (data.knownFaces > 0) onRecognized(camera, data);
        } catch {
            // ignore
        } finally {
            isRunning.current = false;
            setPending(false);
        }
    }, [camera, onRecognized]);

    useEffect(() => {
        setReady(false);
        setError(null);
        setResult(null);
        setFrames(0);

        if (!deviceId) {
            setError('لم يتم العثور على كامرة محلية مطابقة لهذا الاندكس');
            return;
        }

        let mounted = true;

        (async () => {
            try {
                const s = await navigator.mediaDevices.getUserMedia({
                    video: {
                        deviceId: { exact: deviceId },
                        width: 1280,
                        height: 720,
                    },
                });

                if (!mounted) {
                    s.getTracks().forEach(t => t.stop());
                    return;
                }

                streamRef.current = s;

                if (videoRef.current) {
                    videoRef.current.srcObject = s;
                    await videoRef.current.play();
                }

                setReady(true);
                setError(null);
            } catch {
                if (mounted) {
                    setError('فشل فتح الكامرة المحلية المحددة');
                }
            }
        })();

        return () => {
            mounted = false;
            streamRef.current?.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        };
    }, [deviceId]);

    useEffect(() => {
        if (!ready) return;

        capture();
        const id = window.setInterval(capture, intervalSec * 1000);
        return () => window.clearInterval(id);
    }, [ready, capture, intervalSec]);

    const hasSuspect = result?.faces.some(f => f.isKnown && f.person?.hasSuspectRecord);
    const threatLevel =
        hasSuspect ? 'suspect' : (result?.knownFaces ?? 0) > 0 ? 'detected' : 'clear';

    return (
        <CamShell
            camera={camera}
            frames={frames}
            pending={pending}
            threatLevel={threatLevel}
            error={error ?? undefined}
            subLabel={
                deviceLabel
                    ? `[${camera.localDeviceIndex ?? '-'}] ${deviceLabel}`
                    : camera.localDeviceIndex !== undefined
                        ? `اندكس محلي [${camera.localDeviceIndex}]`
                        : undefined
            }
        >
            <div
                style={{
                    background: 'var(--app-video-bg)',
                    aspectRatio: '16/9',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: ready ? 'block' : 'none',
                    }}
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />

                {pending && ready && (
                    <div
                        style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            height: 3,
                            background: 'linear-gradient(90deg,transparent,#06b6d4,transparent)',
                            animation: 'scan 1.8s ease infinite',
                            boxShadow: '0 0 12px #06b6d4',
                        }}
                    />
                )}

                {ready && (
                    <>
                        {['top:8px;left:8px', 'top:8px;right:8px', 'bottom:8px;left:8px', 'bottom:8px;right:8px'].map((pos, i) => {
                            const p = Object.fromEntries(pos.split(';').map(s => s.split(':')));
                            const bTop = i < 2 ? '2px solid #06b6d4' : 'none';
                            const bBottom = i >= 2 ? '2px solid #06b6d4' : 'none';
                            const bLeft = i === 0 || i === 2 ? '2px solid #06b6d4' : 'none';
                            const bRight = i === 1 || i === 3 ? '2px solid #06b6d4' : 'none';

                            return (
                                <div
                                    key={i}
                                    style={{
                                        position: 'absolute',
                                        ...p,
                                        width: 18,
                                        height: 18,
                                        borderTop: bTop,
                                        borderBottom: bBottom,
                                        borderLeft: bLeft,
                                        borderRight: bRight,
                                    }}
                                />
                            );
                        })}
                    </>
                )}

                {ready && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 10,
                            left: 10,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            background: 'rgba(0,0,0,.6)',
                            backdropFilter: 'blur(4px)',
                            borderRadius: 20,
                            padding: '3px 10px',
                            border: '1px solid rgba(255,255,255,.1)',
                        }}
                    >
                        <span
                            style={{
                                width: 7,
                                height: 7,
                                borderRadius: '50%',
                                background: '#ef4444',
                                display: 'inline-block',
                                animation: 'pulse 1.5s infinite',
                            }}
                        />
                        <Text style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>LIVE REC</Text>
                    </div>
                )}

                {!ready && !error && (
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 10,
                        }}
                    >
                        <Spin />
                        <Text style={{ color: 'var(--app-muted)', fontSize: 11 }}>جاري الاتصال…</Text>
                    </div>
                )}
            </div>
        </CamShell>
    );
}

// ═══════════════════════════════════════════════════════
//  IpRtspPanel
// ═══════════════════════════════════════════════════════
function IpRtspPanel({
    camera,
    intervalSec,
    onRecognized,
}: {
    camera: CameraDto;
    intervalSec: number;
    onRecognized: (cam: CameraDto, result: LiveRecognitionResultDto) => void;
}) {
    const [imgSrc, setImgSrc] = useState('');
    const [pending, setPending] = useState(false);
    const [frames, setFrames] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<LiveRecognitionResultDto | null>(null);
    const isRunning = useRef(false);

    const capture = useCallback(async () => {
        if (isRunning.current) return;

        isRunning.current = true;
        setPending(true);

        try {
            const res = await fetch(snapshotUrl(camera.cameraId), {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });

            if (!res.ok) throw new Error();

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);

            setImgSrc(prev => {
                if (prev) URL.revokeObjectURL(prev);
                return url;
            });

            const data = await identifyFace(
                new File([blob], 'f.jpg', { type: 'image/jpeg' }),
                camera.cameraId
            );

            setResult(data);
            setFrames(f => f + 1);
            setError(null);

            if (data.knownFaces > 0) onRecognized(camera, data);
        } catch {
            setError('تعذر الاتصال بالكاميرا');
        } finally {
            isRunning.current = false;
            setPending(false);
        }
    }, [camera, onRecognized]);

    useEffect(() => {
        capture();
        const id = window.setInterval(capture, intervalSec * 1000);

        return () => {
            window.clearInterval(id);
            if (imgSrc) URL.revokeObjectURL(imgSrc);
        };
    }, [capture, intervalSec, imgSrc]);

    const hasSuspect = result?.faces.some(f => f.isKnown && f.person?.hasSuspectRecord);
    const threatLevel =
        hasSuspect ? 'suspect' : (result?.knownFaces ?? 0) > 0 ? 'detected' : 'clear';

    return (
        <CamShell
            camera={camera}
            frames={frames}
            pending={pending}
            threatLevel={threatLevel}
            error={error ?? undefined}
        >
            <div
                style={{
                    background: 'var(--app-video-bg)',
                    aspectRatio: '16/9',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {imgSrc ? (
                    <img src={imgSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {error ? (
                            <div style={{ textAlign: 'center' }}>
                                <WifiOutlined style={{ fontSize: 32, color: 'var(--app-muted)', marginBottom: 6 }} />
                                <br />
                                <Text style={{ color: 'var(--app-muted)', fontSize: 11 }}>NO SIGNAL</Text>
                            </div>
                        ) : (
                            <Spin />
                        )}
                    </div>
                )}

                {pending && imgSrc && (
                    <div
                        style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            height: 3,
                            background: 'linear-gradient(90deg,transparent,#06b6d4,transparent)',
                            animation: 'scan 1.8s ease infinite',
                            boxShadow: '0 0 12px #06b6d4',
                        }}
                    />
                )}
            </div>
        </CamShell>
    );
}

// ═══════════════════════════════════════════════════════
//  IpMjpegPanel
// ═══════════════════════════════════════════════════════
function IpMjpegPanel({
    camera,
    intervalSec,
    onRecognized,
}: {
    camera: CameraDto;
    intervalSec: number;
    onRecognized: (cam: CameraDto, result: LiveRecognitionResultDto) => void;
}) {
    const imgRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isRunning = useRef(false);
    const [result, setResult] = useState<LiveRecognitionResultDto | null>(null);
    const [pending, setPending] = useState(false);
    const [frames, setFrames] = useState(0);
    const [imgErr, setImgErr] = useState(false);

    const capture = useCallback(async () => {
        if (isRunning.current) return;

        const img = imgRef.current;
        const c = canvasRef.current;
        if (!img || !c || !img.complete || img.naturalWidth === 0) return;

        isRunning.current = true;
        setPending(true);

        try {
            c.width = img.naturalWidth;
            c.height = img.naturalHeight;
            c.getContext('2d')?.drawImage(img, 0, 0);

            const blob = await new Promise<Blob | null>(r => c.toBlob(r, 'image/jpeg', 0.82));
            if (!blob) return;

            const data = await identifyFace(
                new File([blob], 'f.jpg', { type: 'image/jpeg' }),
                camera.cameraId
            );

            setResult(data);
            setFrames(f => f + 1);

            if (data.knownFaces > 0) onRecognized(camera, data);
        } catch {
            // ignore
        } finally {
            isRunning.current = false;
            setPending(false);
        }
    }, [camera, onRecognized]);

    useEffect(() => {
        const id = window.setInterval(capture, intervalSec * 1000);
        return () => window.clearInterval(id);
    }, [capture, intervalSec]);

    const hasSuspect = result?.faces.some(f => f.isKnown && f.person?.hasSuspectRecord);
    const threatLevel =
        hasSuspect ? 'suspect' : (result?.knownFaces ?? 0) > 0 ? 'detected' : 'clear';

    return (
        <CamShell camera={camera} frames={frames} pending={pending} threatLevel={threatLevel}>
            <div
                style={{
                    background: 'var(--app-video-bg)',
                    aspectRatio: '16/9',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {imgErr ? (
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <WifiOutlined style={{ fontSize: 32, color: 'var(--app-muted)', marginBottom: 6 }} />
                        <Text style={{ color: 'var(--app-muted)', fontSize: 11 }}>NO SIGNAL</Text>
                    </div>
                ) : (
                    <img
                        ref={imgRef}
                        src={camera.streamUrl}
                        onError={() => setImgErr(true)}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        alt=""
                    />
                )}

                <canvas ref={canvasRef} style={{ display: 'none' }} />

                {pending && !imgErr && (
                    <div
                        style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            height: 3,
                            background: 'linear-gradient(90deg,transparent,#06b6d4,transparent)',
                            animation: 'scan 1.8s ease infinite',
                        }}
                    />
                )}
            </div>
        </CamShell>
    );
}

// ═══════════════════════════════════════════════════════
//  CamShell
// ═══════════════════════════════════════════════════════
function CamShell({
    camera,
    frames,
    pending,
    threatLevel,
    error,
    subLabel,
    children,
}: {
    camera: CameraDto;
    frames: number;
    pending: boolean;
    threatLevel: 'clear' | 'detected' | 'suspect';
    error?: string;
    subLabel?: string;
    children: React.ReactNode;
}) {
    const borderColor =
        threatLevel === 'suspect'
            ? '#dc2626'
            : threatLevel === 'detected'
                ? '#d97706'
                : '#e4e9f2';

    return (
        <div
            className={`cam-panel${threatLevel === 'suspect' ? ' suspect' : ''}`}
            style={{
                background: 'var(--app-surface)',
                borderRadius: 14,
                overflow: 'hidden',
                border: `1px solid ${borderColor}`,
                boxShadow:
                    threatLevel === 'suspect'
                        ? '0 0 24px rgba(220,38,38,.25)'
                        : '0 4px 16px rgba(15,23,42,.08)',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {children}

            <div
                style={{
                    padding: '8px 12px',
                    background: 'var(--app-surface-2)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <div>
                    <Text style={{ color: 'var(--app-text)', fontSize: 12, fontWeight: 600, display: 'block' }}>
                        {camera.name}
                    </Text>
                    <Text style={{ color: 'var(--app-muted)', fontSize: 10 }}>
                        {subLabel || camera.area || ''}
                    </Text>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {frames > 0 && (
                        <Text style={{ color: 'var(--app-muted)', fontSize: 10 }}>{frames}F</Text>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span
                            style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background: pending ? '#f59e0b' : '#22c55e',
                                display: 'inline-block',
                                animation: 'pulse 2s infinite',
                            }}
                        />
                        <Text style={{ color: 'var(--app-muted)', fontSize: 10 }}>
                            {pending ? 'AI' : 'LIVE'}
                        </Text>
                    </div>

                    <ThreatBadge level={threatLevel} />
                </div>
            </div>

            {error && (
                <div
                    style={{
                        padding: '4px 12px',
                        background: 'var(--app-soft-red)',
                        borderTop: '1px solid #fee2e2',
                    }}
                >
                    <Text style={{ color: '#dc2626', fontSize: 11 }}>{error}</Text>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════
//  LiveCamerasPage
// ═══════════════════════════════════════════════════════
export default function LiveCamerasPage() {
    const {
        localDevices,
        devicesReady,
        cameras,
        isLoading,
        localCameras,
        onRecognized,
        totalFrames,
        totalKnown,
        deviceMapping,
        setDeviceMapping,
        refetch,
    } = useMonitor(3);

    const [currentDeviceId, setCurrentDeviceId] = useState<number | null>(() => getCurrentDeviceId());
    const [showMap, setShowMap] = useState(false);
    const [layout, setLayout] = useState<'2' | '3' | '4'>('3');

    useEffect(() => {
        const syncDevice = () => setCurrentDeviceId(getCurrentDeviceId());

        window.addEventListener('storage', syncDevice);
        window.addEventListener('focus', syncDevice);

        return () => {
            window.removeEventListener('storage', syncDevice);
            window.removeEventListener('focus', syncDevice);
        };
    }, []);

    // ── ثبّت الربط تلقائيًا حسب localDeviceIndex بدون fallback عشوائي ──
    useEffect(() => {
        if (localDevices.length === 0 || localCameras.length === 0) return;

        setDeviceMapping(prev => {
            const next = { ...prev };
            let changed = false;

            for (const cam of localCameras) {
                const manualDeviceId = prev[cam.cameraId];
                const manualStillExists = manualDeviceId && localDevices.some(d => d.deviceId === manualDeviceId);

                if (manualStillExists) continue;

                const idx = cam.localDeviceIndex;
                if (idx !== undefined && idx !== null && idx >= 0 && idx < localDevices.length) {
                    const mapped = localDevices[idx].deviceId;
                    if (next[cam.cameraId] !== mapped) {
                        next[cam.cameraId] = mapped;
                        changed = true;
                    }
                }
            }

            return changed ? next : prev;
        });
    }, [localDevices, localCameras, setDeviceMapping]);

    const resolveLocalDeviceId = useCallback((cam: CameraDto): string | null => {
        const manualDeviceId = deviceMapping[cam.cameraId];
        if (manualDeviceId && localDevices.some(d => d.deviceId === manualDeviceId)) {
            return manualDeviceId;
        }

        const idx = cam.localDeviceIndex;
        if (idx === undefined || idx === null) return null;
        if (idx < 0 || idx >= localDevices.length) return null;

        return localDevices[idx]?.deviceId ?? null;
    }, [deviceMapping, localDevices]);

    const resolveLocalDeviceLabel = useCallback((cam: CameraDto): string | null => {
        const deviceId = resolveLocalDeviceId(cam);
        if (!deviceId) return null;

        const idx = localDevices.findIndex(d => d.deviceId === deviceId);
        if (idx < 0) return null;

        return getLocalDeviceLabel(localDevices[idx], idx);
    }, [localDevices, resolveLocalDeviceId]);

    const localDeviceOptions = useMemo(
        () =>
            localDevices.map((d, i) => ({
                value: d.deviceId,
                label: `[${i}] ${getLocalDeviceLabel(d, i)}`,
            })),
        [localDevices]
    );

    if (!devicesReady || isLoading) {
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    background: 'var(--app-page-bg)',
                    flexDirection: 'column',
                    gap: 14,
                }}
            >
                <Spin size="large" />
                <Text type="secondary">
                    {devicesReady ? 'جاري تحميل الكاميرات…' : 'الوصول لأجهزة الكاميرا…'}
                </Text>
            </div>
        );
    }

    const unresolvedLocalCount = localCameras.filter(c => !resolveLocalDeviceId(c)).length;

    return (
        <>
            <style>{CSS}</style>

            <div style={{ background: 'var(--app-page-bg)', minHeight: '100vh', direction: 'rtl' }}>
                <div
                    style={{
                        background: 'linear-gradient(135deg,var(--app-hero-start),var(--app-hero-end))',
                        padding: '10px 20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 10,
                    }}
                >
                    <Space size={14} align="center">
                        <div
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: 9,
                                background: 'linear-gradient(135deg,#2563eb,#7c3aed)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <ThunderboltOutlined style={{ color: '#fff', fontSize: 18 }} />
                        </div>

                        <div>
                            <Text style={{ color: '#fff', fontWeight: 700, fontSize: 14, display: 'block' }}>
                                مركز المراقبة المباشرة
                            </Text>
                            <Text style={{ color: 'rgba(255,255,255,.78)', fontSize: 11 }}>
                                NODE: CAM-CTRL • بث مباشر
                            </Text>
                            <div style={{ marginTop: 2 }}>
                                <Text style={{ color: '#bfdbfe', fontSize: 11 }}>
                                    <LinkOutlined style={{ marginLeft: 4 }} />
                                    الجهاز الحالي: {currentDeviceId ? `#${currentDeviceId}` : 'غير محدد'}
                                </Text>
                            </div>
                        </div>
                    </Space>

                    <Space size={10} wrap>
                        {[
                            { label: 'الفريمات', value: totalFrames, color: 'var(--app-muted)' },
                            { label: 'التعرفات', value: totalKnown, color: '#22c55e' },
                            { label: 'الكاميرات', value: cameras.length, color: '#60a5fa' },
                        ].map(s => (
                            <div
                                key={s.label}
                                style={{
                                    background: 'var(--app-surface-2)',
                                    border: '1px solid var(--app-border)',
                                    borderRadius: 8,
                                    padding: '4px 12px',
                                    textAlign: 'center',
                                }}
                            >
                                <div style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.value}</div>
                                <div style={{ fontSize: 10, color: 'var(--app-muted)' }}>{s.label}</div>
                            </div>
                        ))}

                        <Badge
                            status="processing"
                            text={<Text style={{ color: '#22c55e', fontWeight: 700, fontSize: 12 }}>● LIVE</Text>}
                        />

                        <Select
                            value={layout}
                            onChange={v => setLayout(v as '2' | '3' | '4')}
                            options={[
                                { value: '2', label: '2 عمود' },
                                { value: '3', label: '3 أعمدة' },
                                { value: '4', label: '4 أعمدة' },
                            ]}
                            style={{ width: 100 }}
                            size="small"
                        />

                        <Tooltip title="ضبط الأجهزة">
                            <Button
                                icon={<SettingOutlined />}
                                onClick={() => setShowMap(v => !v)}
                                size="small"
                                type={showMap ? 'primary' : 'default'}
                                style={{ borderRadius: 7 }}
                            />
                        </Tooltip>

                        <Tooltip title="تحديث">
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={() => refetch()}
                                size="small"
                                style={{ borderRadius: 7 }}
                            />
                        </Tooltip>
                    </Space>
                </div>

                {!currentDeviceId && (
                    <div style={{ padding: '12px 20px 0' }}>
                        <Alert
                            type="warning"
                            showIcon
                            message="لم يتم تحديد الجهاز الحالي"
                            description="الكامرات المحلية تعتمد على الجهاز المختار. افتح صفحة المراقبة الرئيسية أولًا وحدد هل هذا جهاز جديد أو قديم."
                        />
                    </div>
                )}

                {localDevices.length > 0 && (
                    <div
                        style={{
                            background: 'var(--app-soft-blue)',
                            borderBottom: '1px solid #bfdbfe',
                            padding: '6px 20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            flexWrap: 'wrap',
                        }}
                    >
                        <HomeOutlined style={{ color: '#2563eb', fontSize: 12 }} />
                        <Text style={{ fontSize: 11, color: '#1d4ed8' }}>
                            {localDevices.length} كاميرا محلية على هذا الجهاز:
                        </Text>

                        {localDevices.map((d, i) => (
                            <Tag key={d.deviceId} color="blue" style={{ fontSize: 10 }}>
                                [{i}] {getLocalDeviceLabel(d, i)}
                            </Tag>
                        ))}
                    </div>
                )}

                {unresolvedLocalCount > 0 && (
                    <div style={{ padding: '12px 20px 0' }}>
                        <Alert
                            type="warning"
                            showIcon
                            message="بعض الكامرات المحلية غير مربوطة بجهاز فعلي"
                            description={`عددها ${unresolvedLocalCount}. افتح "ضبط الأجهزة" واختر الكامرة الصحيحة لكل بطاقة.`}
                        />
                    </div>
                )}

                {showMap && localCameras.length > 0 && (
                    <div
                        style={{
                            background: 'var(--app-surface)',
                            borderBottom: '1px solid var(--app-border)',
                            padding: '10px 20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            flexWrap: 'wrap',
                        }}
                    >
                        <SettingOutlined style={{ color: '#2563eb' }} />
                        <Text style={{ fontSize: 12, fontWeight: 600 }}>ضبط الأجهزة المحلية:</Text>

                        {localCameras.map(cam => (
                            <Space key={cam.cameraId} size={6}>
                                <Text style={{ fontSize: 12, color: 'var(--app-muted)' }}>
                                    {cam.name} [{cam.localDeviceIndex ?? '-'}]:
                                </Text>
                                <Select
                                    size="small"
                                    style={{ width: 260 }}
                                    value={resolveLocalDeviceId(cam) ?? undefined}
                                    onChange={v => setDeviceMapping(p => ({ ...p, [cam.cameraId]: v }))}
                                    options={localDeviceOptions}
                                    placeholder="اختر كامرة الجهاز"
                                />
                            </Space>
                        ))}
                    </div>
                )}

                <div style={{ padding: '16px 20px' }}>
                    {cameras.length === 0 ? (
                        <div
                            style={{
                                textAlign: 'center',
                                padding: 80,
                                background: 'var(--app-surface)',
                                borderRadius: 16,
                                border: '1px solid var(--app-border)',
                            }}
                        >
                            <VideoCameraOutlined style={{ fontSize: 64, color: '#cbd5e1' }} />
                            <br />
                            <br />
                            <Text type="secondary">لا توجد كاميرات نشطة</Text>
                        </div>
                    ) : (
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: `repeat(${layout}, 1fr)`,
                                gap: 14,
                            }}
                        >
                            {cameras.map(cam => {
                                const kind = detectCameraKind(cam);

                                if (kind === 'local') {
                                    return (
                                        <LocalCameraPanel
                                            key={cam.cameraId}
                                            camera={cam}
                                            deviceId={resolveLocalDeviceId(cam)}
                                            deviceLabel={resolveLocalDeviceLabel(cam)}
                                            intervalSec={3}
                                            onRecognized={onRecognized}
                                        />
                                    );
                                }

                                if (kind === 'ip-rtsp') {
                                    return (
                                        <IpRtspPanel
                                            key={cam.cameraId}
                                            camera={cam}
                                            intervalSec={3}
                                            onRecognized={onRecognized}
                                        />
                                    );
                                }

                                return (
                                    <IpMjpegPanel
                                        key={cam.cameraId}
                                        camera={cam}
                                        intervalSec={3}
                                        onRecognized={onRecognized}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}