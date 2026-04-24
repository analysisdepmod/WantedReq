import { useEffect, useMemo, useState } from 'react';
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
    Alert,
    Tag,
    message,
} from 'antd';
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
    ApartmentOutlined,
} from '@ant-design/icons';
import { useCameras, type CameraUpsertPayload } from '../../hooks/useCameras';
import { snapshotUrl } from '../../api/camerasApi';
import type { CameraDto } from '../../types/camera.types';
import { detectCameraKind } from '../../types/camera.types';

const { Title, Text } = Typography;
const STORAGE_KEY = 'current_device_id';

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

function probeImage(url: string, timeoutMs = 4000): Promise<boolean> {
    return new Promise((resolve) => {
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

function KindBadge({ cam }: { cam: CameraDto }) {
    const kind = detectCameraKind(cam);
    const map: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
        local: { label: 'محلية', color: C.blue, icon: <HomeOutlined /> },
        'ip-mjpeg': { label: 'MJPEG', color: C.purple, icon: <WifiOutlined /> },
        'ip-rtsp': { label: 'RTSP', color: '#db2777', icon: <WifiOutlined /> },
    };

    const k = map[kind] ?? map.local;

    return (
        <Tag
            className="device-chip"
            style={{
                background: `${k.color}14`,
                border: `1px solid ${k.color}33`,
                color: k.color,
            }}
        >
            {k.icon} {k.label}
        </Tag>
    );
}

function StatCard({
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
        <div className="stat-card">
            <div>
                <div style={{ fontSize: 24, color, fontWeight: 900, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 12, color: 'var(--app-muted)', marginTop: 6 }}>{label}</div>
            </div>

            <div className="stat-icon" style={{ background: bg, borderColor: border, color }}>
                {icon}
            </div>
        </div>
    );
}

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
        <div className={cardClass} style={{ animationDelay: `${idx * 0.04}s` }}>
            <div className="cam-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                        className="cam-avatar"
                        style={{
                            background: visual.bg,
                            borderColor: visual.border,
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

                <Space size={6} align="center">
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

                    <Tag
                        className="device-chip"
                        style={{
                            background: visual.bg,
                            border: `1px solid ${visual.border}`,
                            color: visual.color,
                        }}
                    >
                        {visual.icon} {visual.label}
                    </Tag>
                </Space>
            </div>

            <div className="kind-strip">
                <KindBadge cam={cam} />
                {cam.isIndoor ? (
                    <Tag className="device-chip" color="blue">
                        <HomeOutlined style={{ marginLeft: 4 }} />
                        داخلية
                    </Tag>
                ) : (
                    <Tag className="device-chip" color="green">
                        <GlobalOutlined style={{ marginLeft: 4 }} />
                        خارجية
                    </Tag>
                )}
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cam.area && (
                    <div className="info-row">
                        <EnvironmentOutlined style={{ color: C.muted, fontSize: 12 }} />
                        <Text style={{ color: C.muted, fontSize: 12 }}>{cam.area}</Text>
                    </div>
                )}

                <div className="info-row">
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
                    <div className="note-box" style={{ color: visual.color, background: visual.bg }}>
                        <Text style={{ fontSize: 11, color: visual.color }}>{visual.note}</Text>
                    </div>
                )}
            </div>

            <Divider style={{ margin: '2px 0 0' }} />

            <div className="cam-actions">
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
                    <Button size="small" icon={<EditOutlined />} onClick={onEdit} />
                </Tooltip>

                <Tooltip title="فتح منفردة">
                    <Button
                        size="small"
                        icon={<PlayCircleOutlined />}
                        type="primary"
                        ghost
                        onClick={() => window.open(`/cameras/${cam.cameraId}`, '_blank')}
                    />
                </Tooltip>

                <Popconfirm title="حذف الكاميرا؟" okText="نعم" cancelText="لا" onConfirm={onDelete}>
                    <Button size="small" icon={<DeleteOutlined />} danger />
                </Popconfirm>
            </div>
        </div>
    );
}

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
    const editing = cameras.find((c) => c.cameraId === editingId);
    const streamUrlValue = Form.useWatch('streamUrl', form);
    const isLocalMode = !String(streamUrlValue ?? '').trim();

    const usedLocalIndexSet = useMemo(() => {
        return new Set(
            cameras
                .filter(
                    (c) =>
                        detectCameraKind(c) === 'local' &&
                        c.localDeviceIndex !== undefined &&
                        c.localDeviceIndex !== null &&
                        c.cameraId !== editingId,
                )
                .map((c) => c.localDeviceIndex as number),
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
                .filter((option) => !option.disabled),
        [localDevices, usedLocalIndexSet],
    );

    const availableLocalIndexSet = useMemo(
        () => new Set(localDeviceOptions.map((option) => Number(option.value))),
        [localDeviceOptions],
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
                width={780}
                centered
                styles={{ body: { direction: 'rtl', paddingTop: 16 } }}
            >
                <Form form={form} layout="vertical" onFinish={onFinish} className="modal-form">
                    {isLocalMode && !currentDeviceId && (
                        <Alert
                            type="warning"
                            showIcon
                            style={{ marginBottom: 16, borderRadius: 14 }}
                            message="لا يوجد جهاز حالي مختار"
                            description="إذا كانت هذه كاميرا محلية، افتح صفحة ضبط الجهاز أولًا وحدد الجهاز الحالي، ثم ارجع للإضافة."
                        />
                    )}

                    {isLocalMode && currentDeviceId && (
                        <Alert
                            type={localDeviceOptions.length > 0 ? 'info' : 'warning'}
                            showIcon
                            style={{ marginBottom: 16, borderRadius: 14 }}
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
                            <Form.Item
                                name="name"
                                label="اسم الكاميرا"
                                rules={[{ required: true, message: 'اسم الكاميرا مطلوب' }]}
                            >
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
                                            ? `المتاح فقط: ${localDeviceOptions.map((x) => x.label).join(' ، ')}`
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
                                            ? localDeviceOptions.length > 0
                                                ? 'اختر كامرة محلية متاحة'
                                                : 'لا توجد كامرات محلية متاحة'
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

    useEffect(() => {
        let disposed = false;

        const loadDevices = async () => {
            try {
                const tmp = await navigator.mediaDevices.getUserMedia({ video: true });
                tmp.getTracks().forEach((t) => t.stop());

                const all = await navigator.mediaDevices.enumerateDevices();
                if (!disposed) {
                    setLocalDevices(all.filter((d) => d.kind === 'videoinput'));
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

    useEffect(() => {
        let disposed = false;

        const initialStatus: Record<number, AvailabilityValue> = {};

        cameras.forEach((cam) => {
            if (!cam.isActive) {
                initialStatus[cam.cameraId] = false;
                return;
            }

            if (detectCameraKind(cam) === 'local') {
                const idx = cam.localDeviceIndex;
                initialStatus[cam.cameraId] =
                    idx !== undefined && idx !== null && idx >= 0 && idx < localDevices.length;
            } else {
                initialStatus[cam.cameraId] = null;
            }
        });

        setAvailabilityMap((prev) => ({ ...prev, ...initialStatus }));

        const remoteCameras = cameras.filter((cam) => cam.isActive && detectCameraKind(cam) !== 'local');

        if (remoteCameras.length === 0) {
            return () => {
                disposed = true;
            };
        }

        (async () => {
            const results = await Promise.all(
                remoteCameras.map(async (cam) => {
                    const base = snapshotUrl(cam.cameraId);
                    const glue = base.includes('?') ? '&' : '?';
                    const ok = await probeImage(`${base}${glue}_=${Date.now()}`, 4000);
                    return { cameraId: cam.cameraId, ok };
                }),
            );

            if (disposed) return;

            setAvailabilityMap((prev) => {
                const next = { ...prev };
                results.forEach((r) => {
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

    const activeAvailable = cameras.filter((c) => c.isActive && availabilityMap[c.cameraId] === true).length;
    const unavailable = cameras.filter((c) => c.isActive && availabilityMap[c.cameraId] === false).length;
    const checking = cameras.filter(
        (c) => c.isActive && (availabilityMap[c.cameraId] === null || availabilityMap[c.cameraId] === undefined),
    ).length;
    const stopped = cameras.filter((c) => !c.isActive).length;
    const local = cameras.filter((c) => detectCameraKind(c) === 'local').length;
    const ip = cameras.length - local;

    return (
        <>
     
            {ctx}

            <div className="cams-shell">
                <div className="cams-hero">
                    <div className="cams-hero-inner">
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                            <div className="hero-badge">
                                <SettingOutlined style={{ fontSize: 28, color: '#fff' }} />
                            </div>

                            <div>
                                <Title level={2} style={{ margin: 0, color: '#fff', fontWeight: 900 }}>
                                    إدارة الكاميرات
                                </Title>
                                <Text style={{ color: 'rgba(255,255,255,.86)', fontSize: 13 }}>
                                    إضافة وتعديل وتشغيل شبكة الكاميرات المحلية والشبكية من لوحة موحّدة.
                                </Text>

                                <div style={{ marginTop: 8 }}>
                                    <Text style={{ fontSize: 12, color: currentDeviceId ? '#dbeafe' : '#fee2e2' }}>
                                        <LinkOutlined style={{ marginLeft: 4 }} />
                                        الجهاز الحالي: {currentDeviceId ? `#${currentDeviceId}` : 'غير محدد'}
                                    </Text>
                                </div>

                                <div className="devices-strip">
                                    {localDevices.length > 0 ? (
                                        localDevices.map((d, i) => (
                                            <Tag key={d.deviceId || `${d.kind}-${i}`} className="device-chip" color="blue">
                                                <CameraOutlined style={{ marginLeft: 4 }} />
                                                [{i}] {getLocalDeviceLabel(d, i)}
                                            </Tag>
                                        ))
                                    ) : (
                                        <Text style={{ fontSize: 12, color: 'rgba(255,255,255,.8)' }}>
                                            لا توجد كامرات محلية مكتشفة حاليًا
                                        </Text>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="hero-actions">
                            <Button
                                className="hero-btn"
                                icon={<ReloadOutlined spin={isFetching} />}
                                onClick={() => refetch()}
                            >
                                تحديث
                            </Button>

                            <Button
                                className="hero-btn"
                                type="primary"
                                icon={<PlayCircleOutlined />}
                                onClick={openMonitor}
                                loading={openingMonitor}
                                style={{ background: '#16a34a', borderColor: '#16a34a' }}
                            >
                                المراقبة المباشرة
                            </Button>

                            <Button className="hero-btn" type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                                إضافة كاميرا
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="stats-strip">
                    <div className="stat-mini-wrap">
                        <StatCard
                            label="إجمالي"
                            value={cameras.length}
                            color={C.text}
                            bg="var(--app-surface-2)"
                            border={C.border}
                            icon={<VideoCameraOutlined />}
                        />
                    </div>

                    <div className="stat-mini-wrap">
                        <StatCard
                            label="متاحة"
                            value={activeAvailable}
                            color={C.green}
                            bg="var(--app-soft-green)"
                            border="#bbf7d0"
                            icon={<CheckCircleOutlined />}
                        />
                    </div>

                    <div className="stat-mini-wrap">
                        <StatCard
                            label="غير نشطة"
                            value={unavailable}
                            color={C.red}
                            bg="var(--app-soft-red)"
                            border="#fecaca"
                            icon={<WarningOutlined />}
                        />
                    </div>

                    <div className="stat-mini-wrap">
                        <StatCard
                            label="قيد التحقق"
                            value={checking}
                            color={C.amber}
                            bg="var(--app-soft-amber)"
                            border="#fde68a"
                            icon={<ClockCircleOutlined />}
                        />
                    </div>

                    <div className="stat-mini-wrap">
                        <StatCard
                            label="متوقفة"
                            value={stopped}
                            color={C.muted}
                            bg="var(--app-surface-2)"
                            border={C.border}
                            icon={<StopOutlined />}
                        />
                    </div>

                    <div className="stat-mini-wrap">
                        <StatCard
                            label="محلية"
                            value={local}
                            color={C.blue}
                            bg="var(--app-soft-blue)"
                            border="#bfdbfe"
                            icon={<HomeOutlined />}
                        />
                    </div>

                    <div className="stat-mini-wrap">
                        <StatCard
                            label="IP / URL"
                            value={ip}
                            color={C.purple}
                            bg="var(--app-soft-purple)"
                            border="#ddd6fe"
                            icon={<WifiOutlined />}
                        />
                    </div>
                </div>

                {!currentDeviceId && (
                    <Alert
                        style={{ marginBottom: 16, borderRadius: 16 }}
                        type="warning"
                        showIcon
                        message="لم يتم اختيار الجهاز الحالي بعد"
                        description="افتح صفحة ضبط الجهاز أولًا وحدد هل هذا جهاز جديد أو قديم، وبعدها ستظهر الكامرات المحلية الخاصة بهذا الجهاز."
                    />
                )}

                <div className="surface-card">
                    <div className="surface-card-head">
                        <Space size={10}>
                            <Title level={4} style={{ margin: 0 }}>
                                سجل الكاميرات
                            </Title>
                            <ApartmentOutlined style={{ color: '#2563eb' }} />
                        </Space>

                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {cameras.length} كاميرا
                        </Text>
                    </div>

                    <div className="surface-card-body">
                        {isLoading ? (
                            <div style={{ textAlign: 'center', padding: 100 }}>
                                <Spin size="large" />
                                <br />
                                <br />
                                <Text type="secondary">جاري تحميل الكاميرات…</Text>
                            </div>
                        ) : cameras.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 70 }}>
                                <VideoCameraOutlined style={{ fontSize: 72, color: '#cbd5e1' }} />
                                <br />
                                <br />
                                <Title level={4} style={{ color: C.muted }}>
                                    لا توجد كاميرات
                                </Title>
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
                                    <Col key={cam.cameraId} xs={24} sm={12} md={8} xl={6}>
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
                </div>
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
