

import { Carousel, Row, Col, Typography, Badge, Space } from 'antd';
import { useState } from 'react';
import Marquee from 'react-fast-marquee';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../app/store';
import { DataIndexValue } from './Interfaces/functions';
import { useTranslation } from 'react-i18next';
import {
    TeamOutlined, ScanOutlined, CameraOutlined,
    CheckCircleOutlined, WarningOutlined, UserOutlined,
    ThunderboltOutlined, ClockCircleOutlined,
} from '@ant-design/icons';


import { RULES } from './Interfaces/roles';
import { useImage, useNews } from './hooks/useApi';
import { useQuery } from '@tanstack/react-query';
import { getPersons } from './api/personsApi';
import { getCameras } from './api/camerasApi';
import { getRecognitions } from './api/recognitionApi';
import { useSignalRRecognition } from './hooks/useSignalRRecognition';
import dayjs from 'dayjs';

const { Text } = Typography;

const CSS = `
  @keyframes fadeUp   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
  @keyframes livePulse {
    0%,100% { box-shadow:0 0 0 0 rgba(22,163,74,.5); }
    60%      { box-shadow:0 0 0 8px rgba(22,163,74,0); }
  }
  @keyframes slideRight { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:none} }

  /* بطاقات التنقل */
  .home-nav-card {
    background:var(--app-surface); border:1px solid var(--app-border); border-radius:16px;
    padding:22px 16px; text-align:center; cursor:pointer;
    transition:all .25s; position:relative; overflow:hidden;
    animation:fadeUp .4s ease both;
  }
  .home-nav-card::before {
    content:''; position:absolute; top:0; left:0; right:0; height:3px;
    background:linear-gradient(90deg,#2563eb,#7c3aed);
    opacity:0; transition:opacity .25s;
  }
  .home-nav-card:hover {
    border-color:#2563eb44; transform:translateY(-4px);
    box-shadow:0 12px 32px rgba(37,99,235,.14);
  }
  .home-nav-card:hover::before { opacity:1; }
  .home-nav-card .icon-wrap {
    width:56px; height:56px; border-radius:14px; margin:0 auto 12px;
    display:flex; align-items:center; justify-content:center;
    font-size:26px; transition:transform .25s;
  }
  .home-nav-card:hover .icon-wrap { transform:scale(1.12); }

  /* Carousel custom */
  .home-carousel .ant-carousel .slick-slide img {
    width:100%; max-height:320px; object-fit:cover; border-radius:16px;
  }
  .home-carousel .ant-carousel .slick-dots li button { background:#2563eb; }

  /* News ticker */
  .news-ticker-wrap {
    background:linear-gradient(90deg,var(--app-hero-start),var(--app-hero-end));
    border-radius:12px; padding:8px 16px; margin:14px 0;
    display:flex; align-items:center; gap:12;
    overflow:hidden;
  }
  .news-label {
    color:#fff; font-weight:700; font-size:12px; letter-spacing:1px;
    background:#dc2626; padding:2px 10px; border-radius:20px; white-space:nowrap;
    margin-left:12px; flex-shrink:0;
  }
  .news-item {
    color:#e2e8f0; font-size:13px;
    display:inline-flex; align-items:center; gap:20px;
  }
  .news-item .author { color:#93c5fd; font-weight:600; margin-left:6px; }
  .news-sep { color:#3b82f6; margin:0 16px; }

  /* Stat mini */
  .stat-mini {
    background:var(--app-surface); border:1px solid var(--app-border); border-radius:12px;
    padding:10px 14px; display:flex; align-items:center; gap:10;
    animation:fadeUp .35s ease both;
  }

  /* Live event row */
  .live-row { padding:7px 10px; border-radius:10px; transition:background .2s; cursor:pointer; }
  .live-row:hover { background:var(--app-soft-blue); }
`;

const scoreColor = (s?: number) => !s ? '#94a3b8' : s >= 0.8 ? '#16a34a' : s >= 0.6 ? '#d97706' : '#dc2626';

// ── Quick Nav Card ────────────────────────────────────────
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
            style={{
                animationDelay: `${delay}ms`,
                position: 'relative',
                minHeight: 128,
                borderRadius: 18,
                padding: '18px 16px',
                background: 'var(--app-surface)',
                border: '1px solid var(--app-border)',
                boxShadow: 'var(--app-shadow)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'center',
                textAlign: 'center',
                overflow: 'hidden',
            }}
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
                    borderTopLeftRadius: 18,
                    borderTopRightRadius: 18,
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
                    width: 58,
                    height: 58,
                    borderRadius: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px solid ${color}22`,
                    boxShadow: `0 10px 22px ${color}18`,
                    marginTop: 4,
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

// ════════════════════════════════════════════════════════
//  Home Component
// ════════════════════════════════════════════════════════
const Home = () => {
    const { arlang } = useSelector((state: RootState) => state.setting);
    const { t } = useTranslation();
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { userRoles, basicUserInfo } = useSelector((state: RootState) => state.auth.loginResponse);

    const { data: newss = [] } = useNews();
    const { data: Images = [] } = useImage();

    // ── Stats from API ────────────────────────────────────
    const { data: persons = [] } = useQuery({ queryKey: ['persons'], queryFn: () => getPersons({}) });
    const { data: cameras = [] } = useQuery({ queryKey: ['cameras'], queryFn: () => getCameras() });
    const { data: recognitions = [] } = useQuery({
        queryKey: ['recognitions-home'],
        queryFn: () => getRecognitions({ isMatch: true }),
        refetchInterval: 30_000,
    });

    // ── SignalR live ──────────────────────────────────────
    const { events, isConnected } = useSignalRRecognition();

    const activeCams = cameras.filter(c => c.isActive).length;
    const suspects = persons.filter((p: any) => p.hasSuspectRecord).length;
    const todayRecs = recognitions.filter(r =>
        dayjs(r.recognitionDateTime).isAfter(dayjs().startOf('day'))
    ).length;

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'صباح الخير' : hour < 17 ? 'مساء الخير' : 'مساء النور';

    const [openingMonitor, setOpeningMonitor] = useState(false);

    const openMonitor = () => {
        if (openingMonitor) return;

        setOpeningMonitor(true);

        try {
            const resultsWin = window.open('/cameras/results', 'live-results');
            resultsWin?.blur?.();
            window.location.assign('/cameras/monitor');
        } finally {
            window.setTimeout(() => setOpeningMonitor(false), 1000);
        }
    };

    return (
        <>
            <style>{CSS}</style>

            <div style={{ padding: '16px 20px', direction: arlang ? 'rtl' : 'ltr', background: 'var(--app-page-bg)', minHeight: '100vh' }}>

                {/* ════════════════════════════════════════
                    Welcome bar
                ════════════════════════════════════════ */}
                <div style={{
                    background: 'linear-gradient(135deg,var(--app-hero-start) 0%,var(--app-hero-end) 100%)',
                    borderRadius: 16, padding: '14px 22px', marginBottom: 16,
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', flexWrap: 'wrap', gap: 10,
                    boxShadow: '0 4px 16px rgba(37,99,235,.3)',
                    animation: 'fadeUp .3s ease both',
                }}>
                    <div>
                        <Text style={{ color: '#fff', fontWeight: 800, fontSize: 16, display: 'block' }}>
                            {greeting}، {basicUserInfo?.rankName} {basicUserInfo?.userName}
                        </Text>
                        <Text style={{ color: '#93c5fd', fontSize: 12 }}>
                            {dayjs().format('dddd، DD MMMM YYYY')}
                        </Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{
                                width: 10, height: 10, borderRadius: '50%', display: 'inline-block',
                                background: isConnected ? '#22c55e' : '#ef4444',
                                animation: isConnected ? 'livePulse 2s infinite' : 'none',
                            }} />
                            <Text style={{ color: isConnected ? '#86efac' : '#fca5a5', fontSize: 12, fontWeight: 600 }}>
                                {isConnected ? 'نظام المراقبة متصل' : 'منقطع'}
                            </Text>
                        </div>
                        <div style={{
                            background: '#16a34a', borderRadius: 20, padding: '4px 14px',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                        }} onClick={() => {
                            openMonitor();
                        }}>
                            <ThunderboltOutlined style={{ color: '#fff', fontSize: 14 }} />
                            <Text style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>المراقبة المباشرة</Text>
                        </div>
                    </div>
                </div>

                {/* ════════════════════════════════════════
                    Stats row
                ════════════════════════════════════════ */}
                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 10,
                        marginBottom: 16,
                    }}
                >
                    {[
                        { label: 'الأشخاص', value: persons.length, color: '#2563eb', bg: '#eff6ff', icon: <UserOutlined />, delay: 50 },
                        { label: 'كاميرات نشطة', value: `${activeCams}/${cameras.length}`, color: '#16a34a', bg: '#f0fdf4', icon: <CameraOutlined />, delay: 100 },
                        { label: 'تعرفات اليوم', value: todayRecs, color: '#7c3aed', bg: '#faf5ff', icon: <CheckCircleOutlined />, delay: 150 },
                        { label: 'مشتبه بهم', value: suspects, color: '#dc2626', bg: '#fff5f5', icon: <WarningOutlined />, delay: 200 },
                        { label: 'أحداث مباشرة', value: events.length, color: '#d97706', bg: '#fefce8', icon: <ThunderboltOutlined />, delay: 250 },
                    ].map(s => (
                        <div
                            key={s.label}
                            style={{
                                flex: '1 1 180px',
                                minWidth: 180,
                            }}
                        >
                            <div className="stat-mini" style={{ animationDelay: `${s.delay}ms` }}>
                                <div
                                    style={{
                                        width: 38,
                                        height: 38,
                                        borderRadius: 10,
                                        flexShrink: 0,
                                        background: s.bg,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 18,
                                        color: s.color,
                                    }}
                                >
                                    {s.icon}
                                </div>

                                <div>
                                    <div style={{ fontSize: 18, fontWeight: 800, color: s.color, lineHeight: 1 }}>
                                        {s.value}
                                    </div>
                                    <div style={{ fontSize: 10, color: 'var(--app-muted)', marginTop: 2 }}>
                                        {s.label}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ════════════════════════════════════════
                    Main layout: Carousel + Live events
                ════════════════════════════════════════ */}
                <Row gutter={[14, 14]} style={{ marginBottom: 16 }}>

                    {/* Carousel */}
                    <Col xs={24} lg={16}>
                        <div style={{
                            borderRadius: 16, overflow: 'hidden',
                            boxShadow: '0 4px 16px rgba(15,23,42,.08)',
                        }} className="home-carousel">
                            {Images.length > 0 ? (
                                <Carousel autoplay dots effect="fade">
                                    {Images.map(i => (
                                        <div key={i.id}>
                                            <img
                                                src={`${i.imageFileName}`}
                                                alt={i.name}
                                                style={{
                                                    width: '100%', maxHeight: 320,
                                                    objectFit: 'cover', display: 'block',
                                                }}
                                            />
                                        </div>
                                    ))}
                                </Carousel>
                            ) : (
                                <div style={{
                                    height: 300, background: 'linear-gradient(135deg,#1e3a5f,#2563eb)',
                                    display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center', gap: 12,
                                }}>
                                    <CameraOutlined style={{ fontSize: 56, color: '#93c5fd' }} />
                                    <Text style={{ color: '#bfdbfe', fontSize: 16, fontWeight: 600 }}>
                                        نظام التعرف الأمني الذكي
                                    </Text>
                                </div>
                            )}
                        </div>
                    </Col>

                    {/* Live events panel */}
                    <Col xs={24} lg={8}>
                        <div style={{
                            background: 'var(--app-surface)', border: '1px solid var(--app-border)', borderRadius: 16,
                            padding: '14px', height: '100%', display: 'flex', flexDirection: 'column',
                            boxShadow: '0 2px 8px rgba(15,23,42,.05)',
                            animation: 'fadeUp .4s ease .1s both',
                        }}>
                            <div style={{
                                display: 'flex', justifyContent: 'space-between',
                                alignItems: 'center', marginBottom: 12,
                                paddingBottom: 10, borderBottom: '1px solid #f1f5f9',
                            }}>
                                <Space size={8}>
                                    <ThunderboltOutlined style={{ color: '#2563eb', fontSize: 16 }} />
                                    <Text strong style={{ fontSize: 13 }}>أحداث التعرف المباشر</Text>
                                    {events.length > 0 && <Badge count={events.length} size="small" />}
                                </Space>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <span style={{
                                        width: 8, height: 8, borderRadius: '50%', display: 'inline-block',
                                        background: isConnected ? '#22c55e' : '#ef4444',
                                        animation: isConnected ? 'livePulse 1.5s infinite' : 'none',
                                    }} />
                                    <Text style={{ fontSize: 10, color: 'var(--app-muted)' }}>
                                        {isConnected ? 'LIVE' : 'OFF'}
                                    </Text>
                                </div>
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', maxHeight: 250 }}>
                                {events.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '28px 0', color: '#94a3b8' }}>
                                        <CheckCircleOutlined style={{ fontSize: 36, marginBottom: 8, display: 'block' }} />
                                        <Text style={{ color: '#94a3b8', fontSize: 12 }}>
                                            لا توجد أحداث حتى الآن
                                        </Text>
                                    </div>
                                ) : (
                                    events.slice(0, 8).map((ev, i) => (
                                        <div key={ev.recognitionId ?? i}
                                            className="live-row"
                                            onClick={() => ev.personId && navigate(`/recognition/person/${ev.personId}`)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 8,
                                                marginBottom: 2, animationDelay: `${i * 40}ms`,
                                                animation: 'slideRight .3s ease both',
                                                border: ev.isSuspect ? '1px solid #fca5a5' : '1px solid transparent',
                                                borderRadius: 10,
                                                background: ev.isSuspect ? '#fff5f5' : 'transparent',
                                            }}>
                                            {ev.primaryImageBase64 ? (
                                                <img src={`data:image/jpeg;base64,${ev.primaryImageBase64}`} alt=""
                                                    style={{
                                                        width: 36, height: 36, borderRadius: 8, objectFit: 'cover',
                                                        border: `2px solid ${scoreColor(ev.score)}`, flexShrink: 0
                                                    }} />
                                            ) : (
                                                <div style={{
                                                    width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                                                    background: '#f1f5f9', display: 'flex',
                                                    alignItems: 'center', justifyContent: 'center',
                                                }}>
                                                    <UserOutlined style={{ color: '#94a3b8', fontSize: 14 }} />
                                                </div>
                                            )}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <Text strong style={{
                                                    fontSize: 12, display: 'block',
                                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                                }}>
                                                    {ev.personFullName} {ev.isSuspect ? '⚠️' : ''}
                                                </Text>
                                                <Text style={{ fontSize: 10, color: 'var(--app-muted)' }}>
                                                    {ev.cameraName} · {dayjs(ev.recognitionDateTime).format('HH:mm:ss')}
                                                </Text>
                                            </div>
                                            <Text style={{
                                                fontSize: 12, fontWeight: 700, flexShrink: 0,
                                                color: scoreColor(ev.score)
                                            }}>
                                                {ev.score ? `${Math.round(ev.score * 100)}%` : ''}
                                            </Text>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div
                                style={{
                                    marginTop: 10, textAlign: 'center', cursor: 'pointer',
                                    color: '#2563eb', fontSize: 12, fontWeight: 600,
                                    paddingTop: 8, borderTop: '1px solid #f1f5f9'
                                }}
                                onClick={() => navigate('/recognition/results')}
                            >
                                عرض كل السجلات ←
                            </div>
                        </div>
                    </Col>
                </Row>

                {/* ════════════════════════════════════════
                    News Ticker (المشوار)
                ════════════════════════════════════════ */}
                {newss?.some(n => n.can) && (
                    <div className="news-ticker-wrap" style={{ marginBottom: 16 }}>
                        <span className="news-label">أخبار</span>
                        <Marquee
                            speed={55}
                            gradient={false}
                            pauseOnHover={true}
                            direction={arlang ? 'right' : 'left'}
                            style={{ flex: 1 }}
                        >
                            {newss.map(i => i.can ? (
                                <span key={i.id} className="news-item">
                                    <span className="author">{DataIndexValue(arlang, 'applicationUserId', i)}</span>
                                    {DataIndexValue(arlang, 'details', i)}
                                    <img src="/Raj1.png" alt="" style={{ height: 18, marginRight: 6, verticalAlign: 'middle' }} />
                                    <span className="news-sep">◆</span>
                                </span>
                            ) : null)}
                        </Marquee>
                    </div>
                )}

                {/* ════════════════════════════════════════
                    Quick Navigation Cards
                ════════════════════════════════════════ */}
                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 16,
                    }}
                >
                    <div style={{ flex: '1 1 180px', minWidth: 180 }}>
                        <NavCard
                            to="/Indexpersons"
                            icon={<TeamOutlined />}
                            label={t('personpage')}
                            color="#2563eb"
                            bg="var(--app-soft-blue)"
                            delay={0}
                        />
                    </div>

                    <div style={{ flex: '1 1 180px', minWidth: 180 }}>
                        <NavCard
                            to="/RecognitionPage"
                            icon={<ScanOutlined />}
                            label={t('recognizepage')}
                            color="#7c3aed"
                            bg="var(--app-soft-purple)"
                            delay={50}
                        />
                    </div>

                    <div style={{ flex: '1 1 180px', minWidth: 180 }}>
                        <NavCard
                            to="/cameras"
                            icon={<CameraOutlined />}
                            label={t('cameraspage') || 'الكاميرات'}
                            color="#16a34a"
                            bg="var(--app-soft-green)"
                            badge={activeCams}
                            delay={100}
                        />
                    </div>

                    <div style={{ flex: '1 1 180px', minWidth: 180 }}>
                        <NavCard
                            to="/recognition/results"
                            icon={<CheckCircleOutlined />}
                            label={t('recognitionresults') || 'سجل التعرف'}
                            color="#0891b2"
                            bg="#ecfeff"
                            badge={todayRecs}
                            delay={150}
                        />
                    </div>

                    {suspects > 0 && (
                        <div style={{ flex: '1 1 180px', minWidth: 180 }}>
                            <NavCard
                                to="/Indexpersons"
                                icon={<WarningOutlined />}
                                label="المشتبه بهم"
                                color="#dc2626"
                                bg="var(--app-soft-red)"
                                badge={suspects}
                                delay={200}
                            />
                        </div>
                    )}

                    <div style={{ flex: '1 1 180px', minWidth: 180 }}>
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
        </>
    );
};

export default Home;