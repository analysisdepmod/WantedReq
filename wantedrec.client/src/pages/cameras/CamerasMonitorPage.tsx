import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spin, Typography, Space } from 'antd';
import { VideoCameraOutlined, CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

export default function CamerasMonitorPage() {
    const navigate = useNavigate();

    useEffect(() => {
        const resultsWin = window.open('/cameras/results', 'live-results');
        resultsWin?.blur?.();

        const timer = window.setTimeout(() => {
            navigate('/cameras/live', { replace: true });
        }, 1300);

        return () => window.clearTimeout(timer);
    }, [navigate]);

    return (
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
                            <Text style={{ color: '#2563eb', fontWeight: 600 }}>
                                تم فتحها في تاب جديد
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
                    <Text style={{ color: 'var(--app-muted)', fontSize: 12 }}>
                        إذا لم يتم فتح تبويب النتائج، تأكد من السماح بالـ Popups لهذا الموقع
                    </Text>
                </div>
            </div>
        </div>
    );
}