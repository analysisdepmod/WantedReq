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

    // مهم جدًا حتى لا ينفتح التاب مرتين في StrictMode
    const bootRef = useRef(false);
    const launchRef = useRef(false);
    const timerRef = useRef<number | null>(null);

    const deviceOptions = useMemo(
        () =>
            devices
                .filter(d => d.isActive)
                .map(d => ({
                    value: d.userDeviceId,
                    label: `${d.name}${d.lastSeenAt ? ` — آخر استخدام: ${new Date(d.lastSeenAt).toLocaleString()}` : ''}`,
                })),
        [devices]
    );

    const cleanupTimer = () => {
        if (timerRef.current) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    };

    const launchMonitoring = useCallback((deviceId: number) => {
        if (launchRef.current) return;
        launchRef.current = true;

        localStorage.setItem(STORAGE_KEY, String(deviceId));
        setPhase('launching');

        const resultsWin = window.open('/cameras/results', 'live-results');
        const blocked = !resultsWin;
        setPopupBlocked(blocked);

        if (resultsWin) {
            resultsWin.blur?.();
        }

        cleanupTimer();
        timerRef.current = window.setTimeout(() => {
            navigate('/cameras/live', { replace: true });
        }, 1300);
    }, [navigate]);

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

                <div
                    style={{
                        minHeight: '100vh',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        direction: 'rtl',
                        padding: 24,
                        background: 'var(--app-page-bg)',
                        color: 'var(--app-text)',
                    }}
                >
                    <div
                        style={{
                            width: 'min(560px, 100%)',
                            background: 'var(--app-surface)',
                            border: '1px solid var(--app-border)',
                            borderRadius: 22,
                            padding: '42px 28px',
                            textAlign: 'center',
                            boxShadow: 'var(--app-shadow)',
                        }}
                    >
                        <div
                            style={{
                                width: 82,
                                height: 82,
                                margin: '0 auto 18px',
                                borderRadius: 22,
                                background: 'linear-gradient(135deg, var(--app-hero-start), var(--app-hero-end))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
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
                                style={{ marginTop: 18, textAlign: 'right' }}
                                type="warning"
                                showIcon
                                icon={<WarningOutlined />}
                                message="تعذر فتح تبويب النتائج تلقائيًا"
                                description="اسمح بالـ Popups لهذا الموقع أو افتح صفحة النتائج يدويًا."
                            />
                        )}

                        <div
                            style={{
                                marginTop: 22,
                                background: 'var(--app-surface-2)',
                                border: '1px solid var(--app-border)',
                                borderRadius: 16,
                                padding: '14px 16px',
                                textAlign: 'right',
                            }}
                        >
                            <Space direction="vertical" size={10} style={{ width: '100%' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <CheckCircleOutlined style={{ color: '#16a34a' }} />
                                        <Text style={{ color: 'var(--app-text)', fontWeight: 600 }}>
                                            النتائج المباشرة
                                        </Text>
                                    </div>
                                    <Text style={{ color: popupBlocked ? '#d97706' : '#2563eb', fontWeight: 600 }}>
                                        {popupBlocked ? 'تحقق من السماح بالـ Popups' : 'تم فتحها في تاب جديد'}
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
            </>
        );
    }

    return (
        <>
            {contextHolder}

            <div
                style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    direction: 'rtl',
                    padding: 24,
                    background: 'var(--app-page-bg)',
                    color: 'var(--app-text)',
                }}
            >
                <div
                    style={{
                        width: 'min(620px, 100%)',
                        background: 'var(--app-surface)',
                        border: '1px solid var(--app-border)',
                        borderRadius: 22,
                        padding: '34px 28px',
                        boxShadow: 'var(--app-shadow)',
                    }}
                >
                    <Space direction="vertical" size={18} style={{ width: '100%' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div
                                style={{
                                    width: 76,
                                    height: 76,
                                    margin: '0 auto 14px',
                                    borderRadius: 20,
                                    background: 'linear-gradient(135deg, var(--app-hero-start), var(--app-hero-end))',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <LaptopOutlined style={{ fontSize: 32, color: '#fff' }} />
                            </div>

                            <Title level={3} style={{ marginBottom: 6, color: 'var(--app-text)' }}>
                                اختيار الجهاز الحالي
                            </Title>
                            <Text style={{ color: 'var(--app-muted)' }}>
                                حتى نعرض الكامرات المحلية الخاصة بهذا الجهاز
                            </Text>
                        </div>

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
                            <Space direction="vertical" size={14} style={{ width: '100%' }}>
                                <Input
                                    value={deviceName}
                                    onChange={(e) => setDeviceName(e.target.value)}
                                    placeholder="مثال: iPad Aso أو حاسبة المكتب"
                                    size="large"
                                />

                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    size="large"
                                    loading={saving}
                                    onClick={registerNewDevice}
                                >
                                    تسجيل جهاز جديد والمتابعة
                                </Button>
                            </Space>
                        ) : (
                            <Space direction="vertical" size={14} style={{ width: '100%' }}>
                                <Select
                                    showSearch
                                    size="large"
                                    loading={loadingDevices}
                                    options={deviceOptions}
                                    value={selectedDeviceId}
                                    onChange={setSelectedDeviceId}
                                    placeholder="اختر جهازًا مسجلًا"
                                    filterOption={(input, option) =>
                                        String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                    }
                                />

                                <Button
                                    type="default"
                                    icon={<ReloadOutlined />}
                                    size="large"
                                    loading={loadingDevices}
                                    onClick={loadDevices}
                                >
                                    تحديث قائمة الأجهزة
                                </Button>

                                <Button
                                    type="primary"
                                    icon={<LinkOutlined />}
                                    size="large"
                                    loading={saving}
                                    onClick={useOldDevice}
                                >
                                    استخدام الجهاز المختار والمتابعة
                                </Button>
                            </Space>
                        )}

                        <div
                            style={{
                                background: 'var(--app-surface-2)',
                                border: '1px solid var(--app-border)',
                                borderRadius: 14,
                                padding: 14,
                            }}
                        >
                            <Text style={{ color: 'var(--app-muted)', fontSize: 12 }}>
                                بعد الاختيار سيتم حفظ الجهاز في المتصفح الحالي، وإذا تغير المتصفح أو انمسحت البيانات
                                سنسألك مرة ثانية هل هذا جهاز جديد أو قديم.
                            </Text>
                        </div>
                    </Space>
                </div>
            </div>
        </>
    );
}