// ═══════════════════════════════════════════════════════
//  src/pages/cameras/CamerasManagePage.tsx
//  Route: /cameras   — إدارة الكاميرات (CRUD)
// ═══════════════════════════════════════════════════════
import { useEffect } from 'react';
import {
    Row, Col, Button, Typography, Space, Switch, Spin,
    Tooltip, Tag, Modal, Form, Input, Select,
    InputNumber, Popconfirm, Divider, Badge,
} from 'antd';
import {
    VideoCameraOutlined, PlusOutlined, EditOutlined,
    DeleteOutlined, ReloadOutlined, PlayCircleOutlined,
    WifiOutlined, HomeOutlined, GlobalOutlined,
    EnvironmentOutlined, ThunderboltOutlined,
    CheckCircleOutlined, StopOutlined, SettingOutlined,
} from '@ant-design/icons';
import { useCameras, type CameraUpsertPayload } from '../../hooks/useCameras';
import type { CameraDto } from '../../types/camera.types';
import { detectCameraKind } from '../../types/camera.types';

const { Title, Text } = Typography;

// ── Palette ───────────────────────────────────────────────
const C = {
    bg:     '#f4f6fb',
    white:  '#ffffff',
    border: '#e4e9f2',
    blue:   '#2563eb',
    green:  '#16a34a',
    red:    '#dc2626',
    purple: '#7c3aed',
    amber:  '#d97706',
    text:   '#0f172a',
    muted:  '#64748b',
};

const CSS = `
  @keyframes livePulse {
    0%,100% { box-shadow:0 0 0 0 rgba(22,163,74,.5); }
    60%      { box-shadow:0 0 0 8px rgba(22,163,74,0); }
  }
  @keyframes slideUp {
    from { opacity:0; transform:translateY(12px); }
    to   { opacity:1; transform:translateY(0); }
  }
  .cam-card {
    background:#fff; border:1px solid #e4e9f2; border-radius:16px;
    padding:20px; height:100%; display:flex; flex-direction:column;
    gap:14px; transition:all .25s; cursor:default;
    position:relative; overflow:hidden;
  }
  .cam-card::before {
    content:''; position:absolute; top:0; left:0; right:0; height:3px;
    background:linear-gradient(90deg,#2563eb,#7c3aed);
    opacity:0; transition:opacity .25s;
  }
  .cam-card:hover { border-color:#2563eb33; transform:translateY(-3px);
    box-shadow:0 12px 32px rgba(37,99,235,.12); }
  .cam-card:hover::before { opacity:1; }
  .cam-card.active { border-color:#bbf7d0; background:linear-gradient(160deg,#f0fdf4,#fff); }
  .cam-card.active::before { opacity:1; background:linear-gradient(90deg,#16a34a,#059669); }
`;

// ── KindBadge ─────────────────────────────────────────────
function KindBadge({ cam }: { cam: CameraDto }) {
    const kind = detectCameraKind(cam);
    const map = {
        local:    { label: 'محلية',  color: C.blue,   icon: <HomeOutlined /> },
        'ip-mjpeg': { label: 'MJPEG', color: C.purple, icon: <WifiOutlined /> },
        'ip-rtsp':  { label: 'RTSP',  color: '#db2777', icon: <WifiOutlined /> },
    };
    const k = map[kind];
    return (
        <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
            background: `${k.color}14`, border: `1px solid ${k.color}33`, color: k.color,
            display: 'inline-flex', alignItems: 'center', gap: 4,
        }}>
            {k.icon} {k.label}
        </span>
    );
}

// ── CameraCard ────────────────────────────────────────────
function CameraCard({ cam, idx, onEdit, onDelete, onToggle, toggling }: {
    cam: CameraDto; idx: number;
    onEdit: () => void; onDelete: () => void;
    onToggle: () => void; toggling: boolean;
}) {
    return (
        <div className={`cam-card${cam.isActive ? ' active' : ''}`}
             style={{ animation: `slideUp .35s ease ${idx * .04}s both` }}>

            {/* Status dot */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                        background: cam.isActive ? '#dcfce7' : '#f1f5f9',
                        border: `1px solid ${cam.isActive ? '#bbf7d0' : '#e4e9f2'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <VideoCameraOutlined style={{ fontSize: 20, color: cam.isActive ? C.green : '#94a3b8' }} />
                    </div>
                    <div>
                        <Text strong style={{ fontSize: 14, color: C.text, display: 'block' }}>
                            {cam.name}
                        </Text>
                        {cam.code && (
                            <Text style={{ fontSize: 11, color: C.muted, fontFamily: 'monospace' }}>
                                {cam.code}
                            </Text>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {cam.isActive && (
                        <span style={{
                            width: 8, height: 8, borderRadius: '50%', background: C.green,
                            display: 'inline-block', animation: 'livePulse 2s infinite',
                        }} />
                    )}
                    <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20,
                        color: cam.isActive ? C.green : C.muted,
                        background: cam.isActive ? '#dcfce7' : '#f1f5f9',
                        border: `1px solid ${cam.isActive ? '#bbf7d0' : C.border}`,
                    }}>
                        {cam.isActive ? 'نشطة' : 'متوقفة'}
                    </span>
                </div>
            </div>

            {/* Kind + Location */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <KindBadge cam={cam} />
                {cam.isIndoor ? (
                    <span style={{ fontSize: 10, color: C.blue, background: '#eff6ff', padding: '2px 8px', borderRadius: 20, border: '1px solid #bfdbfe' }}>
                        <HomeOutlined style={{ marginLeft: 3 }} />داخلية
                    </span>
                ) : (
                    <span style={{ fontSize: 10, color: C.green, background: '#f0fdf4', padding: '2px 8px', borderRadius: 20, border: '1px solid #bbf7d0' }}>
                        <GlobalOutlined style={{ marginLeft: 3 }} />خارجية
                    </span>
                )}
            </div>

            {/* Meta */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {cam.area && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <EnvironmentOutlined style={{ color: C.muted, fontSize: 12 }} />
                        <Text style={{ color: C.muted, fontSize: 12 }}>{cam.area}</Text>
                    </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {detectCameraKind(cam) === 'local' ? (
                        <>
                            <HomeOutlined style={{ color: C.blue, fontSize: 12 }} />
                            <Text style={{ color: C.muted, fontSize: 12 }}>
                                جهاز محلي [{cam.localDeviceIndex ?? 0}]
                            </Text>
                        </>
                    ) : (
                        <>
                            <WifiOutlined style={{ color: C.muted, fontSize: 12 }} />
                            <Text style={{ color: C.muted, fontSize: 12, fontFamily: 'monospace' }}>
                                {cam.ipAddress}
                            </Text>
                        </>
                    )}
                </div>
            </div>

            <Divider style={{ margin: '4px 0' }} />

            {/* Actions */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <Switch checked={cam.isActive} onChange={onToggle} loading={toggling}
                        checkedChildren="ON" unCheckedChildren="OFF" size="small" />
                <div style={{ flex: 1 }} />
                <Tooltip title="تعديل">
                    <Button size="small" icon={<EditOutlined />} onClick={onEdit}
                            style={{ borderRadius: 8 }} />
                </Tooltip>
                <Tooltip title="فتح منفردة">
                    <Button size="small" icon={<PlayCircleOutlined />} type="primary" ghost
                            onClick={() => window.open(`/cameras/${cam.cameraId}`, '_blank')}
                            style={{ borderRadius: 8 }} />
                </Tooltip>
                <Popconfirm title="حذف الكاميرا؟" okText="نعم" cancelText="لا"
                            onConfirm={onDelete}>
                    <Button size="small" icon={<DeleteOutlined />} danger
                            style={{ borderRadius: 8 }} />
                </Popconfirm>
            </div>
        </div>
    );
}

// ── CameraFormModal ───────────────────────────────────────
function CameraFormModal({ open, editingId, cameras, onSave, onClose, isSaving }: {
    open: boolean; editingId: number | null;
    cameras: CameraDto[];
    onSave: (dto: CameraUpsertPayload) => void;
    onClose: () => void; isSaving: boolean;
}) {
    const [form] = Form.useForm();
    const editing = cameras.find(c => c.cameraId === editingId);

    useEffect(() => {
        if (open) {
            if (editing) {
                form.setFieldsValue({
                    name:             editing.name,
                    code:             editing.code,
                    ipAddress:        editing.ipAddress,
                    streamUrl:        editing.streamUrl,
                    localDeviceIndex: editing.localDeviceIndex,
                    area:             editing.area,
                    isIndoor:         editing.isIndoor,
                    isActive:         editing.isActive,
                });
            } else {
                form.resetFields();
                form.setFieldsValue({ isActive: true, isIndoor: true });
            }
        }
    }, [open, editing, form]);

    const onFinish = (vals: any) => onSave(vals);

    return (
        <Modal
            open={open} onCancel={onClose}
            title={
                <Space>
                    <VideoCameraOutlined style={{ color: C.blue }} />
                    {editingId ? 'تعديل الكاميرا' : 'إضافة كاميرا جديدة'}
                </Space>
            }
            footer={null} width={600} centered
            styles={{ body: { direction: 'rtl', paddingTop: 16 } }}
        >
            <Form form={form} layout="vertical" onFinish={onFinish}>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="name" label="اسم الكاميرا" rules={[{ required: true }]}>
                            <Input placeholder="Camera1" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="code" label="الرمز">
                            <Input placeholder="CAM-01" />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item name="streamUrl" label={
                    <Space size={4}>
                        رابط البث
                        <Text type="secondary" style={{ fontSize: 11 }}>
                            (فارغ = كاميرا محلية | http://... = MJPEG | rtsp://... = RTSP)
                        </Text>
                    </Space>
                }>
                    <Input placeholder="rtsp://192.168.1.100/stream أو اتركه فارغاً للكاميرا المحلية" />
                </Form.Item>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="ipAddress" label="عنوان IP">
                            <Input placeholder="192.168.1.100 أو local" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="localDeviceIndex" label="رقم الجهاز المحلي (0, 1, 2...)">
                            <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="area" label="المنطقة / القطاع">
                            <Input placeholder="Sector A / المدخل" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="floor" label="الطابق">
                            <Input placeholder="الطابق الأول" />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item name="latitude" label="خط العرض">
                            <InputNumber style={{ width: '100%' }} placeholder="33.315" />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="longitude" label="خط الطول">
                            <InputNumber style={{ width: '100%' }} placeholder="44.366" />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="isIndoor" label="النوع">
                            <Select options={[
                                { value: true,  label: '🏠 داخلية' },
                                { value: false, label: '🌍 خارجية' },
                            ]} />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item name="notes" label="ملاحظات">
                    <Input.TextArea rows={2} />
                </Form.Item>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="isActive" label="الحالة">
                            <Select options={[
                                { value: true,  label: '✅ نشطة' },
                                { value: false, label: '⏸ متوقفة' },
                            ]} />
                        </Form.Item>
                    </Col>
                </Row>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                    <Button onClick={onClose}>إلغاء</Button>
                    <Button type="primary" htmlType="submit" loading={isSaving}
                            icon={editingId ? <EditOutlined /> : <PlusOutlined />}>
                        {editingId ? 'حفظ التعديلات' : 'إضافة الكاميرا'}
                    </Button>
                </div>
            </Form>
        </Modal>
    );
}

// ── CamerasManagePage ─────────────────────────────────────
export default function CamerasManagePage() {
    const {
        cameras, isLoading, isFetching, refetch,
        modalOpen, editingId, openCreate, openEdit, closeModal,
        save, isSaving,
        deleteCamera, toggleCamera, togglingId,
        ctx,
    } = useCameras();

    const active   = cameras.filter(c => c.isActive).length;
    const inactive = cameras.length - active;
    const local    = cameras.filter(c => !c.streamUrl).length;
    const ip       = cameras.length - local;

    return (
        <>
            <style>{CSS}</style>
            {ctx}

            <div style={{ padding: 24, direction: 'rtl', background: C.bg, minHeight: '100vh' }}>

                {/* ── Header ──────────────────────────────────── */}
                <div style={{
                    background: C.white, border: `1px solid ${C.border}`, borderRadius: 18,
                    padding: '18px 26px', marginBottom: 24,
                    boxShadow: '0 2px 8px rgba(15,23,42,.06)',
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', flexWrap: 'wrap', gap: 16,
                }}>
                    <Space align="center" size={14}>
                        <div style={{
                            width: 48, height: 48, borderRadius: 14,
                            background: 'linear-gradient(135deg,#2563eb,#7c3aed)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 14px rgba(37,99,235,.3)',
                        }}>
                            <SettingOutlined style={{ fontSize: 22, color: '#fff' }} />
                        </div>
                        <div>
                            <Title level={4} style={{ margin: 0, color: C.text, fontWeight: 800 }}>
                                وحدة إدارة الكاميرات
                            </Title>
                            <Text style={{ color: C.muted, fontSize: 12 }}>
                                إضافة وتعديل وإدارة شبكة الكاميرات الأمنية
                            </Text>
                        </div>
                    </Space>

                    <Space size={10} wrap>
                        {[
                            { label: 'إجمالي',  value: cameras.length, color: C.text,   bg: '#f8fafc' },
                            { label: 'نشطة',    value: active,          color: C.green,  bg: '#f0fdf4' },
                            { label: 'متوقفة',  value: inactive,        color: C.red,    bg: '#fef2f2' },
                            { label: 'محلية',   value: local,           color: C.blue,   bg: '#eff6ff' },
                            { label: 'IP',      value: ip,              color: C.purple, bg: '#faf5ff' },
                        ].map(s => (
                            <div key={s.label} style={{
                                background: s.bg, border: `1px solid ${C.border}`,
                                borderRadius: 12, padding: '6px 16px', textAlign: 'center',
                            }}>
                                <div style={{ fontSize: 18, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                                <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{s.label}</div>
                            </div>
                        ))}

                        <Tooltip title="تحديث">
                            <Button icon={<ReloadOutlined spin={isFetching} />}
                                    onClick={() => refetch()} style={{ height: 38, borderRadius: 10 }} />
                        </Tooltip>

                        <Button type="primary" icon={<PlayCircleOutlined />}
                                onClick={() => {
                                    window.open('/cameras/monitor', '_blank');
                                    window.open('/cameras/results', '_blank');
                                }}
                                style={{ height: 38, borderRadius: 10, background: '#16a34a', borderColor: '#16a34a' }}>
                            المراقبة المباشرة
                        </Button>

                        <Button type="primary" icon={<PlusOutlined />}
                                onClick={openCreate}
                                style={{ height: 38, borderRadius: 10 }}>
                            إضافة كاميرا
                        </Button>
                    </Space>
                </div>

                {/* ── Camera Grid ──────────────────────────────── */}
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: 100 }}>
                        <Spin size="large" /><br /><br />
                        <Text type="secondary">جاري تحميل الكاميرات…</Text>
                    </div>
                ) : cameras.length === 0 ? (
                    <div style={{
                        textAlign: 'center', padding: 80, background: C.white,
                        borderRadius: 18, border: `1px solid ${C.border}`,
                    }}>
                        <VideoCameraOutlined style={{ fontSize: 72, color: '#cbd5e1' }} />
                        <br /><br />
                        <Title level={4} style={{ color: C.muted }}>لا توجد كاميرات</Title>
                        <Text type="secondary">ابدأ بإضافة أول كاميرا للشبكة</Text>
                        <br /><br />
                        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                            إضافة أول كاميرا
                        </Button>
                    </div>
                ) : (
                    <Row gutter={[16, 16]}>
                        {cameras.map((cam, idx) => (
                            <Col key={cam.cameraId} xs={24} sm={12} md={8} lg={6}>
                                <CameraCard
                                    cam={cam} idx={idx}
                                    onEdit={() => openEdit(cam.cameraId)}
                                    onDelete={() => deleteCamera(cam.cameraId)}
                                    onToggle={() => toggleCamera(cam)}
                                    toggling={togglingId === cam.cameraId}
                                />
                            </Col>
                        ))}
                    </Row>
                )}
            </div>

            {/* ── Modal ────────────────────────────────────── */}
            <CameraFormModal
                open={modalOpen} editingId={editingId} cameras={cameras}
                onSave={save} onClose={closeModal} isSaving={isSaving}
            />
        </>
    );
}
