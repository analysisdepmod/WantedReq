// ════════════════════════════════════════════════════════
//  src/pages/cameras/CameraDetailPage.tsx  —  Route: /cameras/:id
//  يُفتح في تاب جديد
// ════════════════════════════════════════════════════════

import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Row, Col, Button, Typography, Space, Spin, Tag, Progress,
    Image, Slider, Alert, message, Badge, Tooltip,
} from 'antd';
import {
    VideoCameraOutlined, PlayCircleOutlined, PauseCircleOutlined,
    StopOutlined, CheckCircleOutlined, CloseCircleOutlined,
    EyeOutlined, UserOutlined, WarningOutlined, ArrowRightOutlined,
    EnvironmentOutlined, WifiOutlined, FieldTimeOutlined,
} from '@ant-design/icons';
import { getCameraById } from '../../api/camerasApi';
import { identifyFace } from '../../api/recognitionApi';
import type { LiveRecognitionResultDto, RecognitionFaceDto } from '../../types/camera.types';

const { Text } = Typography;

const CSS = `
  @keyframes scanLine {
    0%   { top:0%; }
    100% { top:100%; }
  }
  @keyframes fadeIn {
    from { opacity:0; transform:translateY(5px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes liveDot {
    0%,100% { opacity:1; }
    50%      { opacity:.3; }
  }
  .face-card { border:1px solid #e6eaf0; border-radius:12px; padding:14px; margin-bottom:10px;
               transition:border-color .2s; animation:fadeIn .3s ease both; background:var(--app-surface); }
  .face-card.known { border-color:#b7eb8f; background:var(--app-soft-green); }
  .face-card:hover { border-color:#1677ff; }
`;

const scoreColor = (s: number) =>
    s >= 0.8 ? '#52c41a' : s >= 0.6 ? '#faad14' : '#ff4d4f';
const scoreLabel = (s: number) =>
    s >= 0.8 ? 'تطابق عالي' : s >= 0.6 ? 'تطابق متوسط' : 'تطابق ضعيف';

function FaceCard({ face }: { face: RecognitionFaceDto }) {
    const navigate = useNavigate();
    return (
        <div className={`face-card${face.isKnown ? ' known' : ''}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: face.isKnown ? 10 : 0 }}>
                <Space size={8} align="start">
                    {face.isKnown
                        ? <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 15, marginTop: 2 }} />
                        : <CloseCircleOutlined style={{ color: '#bfbfbf', fontSize: 15, marginTop: 2 }} />}
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
                        <Button size="small" icon={<EyeOutlined />} type="primary" ghost
                            onClick={() => navigate(`/persons/${face.person!.personId}`)}
                            style={{ borderRadius: 7, height: 26, fontSize: 11 }}>
                            الملف
                        </Button>
                    </Tooltip>
                )}
            </div>

            {face.isKnown && face.person && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {face.primaryImageBase64 ? (
                        <Image
                            src={`data:image/jpeg;base64,${face.primaryImageBase64}`}
                            style={{
                                width: 54, height: 54, objectFit: 'cover', borderRadius: 8, flexShrink: 0,
                                border: `2px solid ${scoreColor(face.score)}`,
                            }}
                            preview={false}
                        />
                    ) : (
                        <div style={{
                            width: 54, height: 54, borderRadius: 8, flexShrink: 0,
                            background: 'var(--app-surface-2)', border: '1px solid var(--app-border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <UserOutlined style={{ color: '#bfbfbf', fontSize: 20 }} />
                        </div>
                    )}
                    <div style={{ flex: 1 }}>
                        {face.person.hasSuspectRecord && (
                            <Tag color="red" style={{ marginBottom: 4, fontSize: 11 }}>
                                <WarningOutlined style={{ marginLeft: 3 }} />مشتبه به
                            </Tag>
                        )}
                        <Progress
                            percent={Math.round(face.score * 100)}
                            strokeColor={scoreColor(face.score)}
                            size="small"
                            format={p => <span style={{ color: scoreColor(face.score), fontSize: 11 }}>{p}%</span>}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default function CameraDetailPage() {
    const { id } = useParams<{ id: string }>();
    const cameraId = Number(id);
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
            const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/jpeg', 0.85));
            if (!blob) return;
            const data = await identifyFace(new File([blob], 'frame.jpg', { type: 'image/jpeg' }), cameraId);
            setLiveResult(data);
            setFrameCount(c => c + 1);
            if (data.knownFaces > 0) setTotalKnown(t => t + data.knownFaces);
        } catch { /* silent */ }
        finally { isRunning.current = false; setLivePending(false); }
    }, [cameraId]);

    const stopLive = useCallback(() => {
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
        setLiveOn(false); isRunning.current = false; setLivePending(false);
    }, []);

    const stopCamera = useCallback(() => {
        stopLive();
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        setCameraOn(false); setLiveResult(null);
    }, [stopLive]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            streamRef.current = stream;
            setCameraOn(true);
            setTimeout(() => {
                if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(console.error); }
            }, 50);
        } catch { msgApi.error('لم يتم السماح بالوصول للكاميرا'); }
    };

    const startLive = useCallback(() => {
        if (!cameraOn) return;
        setLiveOn(true); setFrameCount(0); setTotalKnown(0);
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
        stopLive(); streamRef.current?.getTracks().forEach(t => t.stop());
    }, [stopLive]);

    if (camLoading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
            <Spin size="large" />
        </div>
    );

    return (
        <>
            <style>{CSS}</style>
            {ctx}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            <div style={{ background: 'var(--app-page-bg)', minHeight: '100vh', padding: '16px 20px', direction: 'rtl' }}>

                {/* Top bar */}
                <div style={{
                    background: 'var(--app-surface)', border: '1px solid var(--app-border)', borderRadius: 12,
                    padding: '12px 18px', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,.05)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    flexWrap: 'wrap', gap: 12,
                }}>
                    <Space size={12} align="center">
                        <Tooltip title="إغلاق">
                            <Button icon={<ArrowRightOutlined />} onClick={() => window.close()} size="small" style={{ borderRadius: 7 }} />
                        </Tooltip>
                        <div style={{
                            width: 38, height: 38, borderRadius: 9, flexShrink: 0,
                            background: cameraOn ? '#f6ffed' : '#f5f5f5',
                            border: `1px solid ${cameraOn ? '#b7eb8f' : '#e6eaf0'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <VideoCameraOutlined style={{ fontSize: 18, color: cameraOn ? '#52c41a' : '#bfbfbf' }} />
                        </div>
                        <div>
                            <Text strong style={{ fontSize: 15, display: 'block' }}>
                                {camera?.name ?? `كاميرا ${cameraId}`}
                            </Text>
                            <Space size={10} style={{ marginTop: 1 }}>
                                {camera?.area && (
                                    <Text type="secondary" style={{ fontSize: 11 }}>
                                        <EnvironmentOutlined style={{ marginLeft: 3 }} />{camera.area}
                                    </Text>
                                )}
                                <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>
                                    <WifiOutlined style={{ marginLeft: 3 }} />{camera?.ipAddress}
                                </Text>
                            </Space>
                        </div>
                    </Space>

                    <Space size={10}>
                        {liveOn && <Badge status="processing" text={<Text style={{ color: '#52c41a', fontWeight: 600 }}>LIVE</Text>} />}
                        {[
                            { label: 'الفريمات', value: frameCount, color: 'var(--app-muted)' },
                            { label: 'التعرفات', value: totalKnown, color: '#52c41a' },
                        ].map(s => (
                            <div key={s.label} style={{
                                background: 'var(--app-page-bg)', border: '1px solid var(--app-border)',
                                borderRadius: 8, padding: '4px 14px', textAlign: 'center',
                            }}>
                                <div style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.value}</div>
                                <div style={{ fontSize: 10, color: 'var(--app-muted)' }}>{s.label}</div>
                            </div>
                        ))}
                    </Space>
                </div>

                {/* Main layout */}
                <Row gutter={[14, 14]}>

                    {/* Video */}
                    <Col xs={24} lg={14}>
                        <div style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
                            {/* Viewport */}
                            <div style={{
                                background: 'var(--app-video-bg)', position: 'relative',
                                minHeight: 300, aspectRatio: '16/9',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                            }}>
                                <video ref={videoRef} autoPlay playsInline muted
                                    style={{ width: '100%', display: cameraOn ? 'block' : 'none' }} />

                                {livePending && cameraOn && (
                                    <div style={{
                                        position: 'absolute', left: 0, right: 0, height: 2,
                                        background: 'linear-gradient(90deg,transparent,#52c41a,transparent)',
                                        animation: 'scanLine 1.5s ease infinite', zIndex: 10,
                                    }} />
                                )}

                                {liveOn && (
                                    <div style={{
                                        position: 'absolute', top: 10, left: 10,
                                        display: 'flex', alignItems: 'center', gap: 6,
                                        background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)',
                                        borderRadius: 20, padding: '4px 10px', border: '1px solid rgba(255,255,255,.15)',
                                    }}>
                                        <span style={{
                                            width: 8, height: 8, borderRadius: '50%', display: 'inline-block',
                                            background: livePending ? '#faad14' : '#52c41a',
                                            animation: 'liveDot 1.2s infinite',
                                        }} />
                                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>
                                            {livePending ? 'يحلل...' : 'LIVE'}
                                        </Text>
                                    </div>
                                )}

                                {!cameraOn && (
                                    <div style={{ textAlign: 'center', padding: 50 }}>
                                        <VideoCameraOutlined style={{ fontSize: 72, color: '#3a3a3a', marginBottom: 12 }} />
                                        <br />
                                        <Text style={{ color: '#888' }}>ابدأ الكاميرا للتعرف على الوجوه</Text>
                                    </div>
                                )}
                            </div>

                            {/* Controls */}
                            <div style={{ padding: '14px 16px' }}>
                                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                                    {!cameraOn ? (
                                        <Button icon={<VideoCameraOutlined />} onClick={startCamera}
                                            style={{ flex: 1, height: 40, borderRadius: 10 }}>
                                            فتح الكاميرا
                                        </Button>
                                    ) : (
                                        <>
                                            {!liveOn ? (
                                                <Button icon={<PlayCircleOutlined />} onClick={startLive} type="primary"
                                                    style={{ flex: 1, height: 40, borderRadius: 10, background: '#52c41a', borderColor: '#52c41a' }}>
                                                    بدء التعرف
                                                </Button>
                                            ) : (
                                                <Button icon={<PauseCircleOutlined />} onClick={stopLive} danger
                                                    style={{ flex: 1, height: 40, borderRadius: 10 }}>
                                                    إيقاف التعرف
                                                </Button>
                                            )}
                                            <Button icon={<StopOutlined />} onClick={stopCamera} disabled={liveOn}
                                                style={{ height: 40, borderRadius: 10 }}>
                                                إغلاق
                                            </Button>
                                        </>
                                    )}
                                </div>

                                {/* Interval */}
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            <FieldTimeOutlined style={{ marginLeft: 4 }} />فترة الإرسال
                                        </Text>
                                        <Tag color="blue">{intervalSec}s</Tag>
                                    </div>
                                    <Slider min={1} max={10} step={1} value={intervalSec} onChange={setIntervalSec}
                                        marks={{ 1: '1s', 3: '3s', 5: '5s', 10: '10s' }}
                                        tooltip={{ formatter: v => `${v} ثانية` }} />
                                    <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
                                        💡 عادي → 3s &nbsp;|&nbsp; قوي → 1s &nbsp;|&nbsp; ضعيف → 5s+
                                    </Text>
                                </div>
                            </div>
                        </div>
                    </Col>

                    {/* Results */}
                    <Col xs={24} lg={10}>
                        <div style={{
                            background: 'var(--app-surface)', border: '1px solid var(--app-border)', borderRadius: 14,
                            padding: 14, height: '100%', display: 'flex', flexDirection: 'column',
                            boxShadow: '0 1px 4px rgba(0,0,0,.05)',
                        }}>
                            {/* Panel header */}
                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #f0f0f0',
                            }}>
                                <Text strong style={{ fontSize: 14 }}>نتائج التعرف</Text>
                                {liveResult && (
                                    <Space size={6}>
                                        <Tag color="blue">{liveResult.totalFaces} وجه</Tag>
                                        <Tag color={liveResult.knownFaces > 0 ? 'success' : 'default'}>
                                            {liveResult.knownFaces} معروف
                                        </Tag>
                                    </Space>
                                )}
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto' }}>
                                {livePending && !liveResult && (
                                    <div style={{ textAlign: 'center', padding: 40 }}>
                                        <Spin /><br /><br />
                                        <Text type="secondary">يحلل الفريم…</Text>
                                    </div>
                                )}

                                {!liveResult && !livePending && (
                                    <div style={{ textAlign: 'center', padding: 50 }}>
                                        <UserOutlined style={{ fontSize: 52, color: '#e6eaf0', marginBottom: 12 }} />
                                        <br />
                                        <Text type="secondary">
                                            {cameraOn ? 'اضغط "بدء التعرف" للبدء' : 'افتح الكاميرا أولاً'}
                                        </Text>
                                    </div>
                                )}

                                {liveResult?.faces.length === 0 && (
                                    <Alert message="لم يُكتشف أي وجه في هذا الفريم" type="info" showIcon />
                                )}

                                {liveResult?.faces.map((face, idx) => (
                                    <FaceCard key={idx} face={face} />
                                ))}
                            </div>
                        </div>
                    </Col>
                </Row>
            </div>
        </>
    );
}