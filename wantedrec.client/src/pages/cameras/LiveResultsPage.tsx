import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Typography, Space, Badge, Button, Tag, Input,
    Select, Row, Col,
} from 'antd';
import {
    CheckCircleOutlined, UserOutlined, VideoCameraOutlined, SearchOutlined,
    ThunderboltOutlined, ReloadOutlined, ClockCircleOutlined,
    WifiOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useRecognitions } from '../../hooks/useRecognitions';
import { useSignalRRecognition } from '../../hooks/useSignalRRecognition';
import { getRecognitions } from '../../api/recognitionApi';
import { BASIC_URL } from '../../api';
import { RecognitionStatus, RecognitionStatusLabel } from '../../types/camera.types';
import type { RecognitionDto } from '../../types/camera.types';
import type { LiveRecognitionEvent } from '../../hooks/useSignalRRecognition';

const { Text } = Typography;
const CSS = `
  @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes slideIn  { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:none} }
  @keyframes suspectPulse {
    0%,100% { box-shadow:0 0 0 0 rgba(220,38,38,.5); }
    50%      { box-shadow:0 0 0 10px rgba(220,38,38,0); }
  }
  .live-chip {
    display:flex; align-items:center; gap:10px; padding:10px 12px;
    background:var(--app-surface); border:1px solid var(--app-border); border-radius:12px;
    cursor:pointer; transition:all .18s; animation:slideIn .25s ease both;
  }
  .live-chip:hover { border-color:#2563eb44; box-shadow:0 4px 12px rgba(37,99,235,.1); transform:translateY(-1px); }
  .live-chip.suspect { border-color:#fca5a5; background:var(--app-soft-red); animation:suspectPulse 2s infinite; }
  .db-row {
    display:flex; align-items:center; gap:10px; padding:10px 12px;
    background:var(--app-surface); border:1px solid var(--app-border); border-radius:12px;
    cursor:pointer; transition:all .18s; margin-bottom:6px;
  }
  .db-row:hover { border-color:#2563eb33; background:var(--app-soft-blue); }
`;
const scoreColor = (s?: number) =>
    !s ? '#94a3b8' : s >= 0.8 ? '#16a34a' : s >= 0.6 ? '#d97706' : '#dc2626';

const buildUrl = (p: string) => `${BASIC_URL.replace(/\/api\/?$/, '')}/${p}`;

function normalizeText(v?: string | null) {
    return String(v ?? '').trim().toLowerCase();
}

// ── ScoreBar ────────────────────────────────────────────
function ScoreBar({ score }: { score?: number }) {
    if (!score) return null;

    const pct = Math.round(score * 100);
    const color = scoreColor(score);

    return (
        <div style={{ width: 80 }}>
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

// ── Live Event Chip ──────────────────────────────────────
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
                        borderRadius: 8,
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
                        borderRadius: 8,
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
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

// ── DB Row ───────────────────────────────────────────────
function DbRow({ rec }: { rec: RecognitionDto }) {
    const navigate = useNavigate();

    return (
        <div
            className="db-row"
            onClick={() => rec.personId && navigate(`/recognition/person/${rec.personId}`)}
        >
            {rec.snapshotPath ? (
                <img
                    src={buildUrl(rec.snapshotPath)}
                    alt=""
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
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
                        borderRadius: 8,
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

// ════════════════════════════════════════════════════════
//  LiveResultsPage
// ════════════════════════════════════════════════════════
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
                        .filter(r => r.cameraId !== undefined && r.cameraId !== null)
                        .map(r => [
                            r.cameraId!,
                            {
                                value: r.cameraId!,
                                label: r.cameraName?.trim() || `كاميرا #${r.cameraId}`,
                            },
                        ])
                ).values()
            ).sort((a, b) => a.label.localeCompare(b.label, 'ar')),
        [recognitionCameraSource]
    );
    const filteredDB = useMemo(() => {
        const q = normalizeText(search);

        return recognitions.filter(r => {
            const matchesSearch =
                !q ||
                normalizeText(r.personFullName).includes(q) ||
                normalizeText(r.cameraName).includes(q);

            const matchesCamera =
                !filters.cameraId || r.cameraId === filters.cameraId;

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
            <style>{CSS}</style>

            <div style={{ background: 'var(--app-page-bg)', minHeight: '100vh', direction: 'rtl' }}>
                <div
                    style={{
                        background: 'linear-gradient(135deg,var(--app-hero-start),var(--app-hero-end))',
                        padding: '10px 20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 10,
                    }}
                >
                    <Space size={12} align="center">
                        <div
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: 9,
                                background: 'linear-gradient(135deg,#16a34a,#059669)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <CheckCircleOutlined style={{ color: '#fff', fontSize: 18 }} />
                        </div>

                        <div>
                            <Text style={{ color: '#fff', fontWeight: 700, fontSize: 14, display: 'block' }}>
                                نتائج التعرف المباشر
                            </Text>
                            <Text style={{ color: '#dbeafe', fontSize: 11 }}>
                                SignalR مباشر + سجل قاعدة البيانات لكل الأجهزة
                            </Text>
                        </div>
                    </Space>

                    <Space size={10} wrap>
                        {[
                            { label: 'أحداث مباشرة', value: events.length, color: '#22c55e' },
                            { label: 'سجل DB', value: recognitions.length, color: '#60a5fa' },
                            { label: 'متوسط الدقة', value: `${Math.round(stats.avgScore * 100)}%`, color: '#a78bfa' },
                        ].map(s => (
                            <div
                                key={s.label}
                                style={{
                                    background: 'var(--app-surface-2)',
                                    border: '1px solid var(--app-border)',
                                    borderRadius: 8,
                                    padding: '4px 12px',
                                    textAlign: 'center',
                                }}
                            >
                                <div style={{ fontSize: 15, fontWeight: 700, color: s.color }}>{s.value}</div>
                                <div style={{ fontSize: 10, color: 'var(--app-muted)' }}>{s.label}</div>
                            </div>
                        ))}

                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    display: 'inline-block',
                                    background: isConnected ? '#22c55e' : '#ef4444',
                                    animation: isConnected ? 'pulse 1.5s infinite' : 'none',
                                }}
                            />
                            <Text
                                style={{
                                    color: isConnected ? '#22c55e' : '#ef4444',
                                    fontWeight: 700,
                                    fontSize: 12,
                                }}
                            >
                                {isConnected ? 'LIVE' : 'OFF'}
                            </Text>
                        </div>

                        <Button
                            size="small"
                            icon={<ReloadOutlined spin={isFetching} />}
                            onClick={refreshAll}
                            style={{ borderRadius: 7 }}
                        />
                    </Space>
                </div>

                <div
                    style={{
                        background: 'var(--app-surface)',
                        borderBottom: '1px solid var(--app-border)',
                        padding: '10px 20px',
                        display: 'flex',
                        gap: 10,
                        alignItems: 'center',
                        flexWrap: 'wrap',
                    }}
                >
                    <Input
                        prefix={<SearchOutlined style={{ color: 'var(--app-muted)' }} />}
                        placeholder="بحث بالاسم أو الكاميرا…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ width: 220, borderRadius: 9 }}
                        allowClear
                    />

                    <Select
                        placeholder="الكاميرا"
                        allowClear
                        style={{ width: 160 }}
                        onChange={v => updateFilter({ cameraId: v })}
                        options={cameraOptions}
                    />

                    <Select
                        placeholder="الحالة"
                        allowClear
                        style={{ width: 140 }}
                        onChange={v => updateFilter({ status: v })}
                        options={[0, 1, 2, 3].map(v => ({ value: v, label: RecognitionStatusLabel[v] }))}
                    />

                    {(filters.cameraId || filters.status !== undefined || search) && (
                        <Button
                            size="small"
                            onClick={() => {
                                clearFilters();
                                setSearch('');
                            }}
                            style={{ borderRadius: 7 }}
                        >
                            مسح
                        </Button>
                    )}

                    <Text type="secondary" style={{ fontSize: 12, marginRight: 'auto' }}>
                        {filteredDB.length} سجل
                    </Text>
                </div>

                <div style={{ padding: '14px 20px' }}>
                    <Row gutter={[14, 14]}>
                        <Col xs={24} lg={12}>
                            <div
                                style={{
                                    background: 'var(--app-surface)',
                                    border: '1px solid var(--app-border)',
                                    borderRadius: 14,
                                    overflow: 'hidden',
                                    boxShadow: '0 2px 8px rgba(15,23,42,.06)',
                                }}
                            >
                                <div
                                    style={{
                                        padding: '12px 16px',
                                        background: 'linear-gradient(90deg,var(--app-hero-start),var(--app-hero-end))',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
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
                                                style={{ borderRadius: 7, fontSize: 11, height: 24 }}
                                            >
                                                مسح
                                            </Button>
                                        )}
                                    </Space>
                                </div>

                                <div
                                    style={{
                                        padding: '10px',
                                        maxHeight: 480,
                                        overflowY: 'auto',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 6,
                                    }}
                                >
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
                        </Col>

                        <Col xs={24} lg={12}>
                            <div
                                style={{
                                    background: 'var(--app-surface)',
                                    border: '1px solid var(--app-border)',
                                    borderRadius: 14,
                                    overflow: 'hidden',
                                    boxShadow: '0 2px 8px rgba(15,23,42,.06)',
                                }}
                            >
                                <div
                                    style={{
                                        padding: '12px 16px',
                                        borderBottom: '1px solid #f1f5f9',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
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

                                <div style={{ padding: '10px', maxHeight: 480, overflowY: 'auto' }}>
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
                                        filteredDB.slice(0, 50).map(rec => (
                                            <DbRow key={rec.recognitionId} rec={rec} />
                                        ))
                                    )}
                                </div>
                            </div>
                        </Col>
                    </Row>
                </div>
            </div>
        </>
    );
}