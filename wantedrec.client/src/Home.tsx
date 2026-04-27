import { Carousel, Typography, Badge, Space, Row, Col, Button } from 'antd';
import { useMemo, useState } from 'react';
import Marquee from 'react-fast-marquee';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../app/store';
import { DataIndexValue } from './Interfaces/functions';
import { useTranslation } from 'react-i18next';
import {
    TeamOutlined,
    ScanOutlined,
    CameraOutlined,
    CheckCircleOutlined,
    WarningOutlined,
    UserOutlined,
    ThunderboltOutlined,
    ClockCircleOutlined,
    RadarChartOutlined,
    RiseOutlined,
    BellOutlined,
    PlayCircleOutlined,
    SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useImage, useNews } from './hooks/useApi';
import { useQuery } from '@tanstack/react-query';
import { getPersons } from './api/personsApi';
import { getCameras } from './api/camerasApi';
import { getRecognitions } from './api/recognitionApi';
import { useSignalRRecognition } from './hooks/useSignalRRecognition';
import dayjs from 'dayjs';

const { Text, Title } = Typography;



const scoreColor = (s?: number) => (!s ? '#94a3b8' : s >= 0.8 ? '#16a34a' : s >= 0.6 ? '#d97706' : '#dc2626');

function NavCard({
    to,
    icon,
    label,
    color,
    bg,
    badge,
    delay = 0,
    onClick,
}: {
    to?: string;
    icon: React.ReactNode;
    label: string;
    color: string;
    bg: string;
    badge?: number;
    delay?: number;
    onClick?: () => void;
}) {
    const content = (
        <div
            className="home-nav-card"
            style={{ animationDelay: `${delay}ms` }}
            onClick={onClick}
        >
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    left: 0,
                    height: 4,
                    background: `linear-gradient(90deg, ${color}, ${color}aa)`,
                }}
            />

            {badge !== undefined && badge > 0 && (
                <Badge
                    count={badge}
                    style={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        boxShadow: '0 8px 18px rgba(239,68,68,.22)',
                    }}
                />
            )}

            <div
                className="icon-wrap"
                style={{
                    background: bg,
                    border: `1px solid ${color}22`,
                }}
            >
                <span style={{ color, fontSize: 25, display: 'flex' }}>{icon}</span>
            </div>

            <div>
                <Text
                    strong
                    style={{
                        fontSize: 14,
                        color: 'var(--app-text)',
                        display: 'block',
                        lineHeight: 1.5,
                    }}
                >
                    {label}
                </Text>

                <Text
                    style={{
                        fontSize: 11,
                        color: 'var(--app-muted)',
                        display: 'block',
                        marginTop: 4,
                    }}
                >
                    فتح القسم
                </Text>
            </div>
        </div>
    );

    return to ? (
        <Link to={to} style={{ textDecoration: 'none', display: 'block' }}>
            {content}
        </Link>
    ) : (
        content
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
                <div style={{ fontSize: 22, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 11, color: 'var(--app-muted)', marginTop: 6 }}>{label}</div>
            </div>

            <div className="stat-icon" style={{ background: bg, borderColor: border, color }}>
                {icon}
            </div>
        </div>
    );
}

const Home = () => {

  

    const { arlang } = useSelector((state: RootState) => state.setting);
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { basicUserInfo } = useSelector((state: RootState) => state.auth.loginResponse);

    const { data: newss = [] } = useNews();
    const { data: Images = [] } = useImage();

    const { data: persons = [] } = useQuery({
        queryKey: ['persons'],
        queryFn: () => getPersons({}),
    });

    const { data: cameras = [] } = useQuery({
        queryKey: ['cameras'],
        queryFn: () => getCameras(),
    });

    const { data: recognitions = [] } = useQuery({
        queryKey: ['recognitions-home'],
        queryFn: () => getRecognitions({ isMatch: true }),
        refetchInterval: 30_000,
    });

    const { events, isConnected } = useSignalRRecognition();

    const activeCams = cameras.filter((c) => c.isActive).length;
    const suspects = persons.filter((p: any) => p.hasSuspectRecord).length;
    const todayRecs = recognitions.filter((r) =>
        dayjs(r.recognitionDateTime).isAfter(dayjs().startOf('day')),
    ).length;

    const avgScore = useMemo(() => {
        if (!events.length) return 0;
        const vals = events.map((e) => e.score ?? 0).filter(Boolean);
        if (!vals.length) return 0;
        return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100);
    }, [events]);

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'صباح الخير' : hour < 17 ? 'مساء الخير' : 'مساء النور';

    const [openingMonitor, setOpeningMonitor] = useState(false);

    const openMonitor = () => {
        if (openingMonitor) return;
        setOpeningMonitor(true);

        try {
            window.location.assign('/cameras/monitor');
        } finally {
            window.setTimeout(() => setOpeningMonitor(false), 1000);
        }
    };

    return (
        <>
        

            <div
                className="home-shell"
                style={{ direction: arlang ? 'rtl' : 'ltr' }}
            >
                <div className="home-hero">
                    <div className="home-hero-inner">
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                            <div className="hero-badge">
                                <SafetyCertificateOutlined style={{ fontSize: 28, color: '#fff' }} />
                            </div>

                            <div>
                                <Title level={2} style={{ margin: 0, color: '#fff', fontWeight: 900 }}>
                                    {greeting}، {basicUserInfo?.rankName} {basicUserInfo?.userName}
                                </Title>
                                <Text style={{ color: 'rgba(255,255,255,.86)', fontSize: 13 }}>
                                    لوحة التحكم الرئيسية لنظام التعرف الأمني الذكي ومراقبة الأحداث المباشرة.
                                </Text>

                                <div className="hero-pills">
                                    <span className="hero-pill">
                                        <ClockCircleOutlined />
                                        {dayjs().format('dddd، DD MMMM YYYY')}
                                    </span>

                                    <span className="hero-pill">
                                        <span
                                            style={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: '50%',
                                                display: 'inline-block',
                                                background: isConnected ? '#22c55e' : '#ef4444',
                                                animation: isConnected ? 'pulseRing 1.8s infinite' : 'none',
                                            }}
                                        />
                                        {isConnected ? 'النظام متصل' : 'النظام غير متصل'}
                                    </span>

                                    <span className="hero-pill">
                                        <BellOutlined />
                                        {events.length} أحداث مباشرة
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="hero-actions">
                            <Button
                                className="hero-btn"
                                type="primary"
                                icon={<ThunderboltOutlined />}
                                onClick={openMonitor}
                                loading={openingMonitor}
                                style={{ background: '#16a34a', borderColor: '#16a34a' }}
                            >
                                المراقبة المباشرة
                            </Button>

                            <Button
                                className="hero-btn"
                                icon={<PlayCircleOutlined />}
                                onClick={() => navigate('/recognition/results')}
                            >
                                سجل التعرف
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="stats-strip">
                    {[
                        { label: 'الأشخاص', value: persons.length, color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: <UserOutlined /> },
                        { label: 'كاميرات نشطة', value: `${activeCams}/${cameras.length}`, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', icon: <CameraOutlined /> },
                        { label: 'تعرفات اليوم', value: todayRecs, color: '#7c3aed', bg: '#faf5ff', border: '#ddd6fe', icon: <CheckCircleOutlined /> },
                        { label: 'مشتبه بهم', value: suspects, color: '#dc2626', bg: '#fff5f5', border: '#fecaca', icon: <WarningOutlined /> },
                        { label: 'أحداث مباشرة', value: events.length, color: '#d97706', bg: '#fefce8', border: '#fde68a', icon: <ThunderboltOutlined /> },
                        { label: 'متوسط التطابق الحي', value: `${avgScore}%`, color: '#0891b2', bg: '#ecfeff', border: '#bae6fd', icon: <RiseOutlined /> },
                    ].map((s) => (
                        <div key={s.label} className="stat-wrap">
                            <StatCard {...s} />
                        </div>
                    ))}
                </div>

                <Row gutter={[18, 18]} style={{ marginBottom: 18 }}>
                    <Col xs={24} xl={16}>
                        <div className="surface-card">
                            <div className="surface-head">
                                <Space size={10}>
                                    <Title level={4} style={{ margin: 0 }}>
                                        الواجهة الرئيسية
                                    </Title>
                                    <RadarChartOutlined style={{ color: '#2563eb' }} />
                                </Space>

                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    البث التعريفي والمحتوى العام
                                </Text>
                            </div>

                            <div className="surface-body">
                                <div className="feature-carousel">
                                    {Images.length > 0 ? (
                                        <Carousel autoplay dots effect="fade">
                                            {Images.map((i) => (
                                                <div key={i.id}>
                                                    <div className="feature-slide">
                                                        <img src={`${i.imageFileName}`} alt={i.name} />
                                                        <div className="feature-overlay">
                                                            <div>
                                                                <Title level={4} style={{ margin: 0, color: '#fff' }}>
                                                                    {i.name || 'نظام التعرف الأمني الذكي'}
                                                                </Title>
                                                                <Text style={{ color: 'rgba(255,255,255,.84)', fontSize: 13 }}>
                                                                    متابعة مباشرة وتحليل سريع وربط فوري مع نتائج التعرف.
                                                                </Text>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </Carousel>
                                    ) : (
                                        <div className="feature-empty">
                                            <CameraOutlined style={{ fontSize: 56, color: '#93c5fd' }} />
                                            <Text style={{ color: '#bfdbfe', fontSize: 16, fontWeight: 700 }}>
                                                نظام التعرف الأمني الذكي
                                            </Text>
                                            <Text style={{ color: '#dbeafe', fontSize: 13 }}>
                                                لا توجد صور عرض مضافة حالياً
                                            </Text>
                                        </div>
                                    )}
                                </div>

                                {newss?.some((n) => n.can) && (
                                    <div className="ticker">
                                        <span className="ticker-label">أخبار</span>
                                        <Marquee
                                            speed={55}
                                            gradient={false}
                                            pauseOnHover
                                            direction={arlang ? 'right' : 'left'}
                                            style={{ flex: 1 }}
                                        >
                                            {newss.map((i) =>
                                                i.can ? (
                                                    <span key={i.id} className="ticker-item">
                                                        <span className="author">{DataIndexValue(arlang, 'applicationUserId', i)}</span>
                                                        {DataIndexValue(arlang, 'details', i)}
                                                        <img src="/Raj1.png" alt="" style={{ height: 18, marginRight: 6, verticalAlign: 'middle' }} />
                                                        <span className="ticker-sep">◆</span>
                                                    </span>
                                                ) : null,
                                            )}
                                        </Marquee>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Col>

                    <Col xs={24} xl={8}>
                        <div className="surface-card live-box">
                            <div className="surface-head">
                                <Space size={8}>
                                    <ThunderboltOutlined style={{ color: '#2563eb', fontSize: 16 }} />
                                    <Text strong style={{ fontSize: 13 }}>أحداث التعرف المباشر</Text>
                                    {events.length > 0 && <Badge count={events.length} size="small" />}
                                </Space>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span className={`live-indicator ${isConnected ? 'on' : 'off'}`} />
                                    <Text style={{ fontSize: 11, color: 'var(--app-muted)' }}>
                                        {isConnected ? 'LIVE' : 'OFF'}
                                    </Text>
                                </div>
                            </div>

                            <div className="surface-body" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                <div className="live-list">
                                    {events.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '38px 0', color: '#94a3b8' }}>
                                            <CheckCircleOutlined style={{ fontSize: 40, marginBottom: 10, display: 'block' }} />
                                            <Text style={{ color: '#94a3b8', fontSize: 12 }}>
                                                لا توجد أحداث حتى الآن
                                            </Text>
                                        </div>
                                    ) : (
                                        events.slice(0, 10).map((ev, i) => (
                                            <div
                                                key={ev.recognitionId ?? i}
                                                className={`live-row${ev.isSuspect ? ' suspect' : ''}`}
                                                onClick={() => ev.personId && navigate(`/recognition/person/${ev.personId}`)}
                                                style={{ animationDelay: `${i * 35}ms` }}
                                            >
                                                {ev.primaryImageBase64 ? (
                                                    <img
                                                        src={`data:image/jpeg;base64,${ev.primaryImageBase64}`}
                                                        alt=""
                                                        style={{
                                                            width: 38,
                                                            height: 38,
                                                            borderRadius: 10,
                                                            objectFit: 'cover',
                                                            border: `2px solid ${scoreColor(ev.score)}`,
                                                            flexShrink: 0,
                                                        }}
                                                    />
                                                ) : (
                                                    <div
                                                        style={{
                                                            width: 38,
                                                            height: 38,
                                                            borderRadius: 10,
                                                            flexShrink: 0,
                                                            background: '#f1f5f9',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                        }}
                                                    >
                                                        <UserOutlined style={{ color: '#94a3b8', fontSize: 14 }} />
                                                    </div>
                                                )}

                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <Text
                                                        strong
                                                        style={{
                                                            fontSize: 12,
                                                            display: 'block',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                    >
                                                        {ev.personFullName} {ev.isSuspect ? '⚠️' : ''}
                                                    </Text>

                                                    <Text style={{ fontSize: 10, color: 'var(--app-muted)' }}>
                                                        {ev.cameraName} · {dayjs(ev.recognitionDateTime).format('HH:mm:ss')}
                                                    </Text>
                                                </div>

                                                <Text
                                                    style={{
                                                        fontSize: 12,
                                                        fontWeight: 800,
                                                        flexShrink: 0,
                                                        color: scoreColor(ev.score),
                                                    }}
                                                >
                                                    {ev.score ? `${Math.round(ev.score * 100)}%` : ''}
                                                </Text>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div
                                    style={{
                                        marginTop: 10,
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        color: '#2563eb',
                                        fontSize: 12,
                                        fontWeight: 700,
                                        paddingTop: 10,
                                        borderTop: '1px solid #eef2f7',
                                    }}
                                    onClick={() => navigate('/recognition/results')}
                                >
                                    عرض كل السجلات ←
                                </div>
                            </div>
                        </div>
                    </Col>
                </Row>

                <div className="surface-card">
                    <div className="surface-head">
                        <Space size={10}>
                            <Title level={4} style={{ margin: 0 }}>
                                التنقل السريع
                            </Title>
                            <RadarChartOutlined style={{ color: '#2563eb' }} />
                        </Space>

                        <Text type="secondary" style={{ fontSize: 12 }}>
                            أهم الصفحات المستخدمة يوميًا
                        </Text>
                    </div>

                    <div className="surface-body">
                        <div className="nav-grid">
                            <NavCard
                                to="/Indexpersons"
                                icon={<TeamOutlined />}
                                label={t('personpage')}
                                color="#2563eb"
                                bg="var(--app-soft-blue)"
                                delay={0}
                            />

                            <NavCard
                                to="/RecognitionPage"
                                icon={<ScanOutlined />}
                                label={t('recognizepage')}
                                color="#7c3aed"
                                bg="var(--app-soft-purple)"
                                delay={50}
                            />

                            <NavCard
                                to="/cameras"
                                icon={<CameraOutlined />}
                                label={t('cameraspage') || 'الكاميرات'}
                                color="#16a34a"
                                bg="var(--app-soft-green)"
                                badge={activeCams}
                                delay={100}
                            />

                            <NavCard
                                to="/recognition/results"
                                icon={<CheckCircleOutlined />}
                                label={t('recognitionresults') || 'سجل التعرف'}
                                color="#0891b2"
                                bg="#ecfeff"
                                badge={todayRecs}
                                delay={150}
                            />

                            {suspects > 0 && (
                                <NavCard
                                    to="/Indexpersons"
                                    icon={<WarningOutlined />}
                                    label="المشتبه بهم"
                                    color="#dc2626"
                                    bg="var(--app-soft-red)"
                                    badge={suspects}
                                    delay={200}
                                />
                            )}

                            <NavCard
                                onClick={openMonitor}
                                icon={<ThunderboltOutlined />}
                                label="المراقبة المباشرة"
                                color="#d97706"
                                bg="var(--app-soft-amber)"
                                delay={250}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Home;
