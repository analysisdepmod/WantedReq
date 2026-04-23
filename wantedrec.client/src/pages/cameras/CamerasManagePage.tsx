// ═══════════════════════════════════════════════════════
//  src/pages/cameras/CamerasManagePage.tsx
//  Route: /cameras   — إدارة الكاميرات (CRUD)
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useState } from 'react';
import {
    Row, Col, Button, Typography, Space, Switch, Spin,
    Tooltip, Modal, Form, Input, Select,
    InputNumber, Popconfirm, Divider, Alert, Tag, message,
} from 'antd';
import {
    VideoCameraOutlined, PlusOutlined, EditOutlined,
    DeleteOutlined, ReloadOutlined, PlayCircleOutlined,
    WifiOutlined, HomeOutlined, GlobalOutlined,
    EnvironmentOutlined, SettingOutlined, WarningOutlined,
    CheckCircleOutlined, StopOutlined, ClockCircleOutlined,
    LinkOutlined, CameraOutlined,
} from '@ant-design/icons';
import { useCameras, type CameraUpsertPayload } from '../../hooks/useCameras';
import { snapshotUrl } from '../../api/camerasApi';
import type { CameraDto } from '../../types/camera.types';
import { detectCameraKind } from '../../types/camera.types';

const { Title, Text } = Typography;
const STORAGE_KEY = 'current_device_id';

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
    cursor:default;
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

const getCurrentDeviceId = (): number | null => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = Number(raw);
    return Number.isNaN(parsed) ? null : parsed;
};

function getLocalDeviceLabel(device: MediaDeviceInfo, index: number) {
    return device.label?.trim() || `كاميرا محلية ${index}`;
}

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

function getCameraVisualState(cam: CameraDto, availability: AvailabilityValue) {
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

// ── KindBadge ───────────────────────────────────────────
function KindBadge({ cam }: { cam: CameraDto }) {
    const kind = detectCameraKind(cam);
    const map: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
        local: { label: 'محلية', color: C.blue, icon: <HomeOutlined /> },
        'ip-mjpeg': { label: 'MJPEG', color: C.purple, icon: <WifiOutlined /> },
        'ip-rtsp': { label: 'RTSP', color: '#db2777', icon: <WifiOutlined /> },
    };

    const k = map[kind] ?? map.local;

    return (
        <span style={{
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
        }}>
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
    cam: CameraDto;
    idx: number;
    onEdit: () => void;
    onDelete: () => void;
    onToggle: () => void;
    toggling: boolean;
    availability: AvailabilityValue;
    localDevices: MediaDeviceInfo[];
}) {
    const visual = getCameraVisualState(cam, availability);
    const kind = detectCameraKind(cam);

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
                    <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        flexShrink: 0,
                        background: visual.bg,
                        border: `1px solid ${visual.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
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
                        <span style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: C.green,
                            display: 'inline-block',
                            animation: 'livePulse 2s infinite',
                        }} />
                    )}

                    <span style={{
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
                    }}>
                        {visual.icon}
                        {visual.label}
                    </span>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <KindBadge cam={cam} />

                {cam.isIndoor ? (
                    <span style={{
                        fontSize: 10,
                        color: C.blue,
                        background: '#eff6ff',
                        padding: '2px 8px',
                        borderRadius: 20,
                        border: '1px solid #bfdbfe',
                    }}>
                        <HomeOutlined style={{ marginLeft: 3 }} />
                        داخلية
                    </span>
                ) : (
                    <span style={{
                        fontSize: 10,
                        color: C.green,
                        background: '#f0fdf4',
                        padding: '2px 8px',
                        borderRadius: 20,
                        border: '1px solid #bbf7d0',
                    }}>
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
                    <div style={{
                        marginTop: 4,
                        background: visual.bg,
                        border: `1px dashed ${visual.border}`,
                        borderRadius: 10,
                        padding: '7px 10px',
                    }}>
                        <Text style={{ fontSize: 11, color: visual.color }}>
                            {visual.note}
                        </Text>
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
    cameras: CameraDto[];
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

    const usedLocalIndexSet = useMemo(() => {
        return new Set(
            cameras
                .filter(c =>
                    detectCameraKind(c) === 'local' &&
                    c.localDeviceIndex !== undefined &&
                    c.localDeviceIndex !== null &&
                    c.cameraId !== editingId
                )
                .map(c => c.localDeviceIndex as number)
        );
    }, [cameras, editingId]);

    const localDeviceOptions = useMemo(
        () =>
            localDevices
                .map((device, index) => ({
                    value: String(index),
                    label: `[${index}] ${getLocalDeviceLabel(device, index)}`,
                    disabled: usedLocalIndexSet.has(index),
                }))
                .filter(option => !option.disabled),
        [localDevices, usedLocalIndexSet]
    );

    const availableLocalIndexSet = useMemo(
        () => new Set(localDeviceOptions.map(option => Number(option.value))),
        [localDeviceOptions]
    );

    const usedLocalIndicesText = useMemo(() => {
        const values = Array.from(usedLocalIndexSet).sort((a, b) => a - b);
        return values.length > 0 ? values.join(' ، ') : 'لا يوجد';
    }, [usedLocalIndexSet]);

    useEffect(() => {
        if (!open) return;

        if (editing) {
            const editingLocalIndex =
                editing.localDeviceIndex === undefined || editing.localDeviceIndex === null
                    ? undefined
                    : String(editing.localDeviceIndex);

            form.setFieldsValue({
                name: editing.name,
                code: editing.code,
                ipAddress: editing.ipAddress,
                streamUrl: editing.streamUrl,
                localDeviceIndex: editingLocalIndex,
                area: editing.area,
                floor: (editing as any).floor,
                latitude: (editing as any).latitude,
                longitude: (editing as any).longitude,
                notes: (editing as any).notes,
                isIndoor: editing.isIndoor,
                isActive: editing.isActive,
            });
            return;
        }

        form.resetFields();
        form.setFieldsValue({
            isActive: true,
            isIndoor: true,
            localDeviceIndex: localDeviceOptions.length > 0 ? localDeviceOptions[0].value : undefined,
            ipAddress: 'local',
        });
    }, [open, editing, form, localDeviceOptions]);

    const onFinish = (vals: any) => {
        const streamUrl = typeof vals.streamUrl === 'string' ? vals.streamUrl.trim() : '';
        const parsedIndex =
            vals.localDeviceIndex === undefined ||
                vals.localDeviceIndex === null ||
                vals.localDeviceIndex === ''
                ? undefined
                : Number(vals.localDeviceIndex);

        if (!streamUrl) {
            if (!currentDeviceId) {
                msgApi.error('لا يوجد جهاز حالي مختار. افتح صفحة ضبط الجهاز مع الكاميرا أولًا وحدد الجهاز.');
                return;
            }

            if (parsedIndex === undefined || Number.isNaN(parsedIndex)) {
                msgApi.error('اختر كاميرا محلية متاحة من القائمة.');
                return;
            }

            if (!availableLocalIndexSet.has(parsedIndex)) {
                msgApi.error('هذا الاندكس مستخدم مسبقًا أو غير متاح على هذا الجهاز.');
                return;
            }
        }

        const dto: CameraUpsertPayload = {
            ...vals,
            ipAddress: streamUrl ? (vals.ipAddress || '') : 'local',
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
                    {isLocalMode && !currentDeviceId && (
                        <Alert
                            type="warning"
                            showIcon
                            style={{ marginBottom: 16 }}
                            message="لا يوجد جهاز حالي مختار"
                            description="إذا كانت هذه كاميرا محلية، افتح صفحة ضبط الجهاز أولًا وحدد الجهاز الحالي، ثم ارجع للإضافة."
                        />
                    )}

                    {isLocalMode && currentDeviceId && (
                        <Alert
                            type={localDeviceOptions.length > 0 ? 'info' : 'warning'}
                            showIcon
                            style={{ marginBottom: 16 }}
                            message={
                                localDeviceOptions.length > 0
                                    ? `المتاح للإضافة على هذا الجهاز: ${localDeviceOptions.length} كامرة محلية`
                                    : 'لا توجد كامرات محلية متاحة للإضافة على هذا الجهاز'
                            }
                            description={
                                localDeviceOptions.length > 0
                                    ? `الاندكسات المستخدمة مسبقًا في قاعدة البيانات لهذا الجهاز: ${usedLocalIndicesText}`
                                    : `كل الكامرات المحلية المكتشفة على هذا الجهاز مستخدمة أو لا توجد كامرات مكتشفة. الاندكسات المستخدمة: ${usedLocalIndicesText}`
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
                                <Input placeholder="192.168.1.100 أو local" />
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item
                                name="localDeviceIndex"
                                label="الكامرة المحلية المتاحة"
                                tooltip="تظهر فقط الكامرات المحلية غير المستخدمة لهذا الجهاز."
                                extra={
                                    isLocalMode
                                        ? localDeviceOptions.length > 0
                                            ? `المتاح فقط: ${localDeviceOptions.map(x => x.label).join(' ، ')}`
                                            : 'لا توجد كامرات محلية متاحة حاليًا لهذا الجهاز'
                                        : 'هذا الحقل يُستخدم فقط عند ترك رابط البث فارغًا'
                                }
                            >
                                <Select
                                    showSearch
                                    disabled={!isLocalMode || localDeviceOptions.length === 0}
                                    options={localDeviceOptions}
                                    placeholder={
                                        isLocalMode
                                            ? (localDeviceOptions.length > 0
                                                ? 'اختر كامرة محلية متاحة'
                                                : 'لا توجد كامرات محلية متاحة')
                                            : 'غير مطلوب للكاميرات الشبكية'
                                    }
                                    filterOption={(input, option) =>
                                        String(option?.label ?? '').toLowerCase().includes(input.toLowerCase()) ||
                                        String(option?.value ?? '').toLowerCase().includes(input.toLowerCase())
                                    }
                                />
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

// ── CamerasManagePage ───────────────────────────────────
export default function CamerasManagePage() {
    const [currentDeviceId, setCurrentDeviceId] = useState<number | null>(() => getCurrentDeviceId());

    const {
        cameras,
        isLoading,
        isFetching,
        refetch,
        modalOpen,
        editingId,
        openCreate,
        openEdit,
        closeModal,
        save,
        isSaving,
        deleteCamera,
        toggleCamera,
        togglingId,
        ctx,
    } = useCameras(undefined, currentDeviceId);

    const [openingMonitor, setOpeningMonitor] = useState(false);
    const [localDevices, setLocalDevices] = useState<MediaDeviceInfo[]>([]);
    const [availabilityMap, setAvailabilityMap] = useState<Record<number, AvailabilityValue>>({});

    useEffect(() => {
        const syncDevice = () => setCurrentDeviceId(getCurrentDeviceId());

        window.addEventListener('storage', syncDevice);
        window.addEventListener('focus', syncDevice);

        return () => {
            window.removeEventListener('storage', syncDevice);
            window.removeEventListener('focus', syncDevice);
        };
    }, []);

    // ── Read local camera devices ───────────────────────
    useEffect(() => {
        let disposed = false;

        const loadDevices = async () => {
            try {
                const tmp = await navigator.mediaDevices.getUserMedia({ video: true });
                tmp.getTracks().forEach(t => t.stop());

                const all = await navigator.mediaDevices.enumerateDevices();
                if (!disposed) {
                    setLocalDevices(all.filter(d => d.kind === 'videoinput'));
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

    // ── Availability check ──────────────────────────────
    useEffect(() => {
        let disposed = false;

        const initialStatus: Record<number, AvailabilityValue> = {};

        cameras.forEach(cam => {
            if (!cam.isActive) {
                initialStatus[cam.cameraId] = false;
                return;
            }

            if (detectCameraKind(cam) === 'local') {
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
            cam => cam.isActive && detectCameraKind(cam) !== 'local'
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
    const local = cameras.filter(c => detectCameraKind(c) === 'local').length;
    const ip = cameras.length - local;

    return (
        <>
            <style>{CSS}</style>
            {ctx}

            <div style={{ padding: 24, direction: 'rtl', background: C.bg, minHeight: '100vh' }}>
                <div style={{
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
                }}>
                    <Space align="center" size={14}>
                        <div style={{
                            width: 48,
                            height: 48,
                            borderRadius: 14,
                            background: 'linear-gradient(135deg,#2563eb,#7c3aed)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
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

                            <div style={{ marginTop: 6 }}>
                                <Text style={{ fontSize: 12, color: currentDeviceId ? C.blue : C.red }}>
                                    <LinkOutlined style={{ marginLeft: 4 }} />
                                    الجهاز الحالي:
                                    {' '}
                                    {currentDeviceId ? `#${currentDeviceId}` : 'غير محدد'}
                                </Text>
                            </div>

                            <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {localDevices.length > 0 ? (
                                    localDevices.map((d, i) => (
                                        <Tag key={d.deviceId || `${d.kind}-${i}`} color="blue" style={{ marginInlineEnd: 0 }}>
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
                        description="افتح صفحة ضبط الجهاز أولًا وحدد هل هذا جهاز جديد أو قديم، وبعدها ستظهر الكامرات المحلية الخاصة بهذا الجهاز."
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
                        <Text type="secondary">ابدأ بإضافة أول كاميرا للشبكة</Text>
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
                                    onDelete={() => deleteCamera(cam.cameraId)}
                                    onToggle={() => toggleCamera(cam)}
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
                isSaving={isSaving}
            />
        </>
    );
}
