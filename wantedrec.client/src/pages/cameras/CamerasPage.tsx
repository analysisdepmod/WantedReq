// ════════════════════════════════════════════════════════
//  src/pages/cameras/CamerasPage.tsx  —  Route: /cameras
// ════════════════════════════════════════════════════════

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Row, Col, Button, Typography, Space, Switch, Spin, Tooltip, message, Tag } from 'antd';
import {
    VideoCameraOutlined, ReloadOutlined, EnvironmentOutlined,
    WifiOutlined, FundViewOutlined, HomeOutlined, GlobalOutlined,
    ThunderboltOutlined, PlayCircleOutlined,
} from '@ant-design/icons';
import { getCameras, activateCamera, deactivateCamera } from '../../api/camerasApi';
import type { CameraDto } from '../../types/camera.types';
import { detectCameraKind } from '../../types/camera.types';

const { Title, Text } = Typography;

const CSS = `
  @keyframes livePulse {
    0%,100% { box-shadow:0 0 0 0 rgba(82,196,26,.45); }
    60%      { box-shadow:0 0 0 5px rgba(82,196,26,0); }
  }
  @keyframes slideUp {
    from { opacity:0; transform:translateY(10px); }
    to   { opacity:1; transform:translateY(0); }
  }
  .cam-card {
    background:#fff; border:1px solid #e6eaf0; border-radius:14px;
    padding:18px 16px; height:100%; display:flex; flex-direction:column;
    gap:12px; transition:border-color .2s,transform .2s,box-shadow .2s;
  }
  .cam-card:hover {
    border-color:#1677ff !important; transform:translateY(-2px);
    box-shadow:0 8px 28px rgba(22,119,255,.1);
  }
  .cam-card.on { border-color:#b7eb8f; background:linear-gradient(150deg,#f6ffed,#fff); }
`;

function Chip({ label, value, color, bg }: {
    label: string; value: number | string; color: string; bg: string;
}) {
    return (
        <div style={{
            background: bg, border: '1px solid #e6eaf0',
            borderRadius: 10, padding: '7px 18px', textAlign: 'center', minWidth: 80,
        }}>
            <div style={{ fontSize: 20, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 3 }}>{label}</div>
        </div>
    );
}

function CameraCard({ camera, index, onToggle, toggling }: {
    camera: CameraDto; index: number; onToggle: () => void; toggling: boolean;
}) {
    const kind = detectCameraKind(camera);
    const kindLabel = {
        'local': { text: 'محلية', color: '#1677ff' },
        'ip-mjpeg': { text: 'MJPEG', color: '#722ed1' },
        'ip-rtsp': { text: 'RTSP', color: '#eb2f96' },
    }[kind];

    return (
        <div
            className={`cam-card${camera.isActive ? ' on' : ''}`}
            style={{ animation: `slideUp .35s ease ${index * .05}s both` }}
        >
            {/* Top */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{
                    width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                    background: camera.isActive ? '#f6ffed' : '#f5f5f5',
                    border: `1px solid ${camera.isActive ? '#b7eb8f' : '#e6eaf0'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <VideoCameraOutlined style={{
                        fontSize: 19, color: camera.isActive ? '#52c41a' : '#bfbfbf',
                    }} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {camera.isActive && (
                        <span style={{
                            width: 7, height: 7, borderRadius: '50%', display: 'inline-block',
                            background: '#52c41a', animation: 'livePulse 2s infinite',
                        }} />
                    )}
                    <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 20,
                        color: camera.isActive ? '#389e0d' : '#8c8c8c',
                        background: camera.isActive ? '#f6ffed' : '#f5f5f5',
                        border: `1px solid ${camera.isActive ? '#b7eb8f' : '#e6eaf0'}`,
                    }}>
                        {camera.isActive ? 'نشطة' : 'متوقفة'}
                    </span>
                </div>
            </div>

            {/* Name */}
            <div>
                <Text strong style={{ fontSize: 14, color: '#1a1a2e', display: 'block' }}>
                    {camera.name}
                </Text>
                <div style={{ display: 'flex', gap: 5, marginTop: 3 }}>
                    <Tag style={{
                        fontSize: 10, margin: 0, padding: '0 6px',
                        background: `${kindLabel.color}12`,
                        borderColor: `${kindLabel.color}44`,
                        color: kindLabel.color,
                    }}>
                        {kind === 'local'
                            ? <HomeOutlined style={{ marginLeft: 2 }} />
                            : <WifiOutlined style={{ marginLeft: 2 }} />}
                        {kindLabel.text}
                        {kind === 'local' && camera.localDeviceIndex !== undefined && (
                            <span style={{ marginRight: 3, opacity: .7 }}>
                                [{camera.localDeviceIndex}]
                            </span>
                        )}
                    </Tag>
                </div>
            </div>

            {/* Meta */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                {camera.area && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <EnvironmentOutlined style={{ color: '#8c8c8c', fontSize: 12 }} />
                        <Text style={{ color: '#595959', fontSize: 12 }}>{camera.area}</Text>
                    </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {kind === 'local' ? (
                        <>
                            <HomeOutlined style={{ color: '#1677ff', fontSize: 12 }} />
                            <Text style={{ color: '#595959', fontSize: 12 }}>
                                جهاز محلي — index {camera.localDeviceIndex ?? 0}
                            </Text>
                        </>
                    ) : (
                        <>
                            <WifiOutlined style={{ color: '#8c8c8c', fontSize: 12 }} />
                            <Text style={{ color: '#595959', fontSize: 12, fontFamily: 'monospace' }}>
                                {camera.ipAddress}
                            </Text>
                        </>
                    )}
                </div>

                <div style={{ marginTop: 2 }}>
                    {camera.isIndoor
                        ? <HomeOutlined style={{ color: '#1677ff', fontSize: 11, marginLeft: 4 }} />
                        : <GlobalOutlined style={{ color: '#52c41a', fontSize: 11, marginLeft: 4 }} />}
                    <span style={{ fontSize: 11, color: camera.isIndoor ? '#1677ff' : '#52c41a' }}>
                        {camera.isIndoor ? 'داخلية' : 'خارجية'}
                    </span>
                </div>
            </div>

            <div style={{ height: 1, background: '#f0f0f0' }} />

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Switch
                    checked={camera.isActive}
                    onChange={onToggle}
                    loading={toggling}
                    checkedChildren="ON"
                    unCheckedChildren="OFF"
                    size="small"
                    style={{ flexShrink: 0 }}
                />
                <Button
                    size="small"
                    type="primary"
                    icon={<FundViewOutlined />}
                    onClick={() => window.open(`/cameras/${camera.cameraId}`, '_blank')}
                    style={{ flex: 1, height: 28, borderRadius: 8, fontSize: 12 }}
                >
                    فتح منفردة
                </Button>
            </div>
        </div>
    );
}

export default function CamerasPage() {
    const qc = useQueryClient();
    const [msgApi, ctx] = message.useMessage();
    const [togglingId, setTogglingId] = useState<number | null>(null);
    const [openingMonitor, setOpeningMonitor] = useState(false);

    const { data: cameras = [], isLoading, refetch, isFetching } = useQuery<CameraDto[]>({
        queryKey: ['cameras'],
        queryFn: () => getCameras(),
        refetchInterval: 30_000,
    });

    const toggle = useMutation({
        mutationFn: (cam: CameraDto) =>
            cam.isActive ? deactivateCamera(cam.cameraId) : activateCamera(cam.cameraId),
        onMutate: (cam) => setTogglingId(cam.cameraId),
        onSuccess: (_, cam) => {
            msgApi.success(cam.isActive ? 'تم إيقاف الكاميرا' : 'تم تشغيل الكاميرا');
            qc.invalidateQueries({ queryKey: ['cameras'] });
        },
        onError: () => msgApi.error('فشل تغيير الحالة'),
        onSettled: () => setTogglingId(null),
    });

    const openMonitor = () => {
        if (openingMonitor) return;

        setOpeningMonitor(true);

        try {
            const win = window.open('/cameras/monitor', 'live-monitor');
            win?.focus();
        } finally {
            window.setTimeout(() => setOpeningMonitor(false), 1000);
        }
    };

    const active = cameras.filter(c => c.isActive).length;
    const inactive = cameras.length - active;
    const local = cameras.filter(c => !c.streamUrl).length;
    const ip = cameras.length - local;

    return (
        <>
            <style>{CSS}</style>
            {ctx}

            <div style={{ padding: 24, direction: 'rtl', background: '#f7f9fc', minHeight: '100vh' }}>
                {/* Header */}
                <div style={{
                    background: '#fff',
                    border: '1px solid #e6eaf0',
                    borderRadius: 16,
                    padding: '18px 24px',
                    marginBottom: 24,
                    boxShadow: '0 1px 4px rgba(0,0,0,.05)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 16,
                }}>
                    <Space align="center" size={14}>
                        <div style={{
                            width: 46,
                            height: 46,
                            borderRadius: 12,
                            background: '#e6f4ff',
                            border: '1px solid #91caff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <ThunderboltOutlined style={{ fontSize: 22, color: '#1677ff' }} />
                        </div>

                        <div>
                            <Title level={4} style={{ margin: 0, color: '#1a1a2e', fontWeight: 700 }}>
                                مركز إدارة الكاميرات
                            </Title>
                            <Text style={{ color: '#8c8c8c', fontSize: 12 }}>
                                تشغيل وإيقاف وإدارة جميع الكاميرات
                            </Text>
                        </div>
                    </Space>

                    <Space size={10} wrap>
                        <Chip label="الإجمالي" value={cameras.length} color="#1a1a2e" bg="#f5f5f5" />
                        <Chip label="نشطة" value={active} color="#389e0d" bg="#f6ffed" />
                        <Chip label="متوقفة" value={inactive} color="#cf1322" bg="#fff1f0" />
                        <Chip label="محلية" value={local} color="#1677ff" bg="#e6f4ff" />
                        <Chip label="IP" value={ip} color="#722ed1" bg="#f9f0ff" />

                        <Tooltip title="تحديث">
                            <Button
                                icon={<ReloadOutlined spin={isFetching} />}
                                onClick={() => refetch()}
                                style={{ height: 38, borderRadius: 9 }}
                            />
                        </Tooltip>

                        <Button
                            type="primary"
                            icon={<PlayCircleOutlined />}
                            onClick={openMonitor}
                            loading={openingMonitor}
                            style={{
                                height: 38,
                                borderRadius: 9,
                                background: '#52c41a',
                                borderColor: '#52c41a',
                            }}
                        >
                            المراقبة المباشرة
                        </Button>
                    </Space>
                </div>

                {/* Grid */}
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: 100 }}>
                        <Spin size="large" />
                        <br />
                        <br />
                        <Text type="secondary">جاري تحميل الكاميرات…</Text>
                    </div>
                ) : cameras.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: 80,
                        background: '#fff',
                        borderRadius: 16,
                        border: '1px solid #e6eaf0',
                    }}>
                        <VideoCameraOutlined style={{ fontSize: 72, color: '#d9d9d9' }} />
                        <br />
                        <br />
                        <Title level={4} style={{ color: '#8c8c8c' }}>لا توجد كاميرات مسجلة</Title>
                        <Text type="secondary">أضف كاميرات من لوحة الإدارة</Text>
                    </div>
                ) : (
                    <Row gutter={[16, 16]}>
                        {cameras.map((cam, idx) => (
                            <Col key={cam.cameraId} xs={24} sm={12} md={8} lg={6}>
                                <CameraCard
                                    camera={cam}
                                    index={idx}
                                    onToggle={() => toggle.mutate(cam)}
                                    toggling={togglingId === cam.cameraId}
                                />
                            </Col>
                        ))}
                    </Row>
                )}
            </div>
        </>
    );
}