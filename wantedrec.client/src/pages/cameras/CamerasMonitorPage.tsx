// ═══════════════════════════════════════════════════════
//  src/pages/cameras/CamerasMonitorPage.tsx
//  Route: /cameras/monitor
//  يفتح تابَّين جديدَّين فوراً عند الدخول
// ═══════════════════════════════════════════════════════
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spin, Typography, Space } from 'antd';
import { VideoCameraOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

export default function CamerasMonitorPage() {
    const navigate  = useNavigate();
    const opened    = useRef(false);

    useEffect(() => {
        if (opened.current) return;
        opened.current = true;

        // تاب 1: الكاميرات المباشرة
        window.open('/cameras/live', '_blank', 'noopener');

        // تاب 2: نتائج التعرف (تأخير خفيف لتجنب popup blocker)
        setTimeout(() => {
            window.open('/cameras/results', '_blank', 'noopener');
        }, 300);

        // ارجع للصفحة السابقة بعد ثانية
        setTimeout(() => navigate(-1), 1200);
    }, [navigate]);

    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            minHeight: '100vh', background: '#f4f6fb', flexDirection: 'column', gap: 20,
            direction: 'rtl',
        }}>
            <div style={{
                background: '#fff', border: '1px solid #e4e9f2', borderRadius: 20,
                padding: '48px 64px', textAlign: 'center',
                boxShadow: '0 8px 32px rgba(15,23,42,.08)',
            }}>
                <Spin size="large" style={{ marginBottom: 20 }} />
                <Title level={4} style={{ marginBottom: 8 }}>جاري فتح شاشات المراقبة</Title>
                <Space direction="vertical" size={8}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#16a34a' }}>
                        <VideoCameraOutlined />
                        <Text style={{ color: '#16a34a', fontWeight: 600 }}>تاب 1: شاشة الكاميرات المباشرة</Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#2563eb' }}>
                        <CheckCircleOutlined />
                        <Text style={{ color: '#2563eb', fontWeight: 600 }}>تاب 2: نتائج التعرف</Text>
                    </div>
                </Space>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                    لو لم تفتح التابات، تأكد من السماح بالـ Popups لهذا الموقع
                </Text>
            </div>
        </div>
    );
}
