import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Typography,
    Space,
    Badge,
    Button,
    Tag,
    Input,
    Select,
    Alert,
    Avatar,
    Card,
} from 'antd';
import {
    CheckCircleOutlined,
    UserOutlined,
    VideoCameraOutlined,
    SearchOutlined,
    ThunderboltOutlined,
    ReloadOutlined,
    ClockCircleOutlined,
    WifiOutlined,
    RadarChartOutlined,
    RiseOutlined,
    DatabaseOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useRecognitions } from '../../hooks/useRecognitions';
import { useSignalRRecognition } from '../../hooks/useSignalRRecognition';
import { getRecognitions } from '../../api/recognitionApi';
import { RecognitionStatus, RecognitionStatusLabel } from '../../types/camera.types';
import type { RecognitionDto } from '../../types/camera.types';
import type { LiveRecognitionEvent } from '../../hooks/useSignalRRecognition';
import { buildImgUrl } from '../../Interfaces/functions';

const { Text, Title } = Typography;



const scoreColor = (s?: number) =>
    !s ? '#94a3b8' : s >= 0.8 ? '#16a34a' : s >= 0.6 ? '#d97706' : '#dc2626';

function normalizeText(v?: string | null) {
    return String(v ?? '').trim().toLowerCase();
}

function ScoreBar({ score }: { score?: number }) {
    if (!score) return null;

    const pct = Math.round(score * 100);
    const color = scoreColor(score);

    return (
        <div style={{ width: 84 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <Text style={{ fontSize: 10, color: 'var(--app-muted)' }}>
                    {pct >= 80 ? 'عالي' : pct >= 60 ? 'متوسط' : 'منخفض'}
                </Text>
                <Text style={{ fontSize: 11, fontWeight: 700, color }}>{pct}%</Text>
            </div>
            <div
                style={{
                    height: 4,
                    background: 'var(--app-surface-2)',
                    borderRadius: 99,
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        height: '100%',
                        width: `${pct}%`,
                        borderRadius: 99,
                        background: `linear-gradient(90deg,${color}88,${color})`,
                    }}
                />
            </div>
        </div>
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
                <div style={{ fontSize: 22, lineHeight: 1, fontWeight: 900, color }}>{value}</div>
                <div style={{ fontSize: 11, color: 'var(--app-muted)', marginTop: 6 }}>{label}</div>
            </div>

            <div className="stat-icon" style={{ background: bg, borderColor: border, color }}>
                {icon}
            </div>
        </div>
    );
}

function LiveChip({ ev, delay = 0 }: { ev: LiveRecognitionEvent; delay?: number }) {
    const navigate = useNavigate();

    return (
        <div
            className={`live-chip${ev.isSuspect ? ' suspect' : ''}`}
            style={{ animationDelay: `${delay}ms` }}
            onClick={() => ev.personId && navigate(`/recognition/person/${ev.personId}`)}
        >
            {ev.primaryImageBase64 ? (
                <img
                    src={`data:image/jpeg;base64,${ev.primaryImageBase64}`}
                    alt=""
                    style={{
                        width: 42,
                        height: 42,
                        borderRadius: 10,
                        objectFit: 'cover',
                        flexShrink: 0,
                        border: `2px solid ${scoreColor(ev.score)}`,
                    }}
                />
            ) : (
                <div
                    style={{
                        width: 42,
                        height: 42,
                        borderRadius: 10,
                        flexShrink: 0,
                        background: 'var(--app-surface-2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <UserOutlined style={{ color: 'var(--app-muted)', fontSize: 18 }} />
                </div>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                    <Text
                        strong
                        style={{
                            fontSize: 13,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {ev.personFullName ?? '—'}
                    </Text>

                    {ev.isSuspect && <span style={{ fontSize: 13 }}>⚠️</span>}

                    <span
                        style={{
                            fontSize: 9,
                            fontWeight: 700,
                            color: '#16a34a',
                            background: '#dcfce7',
                            padding: '1px 6px',
                            borderRadius: 20,
                            border: '1px solid #bbf7d0',
                            flexShrink: 0,
                        }}
                    >
                        LIVE
                    </span>
                </div>

                <Text style={{ fontSize: 11, color: 'var(--app-muted)' }}>
                    <VideoCameraOutlined style={{ marginLeft: 3, fontSize: 10 }} />
                    {ev.cameraName ?? '—'} · {dayjs(ev.recognitionDateTime).format('HH:mm:ss')}
                </Text>
            </div>

            <ScoreBar score={ev.score} />
        </div>
    );
}

function DbRow({ rec }: { rec: RecognitionDto }) {
    const navigate = useNavigate();

    return (
        <div
            className="db-row"
            onClick={() => rec.personId && navigate(`/recognition/person/${rec.personId}`)}
        >
            {rec.snapshotPath ? (
                <img
                    src={buildImgUrl(rec.snapshotPath)}
                    alt=""
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        objectFit: 'cover',
                        flexShrink: 0,
                        border: `2px solid ${scoreColor(rec.recognitionScore)}`,
                    }}
                />
            ) : (
                <div
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        flexShrink: 0,
                        background: 'var(--app-surface-2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <UserOutlined style={{ color: 'var(--app-muted)', fontSize: 16 }} />
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
                    {rec.personFullName ?? '—'}
                </Text>
                <Text style={{ fontSize: 11, color: 'var(--app-muted)' }}>
                    <VideoCameraOutlined style={{ marginLeft: 3, fontSize: 10 }} />
                    {rec.cameraName ?? '—'} · {dayjs(rec.recognitionDateTime).format('HH:mm:ss')}
                </Text>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                <ScoreBar score={rec.recognitionScore} />
                <Tag
                    color={
                        rec.recognitionStatus === RecognitionStatus.Confirmed
                            ? 'success'
                            : rec.recognitionStatus === RecognitionStatus.Pending
                                ? 'warning'
                                : 'default'
                    }
                    style={{ fontSize: 10, margin: 0 }}
                >
                    {RecognitionStatusLabel[rec.recognitionStatus]}
                </Tag>
            </div>
        </div>
    );
}

export default function LiveResultsPage() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');

    const { events, isConnected, clearEvents } = useSignalRRecognition();

    const {
        recognitions,
        isLoading,
        isFetching,
        refetch,
        filters,
        updateFilter,
        clearFilters,
        stats,
    } = useRecognitions({ isMatch: true });

    const { data: recognitionCameraSource = [] } = useQuery<RecognitionDto[]>({
        queryKey: ['recognitions-camera-options'],
        queryFn: () => getRecognitions({ isMatch: true, pageSize: 500 }),
        staleTime: 60_000,
        refetchInterval: 60_000,
    });

    const cameraOptions = useMemo(
        () =>
            Array.from(
                new Map(
                    recognitionCameraSource
                        .filter((r) => r.cameraId !== undefined && r.cameraId !== null)
                        .map((r) => [
                            r.cameraId!,
                            {
                                value: r.cameraId!,
                                label: r.cameraName?.trim() || `كاميرا #${r.cameraId}`,
                            },
                        ]),
                ).values(),
            ).sort((a, b) => a.label.localeCompare(b.label, 'ar')),
        [recognitionCameraSource],
    );

    const filteredDB = useMemo(() => {
        const q = normalizeText(search);

        return recognitions.filter((r) => {
            const matchesSearch =
                !q ||
                normalizeText(r.personFullName).includes(q) ||
                normalizeText(r.cameraName).includes(q);

            const matchesCamera = !filters.cameraId || r.cameraId === filters.cameraId;
            const matchesStatus =
                filters.status === undefined || r.recognitionStatus === filters.status;

            return matchesSearch && matchesCamera && matchesStatus;
        });
    }, [recognitions, search, filters.cameraId, filters.status]);

    const refreshAll = () => {
        refetch();
    };

    return (
        <>
    

            <div className="results-shell">
                <div className="results-hero">
                    <div className="results-hero-inner">
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                            <div className="hero-badge">
                                <CheckCircleOutlined style={{ fontSize: 28, color: '#fff' }} />
                            </div>

                            <div>
                                <Title level={2} style={{ margin: 0, color: '#fff', fontWeight: 900 }}>
                                    نتائج التعرف المباشر
                                </Title>
                                <Text style={{ color: 'rgba(255,255,255,.86)', fontSize: 13 }}>
                                    SignalR مباشر مع سجل قاعدة البيانات لكل الأجهزة والبحث الفوري.
                                </Text>
                            </div>
                        </div>

                        <div className="hero-actions">
                            <Button className="hero-btn" icon={<DatabaseOutlined />} onClick={() => navigate('/recognition/results')}>
                                السجل الكامل
                            </Button>
                            <Button className="hero-btn" icon={<ReloadOutlined spin={isFetching} />} onClick={refreshAll}>
                                تحديث
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="stats-strip">
                    <div className="stat-wrap">
                        <StatCard label="أحداث مباشرة" value={events.length} color="#22c55e" bg="#f0fdf4" border="#bbf7d0" icon={<ThunderboltOutlined />} />
                    </div>
                    <div className="stat-wrap">
                        <StatCard label="سجل DB" value={recognitions.length} color="#2563eb" bg="#eff6ff" border="#bfdbfe" icon={<DatabaseOutlined />} />
                    </div>
                    <div className="stat-wrap">
                        <StatCard label="متوسط الدقة" value={`${Math.round(stats.avgScore * 100)}%`} color="#a78bfa" bg="#faf5ff" border="#ddd6fe" icon={<RiseOutlined />} />
                    </div>
                    <div className="stat-wrap">
                        <StatCard label="الاتصال" value={isConnected ? 'LIVE' : 'OFF'} color={isConnected ? '#16a34a' : '#dc2626'} bg={isConnected ? '#f0fdf4' : '#fff5f5'} border={isConnected ? '#bbf7d0' : '#fecaca'} icon={<WifiOutlined />} />
                    </div>
                </div>

                <div className="surface-card" style={{ marginBottom: 18 }}>
                    <div className="surface-head">
                        <Space size={10}>
                            <Title level={4} style={{ margin: 0 }}>
                                الفلاتر والتحكم
                            </Title>
                            <RadarChartOutlined style={{ color: '#2563eb' }} />
                        </Space>

                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {filteredDB.length} سجل بعد التصفية
                        </Text>
                    </div>

                    <div className="surface-body">
                        <div className="filter-row">
                            <div className="filter-item search">
                                <Input
                                    prefix={<SearchOutlined style={{ color: 'var(--app-muted)' }} />}
                                    placeholder="بحث بالاسم أو الكاميرا…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    allowClear
                                />
                            </div>

                            <div className="filter-item">
                                <Select
                                    placeholder="الكاميرا"
                                    allowClear
                                    onChange={(v) => updateFilter({ cameraId: v })}
                                    options={cameraOptions}
                                />
                            </div>

                            <div className="filter-item">
                                <Select
                                    placeholder="الحالة"
                                    allowClear
                                    onChange={(v) => updateFilter({ status: v })}
                                    options={[0, 1, 2, 3].map((v) => ({ value: v, label: RecognitionStatusLabel[v] }))}
                                />
                            </div>

                            {(filters.cameraId || filters.status !== undefined || search) && (
                                <div className="filter-item" style={{ flex: '0 0 120px', minWidth: 120 }}>
                                    <Button
                                        onClick={() => {
                                            clearFilters();
                                            setSearch('');
                                        }}
                                        block
                                    >
                                        مسح
                                    </Button>
                                </div>
                            )}

                            <div className="filter-item" style={{ flex: '0 0 180px', minWidth: 180 }}>
                                <Alert
                                    type={isConnected ? 'success' : 'warning'}
                                    showIcon
                                    message={isConnected ? 'متصل الآن' : 'الاتصال منقطع'}
                                    style={{ borderRadius: 12, padding: '7px 10px' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="dual-grid">
                    <div className="surface-card live-panel">
                        <div
                            className="surface-head"
                            style={{
                                background: 'linear-gradient(90deg,var(--app-hero-start),var(--app-hero-end))',
                                color: '#fff',
                            }}
                        >
                            <Space size={8}>
                                <ThunderboltOutlined style={{ color: '#22c55e', fontSize: 16 }} />
                                <Text style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>
                                    أحداث مباشرة
                                </Text>
                                {events.length > 0 && <Badge count={events.length} />}
                            </Space>

                            <Space>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <WifiOutlined style={{ color: isConnected ? '#22c55e' : '#ef4444', fontSize: 12 }} />
                                    <Text style={{ color: isConnected ? '#22c55e' : '#ef4444', fontSize: 11 }}>
                                        {isConnected ? 'متصل' : 'منقطع'}
                                    </Text>
                                </div>

                                {events.length > 0 && (
                                    <Button
                                        size="small"
                                        onClick={clearEvents}
                                        style={{ borderRadius: 7, fontSize: 11, height: 26 }}
                                    >
                                        مسح
                                    </Button>
                                )}
                            </Space>
                        </div>

                        <div className="panel-list">
                            {events.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--app-muted)' }}>
                                    <ThunderboltOutlined style={{ fontSize: 40, marginBottom: 10, display: 'block' }} />
                                    <Text style={{ color: 'var(--app-muted)', fontSize: 13 }}>
                                        في انتظار أحداث التعرف…
                                    </Text>
                                    <br />
                                    <Text style={{ color: 'var(--app-muted)', fontSize: 11 }}>
                                        ستظهر الأحداث هنا فور اكتشافها عبر الكاميرات
                                    </Text>
                                </div>
                            ) : (
                                events.map((ev, i) => (
                                    <LiveChip
                                        key={`${ev.recognitionId ?? 'evt'}-${i}-${ev.recognitionDateTime}`}
                                        ev={ev}
                                        delay={i * 20}
                                    />
                                ))
                            )}
                        </div>
                    </div>

                    <div className="surface-card db-panel">
                        <div className="surface-head">
                            <Space size={8}>
                                <ClockCircleOutlined style={{ color: '#2563eb', fontSize: 16 }} />
                                <Text style={{ fontWeight: 700, fontSize: 14 }}>
                                    سجل قاعدة البيانات
                                </Text>
                            </Space>

                            <Space>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    {filteredDB.length} نتيجة
                                </Text>
                                <Button
                                    size="small"
                                    type="link"
                                    onClick={() => navigate('/recognition/results')}
                                    style={{ padding: 0, fontSize: 11 }}
                                >
                                    الكل ←
                                </Button>
                            </Space>
                        </div>

                        <div className="panel-list">
                            {isLoading ? (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--app-muted)' }}>
                                    <ReloadOutlined spin style={{ fontSize: 32, marginBottom: 10, display: 'block' }} />
                                    <Text style={{ color: 'var(--app-muted)' }}>جاري التحميل…</Text>
                                </div>
                            ) : filteredDB.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--app-muted)' }}>
                                    <CheckCircleOutlined
                                        style={{
                                            fontSize: 40,
                                            marginBottom: 10,
                                            display: 'block',
                                            color: '#bbf7d0',
                                        }}
                                    />
                                    <Text style={{ color: 'var(--app-muted)', fontSize: 13 }}>لا توجد سجلات</Text>
                                </div>
                            ) : (
                                filteredDB.slice(0, 50).map((rec) => (
                                    <DbRow key={rec.recognitionId} rec={rec} />
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
