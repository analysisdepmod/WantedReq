import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Typography, Space, Spin, Tag, Button, Select, Alert, Input, Tooltip } from 'antd';
import {
    VideoCameraOutlined,
    HomeOutlined,
    WifiOutlined,
    ReloadOutlined,
    SettingOutlined,
    LinkOutlined,
    WarningOutlined,
    FullscreenOutlined,
    FullscreenExitOutlined,
    SearchOutlined,
    AppstoreOutlined,
} from '@ant-design/icons';
import { useMonitor } from '../../hooks/useMonitor';
import { identifyFace } from '../../api/recognitionApi';
import { snapshotUrl } from '../../api/camerasApi';
import type { CameraDto, LiveRecognitionResultDto } from '../../types/camera.types';
import { detectCameraKind } from '../../types/camera.types';

const { Text, Title } = Typography;
const STORAGE_KEY = 'current_device_id';



const getCurrentDeviceId = (): number | null => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isNaN(parsed) ? null : parsed;
};

const getLocalDeviceLabel = (d: MediaDeviceInfo, index: number) =>
    d.label?.trim() || `كاميرا ${index}`;

function kindLabel(kind: ReturnType<typeof detectCameraKind>) {
    if (kind === 'local') return 'محلية';
    if (kind === 'ip-rtsp') return 'RTSP';
    return 'MJPEG';
}

function kindColor(kind: ReturnType<typeof detectCameraKind>) {
    if (kind === 'local') return 'blue';
    if (kind === 'ip-rtsp') return 'magenta';
    return 'purple';
}

function TileShell({
    camera,
    threatLevel,
    error,
    subLabel,
    children,
}: {
    camera: CameraDto;
    threatLevel: 'clear' | 'detected' | 'suspect';
    error?: string;
    subLabel?: string;
    children: React.ReactNode;
}) {
    const hostRef = useRef<HTMLDivElement>(null);
    const kind = detectCameraKind(camera);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const onFullscreenChange = () => {
            setIsFullscreen(document.fullscreenElement === hostRef.current);
        };

        document.addEventListener('fullscreenchange', onFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
    }, []);

    const toggleFullscreen = async () => {
        const el = hostRef.current;
        if (!el) return;

        try {
            if (document.fullscreenElement === el) {
                await document.exitFullscreen();
            } else if (!document.fullscreenElement) {
                await el.requestFullscreen();
            } else {
                await document.exitFullscreen();
                await el.requestFullscreen();
            }
        } catch {
            // ignore fullscreen failures
        }
    };

    return (
        <div ref={hostRef} className={`tile ${threatLevel}`}>
            <div className="tile-media">
                {children}

                <div className="tile-overlay-top">
                    <div className="tile-title">
                        <span className="name">{camera.name}</span>
                        <span className="sub">{subLabel || camera.area || camera.code || '—'}</span>
                    </div>

                    <div className="tile-tools">
                        <Tag className="kind-tag" color={kindColor(kind)}>
                            {kindLabel(kind)}
                        </Tag>

                        <Tooltip title={isFullscreen ? 'رجوع للحجم الطبيعي' : 'شاشة كاملة'}>
                            <Button
                                size="small"
                                className="tile-icon-btn"
                                icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                                onClick={toggleFullscreen}
                            />
                        </Tooltip>
                    </div>
                </div>

                <div className="tile-overlay-bottom">
                    <div className="status-line">
                        {error ? <span className="error-dot" /> : <span className="live-dot" />}
                        {error ? 'NO SIGNAL' : 'LIVE'}
                    </div>

                    {camera.cameraId ? (
                        <Text style={{ color: '#e2e8f0', fontSize: 10 }}>
                            #{camera.cameraId}
                        </Text>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

function LocalCameraTile({
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

            const blob = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/jpeg', 0.82));
            if (!blob) return;

            const data = await identifyFace(new File([blob], 'f.jpg', { type: 'image/jpeg' }), camera.cameraId);
            setResult(data);

            if (data.knownFaces > 0) onRecognized(camera, data);
        } catch {
            // ignore background recognition failures
        } finally {
            isRunning.current = false;
            setPending(false);
        }
    }, [camera, onRecognized]);

    useEffect(() => {
        setReady(false);
        setError(null);
        setResult(null);

        if (!deviceId) {
            setError('الكامرة المحلية غير مربوطة');
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
                    s.getTracks().forEach((t) => t.stop());
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
                if (mounted) setError('فشل فتح الكامرة المحلية');
            }
        })();

        return () => {
            mounted = false;
            streamRef.current?.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        };
    }, [deviceId]);

    useEffect(() => {
        if (!ready) return;
        capture();
        const id = window.setInterval(capture, intervalSec * 1000);
        return () => window.clearInterval(id);
    }, [ready, capture, intervalSec]);

    const hasSuspect = result?.faces.some((f) => f.isKnown && f.person?.hasSuspectRecord);
    const threatLevel = hasSuspect ? 'suspect' : (result?.knownFaces ?? 0) > 0 ? 'detected' : 'clear';

    return (
        <TileShell
            camera={camera}
            threatLevel={threatLevel}
            error={error ?? undefined}
            subLabel={
                deviceLabel
                    ? `[${camera.localDeviceIndex ?? '-'}] ${deviceLabel}`
                    : camera.localDeviceIndex !== undefined
                        ? `اندكس [${camera.localDeviceIndex}]`
                        : undefined
            }
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

            {pending && ready && <div className="scan-bar" />}

            {!ready && !error && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Spin />
                </div>
            )}
        </TileShell>
    );
}

function IpRtspTile({
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

            setImgSrc((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return url;
            });

            const data = await identifyFace(new File([blob], 'f.jpg', { type: 'image/jpeg' }), camera.cameraId);
            setResult(data);
            setError(null);

            if (data.knownFaces > 0) onRecognized(camera, data);
        } catch {
            setError('تعذر الاتصال');
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

    const hasSuspect = result?.faces.some((f) => f.isKnown && f.person?.hasSuspectRecord);
    const threatLevel = hasSuspect ? 'suspect' : (result?.knownFaces ?? 0) > 0 ? 'detected' : 'clear';

    return (
        <TileShell camera={camera} threatLevel={threatLevel} error={error ?? undefined}>
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
                    {error ? <WifiOutlined style={{ fontSize: 26, color: 'var(--app-muted)' }} /> : <Spin />}
                </div>
            )}

            {pending && imgSrc && <div className="scan-bar" />}
        </TileShell>
    );
}

function IpMjpegTile({
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

            const blob = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/jpeg', 0.82));
            if (!blob) return;

            const data = await identifyFace(new File([blob], 'f.jpg', { type: 'image/jpeg' }), camera.cameraId);
            setResult(data);

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

    const hasSuspect = result?.faces.some((f) => f.isKnown && f.person?.hasSuspectRecord);
    const threatLevel = hasSuspect ? 'suspect' : (result?.knownFaces ?? 0) > 0 ? 'detected' : 'clear';

    return (
        <TileShell camera={camera} threatLevel={threatLevel} error={imgErr ? 'NO SIGNAL' : undefined}>
            {imgErr ? (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <WifiOutlined style={{ fontSize: 26, color: 'var(--app-muted)' }} />
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
            {pending && !imgErr && <div className="scan-bar" />}
        </TileShell>
    );
}

export default function LiveCamerasPage() {
    const {
        localDevices,
        devicesReady,
        cameras,
        isLoading,
        localCameras,
        onRecognized,
       
        deviceMapping,
        setDeviceMapping,
        refetch,
    } = useMonitor(2);

    const [currentDeviceId, setCurrentDeviceId] = useState<number | null>(() => getCurrentDeviceId());
    const [showMap, setShowMap] = useState(false);
    const [columns, setColumns] = useState<number>(4);
    const [search, setSearch] = useState('');
    const [kindFilter, setKindFilter] = useState<'all' | 'local' | 'ip-mjpeg' | 'ip-rtsp'>('all');

    useEffect(() => {
        const syncDevice = () => setCurrentDeviceId(getCurrentDeviceId());
        window.addEventListener('storage', syncDevice);
        window.addEventListener('focus', syncDevice);

        return () => {
            window.removeEventListener('storage', syncDevice);
            window.removeEventListener('focus', syncDevice);
        };
    }, []);

    useEffect(() => {
        if (localDevices.length === 0 || localCameras.length === 0) return;

        setDeviceMapping((prev) => {
            const next = { ...prev };
            let changed = false;

            for (const cam of localCameras) {
                const manualDeviceId = prev[cam.cameraId];
                const manualStillExists = manualDeviceId && localDevices.some((d) => d.deviceId === manualDeviceId);

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
        if (manualDeviceId && localDevices.some((d) => d.deviceId === manualDeviceId)) {
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

        const idx = localDevices.findIndex((d) => d.deviceId === deviceId);
        if (idx < 0) return null;

        return getLocalDeviceLabel(localDevices[idx], idx);
    }, [localDevices, resolveLocalDeviceId]);

    const localDeviceOptions = useMemo(
        () =>
            localDevices.map((d, i) => ({
                value: d.deviceId,
                label: `[${i}] ${getLocalDeviceLabel(d, i)}`,
            })),
        [localDevices],
    );

    const filteredCameras = useMemo(() => {
        const q = search.trim().toLowerCase();

        return cameras.filter((cam) => {
            const kind = detectCameraKind(cam);

            const matchesKind = kindFilter === 'all' ? true : kind === kindFilter;
            const matchesSearch =
                !q ||
                String(cam.name ?? '').toLowerCase().includes(q) ||
                String(cam.code ?? '').toLowerCase().includes(q) ||
                String(cam.area ?? '').toLowerCase().includes(q) ||
                String(cam.ipAddress ?? '').toLowerCase().includes(q) ||
                String(cam.streamUrl ?? '').toLowerCase().includes(q);

            return matchesKind && matchesSearch;
        });
    }, [cameras, search, kindFilter]);

    if (!devicesReady || isLoading) {
        return (
            <>
              
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
                    <Text type="secondary" style={{ color: 'var(--app-muted)' }}>
                        {devicesReady ? 'جاري تحميل الكاميرات…' : 'الوصول لأجهزة الكاميرا…'}
                    </Text>
                </div>
            </>
        );
    }

    const unresolvedLocalCount = localCameras.filter((c) => !resolveLocalDeviceId(c)).length;

    return (
        <>
    

            <div className="monitor-page">
                <div className="monitor-header">
                    <div className="monitor-header-top">
                        <div className="monitor-title-wrap">
                            <div className="monitor-badge">
                                <VideoCameraOutlined style={{ color: '#fff', fontSize: 18 }} />
                            </div>

                            <div>
                                <Title level={4} style={{ margin: 0, color: '#fff', fontWeight: 900 }}>
                                    شبكة المراقبة
                                </Title>
                                <Text style={{ color: 'var(--app-muted)', fontSize: 12 }}>
                                    عرض شبكي مباشر فقط
                                </Text>
                            </div>
                        </div>

                        <div className="header-kpis">
                            <span className="kpi-chip">
                                <LinkOutlined />
                                {currentDeviceId ? `الجهاز #${currentDeviceId}` : 'بدون جهاز'}
                            </span>
                            <span className="kpi-chip">
                                <VideoCameraOutlined />
                                {filteredCameras.length}/{cameras.length} كاميرا
                            </span>
                            <span className="kpi-chip">
                                <HomeOutlined />
                                {localCameras.length} محلية
                            </span>
                            <span className="kpi-chip">
                                <WarningOutlined />
                                {unresolvedLocalCount} غير مربوطة
                            </span>
                        </div>
                    </div>

                    <div className="filter-row">
                        <div className="filter-item search">
                            <Input
                                prefix={<SearchOutlined style={{ color: 'var(--app-muted)' }} />}
                                placeholder="بحث بالاسم أو الكود أو الموقع أو الرابط"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                allowClear
                            />
                        </div>

                        <div className="filter-item">
                            <Select
                                value={kindFilter}
                                onChange={(v) => setKindFilter(v)}
                                options={[
                                    { value: 'all', label: 'كل الأنواع' },
                                    { value: 'local', label: 'محلية' },
                                    { value: 'ip-mjpeg', label: 'MJPEG' },
                                    { value: 'ip-rtsp', label: 'RTSP' },
                                ]}
                            />
                        </div>

                        <div className="filter-item columns">
                            <Select
                                value={columns}
                                onChange={(v) => setColumns(v)}
                                options={Array.from({ length: 6 }, (_, i) => ({
                                    value: i + 1,
                                    label: `${i + 1} عمود`,
                                }))}
                                suffixIcon={<AppstoreOutlined style={{ color: 'var(--app-muted)' }} />}
                            />
                        </div>

                        <div className="filter-item actions">
                            <Button
                                icon={<SettingOutlined />}
                                onClick={() => setShowMap((v) => !v)}
                            >
                                ضبط
                            </Button>
                        </div>

                        <div className="filter-item actions">
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={() => refetch()}
                            >
                                تحديث
                            </Button>
                        </div>
                    </div>
                </div>

                {!currentDeviceId && (
                    <div className="monitor-alerts">
                        <Alert
                            type="warning"
                            showIcon
                            message="لم يتم تحديد الجهاز الحالي"
                            description="الكامرات المحلية تعتمد على الجهاز المختار. افتح صفحة ضبط الجهاز أولًا وحدد الجهاز."
                            style={{ borderRadius: 12 }}
                        />
                    </div>
                )}

                {unresolvedLocalCount > 0 && (
                    <div className="monitor-alerts">
                        <Alert
                            type="warning"
                            showIcon
                            message="بعض الكامرات المحلية غير مربوطة"
                            description={`عددها ${unresolvedLocalCount}. اضغط "ضبط" واختر الجهاز الصحيح لكل كامرة.`}
                            style={{ borderRadius: 12 }}
                        />
                    </div>
                )}

                {showMap && localCameras.length > 0 && (
                    <div className="mapping-bar">
                        <Space size={8}>
                            <SettingOutlined style={{ color: '#60a5fa' }} />
                            <Text style={{ color: '#e5e7eb', fontSize: 13, fontWeight: 700 }}>
                                ربط الكامرات المحلية بأجهزة هذا الحاسوب
                            </Text>
                        </Space>

                        <div className="mapping-grid">
                            {localCameras.map((cam) => (
                                <div key={cam.cameraId} className="mapping-item">
                                    <Text style={{ color: '#cbd5e1', fontSize: 12, display: 'block', marginBottom: 8 }}>
                                        {cam.name} [{cam.localDeviceIndex ?? '-'}]
                                    </Text>

                                    <Select
                                        value={resolveLocalDeviceId(cam) ?? undefined}
                                        onChange={(v) => setDeviceMapping((p) => ({ ...p, [cam.cameraId]: v }))}
                                        options={localDeviceOptions}
                                        placeholder="اختر كامرة الجهاز"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid-wrap">
                    {filteredCameras.length === 0 ? (
                        <div className="empty-wrap">
                            <div>
                                <VideoCameraOutlined style={{ fontSize: 60, color: '#334155' }} />
                                <div style={{ marginTop: 12 }}>
                                    <Text style={{ color: 'var(--app-muted)' }}>لا توجد كاميرات مطابقة للفلاتر الحالية</Text>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div
                            className="cam-grid"
                            style={{
                                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                            }}
                        >
                            {filteredCameras.map((cam) => {
                                const kind = detectCameraKind(cam);

                                if (kind === 'local') {
                                    return (
                                        <LocalCameraTile
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
                                        <IpRtspTile
                                            key={cam.cameraId}
                                            camera={cam}
                                            intervalSec={3}
                                            onRecognized={onRecognized}
                                        />
                                    );
                                }

                                return (
                                    <IpMjpegTile
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
