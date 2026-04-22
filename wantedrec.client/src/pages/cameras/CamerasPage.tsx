import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
    Row,
    Col,
    Button,
    Typography,
    Space,
    Switch,
    Spin,
    Tooltip,
    Modal,
    Form,
    Input,
    Select,
    InputNumber,
    Popconfirm,
    Divider,
    AutoComplete,
    message,
    Alert,
    Tag,
} from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    VideoCameraOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    ReloadOutlined,
    PlayCircleOutlined,
    WifiOutlined,
    HomeOutlined,
    GlobalOutlined,
    EnvironmentOutlined,
    SettingOutlined,
    WarningOutlined,
    CheckCircleOutlined,
    StopOutlined,
    ClockCircleOutlined,
    LinkOutlined,
    CameraOutlined,
} from '@ant-design/icons';
import axios from '../../api';
import { snapshotUrl } from '../../api/camerasApi';
import { detectCameraKind } from '../../types/camera.types';

const { Title, Text } = Typography;

const STORAGE_KEY = 'current_device_id';

// ── Types ───────────────────────────────────────────────
type ApiResponse<T> = {
    success: boolean;
    message?: string;
    data: T;
};

type CameraRow = {
    cameraId: number;
    name: string;
    code?: string;
    description?: string;
    ipAddress: string;
    streamUrl?: string;
    localDeviceIndex?: number;
    userDeviceId?: number;
    latitude?: number;
    longitude?: number;
    floor?: string;
    area?: string;
    isIndoor: boolean;
    isActive: boolean;
    installationDate?: string;
    lastMaintenanceDate?: string;
    notes?: string;
};

type CameraUpsertPayload = {
    name: string;
    code?: string;
    description?: string;
    ipAddress: string;
    streamUrl?: string;
    localDeviceIndex?: number;
    userDeviceId?: number;
    latitude?: number;
    longitude?: number;
    floor?: string;
    area?: string;
    isIndoor: boolean;
    isActive: boolean;
    installationDate?: string;
    lastMaintenanceDate?: string;
    notes?: string;
};

type DeviceDto = {
    userDeviceId: number;
    name: string;
    isActive: boolean;
    createdAt?: string;
    lastSeenAt?: string;
};

// ── Palette ─────────────────────────────────────────────
const C = {
    bg: 'var(--app-page-bg)',
    white: 'var(--app-surface)',
    border: 'var(--app-border)',
    blue: '#2563eb',
    green: '#16a34a',
    red: '#dc2626',
    purple: '#7c3aed',
    amber: '#d97706',
    text: 'var(--app-text)',
    muted: 'var(--app-muted)',
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
    background:var(--app-surface);
    border:1px solid var(--app-border);
    border-radius:16px;
    padding:20px;
    height:100%;
    display:flex;
    flex-direction:column;
    gap:14px;
    transition:all .25s;
    position:relative;
    overflow:hidden;
  }
  .cam-card::before {
    content:'';
    position:absolute;
    top:0;
    left:0;
    right:0;
    height:3px;
    background:linear-gradient(90deg,#2563eb,#7c3aed);
    opacity:0;
    transition:opacity .25s;
  }
  .cam-card:hover {
    border-color:#2563eb33;
    transform:translateY(-3px);
    box-shadow:0 12px 32px rgba(37,99,235,.12);
  }
  .cam-card:hover::before {
    opacity:1;
  }
  .cam-card.live {
    border-color:#bbf7d0;
    background:linear-gradient(160deg,var(--app-soft-green),var(--app-surface));
  }
  .cam-card.live::before {
    opacity:1;
    background:linear-gradient(90deg,#16a34a,#059669);
  }
  .cam-card.offline {
    border-color:#fecaca;
    background:linear-gradient(160deg,var(--app-soft-red),var(--app-surface));
  }
  .cam-card.offline::before {
    opacity:1;
    background:linear-gradient(90deg,#dc2626,#ef4444);
  }
`;

type AvailabilityValue = boolean | null | undefined;

// ── API helpers ─────────────────────────────────────────
const getStoredDeviceId = (): number | null => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isNaN(n) ? null : n;
};

const fetchCameras = async (deviceId: number | null): Promise<CameraRow[]> => {
    const res = await axios.get<ApiResponse<CameraRow[]>>('/cameras', {
        headers: deviceId ? { 'X-User-Device-Id': String(deviceId) } : undefined,
    });
    return res.data.data ?? [];
};

const fetchDevices = async (): Promise<DeviceDto[]> => {
    const res = await axios.get<ApiResponse<DeviceDto[]>>('/devices/my');
    return res.data.data ?? [];
};

const createCamera = async (dto: CameraUpsertPayload): Promise<CameraRow> => {
    const res = await axios.post<ApiResponse<CameraRow>>('/cameras', dto);
    return res.data.data;
};

const updateCamera = async (id: number, dto: CameraUpsertPayload): Promise<CameraRow> => {
    const res = await axios.put<ApiResponse<CameraRow>>(`/cameras/${id}`, dto);
    return res.data.data;
};

const deleteCameraRequest = async (id: number): Promise<void> => {
    await axios.delete(`/cameras/${id}`);
};

const activateCamera = async (id: number): Promise<void> => {
    await axios.put(`/cameras/${id}/activate`);
};

const deactivateCamera = async (id: number): Promise<void> => {
    await axios.put(`/cameras/${id}/deactivate`);
};

// ── Helpers ─────────────────────────────────────────────
function probeImage(url: string, timeoutMs = 4000): Promise<boolean> {
    return new Promise(resolve => {
        const img = new Image();
        const timer = window.setTimeout(() => {
            cleanup();
            resolve(false);
        }, timeoutMs);

        const cleanup = () => {
            img.onload = null;
            img.onerror = null;
            window.clearTimeout(timer);
        };

        img.onload = () => {
            cleanup();
            resolve(true);
        };

        img.onerror = () => {
            cleanup();
            resolve(false);
        };

        img.src = url;
    });
}

function getCameraVisualState(cam: CameraRow, availability: AvailabilityValue) {
    const isConfiguredOn = !!cam.isActive;
    const isAvailable = availability === true;
    const isChecking = isConfiguredOn && (availability === null || availability === undefined);
    const isUnavailable = isConfiguredOn && availability === false;

    if (isConfiguredOn && isAvailable) {
        return {
            key: 'live' as const,
            label: 'نشطة',
            color: C.green,
            bg: '#dcfce7',
            border: '#bbf7d0',
            icon: <CheckCircleOutlined />,
            note: '',
        };
    }

    if (isChecking) {
        return {
            key: 'checking' as const,
            label: 'جارِ التحقق',
            color: C.amber,
            bg: '#fef3c7',
            border: '#fde68a',
            icon: <ClockCircleOutlined />,
            note: 'يتم فحص الوصول إلى الكاميرا الآن',
        };
    }

    if (isUnavailable) {
        return {
            key: 'offline' as const,
            label: 'غير نشطة',
            color: C.red,
            bg: '#fee2e2',
            border: '#fecaca',
            icon: <WarningOutlined />,
            note: 'مفعلة بالنظام لكن لا يوجد وصول إليها حاليًا',
        };
    }

    return {
        key: 'stopped' as const,
        label: 'متوقفة',
        color: C.muted,
        bg: '#f1f5f9',
        border: C.border,
        icon: <StopOutlined />,
        note: 'الكاميرا متوقفة من إعدادات النظام',
    };
}

function getLocalDeviceLabel(d: MediaDeviceInfo, index: number) {
    return d.label?.trim() || `كاميرا محلية ${index}`;
}

// ── KindBadge ───────────────────────────────────────────
function KindBadge({ cam }: { cam: CameraRow }) {
    const kind = detectCameraKind(cam as any);
    const map: Record<string, { label: string; color: string; icon: ReactNode }> = {
        local: { label: 'محلية', color: C.blue, icon: <HomeOutlined /> },
        'ip-mjpeg': { label: 'MJPEG', color: C.purple, icon: <WifiOutlined /> },
        'ip-rtsp': { label: 'RTSP', color: '#db2777', icon: <WifiOutlined /> },
    };

    const k = map[kind] ?? map.local;

    return (
        <span
            style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 20,
                background: `${k.color}14`,
                border: `1px solid ${k.color}33`,
                color: k.color,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
            }}
        >
            {k.icon} {k.label}
        </span>
    );
}

// ── CameraCard ──────────────────────────────────────────
function CameraCard({
    cam,
    idx,
    onEdit,
    onDelete,
    onToggle,
    toggling,
    availability,
    localDevices,
}: {
    cam: CameraRow;
    idx: number;
    onEdit: () => void;
    onDelete: () => void;
    onToggle: () => void;
    toggling: boolean;
    availability: AvailabilityValue;
    localDevices: MediaDeviceInfo[];
}) {
    const visual = getCameraVisualState(cam, availability);
    const kind = detectCameraKind(cam as any);

    const cardClass =
        visual.key === 'live'
            ? 'cam-card live'
            : visual.key === 'offline'
                ? 'cam-card offline'
                : 'cam-card';

    const localLabel =
        kind === 'local' &&
            cam.localDeviceIndex !== undefined &&
            cam.localDeviceIndex !== null &&
            cam.localDeviceIndex >= 0 &&
            cam.localDeviceIndex < localDevices.length
            ? getLocalDeviceLabel(localDevices[cam.localDeviceIndex], cam.localDeviceIndex)
            : null;

    return (
        <div className={cardClass} style={{ animation: `slideUp .35s ease ${idx * 0.04}s both` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            flexShrink: 0,
                            background: visual.bg,
                            border: `1px solid ${visual.border}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <VideoCameraOutlined style={{ fontSize: 20, color: visual.color }} />
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
                    {visual.key === 'live' && (
                        <span
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: C.green,
                                display: 'inline-block',
                                animation: 'livePulse 2s infinite',
                            }}
                        />
                    )}

                    <span
                        style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '2px 10px',
                            borderRadius: 20,
                            color: visual.color,
                            background: visual.bg,
                            border: `1px solid ${visual.border}`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                        }}
                    >
                        {visual.icon}
                        {visual.label}
                    </span>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <KindBadge cam={cam} />

                {cam.isIndoor ? (
                    <span
                        style={{
                            fontSize: 10,
                            color: C.blue,
                            background: '#eff6ff',
                            padding: '2px 8px',
                            borderRadius: 20,
                            border: '1px solid #bfdbfe',
                        }}
                    >
                        <HomeOutlined style={{ marginLeft: 3 }} />
                        داخلية
                    </span>
                ) : (
                    <span
                        style={{
                            fontSize: 10,
                            color: C.green,
                            background: '#f0fdf4',
                            padding: '2px 8px',
                            borderRadius: 20,
                            border: '1px solid #bbf7d0',
                        }}
                    >
                        <GlobalOutlined style={{ marginLeft: 3 }} />
                        خارجية
                    </span>
                )}
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {cam.area && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <EnvironmentOutlined style={{ color: C.muted, fontSize: 12 }} />
                        <Text style={{ color: C.muted, fontSize: 12 }}>{cam.area}</Text>
                    </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {kind === 'local' ? (
                        <>
                            <HomeOutlined style={{ color: C.blue, fontSize: 12 }} />
                            <Text style={{ color: C.muted, fontSize: 12 }}>
                                جهاز محلي [{cam.localDeviceIndex ?? 'غير محدد'}]
                                {localLabel ? ` — ${localLabel}` : ''}
                            </Text>
                        </>
                    ) : (
                        <>
                            <WifiOutlined style={{ color: C.muted, fontSize: 12 }} />
                            <Text style={{ color: C.muted, fontSize: 12, fontFamily: 'monospace' }}>
                                {cam.ipAddress || cam.streamUrl || '—'}
                            </Text>
                        </>
                    )}
                </div>

                {visual.note && (
                    <div
                        style={{
                            marginTop: 4,
                            background: visual.bg,
                            border: `1px dashed ${visual.border}`,
                            borderRadius: 10,
                            padding: '7px 10px',
                        }}
                    >
                        <Text style={{ fontSize: 11, color: visual.color }}>{visual.note}</Text>
                    </div>
                )}
            </div>

            <Divider style={{ margin: '4px 0' }} />

            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <Switch
                    checked={cam.isActive}
                    onChange={onToggle}
                    loading={toggling}
                    checkedChildren="ON"
                    unCheckedChildren="OFF"
                    size="small"
                />

                <div style={{ flex: 1 }} />

                <Tooltip title="تعديل">
                    <Button size="small" icon={<EditOutlined />} onClick={onEdit} style={{ borderRadius: 8 }} />
                </Tooltip>

                <Tooltip title="فتح منفردة">
                    <Button
                        size="small"
                        icon={<PlayCircleOutlined />}
                        type="primary"
                        ghost
                        onClick={() => window.open(`/cameras/${cam.cameraId}`, '_blank')}
                        style={{ borderRadius: 8 }}
                    />
                </Tooltip>

                <Popconfirm title="حذف الكاميرا؟" okText="نعم" cancelText="لا" onConfirm={onDelete}>
                    <Button size="small" icon={<DeleteOutlined />} danger style={{ borderRadius: 8 }} />
                </Popconfirm>
            </div>
        </div>
    );
}

// ── CameraFormModal ─────────────────────────────────────
function CameraFormModal({
    open,
    editingId,
    cameras,
    currentDeviceId,
    localDevices,
    onSave,
    onClose,
    isSaving,
}: {
    open: boolean;
    editingId: number | null;
    cameras: CameraRow[];
    currentDeviceId: number | null;
    localDevices: MediaDeviceInfo[];
    onSave: (dto: CameraUpsertPayload) => void;
    onClose: () => void;
    isSaving: boolean;
}) {
    const [form] = Form.useForm();
    const [msgApi, holder] = message.useMessage();
    const editing = cameras.find(c => c.cameraId === editingId);
    const streamUrlValue = Form.useWatch('streamUrl', form);
    const isLocalMode = !String(streamUrlValue ?? '').trim();

    const localDeviceOptions = useMemo(
        () =>
            localDevices.map((d, i) => ({
                value: String(i),
                label: `[${i}] ${getLocalDeviceLabel(d, i)}`,
            })),
        [localDevices]
    );

    useEffect(() => {
        if (!open) return;

        if (editing) {
            form.setFieldsValue({
                name: editing.name,
                code: editing.code,
                description: editing.description,
                ipAddress: editing.ipAddress,
                streamUrl: editing.streamUrl,
                localDeviceIndex:
                    editing.localDeviceIndex === undefined || editing.localDeviceIndex === null
                        ? undefined
                        : String(editing.localDeviceIndex),
                area: editing.area,
                floor: editing.floor,
                latitude: editing.latitude,
                longitude: editing.longitude,
                notes: editing.notes,
                isIndoor: editing.isIndoor,
                isActive: editing.isActive,
            });
        } else {
            form.resetFields();
            form.setFieldsValue({
                isActive: true,
                isIndoor: true,
                localDeviceIndex: localDevices.length > 0 ? '0' : undefined,
                ipAddress: 'local',
            });
        }
    }, [open, editing, form, localDevices.length]);

    const onFinish = (vals: any) => {
        const streamUrl = typeof vals.streamUrl === 'string' ? vals.streamUrl.trim() : '';
        const parsedIndex =
            vals.localDeviceIndex === undefined ||
                vals.localDeviceIndex === null ||
                vals.localDeviceIndex === ''
                ? undefined
                : Number(vals.localDeviceIndex);

        if (!streamUrl && !currentDeviceId) {
            msgApi.error('لا يوجد جهاز حالي مختار. افتح صفحة المراقبة أولًا وحدد الجهاز.');
            return;
        }

        if (!streamUrl && (parsedIndex === undefined || Number.isNaN(parsedIndex))) {
            msgApi.error('اختر رقم الكاميرا المحلية أو اكتبه يدويًا.');
            return;
        }

        const dto: CameraUpsertPayload = {
            ...vals,
            ipAddress: streamUrl ? vals.ipAddress || '' : 'local',
            streamUrl: streamUrl || undefined,
            localDeviceIndex: streamUrl ? undefined : parsedIndex,
            userDeviceId: streamUrl ? undefined : (currentDeviceId ?? undefined),
        };

        onSave(dto);
    };

    return (
        <>
            {holder}
            <Modal
                open={open}
                onCancel={onClose}
                title={
                    <Space>
                        <VideoCameraOutlined style={{ color: C.blue }} />
                        {editingId ? 'تعديل الكاميرا' : 'إضافة كاميرا جديدة'}
                    </Space>
                }
                footer={null}
                width={760}
                centered
                styles={{ body: { direction: 'rtl', paddingTop: 16 } }}
            >
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    {!currentDeviceId && (
                        <Alert
                            type="warning"
                            showIcon
                            style={{ marginBottom: 16 }}
                            message="لا يوجد جهاز حالي مختار"
                            description="إضافة كاميرا محلية تتطلب اختيار الجهاز الحالي أولًا من صفحة المراقبة."
                        />
                    )}

                    {isLocalMode && (
                        <Alert
                            type={localDevices.length > 0 ? 'info' : 'warning'}
                            showIcon
                            style={{ marginBottom: 16 }}
                            message={
                                localDevices.length > 0
                                    ? `تم اكتشاف ${localDevices.length} كامرة محلية على هذا الجهاز`
                                    : 'لم يتم اكتشاف كامرات محلية على هذا الجهاز'
                            }
                            description={
                                localDevices.length > 0
                                    ? localDevices.map((d, i) => `[${i}] ${getLocalDeviceLabel(d, i)}`).join('  |  ')
                                    : 'تأكد من السماح للمتصفح بالوصول للكاميرا وأن الكامرات غير مستخدمة من برنامج آخر'
                            }
                        />
                    )}

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="name" label="اسم الكاميرا" rules={[{ required: true, message: 'اسم الكاميرا مطلوب' }]}>
                                <Input placeholder="Camera1" />
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item name="code" label="الرمز">
                                <Input placeholder="CAM-01" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name="streamUrl"
                        label={
                            <Space size={4}>
                                رابط البث
                                <Text type="secondary" style={{ fontSize: 11 }}>
                                    (فارغ = كاميرا محلية | http://... = MJPEG | rtsp://... = RTSP)
                                </Text>
                            </Space>
                        }
                    >
                        <Input placeholder="rtsp://192.168.1.100/stream أو اتركه فارغاً للكاميرا المحلية" />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="ipAddress" label="عنوان IP">
                                <Input placeholder={isLocalMode ? 'local' : '192.168.1.100'} />
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item
                                name="localDeviceIndex"
                                label="رقم الجهاز المحلي"
                                tooltip="اختر الكامرة المحلية المكتشفة على هذا الجهاز أو اكتب الرقم يدويًا"
                                extra={
                                    isLocalMode
                                        ? localDeviceOptions.length > 0
                                            ? `الكامرات المحلية المكتشفة: ${localDeviceOptions.map(x => x.label).join(' ، ')}`
                                            : 'لا توجد كامرات محلية مكتشفة حاليًا'
                                        : 'هذا الحقل يُستخدم فقط عند ترك رابط البث فارغًا'
                                }
                            >
                                <AutoComplete
                                    options={localDeviceOptions}
                                    disabled={!isLocalMode}
                                    filterOption={(inputValue, option) =>
                                        String(option?.value ?? '').toLowerCase().includes(inputValue.toLowerCase()) ||
                                        String(option?.label ?? '').toLowerCase().includes(inputValue.toLowerCase())
                                    }
                                >
                                    <Input
                                        inputMode="numeric"
                                        placeholder={isLocalMode ? '0 أو 1 أو 2...' : 'غير مطلوب للكاميرات الشبكية'}
                                    />
                                </AutoComplete>
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
                                <Select
                                    options={[
                                        { value: true, label: '🏠 داخلية' },
                                        { value: false, label: '🌍 خارجية' },
                                    ]}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="description" label="الوصف">
                        <Input.TextArea rows={2} />
                    </Form.Item>

                    <Form.Item name="notes" label="ملاحظات">
                        <Input.TextArea rows={3} />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="isActive" label="الحالة">
                                <Select
                                    options={[
                                        { value: true, label: '✅ نشطة' },
                                        { value: false, label: '⏸ متوقفة' },
                                    ]}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                        <Button onClick={onClose}>إلغاء</Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={isSaving}
                            icon={editingId ? <EditOutlined /> : <PlusOutlined />}
                        >
                            {editingId ? 'حفظ التعديلات' : 'إضافة الكاميرا'}
                        </Button>
                    </div>
                </Form>
            </Modal>
        </>
    );
}

// ── Page ────────────────────────────────────────────────
export default function CamerasManagePage() {
    const qc = useQueryClient();
    const [msgApi, ctx] = message.useMessage();

    const [currentDeviceId, setCurrentDeviceId] = useState<number | null>(() => getStoredDeviceId());
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [openingMonitor, setOpeningMonitor] = useState(false);
    const [togglingId, setTogglingId] = useState<number | null>(null);
    const [localDevices, setLocalDevices] = useState<MediaDeviceInfo[]>([]);
    const [availabilityMap, setAvailabilityMap] = useState<Record<number, AvailabilityValue>>({});

    const { data: devices = [] } = useQuery({
        queryKey: ['devices-my'],
        queryFn: fetchDevices,
    });

    useEffect(() => { console.log("test")})

    const currentDevice = devices.find(d => d.userDeviceId === currentDeviceId);

    const {
        data: cameras = [],
        isLoading,
        isFetching,
        refetch,
    } = useQuery({
        queryKey: ['cameras', currentDeviceId],
        queryFn: () => fetchCameras(currentDeviceId),
    });

    const invalidate = () => {
        qc.invalidateQueries({ queryKey: ['cameras'] });
        qc.invalidateQueries({ queryKey: ['devices-my'] });
    };

    const createMutation = useMutation({
        mutationFn: createCamera,
        onSuccess: () => {
            msgApi.success('تمت إضافة الكاميرا');
            invalidate();
            setModalOpen(false);
            setEditingId(null);
        },
        onError: () => msgApi.error('فشل إنشاء الكاميرا'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, dto }: { id: number; dto: CameraUpsertPayload }) => updateCamera(id, dto),
        onSuccess: () => {
            msgApi.success('تم تحديث الكاميرا');
            invalidate();
            setModalOpen(false);
            setEditingId(null);
        },
        onError: () => msgApi.error('فشل تحديث الكاميرا'),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteCameraRequest,
        onSuccess: () => {
            msgApi.success('تمت معالجة طلب الحذف');
            invalidate();
        },
        onError: () => msgApi.error('فشل الحذف'),
    });

    const toggleMutation = useMutation({
        mutationFn: async (cam: CameraRow) => {
            setTogglingId(cam.cameraId);
            return cam.isActive ? deactivateCamera(cam.cameraId) : activateCamera(cam.cameraId);
        },
        onSuccess: (_, cam) => {
            msgApi.success(cam.isActive ? 'تم إيقاف الكاميرا' : 'تم تشغيل الكاميرا');
            invalidate();
        },
        onError: () => msgApi.error('فشل تغيير الحالة'),
        onSettled: () => setTogglingId(null),
    });

    useEffect(() => {
        const sync = () => setCurrentDeviceId(getStoredDeviceId());
        window.addEventListener('storage', sync);
        window.addEventListener('focus', sync);

        return () => {
            window.removeEventListener('storage', sync);
            window.removeEventListener('focus', sync);
        };
    }, []);

    // ── Read local devices with permission ─────────────────
    useEffect(() => {
        let disposed = false;

        const loadDevices = async () => {
            try {
                const tmp = await navigator.mediaDevices.getUserMedia({ video: true });
                tmp.getTracks().forEach(t => t.stop());

                const all = await navigator.mediaDevices.enumerateDevices();
                console.log("all:",all)
                const videos = all.filter(d => d.kind === 'videoinput');

                if (!disposed) {
                    setLocalDevices(videos);
                }
            } catch {
                if (!disposed) {
                    setLocalDevices([]);
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

    // ── Availability check ────────────────────────────────
    useEffect(() => {
        let disposed = false;

        const initialStatus: Record<number, AvailabilityValue> = {};

        cameras.forEach(cam => {
            if (!cam.isActive) {
                initialStatus[cam.cameraId] = false;
                return;
            }

            if (detectCameraKind(cam as any) === 'local') {
                const idx = cam.localDeviceIndex;
                initialStatus[cam.cameraId] =
                    idx !== undefined &&
                    idx !== null &&
                    idx >= 0 &&
                    idx < localDevices.length;
            } else {
                initialStatus[cam.cameraId] = null;
            }
        });

        setAvailabilityMap(prev => ({ ...prev, ...initialStatus }));

        const remoteCameras = cameras.filter(
            cam => cam.isActive && detectCameraKind(cam as any) !== 'local'
        );

        if (remoteCameras.length === 0) {
            return () => {
                disposed = true;
            };
        }

        (async () => {
            const results = await Promise.all(
                remoteCameras.map(async cam => {
                    const base = snapshotUrl(cam.cameraId);
                    const glue = base.includes('?') ? '&' : '?';
                    const ok = await probeImage(`${base}${glue}_=${Date.now()}`, 4000);
                    return { cameraId: cam.cameraId, ok };
                })
            );

            if (disposed) return;

            setAvailabilityMap(prev => {
                const next = { ...prev };
                results.forEach(r => {
                    next[r.cameraId] = r.ok;
                });
                return next;
            });
        })();

        return () => {
            disposed = true;
        };
    }, [cameras, localDevices]);

    const openCreate = () => {
        setEditingId(null);
        setModalOpen(true);
    };

    const openEdit = (id: number) => {
        setEditingId(id);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingId(null);
    };

    const save = (dto: CameraUpsertPayload) => {
        if (editingId) {
            updateMutation.mutate({ id: editingId, dto });
        } else {
            createMutation.mutate(dto);
        }
    };

    const openMonitor = () => {
        if (openingMonitor) return;

        setOpeningMonitor(true);

        try {
            const resultsWin = window.open('/cameras/results', 'live-results');
            resultsWin?.blur?.();
            window.location.replace('/cameras/monitor');
        } finally {
            window.setTimeout(() => setOpeningMonitor(false), 1000);
        }
    };

    const activeAvailable = cameras.filter(c => c.isActive && availabilityMap[c.cameraId] === true).length;
    const unavailable = cameras.filter(c => c.isActive && availabilityMap[c.cameraId] === false).length;
    const checking = cameras.filter(c => c.isActive && (availabilityMap[c.cameraId] === null || availabilityMap[c.cameraId] === undefined)).length;
    const stopped = cameras.filter(c => !c.isActive).length;
    const local = cameras.filter(c => detectCameraKind(c as any) === 'local').length;
    const ip = cameras.length - local;

    return (
        <>
            <style>{CSS}</style>
            {ctx}

            <div style={{ padding: 24, direction: 'rtl', background: C.bg, minHeight: '100vh' }}>
                <div
                    style={{
                        background: C.white,
                        border: `1px solid ${C.border}`,
                        borderRadius: 18,
                        padding: '18px 26px',
                        marginBottom: 24,
                        boxShadow: 'var(--app-shadow)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 16,
                    }}
                >
                    <Space align="center" size={14}>
                        <div
                            style={{
                                width: 48,
                                height: 48,
                                borderRadius: 14,
                                background: 'linear-gradient(135deg,#2563eb,#7c3aed)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 14px rgba(37,99,235,.3)',
                            }}
                        >
                            <SettingOutlined style={{ fontSize: 22, color: '#fff' }} />
                        </div>

                        <div>
                            <Title level={4} style={{ margin: 0, color: C.text, fontWeight: 800 }}>
                                وحدة إدارة الكاميرات
                            </Title>
                            <Text style={{ color: C.muted, fontSize: 12 }}>
                                إضافة وتعديل وإدارة شبكة الكاميرات الأمنية
                            </Text>

                            <div style={{ marginTop: 6 }}>
                                <Text style={{ fontSize: 12, color: currentDevice ? C.blue : C.red }}>
                                    <LinkOutlined style={{ marginLeft: 4 }} />
                                    الجهاز الحالي: {currentDevice ? currentDevice.name : 'غير محدد'}
                                </Text>
                            </div>

                            <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {localDevices.length > 0 ? (
                                    localDevices.map((d, i) => (
                                        <Tag key={d.deviceId} color="blue" style={{ marginInlineEnd: 0 }}>
                                            <CameraOutlined style={{ marginLeft: 4 }} />
                                            [{i}] {getLocalDeviceLabel(d, i)}
                                        </Tag>
                                    ))
                                ) : (
                                    <Text style={{ fontSize: 12, color: C.muted }}>
                                        لا توجد كامرات محلية مكتشفة حاليًا
                                    </Text>
                                )}
                            </div>
                        </div>
                    </Space>

                    <Space size={10} wrap>
                        {[
                            { label: 'إجمالي', value: cameras.length, color: C.text, bg: 'var(--app-surface-2)' },
                            { label: 'متاحة', value: activeAvailable, color: C.green, bg: 'var(--app-soft-green)' },
                            { label: 'غير نشطة', value: unavailable, color: C.red, bg: 'var(--app-soft-red)' },
                            { label: 'قيد التحقق', value: checking, color: C.amber, bg: 'var(--app-soft-amber)' },
                            { label: 'متوقفة', value: stopped, color: C.muted, bg: 'var(--app-surface-2)' },
                            { label: 'محلية', value: local, color: C.blue, bg: 'var(--app-soft-blue)' },
                            { label: 'IP / URL', value: ip, color: C.purple, bg: 'var(--app-soft-purple)' },
                        ].map(s => (
                            <div
                                key={s.label}
                                style={{
                                    background: s.bg,
                                    border: `1px solid ${C.border}`,
                                    borderRadius: 12,
                                    padding: '6px 16px',
                                    textAlign: 'center',
                                    minWidth: 78,
                                }}
                            >
                                <div style={{ fontSize: 18, fontWeight: 700, color: s.color, lineHeight: 1 }}>
                                    {s.value}
                                </div>
                                <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                                    {s.label}
                                </div>
                            </div>
                        ))}

                        <Tooltip title="تحديث">
                            <Button
                                icon={<ReloadOutlined spin={isFetching} />}
                                onClick={() => refetch()}
                                style={{ height: 38, borderRadius: 10 }}
                            />
                        </Tooltip>

                        <Button
                            type="primary"
                            icon={<PlayCircleOutlined />}
                            onClick={openMonitor}
                            loading={openingMonitor}
                            style={{
                                height: 38,
                                borderRadius: 10,
                                background: '#16a34a',
                                borderColor: '#16a34a',
                            }}
                        >
                            المراقبة المباشرة
                        </Button>

                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={openCreate}
                            style={{ height: 38, borderRadius: 10 }}
                        >
                            إضافة كاميرا
                        </Button>
                    </Space>
                </div>

                {!currentDeviceId && (
                    <Alert
                        style={{ marginBottom: 16 }}
                        type="warning"
                        showIcon
                        message="لم يتم اختيار الجهاز الحالي بعد"
                        description="افتح صفحة المراقبة أولًا وحدد هل هذا جهاز جديد أو قديم، وبعدها ستظهر الكامرات المحلية الخاصة بهذا الجهاز."
                    />
                )}

                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: 100 }}>
                        <Spin size="large" />
                        <br />
                        <br />
                        <Text type="secondary">جاري تحميل الكاميرات…</Text>
                    </div>
                ) : cameras.length === 0 ? (
                    <div
                        style={{
                            textAlign: 'center',
                            padding: 80,
                            background: C.white,
                            borderRadius: 18,
                            border: `1px solid ${C.border}`,
                        }}
                    >
                        <VideoCameraOutlined style={{ fontSize: 72, color: '#cbd5e1' }} />
                        <br />
                        <br />
                        <Title level={4} style={{ color: C.muted }}>لا توجد كاميرات</Title>
                        <Text type="secondary">ابدأ بإضافة أول كاميرا للجهاز الحالي أو للشبكة</Text>
                        <br />
                        <br />
                        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                            إضافة أول كاميرا
                        </Button>
                    </div>
                ) : (
                    <Row gutter={[16, 16]}>
                        {cameras.map((cam, idx) => (
                            <Col key={cam.cameraId} xs={24} sm={12} md={8} lg={6}>
                                <CameraCard
                                    cam={cam}
                                    idx={idx}
                                    onEdit={() => openEdit(cam.cameraId)}
                                    onDelete={() => deleteMutation.mutate(cam.cameraId)}
                                    onToggle={() => toggleMutation.mutate(cam)}
                                    toggling={togglingId === cam.cameraId}
                                    availability={availabilityMap[cam.cameraId]}
                                    localDevices={localDevices}
                                />
                            </Col>
                        ))}
                    </Row>
                )}
            </div>

            <CameraFormModal
                open={modalOpen}
                editingId={editingId}
                cameras={cameras}
                currentDeviceId={currentDeviceId}
                localDevices={localDevices}
                onSave={save}
                onClose={closeModal}
                isSaving={createMutation.isPending || updateMutation.isPending}
            />
        </>
    );
}