import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Spin,
    Typography,
    Space,
    Button,
    Input,
    Segmented,
    Select,
    message,
    Alert,
    Card,
    Row,
    Col,
    Tag,
} from 'antd';
import {
    VideoCameraOutlined,
    CheckCircleOutlined,
    LoadingOutlined,
    LaptopOutlined,
    PlusOutlined,
    LinkOutlined,
    WarningOutlined,
    ReloadOutlined,
    RadarChartOutlined,
    ThunderboltOutlined,
    ApartmentOutlined,
    ClockCircleOutlined,
} from '@ant-design/icons';
import axios from '../../api';

const { Text, Title } = Typography;

const STORAGE_KEY = 'current_device_id';

type DeviceDto = {
    userDeviceId: number;
    name: string;
    isActive: boolean;
    createdAt?: string;
    lastSeenAt?: string;
};

type ApiResponse<T> = {
    success: boolean;
    message?: string;
    data: T;
};



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
                <div style={{ fontSize: 18, color, fontWeight: 900, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 11, color: 'var(--app-muted)', marginTop: 6 }}>{label}</div>
            </div>

            <div className="stat-icon" style={{ background: bg, borderColor: border, color }}>
                {icon}
            </div>
        </div>
    );
}

export default function CamerasMonitorPage() {
    const navigate = useNavigate();
    const [msgApi, contextHolder] = message.useMessage();

    const [phase, setPhase] = useState<'checking' | 'choose' | 'launching'>('checking');
    const [mode, setMode] = useState<'new' | 'old'>('new');

    const [deviceName, setDeviceName] = useState('');
    const [devices, setDevices] = useState<DeviceDto[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<number | undefined>(undefined);
    const [loadingDevices, setLoadingDevices] = useState(false);
    const [saving, setSaving] = useState(false);
    const [popupBlocked, setPopupBlocked] = useState(false);

    const bootRef = useRef(false);
    const launchRef = useRef(false);
    const timerRef = useRef<number | null>(null);

    const activeDevices = useMemo(() => devices.filter((d) => d.isActive), [devices]);

    const deviceOptions = useMemo(
        () =>
            activeDevices.map((d) => ({
                value: d.userDeviceId,
                label: `${d.name}${d.lastSeenAt ? ` — آخر استخدام: ${new Date(d.lastSeenAt).toLocaleString()}` : ''}`,
            })),
        [activeDevices],
    );

    const cleanupTimer = () => {
        if (timerRef.current) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    };

    const launchMonitoring = useCallback(
        (deviceId: number) => {
            if (launchRef.current) return;
            launchRef.current = true;

            localStorage.setItem(STORAGE_KEY, String(deviceId));
            setPhase('launching');

            cleanupTimer();
            timerRef.current = window.setTimeout(() => {
                navigate('/cameras', { replace: true });
            }, 1300);
        },
        [navigate],
    );

    const loadDevices = useCallback(async () => {
        setLoadingDevices(true);
        try {
            const res = await axios.get<ApiResponse<DeviceDto[]>>('/devices/my');
            setDevices(res.data.data ?? []);
        } catch {
            msgApi.error('فشل جلب أجهزة المستخدم');
        } finally {
            setLoadingDevices(false);
        }
    }, [msgApi]);

    useEffect(() => {
        if (bootRef.current) return;
        bootRef.current = true;

        const stored = localStorage.getItem(STORAGE_KEY);

        if (stored) {
            const parsed = Number(stored);

            if (!Number.isNaN(parsed) && parsed > 0) {
                launchMonitoring(parsed);
                return;
            }

            localStorage.removeItem(STORAGE_KEY);
        }

        setPhase('choose');
    }, [launchMonitoring]);

    useEffect(() => {
        if (phase === 'choose' && mode === 'old') {
            loadDevices();
        }
    }, [phase, mode, loadDevices]);

    useEffect(() => {
        return () => {
            cleanupTimer();
        };
    }, []);

    const registerNewDevice = async () => {
        if (!deviceName.trim()) {
            msgApi.warning('اكتب اسمًا للجهاز أولًا');
            return;
        }

        setSaving(true);
        try {
            const res = await axios.post<ApiResponse<DeviceDto>>('/devices/register', {
                name: deviceName.trim(),
            });

            launchMonitoring(res.data.data.userDeviceId);
        } catch {
            msgApi.error('فشل تسجيل الجهاز');
            launchRef.current = false;
        } finally {
            setSaving(false);
        }
    };

    const useOldDevice = async () => {
        if (!selectedDeviceId) {
            msgApi.warning('اختر جهازًا');
            return;
        }

        setSaving(true);
        try {
            await axios.post(`/devices/${selectedDeviceId}/use`);
            launchMonitoring(selectedDeviceId);
        } catch {
            msgApi.error('فشل ربط الجهاز الحالي');
            launchRef.current = false;
        } finally {
            setSaving(false);
        }
    };

    const resetStoredDevice = () => {
        localStorage.removeItem(STORAGE_KEY);
        setSelectedDeviceId(undefined);
        setDeviceName('');
        setMode('new');
        setPopupBlocked(false);
        launchRef.current = false;
        setPhase('choose');
    };

    if (phase === 'launching' || phase === 'checking') {
        return (
            <>
   
                {contextHolder}

                <div className="monitor-shell">
                    <div className="center-wrap">
                        <div className="launch-box">
                            <div className="big-orb">
                                <VideoCameraOutlined style={{ fontSize: 34, color: '#fff' }} />
                            </div>

                            <Spin indicator={<LoadingOutlined spin style={{ fontSize: 28 }} />} />

                            <Title level={3} style={{ marginTop: 18, marginBottom: 6, color: 'var(--app-text)' }}>
                                جاري فتح صفحة المراقبة
                            </Title>

                            <Text style={{ color: 'var(--app-muted)', fontSize: 14 }}>
                                يتم تجهيز البث المباشر في هذه الصفحة
                            </Text>

                            {popupBlocked && (
                                <Alert
                                    style={{ marginTop: 18, textAlign: 'right', borderRadius: 14 }}
                                    type="warning"
                                    showIcon
                                    icon={<WarningOutlined />}
                                    message="تعذر فتح تبويب النتائج تلقائيًا"
                                    description="اسمح بالـ Popups لهذا الموقع أو افتح صفحة النتائج يدويًا."
                                />
                            )}

                            <div className="launch-status">
                                <Space direction="vertical" size={10} style={{ width: '100%' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <CheckCircleOutlined style={{ color: '#16a34a' }} />
                                            <Text style={{ color: 'var(--app-text)', fontWeight: 600 }}>
                                                النتائج المباشرة
                                            </Text>
                                        </div>
                                        <Text style={{ color: popupBlocked ? '#d97706' : '#2563eb', fontWeight: 600 }}>
                                            {popupBlocked ? 'تحقق من السماح بالـ Popups' : 'تم تجهيزها'}
                                        </Text>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <CheckCircleOutlined style={{ color: '#16a34a' }} />
                                            <Text style={{ color: 'var(--app-text)', fontWeight: 600 }}>
                                                البث المباشر
                                            </Text>
                                        </div>
                                        <Text style={{ color: '#2563eb', fontWeight: 600 }}>
                                            سيظهر هنا بعد لحظات
                                        </Text>
                                    </div>
                                </Space>
                            </div>

                            <div style={{ marginTop: 16 }}>
                                <Button onClick={resetStoredDevice} icon={<ReloadOutlined />}>
                                    اختيار جهاز آخر
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
        
            {contextHolder}

            <div className="monitor-shell">
                <div className="monitor-hero">
                    <div className="monitor-hero-inner">
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                            <div className="hero-badge">
                                <LaptopOutlined style={{ fontSize: 28, color: '#fff' }} />
                            </div>

                            <div>
                                <Title level={2} style={{ margin: 0, color: '#fff', fontWeight: 900 }}>
                                    اختيار الجهاز الحالي
                                </Title>
                                <Text style={{ color: 'rgba(255,255,255,.86)', fontSize: 13 }}>
                                    حتى نعرض الكامرات المحلية الخاصة بهذا الجهاز ونربطه بجلسة المراقبة.
                                </Text>
                            </div>
                        </div>

                        <div className="hero-actions">
                            <Button className="hero-btn" icon={<ReloadOutlined />} onClick={resetStoredDevice}>
                                إعادة التعيين
                            </Button>

                            <Button className="hero-btn" type="primary" icon={<VideoCameraOutlined />}>
                                تجهيز المراقبة
                            </Button>
                        </div>
                    </div>
                </div>

                <Row gutter={[14, 14]} className="stats-grid">
                    <Col xs={12} md={8} lg={6}>
                        <StatCard
                            label="الأجهزة الفعالة"
                            value={activeDevices.length}
                            color="#16a34a"
                            bg="var(--app-soft-green)"
                            border="#bbf7d0"
                            icon={<CheckCircleOutlined />}
                        />
                    </Col>

                    <Col xs={12} md={8} lg={6}>
                        <StatCard
                            label="إجمالي الأجهزة"
                            value={devices.length}
                            color="#2563eb"
                            bg="var(--app-soft-blue)"
                            border="#bfdbfe"
                            icon={<ApartmentOutlined />}
                        />
                    </Col>

                    <Col xs={12} md={8} lg={6}>
                        <StatCard
                            label="الوضع المختار"
                            value={mode === 'new' ? 'جديد' : 'قديم'}
                            color="#7c3aed"
                            bg="var(--app-soft-purple)"
                            border="#ddd6fe"
                            icon={<RadarChartOutlined />}
                        />
                    </Col>

                    <Col xs={12} md={8} lg={6}>
                        <StatCard
                            label="جاهزية الصفحة"
                            value="مستعدة"
                            color="#d97706"
                            bg="var(--app-soft-amber)"
                            border="#fde68a"
                            icon={<ClockCircleOutlined />}
                        />
                    </Col>
                </Row>

                <div className="choice-box">
                    <div className="choice-head">
                        <div className="big-orb small">
                            <LaptopOutlined style={{ fontSize: 32, color: '#fff' }} />
                        </div>

                        <div>
                            <Title level={4} style={{ margin: 0, color: 'var(--app-text)' }}>
                                تحديد الجهاز المستخدم
                            </Title>
                            <Text style={{ color: 'var(--app-muted)' }}>
                                بعد الاختيار سيتم حفظ الجهاز في هذا المتصفح
                            </Text>
                        </div>
                    </div>

                    <div className="choice-body">
                        <div className="choice-stack">
                            <Segmented
                                block
                                value={mode}
                                onChange={(v) => setMode(v as 'new' | 'old')}
                                options={[
                                    { label: 'جهاز جديد', value: 'new' },
                                    { label: 'جهاز قديم', value: 'old' },
                                ]}
                            />

                            {mode === 'new' ? (
                                <Card bordered={false} style={{ background: 'var(--app-surface-2)', borderRadius: 18 }}>
                                    <Space direction="vertical" size={14} style={{ width: '100%' }}>
                                        <div className="form-field">
                                            <Input
                                                value={deviceName}
                                                onChange={(e) => setDeviceName(e.target.value)}
                                                placeholder="مثال: iPad Aso أو حاسبة المكتب"
                                                size="large"
                                            />
                                        </div>

                                        <div className="form-field">
                                            <Button
                                                type="primary"
                                                icon={<PlusOutlined />}
                                                size="large"
                                                loading={saving}
                                                onClick={registerNewDevice}
                                                block
                                            >
                                                تسجيل جهاز جديد والمتابعة
                                            </Button>
                                        </div>
                                    </Space>
                                </Card>
                            ) : (
                                <Card bordered={false} style={{ background: 'var(--app-surface-2)', borderRadius: 18 }}>
                                    <Space direction="vertical" size={14} style={{ width: '100%' }}>
                                        <div className="form-field">
                                            <Select
                                                showSearch
                                                size="large"
                                                loading={loadingDevices}
                                                options={deviceOptions}
                                                value={selectedDeviceId}
                                                onChange={setSelectedDeviceId}
                                                placeholder="اختر جهازًا مسجلًا"
                                                filterOption={(input, option) =>
                                                    String(option?.label ?? '')
                                                        .toLowerCase()
                                                        .includes(input.toLowerCase())
                                                }
                                            />
                                        </div>

                                        <div className="form-field">
                                            <Button
                                                type="default"
                                                icon={<ReloadOutlined />}
                                                size="large"
                                                loading={loadingDevices}
                                                onClick={loadDevices}
                                                block
                                            >
                                                تحديث قائمة الأجهزة
                                            </Button>
                                        </div>

                                        <div className="form-field">
                                            <Button
                                                type="primary"
                                                icon={<LinkOutlined />}
                                                size="large"
                                                loading={saving}
                                                onClick={useOldDevice}
                                                block
                                            >
                                                استخدام الجهاز المختار والمتابعة
                                            </Button>
                                        </div>
                                    </Space>
                                </Card>
                            )}

                            <div className="helper-box">
                                <Text style={{ color: 'var(--app-muted)', fontSize: 12 }}>
                                    إذا تغير المتصفح أو انمسحت البيانات فسنطلب منك الاختيار مرة ثانية.
                                    الجهاز المحفوظ يحدد الكامرات المحلية التي ستظهر في النظام الحالي.
                                </Text>
                            </div>

                            {mode === 'old' && activeDevices.length === 0 && !loadingDevices && (
                                <Alert
                                    type="info"
                                    showIcon
                                    style={{ borderRadius: 14 }}
                                    message="لا توجد أجهزة فعالة متاحة"
                                    description="يمكنك تسجيل جهاز جديد مباشرة أو تحديث قائمة الأجهزة."
                                />
                            )}

                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <Tag color="blue">المفتاح المحلي: {STORAGE_KEY}</Tag>
                                <Tag color="green">المرحلة: {phase}</Tag>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
