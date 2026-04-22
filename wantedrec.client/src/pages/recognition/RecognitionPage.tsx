import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
    Upload, Button, Card, Row, Col, Typography, Space,
    Image, Progress, Alert, Spin, Tag, Divider,
    Empty, Tabs, Slider, Badge, message, Select,
} from 'antd';
import type { UploadFile } from 'antd';
import {
    SearchOutlined, UploadOutlined, CameraOutlined,
    CheckCircleOutlined, CloseCircleOutlined,
    UserOutlined, EyeOutlined, StopOutlined,
    PlayCircleOutlined, PauseCircleOutlined,
    LinkOutlined, MonitorOutlined,
} from '@ant-design/icons';
import type { ApiResponse } from '../../types/person.types';
import { ValidFile } from '../../Interfaces/functions';
import type { RecognitionFaceDto, LiveRecognitionResultDto } from '../../types/camera.types';
import { getCameras } from '../../api/camerasApi';
import { identifyFace } from '../../api/recognitionApi';

const { Title, Text } = Typography;
const STORAGE_KEY = 'current_device_id';

// ── Helpers ─────────────────────────────────────────────
const getCurrentDeviceId = (): number | null => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = Number(raw);
    return Number.isNaN(parsed) ? null : parsed;
};

const scoreColor = (s: number) =>
    s >= 0.8 ? '#52c41a' : s >= 0.6 ? '#faad14' : '#ff4d4f';

const scoreLabel = (s: number) =>
    s >= 0.8 ? 'تطابق عالي' : s >= 0.6 ? 'تطابق متوسط' : 'تطابق ضعيف';

// ── نتيجة مشتركة ────────────────────────────────────────
function ResultPanel({
    result,
    isPending,
    error,
    cameraMode = false,
    frameCount = 0,
}: {
    result: LiveRecognitionResultDto | null;
    isPending: boolean;
    error?: any;
    cameraMode?: boolean;
    frameCount?: number;
}) {
    const navigate = useNavigate();

    return (
        <Card
            title={
                <Space>
                    <span>نتيجة التعرف</span>
                    {result && (
                        <Tag color={result.knownFaces > 0 ? 'success' : 'default'}>
                            {result.knownFaces}/{result.totalFaces} وجه
                        </Tag>
                    )}
                    {cameraMode && frameCount > 0 && (
                        <Tag color="blue">{frameCount} فريم</Tag>
                    )}
                </Space>
            }
            style={{ height: '100%' }}
        >
            {isPending && !cameraMode && (
                <div style={{ textAlign: 'center', padding: 60 }}>
                    <Spin size="large" />
                    <br />
                    <br />
                    <Text type="secondary">جاري تحليل الصورة...</Text>
                </div>
            )}

            {error && !isPending && (
                <Alert
                    type="error"
                    showIcon
                    message="فشل التعرف"
                    description="تأكد من وضوح الصورة وحاول مجدداً"
                />
            )}

            {!isPending && !error && !result && (
                <Empty
                    image={<UserOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
                    description={
                        cameraMode
                            ? 'اضغط "بدء التعرف المستمر"'
                            : 'ارفع صورة واضغط بحث'
                    }
                />
            )}

            {result && (
                <>
                    <Row gutter={12} style={{ marginBottom: 16 }}>
                        <Col span={12}>
                            <Card size="small" style={{ textAlign: 'center', background: '#f0f5ff' }}>
                                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1677ff' }}>
                                    {result.totalFaces}
                                </div>
                                <Text type="secondary" style={{ fontSize: 12 }}>وجه مكتشف</Text>
                            </Card>
                        </Col>

                        <Col span={12}>
                            <Card
                                size="small"
                                style={{
                                    textAlign: 'center',
                                    background: result.knownFaces > 0 ? '#f6ffed' : '#fff7e6',
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: 24,
                                        fontWeight: 'bold',
                                        color: result.knownFaces > 0 ? '#52c41a' : '#faad14',
                                    }}
                                >
                                    {result.knownFaces}
                                </div>
                                <Text type="secondary" style={{ fontSize: 12 }}>تم التعرف</Text>
                            </Card>
                        </Col>
                    </Row>

                    {result.faces.length === 0 && (
                        <Alert type="warning" showIcon message="لم يتم كشف أي وجه في الصورة" />
                    )}

                    {result.faces.map((face, idx) => (
                        <Card
                            key={idx}
                            size="small"
                            style={{
                                marginBottom: 10,
                                borderColor: face.isKnown ? '#52c41a' : '#d9d9d9',
                                background: face.isKnown ? '#f6ffed' : '#fafafa',
                            }}
                            title={
                                <Space>
                                    {face.isKnown
                                        ? <CheckCircleOutlined style={{ color: '#52c41a' }} />
                                        : <CloseCircleOutlined style={{ color: 'var(--app-muted)' }} />}
                                    <Text strong style={{ fontSize: 13 }}>
                                        {face.isKnown ? face.name : 'وجه غير معروف'}
                                    </Text>
                                    {face.isKnown && (
                                        <Tag color={scoreColor(face.score)} style={{ fontSize: 11 }}>
                                            {scoreLabel(face.score)} — {Math.round(face.score * 100)}%
                                        </Tag>
                                    )}
                                </Space>
                            }
                            extra={
                                face.isKnown && face.person && (
                                    <Button
                                        size="small"
                                        type="link"
                                        icon={<EyeOutlined />}
                                        onClick={() => navigate(`/persons/${face.person!.personId}`)}
                                    >
                                        الملف
                                    </Button>
                                )
                            }
                        >
                            {face.isKnown && face.person && (
                                <Row gutter={8} align="middle">
                                    {face.primaryImageBase64 && (
                                        <Col span={6}>
                                            <Image
                                                src={`data:image/jpeg;base64,${face.primaryImageBase64}`}
                                                style={{
                                                    width: 60,
                                                    height: 60,
                                                    objectFit: 'cover',
                                                    borderRadius: 6,
                                                    border: `2px solid ${scoreColor(face.score)}`,
                                                }}
                                            />
                                        </Col>
                                    )}

                                    <Col span={face.primaryImageBase64 ? 18 : 24}>
                                        <div>
                                            <Text type="secondary" style={{ fontSize: 11 }}>الهوية: </Text>
                                            <Text style={{ fontSize: 12 }}>{face.person.nationalId || '—'}</Text>
                                        </div>

                                        <div>
                                            <Text type="secondary" style={{ fontSize: 11 }}>الحالة: </Text>
                                            <Tag color={face.person.isActive ? 'green' : 'red'} style={{ fontSize: 11 }}>
                                                {face.person.isActive ? 'نشط' : 'غير نشط'}
                                            </Tag>
                                        </div>

                                        {face.person.hasSuspectRecord && (
                                            <Tag color="red" style={{ marginTop: 4, fontSize: 11 }}>
                                                ⚠️ مشتبه به
                                            </Tag>
                                        )}

                                        <Progress
                                            percent={Math.round(face.score * 100)}
                                            strokeColor={scoreColor(face.score)}
                                            size="small"
                                            style={{ marginTop: 4 }}
                                        />
                                    </Col>
                                </Row>
                            )}
                        </Card>
                    ))}
                </>
            )}
        </Card>
    );
}

// ── RecognitionPage ─────────────────────────────────────
export default function RecognitionPage() {
    const navigate = useNavigate();
    const [messageApi, contextHolder] = message.useMessage();
    const [activeTab, setActiveTab] = useState('upload');
    const [currentDeviceId, setCurrentDeviceId] = useState<number | null>(() => getCurrentDeviceId());

    // ── Upload State ─────────────────────────────────────
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [capturedFile, setCapturedFile] = useState<File | null>(null);
    const [uploadResult, setUploadResult] = useState<LiveRecognitionResultDto | null>(null);

    const { data: cameras = [] } = useQuery({
        queryKey: ['cameras', currentDeviceId, true],
        queryFn: () => getCameras({ isActive: true }),
    });

    const {
        mutate: runUploadIdentify,
        isPending: uploadPending,
        error: uploadError,
        reset: uploadReset,
    } = useMutation({
        mutationFn: () => identifyFace(capturedFile!),
        onSuccess: (data) => setUploadResult(data),
        onError: () => messageApi.error('فشل التعرف'),
    });

    const handleUpload = (file: File): false => {
        if (ValidFile && ValidFile(file) === false) {
            messageApi.error('الملف غير صالح');
            return false;
        }

        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }

        setPreviewUrl(URL.createObjectURL(file));
        setCapturedFile(file);
        setUploadResult(null);
        uploadReset();
        return false;
    };

    // ── Live Camera State ────────────────────────────────
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isRunning = useRef(false);

    const [cameraOn, setCameraOn] = useState(false);
    const [liveOn, setLiveOn] = useState(false);
    const [intervalSec, setIntervalSec] = useState(2);
    const [liveResult, setLiveResult] = useState<LiveRecognitionResultDto | null>(null);
    const [livePending, setLivePending] = useState(false);
    const [frameCount, setFrameCount] = useState(0);
    const [cameraId, setCameraId] = useState<number | undefined>(undefined);

    useEffect(() => {
        const syncDevice = () => setCurrentDeviceId(getCurrentDeviceId());

        window.addEventListener('storage', syncDevice);
        window.addEventListener('focus', syncDevice);

        return () => {
            window.removeEventListener('storage', syncDevice);
            window.removeEventListener('focus', syncDevice);
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    useEffect(() => {
        if (!cameraId && cameras.length > 0) {
            setCameraId(cameras[0].cameraId);
        }
    }, [cameras, cameraId]);

    // ── Capture & Identify ───────────────────────────────
    const captureAndIdentify = useCallback(async () => {
        if (isRunning.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.readyState < 2) return;

        isRunning.current = true;
        setLivePending(true);

        try {
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
            canvas.getContext('2d')?.drawImage(video, 0, 0);

            const blob = await new Promise<Blob | null>((res) =>
                canvas.toBlob(res, 'image/jpeg', 0.85)
            );
            if (!blob) return;

            const file = new File([blob], 'frame.jpg', { type: 'image/jpeg' });
            const data = await identifyFace(file, cameraId);

            setLiveResult(data);
            setFrameCount((c) => c + 1);
        } catch {
            // تجاهل أخطاء الـ live
        } finally {
            isRunning.current = false;
            setLivePending(false);
        }
    }, [cameraId]);

    // ── Camera Controls ──────────────────────────────────
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            streamRef.current = stream;
            setCameraOn(true);

            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play().catch(console.error);
                }
            }, 50);
        } catch {
            messageApi.error('لم يتم السماح بالوصول للكاميرا');
        }
    };

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
        setCameraOn(false);
        setLiveResult(null);
    }, [stopLive]);

    const startLive = useCallback(() => {
        if (!cameraOn) return;

        if (!cameraId) {
            messageApi.warning('اختر الكاميرا أولًا');
            return;
        }

        setLiveOn(true);
        setFrameCount(0);
        captureAndIdentify();
        intervalRef.current = setInterval(captureAndIdentify, intervalSec * 1000);
    }, [cameraOn, cameraId, intervalSec, captureAndIdentify, messageApi]);

    useEffect(() => {
        if (liveOn) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = setInterval(captureAndIdentify, intervalSec * 1000);
        }
    }, [intervalSec, captureAndIdentify, liveOn]);

    useEffect(() => {
        return () => {
            stopLive();
            streamRef.current?.getTracks().forEach((t) => t.stop());
        };
    }, [stopLive]);

    const handleTabChange = (key: string) => {
        setActiveTab(key);
        if (key !== 'live') stopCamera();
    };

    return (
        <div
            style={{
                padding: 24,
                direction: 'rtl',
                background: 'var(--app-page-bg)',
                minHeight: '100vh',
                color: 'var(--app-text)',
            }}
        >
            {contextHolder}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {!currentDeviceId && (
                <Alert
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16 }}
                    message="لم يتم اختيار الجهاز الحالي"
                    description={
                        <Space direction="vertical" size={8}>
                            <Text>
                                إذا كنت تريد التعرف المباشر أو الكامرات المحلية الخاصة بهذا الجهاز، افتح صفحة المراقبة أولًا وحدد الجهاز الحالي.
                            </Text>
                            <Button
                                size="small"
                                type="primary"
                                icon={<MonitorOutlined />}
                                onClick={() => navigate('/cameras/monitor')}
                                style={{ width: 'fit-content' }}
                            >
                                فتح صفحة اختيار الجهاز
                            </Button>
                        </Space>
                    }
                />
            )}

            <Space align="center" style={{ marginBottom: 24, flexWrap: 'wrap' }}>
                <SearchOutlined style={{ fontSize: 28, color: '#1677ff' }} />
                <Title level={3} style={{ margin: 0 }}>التعرف على الوجه</Title>

                {liveOn && (
                    <Badge
                        status="processing"
                        text={<Text type="success">Live — {frameCount} فريم</Text>}
                    />
                )}

                <Text type="secondary" style={{ fontSize: 12 }}>
                    <LinkOutlined style={{ marginLeft: 4 }} />
                    الجهاز الحالي: {currentDeviceId ? `#${currentDeviceId}` : 'غير محدد'}
                </Text>
            </Space>

            <Tabs
                activeKey={activeTab}
                onChange={handleTabChange}
                size="large"
                items={[
                    {
                        key: 'upload',
                        label: <Space><UploadOutlined />رفع صورة</Space>,
                        children: (
                            <Row gutter={24}>
                                <Col xs={24} lg={10}>
                                    <Card title="الصورة">
                                        {previewUrl ? (
                                            <div style={{ textAlign: 'center', marginBottom: 16 }}>
                                                <Image
                                                    src={previewUrl}
                                                    style={{
                                                        width: '100%',
                                                        maxHeight: 280,
                                                        objectFit: 'cover',
                                                        borderRadius: 8,
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <div
                                                style={{
                                                    height: 200,
                                                    border: '2px dashed var(--app-border)',
                                                    borderRadius: 8,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    marginBottom: 16,
                                                    background: 'var(--app-surface-2)',
                                                }}
                                            >
                                                <UploadOutlined
                                                    style={{
                                                        fontSize: 48,
                                                        color: 'var(--app-muted)',
                                                        marginBottom: 8,
                                                    }}
                                                />
                                                <Text type="secondary">اختر صورة</Text>
                                            </div>
                                        )}

                                        <Upload<UploadFile>
                                            accept="image/*"
                                            showUploadList={false}
                                            beforeUpload={(f) => handleUpload(f as unknown as File)}
                                        >
                                            <Button icon={<UploadOutlined />} block style={{ marginBottom: 12 }}>
                                                {previewUrl ? 'تغيير الصورة' : 'اختيار صورة'}
                                            </Button>
                                        </Upload>

                                        <Button
                                            type="primary"
                                            icon={<SearchOutlined />}
                                            onClick={() => runUploadIdentify()}
                                            loading={uploadPending}
                                            disabled={!capturedFile}
                                            block
                                            size="large"
                                        >
                                            {uploadPending ? 'جاري البحث...' : 'ابحث عن الشخص'}
                                        </Button>

                                        <div style={{ marginTop: 8 }}>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                📌 تأكد أن الصورة تحتوي على وجه واضح
                                            </Text>
                                        </div>
                                    </Card>
                                </Col>

                                <Col xs={24} lg={14}>
                                    <ResultPanel
                                        result={uploadResult}
                                        isPending={uploadPending}
                                        error={uploadError}
                                    />
                                </Col>
                            </Row>
                        ),
                    },
                    {
                        key: 'live',
                        label: <Space><PlayCircleOutlined />تعرف مباشر</Space>,
                        children: (
                            <Row gutter={24}>
                                <Col xs={24} lg={12}>
                                    <Card
                                        title={
                                            <Space>
                                                <CameraOutlined />
                                                <span>الكاميرا</span>
                                                {livePending && <Badge status="processing" text="يحلل..." />}
                                            </Space>
                                        }
                                    >
                                        <div
                                            style={{
                                                background: 'var(--app-video-bg)',
                                                borderRadius: 8,
                                                overflow: 'hidden',
                                                marginBottom: 16,
                                                minHeight: 240,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                position: 'relative',
                                            }}
                                        >
                                            <video
                                                ref={videoRef}
                                                autoPlay
                                                playsInline
                                                muted
                                                style={{
                                                    width: '100%',
                                                    display: cameraOn ? 'block' : 'none',
                                                }}
                                            />

                                            {liveOn && (
                                                <div
                                                    style={{
                                                        position: 'absolute',
                                                        top: 8,
                                                        right: 8,
                                                        background: livePending ? '#ff4d4f' : '#52c41a',
                                                        borderRadius: '50%',
                                                        width: 12,
                                                        height: 12,
                                                        boxShadow: `0 0 6px ${livePending ? '#ff4d4f' : '#52c41a'}`,
                                                    }}
                                                />
                                            )}

                                            {!cameraOn && (
                                                <div style={{ textAlign: 'center', padding: 40 }}>
                                                    <CameraOutlined
                                                        style={{
                                                            fontSize: 56,
                                                            color: 'var(--app-muted)',
                                                            marginBottom: 12,
                                                        }}
                                                    />
                                                    <br />
                                                    <Text style={{ color: 'var(--app-muted)' }}>
                                                        افتح الكاميرا للبدء
                                                    </Text>
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ marginBottom: 12 }}>
                                            <Space wrap>
                                                <Text strong>الكاميرا المرتبطة:</Text>
                                                <Select
                                                    value={cameraId}
                                                    onChange={setCameraId}
                                                    disabled={liveOn}
                                                    options={cameras.map(c => ({
                                                        value: c.cameraId,
                                                        label: `${c.name}${c.area ? ` — ${c.area}` : ''}`,
                                                    }))}
                                                    style={{ width: 260 }}
                                                    placeholder="اختر كاميرا"
                                                />
                                            </Space>
                                        </div>

                                        <Space direction="vertical" style={{ width: '100%' }}>
                                            {!cameraOn ? (
                                                <Button
                                                    icon={<CameraOutlined />}
                                                    block
                                                    size="large"
                                                    onClick={startCamera}
                                                >
                                                    فتح الكاميرا
                                                </Button>
                                            ) : (
                                                <Button
                                                    danger
                                                    icon={<StopOutlined />}
                                                    block
                                                    size="large"
                                                    onClick={stopCamera}
                                                    disabled={liveOn}
                                                >
                                                    إغلاق الكاميرا
                                                </Button>
                                            )}

                                            {cameraOn && (
                                                !liveOn ? (
                                                    <Button
                                                        type="primary"
                                                        icon={<PlayCircleOutlined />}
                                                        block
                                                        size="large"
                                                        onClick={startLive}
                                                        style={{ background: '#52c41a', borderColor: '#52c41a' }}
                                                    >
                                                        بدء التعرف المستمر
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        icon={<PauseCircleOutlined />}
                                                        block
                                                        size="large"
                                                        onClick={stopLive}
                                                        danger
                                                    >
                                                        إيقاف التعرف
                                                    </Button>
                                                )
                                            )}
                                        </Space>

                                        <Divider />

                                        <div>
                                            <Space style={{ marginBottom: 8 }}>
                                                <Text strong>فترة الإرسال:</Text>
                                                <Tag color="blue">{intervalSec} ثانية</Tag>
                                            </Space>

                                            <Slider
                                                min={1}
                                                max={10}
                                                step={1}
                                                value={intervalSec}
                                                onChange={(v) => setIntervalSec(v as number)}
                                                marks={{ 1: '1s', 2: '2s', 3: '3s', 5: '5s', 10: '10s' }}
                                            />

                                            <Text type="secondary" style={{ fontSize: 11 }}>
                                                💡 CPU عادي → 2-3s | CPU قوي → 1s | جهاز ضعيف → 5s+
                                            </Text>
                                        </div>
                                    </Card>
                                </Col>

                                <Col xs={24} lg={12}>
                                    <ResultPanel
                                        result={liveResult}
                                        isPending={livePending}
                                        cameraMode
                                        frameCount={frameCount}
                                    />
                                </Col>
                            </Row>
                        ),
                    },
                ]}
            />
        </div>
    );
}