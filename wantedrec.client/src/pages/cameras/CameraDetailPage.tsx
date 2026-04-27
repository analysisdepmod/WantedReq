import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Row,
    Col,
    Button,
    Typography,
    Space,
    Spin,
    Tag,
    Progress,
    Image,
    Slider,
    Alert,
    message,
    
    Tooltip,
    Card,
    Avatar,
    Empty,
} from 'antd';
import {
    VideoCameraOutlined,
    PlayCircleOutlined,
    PauseCircleOutlined,
    StopOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    EyeOutlined,
    UserOutlined,
    WarningOutlined,
    ArrowRightOutlined,
    EnvironmentOutlined,
    WifiOutlined,
    FieldTimeOutlined,
    CameraOutlined,
    ScanOutlined,
    ThunderboltOutlined,
    AimOutlined,
    ClockCircleOutlined,
    LinkOutlined,
    SafetyOutlined,
    ExclamationCircleOutlined,
} from '@ant-design/icons';
import { getCameraById, snapshotUrl } from '../../api/camerasApi';
import { identifyFace } from '../../api/recognitionApi';
import type { LiveRecognitionResultDto, RecognitionFaceDto } from '../../types/camera.types';
import { detectCameraKind } from '../../types/camera.types';
import {
    DangerLevel,
    DangerLevelLabel,
    PersonSecurityStatus,
    PersonSecurityStatusLabel,
} from '../../types/person.types';

const { Title, Text } = Typography;


const scoreColor = (s: number) =>
    s >= 0.8 ? '#52c41a' : s >= 0.6 ? '#faad14' : '#ff4d4f';

const scoreLabel = (s: number) =>
    s >= 0.8 ? 'تطابق عالي' : s >= 0.6 ? 'تطابق متوسط' : 'تطابق ضعيف';

const dangerTone: Record<number, { bg: string; border: string; color: string }> = {
    [DangerLevel.None]: { bg: '#f8fafc', border: '#e2e8f0', color: '#475569' },
    [DangerLevel.Low]: { bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d' },
    [DangerLevel.Medium]: { bg: '#fffbeb', border: '#fde68a', color: '#b45309' },
    [DangerLevel.High]: { bg: '#fff7ed', border: '#fdba74', color: '#c2410c' },
    [DangerLevel.Critical]: { bg: '#fff1f2', border: '#fecaca', color: '#dc2626' },
};

const securityTone: Record<number, { bg: string; border: string; color: string }> = {
    [PersonSecurityStatus.Normal]: { bg: '#f8fafc', border: '#e2e8f0', color: '#475569' },
    [PersonSecurityStatus.Suspect]: { bg: '#fff7ed', border: '#fdba74', color: '#c2410c' },
    [PersonSecurityStatus.Wanted]: { bg: '#fff1f2', border: '#fecaca', color: '#dc2626' },
    [PersonSecurityStatus.WantedAndSuspect]: { bg: '#fff1f2', border: '#fda4af', color: '#be123c' },
    [PersonSecurityStatus.Arrested]: { bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8' },
    [PersonSecurityStatus.Closed]: { bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d' },
};

function CompactStat({
    label,
    value,
    color,
    bg,
    border,
    icon,
}: {
    label: string;
    value: string | number;
    color: string;
    bg: string;
    border: string;
    icon: React.ReactNode;
}) {
    return (
        <div className="camera-compact-stat-card">
            <div>
                <div className="v" style={{ color }}>{value}</div>
                <div className="l">{label}</div>
            </div>

            <div className="i" style={{ background: bg, borderColor: border, color }}>
                {icon}
            </div>
        </div>
    );
}

function Pill({
    text,
    tone,
    icon,
}: {
    text: string;
    tone?: { bg: string; border: string; color: string };
    icon?: React.ReactNode;
}) {
    const t = tone ?? { bg: '#f8fafc', border: '#e2e8f0', color: '#475569' };
    return (
        <span className="pill" style={{ background: t.bg, borderColor: t.border, color: t.color }}>
            {icon}
            {text}
        </span>
    );
}

function isRiskyPerson(person: any): boolean {
    if (!person) return false;
    return !!person.hasActiveAlert || !!person.isArmedAndDangerous || (person.dangerLevel ?? DangerLevel.None) >= DangerLevel.High;
}

function FaceCard({ face }: { face: RecognitionFaceDto }) {
    const navigate = useNavigate();
    const person = face.person as any;
    const risky = face.isKnown && isRiskyPerson(person);
    const securityStatus = (person?.securityStatus ?? PersonSecurityStatus.Normal) as PersonSecurityStatus;
    const dangerLevel = (person?.dangerLevel ?? DangerLevel.None) as DangerLevel;

    return (
        <div className={`face-card${face.isKnown ? ' known' : ''}${risky ? ' risky' : ''}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: face.isKnown ? 10 : 0, gap: 10, flexWrap: 'wrap' }}>
                <Space size={8} align="start">
                    {face.isKnown ? (
                        <CheckCircleOutlined style={{ color: risky ? '#dc2626' : '#52c41a', fontSize: 15, marginTop: 2 }} />
                    ) : (
                        <CloseCircleOutlined style={{ color: '#bfbfbf', fontSize: 15, marginTop: 2 }} />
                    )}

                    <div>
                        <Text strong style={{ fontSize: 13, display: 'block' }}>
                            {face.isKnown ? face.name : 'وجه غير معروف'}
                        </Text>

                        {face.isKnown && (
                            <Text style={{ color: scoreColor(face.score), fontSize: 11 }}>
                                {scoreLabel(face.score)} — {Math.round(face.score * 100)}%
                            </Text>
                        )}
                    </div>
                </Space>

                {face.isKnown && face.person && (
                    <Tooltip title="عرض الملف الكامل">
                        <Button
                            size="small"
                            icon={<EyeOutlined />}
                            type="primary"
                            ghost
                            onClick={() => navigate(`/persons/${face.person!.personId}`)}
                            style={{ borderRadius: 8, height: 28, fontSize: 11 }}
                        >
                            الملف
                        </Button>
                    </Tooltip>
                )}
            </div>

            {face.isKnown && face.person && (
                <>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        {face.primaryImageBase64 ? (
                            <Image
                                src={`data:image/jpeg;base64,${face.primaryImageBase64}`}
                                style={{
                                    width: 58,
                                    height: 58,
                                    objectFit: 'cover',
                                    borderRadius: 10,
                                    flexShrink: 0,
                                    border: `2px solid ${scoreColor(face.score)}`,
                                }}
                                preview={false}
                            />
                        ) : (
                            <Avatar
                                size={58}
                                icon={<UserOutlined />}
                                style={{
                                    background: 'var(--app-surface-2)',
                                    color: '#2563eb',
                                    borderRadius: 10,
                                    flexShrink: 0,
                                }}
                            />
                        )}

                        <div style={{ flex: 1 }}>
                            <Space size={[6, 6]} wrap style={{ marginBottom: 8 }}>
                                <Pill text={PersonSecurityStatusLabel[securityStatus]} tone={securityTone[securityStatus]} icon={<SafetyOutlined />} />
                                <Pill text={DangerLevelLabel[dangerLevel]} tone={dangerTone[dangerLevel]} icon={<ExclamationCircleOutlined />} />
                                {person.hasSuspectRecord && (
                                    <Pill text="مشتبه به" tone={{ bg: '#fff1f2', border: '#fecaca', color: '#dc2626' }} icon={<WarningOutlined />} />
                                )}
                            </Space>

                            <Progress
                                percent={Math.round(face.score * 100)}
                                strokeColor={scoreColor(face.score)}
                                size="small"
                                format={(p) => <span style={{ color: scoreColor(face.score), fontSize: 11 }}>{p}%</span>}
                            />
                        </div>
                    </div>

                    {(person.securityReason || person.alertInstructions || person.lastSeenLocation) && (
                        <div style={{ marginTop: 12 }}>
                            <div className="info-strip">
                                {person.securityReason ? (
                                    <div className="info-box">
                                        <div className="k">سبب الإدراج الأمني</div>
                                        <div className="v">{person.securityReason}</div>
                                    </div>
                                ) : null}

                                {person.lastSeenLocation ? (
                                    <div className="info-box">
                                        <div className="k">مكان آخر ظهور</div>
                                        <div className="v">{person.lastSeenLocation}</div>
                                    </div>
                                ) : null}
                            </div>

                            {person.alertInstructions && (
                                <Alert
                                    style={{ marginTop: 10, borderRadius: 14 }}
                                    type={risky ? 'error' : 'warning'}
                                    showIcon
                                    message="تعليمات عند المشاهدة"
                                    description={person.alertInstructions}
                                />
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default function CameraDetailPage() {
    const { id } = useParams<{ id: string }>();
    const cameraId = Number(id);
    const navigate = useNavigate();
    const [msgApi, ctx] = message.useMessage();

    const { data: camera, isLoading: camLoading } = useQuery({
        queryKey: ['camera', cameraId],
        queryFn: () => getCameraById(cameraId),
        enabled: !!cameraId && !isNaN(cameraId),
    });

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isRunning = useRef(false);

    const [cameraOn, setCameraOn] = useState(false);
    const [liveOn, setLiveOn] = useState(false);
    const [intervalSec, setIntervalSec] = useState(3);
    const [liveResult, setLiveResult] = useState<LiveRecognitionResultDto | null>(null);
    const [livePending, setLivePending] = useState(false);
    const [frameCount, setFrameCount] = useState(0);
    const [totalKnown, setTotalKnown] = useState(0);
    const [remoteImageUrl, setRemoteImageUrl] = useState<string>('');
    const [openedDeviceLabel, setOpenedDeviceLabel] = useState<string>('');

    const kind = camera ? detectCameraKind(camera as any) : 'local';
    const isLocalCamera = kind === 'local';
    const totalFaces = liveResult?.totalFaces ?? 0;
    const riskyFaces = liveResult?.faces.filter((f: any) => isRiskyPerson(f.person)).length ?? 0;

    const captureAndIdentify = useCallback(async () => {
        if (!camera) return;
        if (isRunning.current) return;

        isRunning.current = true;
        setLivePending(true);

        try {
            if (isLocalCamera) {
                const video = videoRef.current;
                const canvas = canvasRef.current;
                if (!video || !canvas || video.readyState < 2) return;

                canvas.width = video.videoWidth || 640;
                canvas.height = video.videoHeight || 480;
                canvas.getContext('2d')?.drawImage(video, 0, 0);

                const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.85));
                if (!blob) return;

                const data = await identifyFace(
                    new File([blob], 'frame.jpg', { type: 'image/jpeg' }),
                    cameraId,
                );

                setLiveResult(data);
                setFrameCount((c) => c + 1);
                if (data.knownFaces > 0) setTotalKnown((t) => t + data.knownFaces);
            } else {
                const res = await fetch(snapshotUrl(cameraId), {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` },
                });

                if (!res.ok) throw new Error('snapshot failed');

                const blob = await res.blob();
                const objectUrl = URL.createObjectURL(blob);

                setRemoteImageUrl((prev) => {
                    if (prev) URL.revokeObjectURL(prev);
                    return objectUrl;
                });

                const data = await identifyFace(
                    new File([blob], 'frame.jpg', { type: 'image/jpeg' }),
                    cameraId,
                );

                setLiveResult(data);
                setFrameCount((c) => c + 1);
                if (data.knownFaces > 0) setTotalKnown((t) => t + data.knownFaces);
            }
        } catch {
            // silent
        } finally {
            isRunning.current = false;
            setLivePending(false);
        }
    }, [camera, cameraId, isLocalCamera]);

    const stopLive = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setLiveOn(false);
        isRunning.current = false;
        setLivePending(false);
    }, []);

    const stopCamera = useCallback(() => {
        stopLive();
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        if (remoteImageUrl) {
            URL.revokeObjectURL(remoteImageUrl);
            setRemoteImageUrl('');
        }

        setCameraOn(false);
        setLiveResult(null);
        setOpenedDeviceLabel('');
    }, [stopLive, remoteImageUrl]);

    const startCamera = async () => {
        if (!camera) return;

        try {
            if (isLocalCamera) {
                const tmp = await navigator.mediaDevices.getUserMedia({ video: true });
                tmp.getTracks().forEach((t) => t.stop());

                const all = await navigator.mediaDevices.enumerateDevices();
                const videoInputs = all.filter((d) => d.kind === 'videoinput');

                const localIndex = camera.localDeviceIndex;

                if (
                    localIndex === undefined ||
                    localIndex === null ||
                    localIndex < 0 ||
                    localIndex >= videoInputs.length
                ) {
                    msgApi.error('لم يتم العثور على الكامرة المحلية المرتبطة بهذه الكامرة في هذا الجهاز');
                    return;
                }

                const selectedDevice = videoInputs[localIndex];
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        deviceId: { exact: selectedDevice.deviceId },
                        width: 1280,
                        height: 720,
                    },
                });

                streamRef.current = stream;
                setCameraOn(true);
                setOpenedDeviceLabel(selectedDevice.label?.trim() || `كاميرا محلية ${localIndex}`);

                setTimeout(() => {
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        videoRef.current.play().catch(() => { });
                    }
                }, 50);
            } else {
                setCameraOn(true);
                setOpenedDeviceLabel(camera.streamUrl || camera.ipAddress || 'كاميرا شبكية');
                await captureAndIdentify();
            }
        } catch {
            msgApi.error('لم يتم فتح الكامرة المطلوبة');
        }
    };

    const startLive = useCallback(() => {
        if (!cameraOn) return;

        setLiveOn(true);
        setFrameCount(0);
        setTotalKnown(0);

        captureAndIdentify();
        intervalRef.current = setInterval(captureAndIdentify, intervalSec * 1000);
    }, [cameraOn, intervalSec, captureAndIdentify]);

    useEffect(() => {
        if (liveOn) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = setInterval(captureAndIdentify, intervalSec * 1000);
        }
    }, [intervalSec, captureAndIdentify, liveOn]);

    useEffect(() => () => {
        stopLive();
        streamRef.current?.getTracks().forEach((t) => t.stop());
        if (remoteImageUrl) URL.revokeObjectURL(remoteImageUrl);
    }, [stopLive, remoteImageUrl]);

    if (camLoading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <>
   
            {ctx}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            <div className="camera-detail-shell">
                <div className="camera-detail-hero">
                    <div className="camera-detail-hero-inner">
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                            <div className="hero-badge">
                                <VideoCameraOutlined style={{ fontSize: 28, color: '#fff' }} />
                            </div>

                            <div>
                                <Title level={2} style={{ margin: 0, color: '#fff', fontWeight: 900 }}>
                                    {camera?.name ?? `كاميرا ${cameraId}`}
                                </Title>

                                <Text style={{ color: 'rgba(255,255,255,.88)', fontSize: 13 }}>
                                    عرض مباشر موحّد مع بقية الصفحات، وتحليل حي للوجوه من الكامرة المحددة.
                                </Text>

                                <div className="hero-pills">
                                    {camera?.area && (
                                        <span className="hero-pill">
                                            <EnvironmentOutlined />
                                            {camera.area}
                                        </span>
                                    )}

                                    <span className="hero-pill">
                                        <WifiOutlined />
                                        {camera?.ipAddress || '—'}
                                    </span>

                                    <span className="hero-pill">
                                        <LinkOutlined />
                                        {isLocalCamera ? 'كامرة محلية' : 'كامرة شبكية'}
                                    </span>

                                    {openedDeviceLabel && (
                                        <span className="hero-pill">
                                            <CameraOutlined />
                                            {openedDeviceLabel}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="hero-actions">
                            <Button
                                className="hero-btn"
                                icon={<ArrowRightOutlined />}
                                onClick={() => navigate('/cameras')}
                            >
                                العودة
                            </Button>

                            <Button
                                className="hero-btn"
                                icon={<StopOutlined />}
                                onClick={() => window.close()}
                            >
                                إغلاق النافذة
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="camera-compact-stats">
                    <div className="camera-compact-stat-wrap">
                        <CompactStat
                            label="نوع الكامرة"
                            value={isLocalCamera ? 'محلية' : 'شبكية'}
                            color="#2563eb"
                            bg="#eff6ff"
                            border="#bfdbfe"
                            icon={<VideoCameraOutlined />}
                        />
                    </div>

                    <div className="camera-compact-stat-wrap">
                        <CompactStat
                            label="الحالة"
                            value={cameraOn ? (liveOn ? 'بث مباشر' : 'مفتوحة') : 'متوقفة'}
                            color={cameraOn ? '#16a34a' : '#64748b'}
                            bg={cameraOn ? '#f0fdf4' : '#f8fafc'}
                            border={cameraOn ? '#bbf7d0' : '#e2e8f0'}
                            icon={<ThunderboltOutlined />}
                        />
                    </div>

                    <div className="camera-compact-stat-wrap">
                        <CompactStat
                            label="الفريمات"
                            value={frameCount}
                            color="#7c3aed"
                            bg="#faf5ff"
                            border="#ddd6fe"
                            icon={<CameraOutlined />}
                        />
                    </div>

                    <div className="camera-compact-stat-wrap">
                        <CompactStat
                            label="وجوه معروفة"
                            value={totalKnown}
                            color="#16a34a"
                            bg="#f0fdf4"
                            border="#bbf7d0"
                            icon={<AimOutlined />}
                        />
                    </div>

                    <div className="camera-compact-stat-wrap">
                        <CompactStat
                            label="إنذارات مهمة"
                            value={riskyFaces}
                            color="#dc2626"
                            bg="#fff5f5"
                            border="#fecaca"
                            icon={<WarningOutlined />}
                        />
                    </div>

                    <div className="camera-compact-stat-wrap">
                        <CompactStat
                            label="فترة الإرسال"
                            value={`${intervalSec}s`}
                            color="#d97706"
                            bg="#fff7ed"
                            border="#fed7aa"
                            icon={<ClockCircleOutlined />}
                        />
                    </div>
                </div>

                <Row gutter={[18, 18]}>
                    <Col xs={24} lg={14}>
                        <Card
                            className="surface-card"
                            title={
                                <div className="section-title">
                                    <ScanOutlined style={{ color: '#1677ff' }} />
                                    <span>العرض المباشر والتحكم</span>
                                </div>
                            }
                        >
                            <div className="camera-live-box">
                                {isLocalCamera ? (
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: cameraOn ? 'block' : 'none' }}
                                    />
                                ) : remoteImageUrl ? (
                                    <img
                                        src={remoteImageUrl}
                                        alt=""
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : null}

                                {livePending && cameraOn && <div className="scan-line" />}

                                {liveOn && (
                                    <div className="live-badge">
                                        <span
                                            className="dot"
                                            style={{ background: livePending ? '#faad14' : '#52c41a' }}
                                        />
                                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>
                                            {livePending ? 'يحلل...' : 'LIVE'}
                                        </Text>
                                    </div>
                                )}

                                {!cameraOn && (
                                    <div style={{ textAlign: 'center', padding: 50 }}>
                                        <VideoCameraOutlined style={{ fontSize: 72, color: '#94a3b8', marginBottom: 12 }} />
                                        <br />
                                        <Text style={{ color: 'var(--app-muted)' }}>
                                            ابدأ الكامرة للتعرف على الوجوه
                                        </Text>
                                    </div>
                                )}
                            </div>

                            <div style={{ paddingTop: 16 }}>
                                <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                                    {!cameraOn ? (
                                        <Button
                                            icon={<VideoCameraOutlined />}
                                            onClick={startCamera}
                                            style={{ flex: 1, height: 42, borderRadius: 12 }}
                                        >
                                            فتح الكامرة
                                        </Button>
                                    ) : (
                                        <>
                                            {!liveOn ? (
                                                <Button
                                                    icon={<PlayCircleOutlined />}
                                                    onClick={startLive}
                                                    type="primary"
                                                    style={{
                                                        flex: 1,
                                                        height: 42,
                                                        borderRadius: 12,
                                                        background: '#52c41a',
                                                        borderColor: '#52c41a',
                                                    }}
                                                >
                                                    بدء التعرف
                                                </Button>
                                            ) : (
                                                <Button
                                                    icon={<PauseCircleOutlined />}
                                                    onClick={stopLive}
                                                    danger
                                                    style={{ flex: 1, height: 42, borderRadius: 12 }}
                                                >
                                                    إيقاف التعرف
                                                </Button>
                                            )}

                                            <Button
                                                icon={<StopOutlined />}
                                                onClick={stopCamera}
                                                disabled={liveOn}
                                                style={{ height: 42, borderRadius: 12 }}
                                            >
                                                إغلاق
                                            </Button>
                                        </>
                                    )}
                                </div>

                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            <FieldTimeOutlined style={{ marginLeft: 4 }} />
                                            فترة الإرسال
                                        </Text>
                                        <Tag color="blue" style={{ borderRadius: 999 }}>{intervalSec}s</Tag>
                                    </div>

                                    <Slider
                                        min={1}
                                        max={10}
                                        step={1}
                                        value={intervalSec}
                                        onChange={setIntervalSec}
                                        marks={{ 1: '1s', 3: '3s', 5: '5s', 10: '10s' }}
                                        tooltip={{ formatter: (v) => `${v} ثانية` }}
                                    />

                                    <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
                                        💡 عادي → 3s &nbsp;|&nbsp; قوي → 1s &nbsp;|&nbsp; ضعيف → 5s+
                                    </Text>
                                </div>
                            </div>
                        </Card>
                    </Col>

                    <Col xs={24} lg={10}>
                        <Card
                            className="surface-card"
                            title={
                                <div className="section-title">
                                    <UserOutlined style={{ color: '#7c3aed' }} />
                                    <span>نتائج التعرف</span>
                                </div>
                            }
                        >
                            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    النتائج الحالية للفريم الأحدث
                                </Text>

                                {liveResult && (
                                    <Space size={6} wrap>
                                        <Tag color="blue" style={{ borderRadius: 999 }}>{totalFaces} وجه</Tag>
                                        <Tag color={liveResult.knownFaces > 0 ? 'success' : 'default'} style={{ borderRadius: 999 }}>
                                            {liveResult.knownFaces} معروف
                                        </Tag>
                                    </Space>
                                )}
                            </div>

                            {riskyFaces > 0 && (
                                <Alert
                                    type="error"
                                    showIcon
                                    style={{ marginBottom: 12, borderRadius: 14 }}
                                    message={`تم رصد ${riskyFaces} حالة تتطلب انتباهًا أمنيًا`}
                                />
                            )}

                            <div style={{ maxHeight: 650, overflowY: 'auto', paddingInlineEnd: 2 }}>
                                {livePending && !liveResult && (
                                    <div style={{ textAlign: 'center', padding: 40 }}>
                                        <Spin />
                                        <br />
                                        <br />
                                        <Text type="secondary">يحلل الفريم…</Text>
                                    </div>
                                )}

                                {!liveResult && !livePending && (
                                    <Empty
                                        image={<UserOutlined style={{ fontSize: 52, color: '#d9d9d9' }} />}
                                        description={cameraOn ? 'اضغط "بدء التعرف" للبدء' : 'افتح الكامرة أولًا'}
                                    />
                                )}

                                {liveResult?.faces.length === 0 && (
                                    <Alert
                                        message="لم يُكتشف أي وجه في هذا الفريم"
                                        type="info"
                                        showIcon
                                        style={{ borderRadius: 14 }}
                                    />
                                )}

                                {liveResult?.faces.map((face, idx) => (
                                    <FaceCard key={idx} face={face} />
                                ))}
                            </div>
                        </Card>
                    </Col>
                </Row>
            </div>
        </>
    );
}
