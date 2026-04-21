// ═══════════════════════════════════════════════════════
//  src/pages/cameras/LiveResultsPage.tsx
//  Route: /cameras/results  — تاب 2: نتائج التعرف المباشر
// ═══════════════════════════════════════════════════════
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Typography, Space, Badge, Button, Tag, Input, Tooltip, Select, Empty } from 'antd';
import {
    CheckCircleOutlined, WarningOutlined, EyeOutlined,
    UserOutlined, VideoCameraOutlined, SearchOutlined,
    ThunderboltOutlined, ReloadOutlined, BellOutlined,
    ClockCircleOutlined, BarChartOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useRecognitions } from '../../hooks/useRecognitions';
import { getCameras } from '../../api/camerasApi';
import { BASIC_URL } from '../../api';
import { RecognitionStatus, RecognitionStatusLabel } from '../../types/camera.types';
import type { RecognitionDto } from '../../types/camera.types';

const { Text, Title } = Typography;

const CSS = `
  @keyframes pulse {
    0%,100% { opacity:1; }
    50%      { opacity:.4; }
  }
  @keyframes slideIn {
    from { opacity:0; transform:translateX(20px); }
    to   { opacity:1; transform:translateX(0); }
  }
  @keyframes suspectPulse {
    0%,100% { box-shadow:0 0 0 0 rgba(220,38,38,.5); }
    50%      { box-shadow:0 0 0 12px rgba(220,38,38,0); }
  }
  .person-card {
    background:#fff; border:1px solid #e4e9f2; border-radius:14px;
    padding:16px; cursor:pointer; transition:all .2s;
    animation: slideIn .3s ease both;
  }
  .person-card:hover {
    border-color:#2563eb44; transform:translateY(-2px);
    box-shadow:0 8px 24px rgba(37,99,235,.12);
  }
  .person-card.suspect {
    border-color:#fca5a5; background:linear-gradient(135deg,#fff5f5,#fff);
    animation:suspectPulse 2s infinite;
  }
`;

const scoreColor = (s?: number) =>
    !s ? '#94a3b8' : s >= 0.8 ? '#16a34a' : s >= 0.6 ? '#d97706' : '#dc2626';

const buildUrl = (p: string) => `${BASIC_URL.replace(/\/api\/?$/, '')}/${p}`;

// ── ScoreMeter ────────────────────────────────────────────
function ScoreMeter({ score }: { score: number }) {
    const pct = Math.round(score * 100);
    const color = scoreColor(score);
    return (
        <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <Text style={{ fontSize: 10, color: '#64748b' }}>
                    {pct >= 80 ? 'تطابق عالي' : pct >= 60 ? 'تطابق متوسط' : 'تطابق منخفض'}
                </Text>
                <Text style={{ fontSize: 12, fontWeight: 700, color }}>{pct}%</Text>
            </div>
            <div style={{ height: 5, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                    height: '100%', width: `${pct}%`, borderRadius: 99,
                    background: `linear-gradient(90deg,${color}88,${color})`,
                    transition: 'width .5s ease',
                }} />
            </div>
        </div>
    );
}

// ── PersonCard ────────────────────────────────────────────
function PersonCard({ rec, delay = 0 }: { rec: RecognitionDto; delay?: number }) {
    const navigate = useNavigate();

    return (
        <div
            className={`person-card${rec.personId ? '' : ''}`}
            style={{ animationDelay: `${delay}ms` }}
            onClick={() => rec.personId && navigate(`/recognition/person/${rec.personId}`)}
        >
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                {/* Photo */}
                <div style={{ flexShrink: 0, position: 'relative' }}>
                    {rec.snapshotPath ? (
                        <img src={buildUrl(rec.snapshotPath)} alt=""
                             style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover',
                                      border: `3px solid ${scoreColor(rec.recognitionScore)}` }} />
                    ) : (
                        <div style={{
                            width: 64, height: 64, borderRadius: 12,
                            background: '#f1f5f9', border: '1px solid #e4e9f2',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <UserOutlined style={{ fontSize: 28, color: '#94a3b8' }} />
                        </div>
                    )}
                    {/* Status dot */}
                    <span style={{
                        position: 'absolute', bottom: -2, right: -2,
                        width: 14, height: 14, borderRadius: '50%',
                        background: rec.recognitionStatus === RecognitionStatus.Confirmed ? '#16a34a'
                                  : rec.recognitionStatus === RecognitionStatus.Pending  ? '#d97706' : '#94a3b8',
                        border: '2px solid #fff',
                    }} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                        <Text strong style={{ fontSize: 13, color: '#0f172a', display: 'block',
                                             overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {rec.personFullName ?? 'غير معروف'}
                        </Text>
                        <Tooltip title="عرض سجل التعرف">
                            <Button size="small" icon={<EyeOutlined />} type="link"
                                    onClick={e => { e.stopPropagation(); rec.personId && navigate(`/recognition/person/${rec.personId}`); }}
                                    style={{ padding: 0, height: 'auto', color: '#2563eb' }} />
                        </Tooltip>
                    </div>

                    {/* Camera + Time */}
                    <div style={{ display: 'flex', gap: 10, marginBottom: 6 }}>
                        {rec.cameraName && (
                            <span style={{ fontSize: 10, color: '#64748b', display: 'flex', alignItems: 'center', gap: 3 }}>
                                <VideoCameraOutlined style={{ fontSize: 10 }} />
                                {rec.cameraName}
                            </span>
                        )}
                        <span style={{ fontSize: 10, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <ClockCircleOutlined style={{ fontSize: 10 }} />
                            {dayjs(rec.recognitionDateTime).format('HH:mm:ss')}
                        </span>
                    </div>

                    {/* Score */}
                    {rec.recognitionScore !== undefined && (
                        <ScoreMeter score={rec.recognitionScore} />
                    )}
                </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                <Tag color={
                    rec.recognitionStatus === RecognitionStatus.Confirmed ? 'success'
                  : rec.recognitionStatus === RecognitionStatus.Pending   ? 'warning' : 'default'
                } style={{ fontSize: 10, margin: 0 }}>
                    {RecognitionStatusLabel[rec.recognitionStatus]}
                </Tag>
                <Text style={{ fontSize: 10, color: '#94a3b8' }}>
                    {dayjs(rec.recognitionDateTime).format('YYYY/MM/DD')}
                </Text>
            </div>
        </div>
    );
}

// ── LiveResultsPage ───────────────────────────────────────
export default function LiveResultsPage() {
    const navigate = useNavigate();
    const { recognitions, isLoading, isFetching, refetch, filters, updateFilter, clearFilters, stats } = useRecognitions({ isMatch: true });
    const { data: cameras = [] } = useQuery({ queryKey: ['cameras'], queryFn: getCameras });
    const [search, setSearch] = useState('');
    const audioRef = useRef<AudioContext | null>(null);

    const filtered = recognitions.filter(r =>
        !search || r.personFullName?.includes(search) || r.cameraName?.includes(search),
    );

    // تنبيه صوتي لو في مشتبه به
    const hasSuspect = filtered.some(r => r.personId); // placeholder
    useEffect(() => {
        // يمكن إضافة صوت تنبيه هنا
    }, [hasSuspect]);

    return (
        <>
            <style>{CSS}</style>
            <div style={{ background: '#f4f6fb', minHeight: '100vh', direction: 'rtl' }}>

                {/* ── Top bar ──────────────────────────────── */}
                <div style={{
                    background: '#0f172a', padding: '10px 20px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
                }}>
                    <Space size={14} align="center">
                        <div style={{
                            width: 36, height: 36, borderRadius: 9,
                            background: 'linear-gradient(135deg,#16a34a,#059669)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <CheckCircleOutlined style={{ color: '#fff', fontSize: 18 }} />
                        </div>
                        <div>
                            <Text style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 14, display: 'block' }}>
                                نتائج التعرف المباشر
                            </Text>
                            <Text style={{ color: '#64748b', fontSize: 11 }}>
                                تحديث تلقائي كل 20 ثانية
                            </Text>
                        </div>
                    </Space>

                    <Space size={10}>
                        {[
                            { label: 'إجمالي',     value: recognitions.length, color: '#94a3b8' },
                            { label: 'مؤكدة',      value: stats.confirmed,     color: '#22c55e' },
                            { label: 'مراجعة',     value: stats.pending,       color: '#f59e0b' },
                            { label: 'متوسط الدقة', value: `${Math.round(stats.avgScore * 100)}%`, color: '#60a5fa' },
                        ].map(s => (
                            <div key={s.label} style={{
                                background: '#1e293b', border: '1px solid #334155',
                                borderRadius: 8, padding: '4px 12px', textAlign: 'center',
                            }}>
                                <div style={{ fontSize: 15, fontWeight: 700, color: s.color }}>{s.value}</div>
                                <div style={{ fontSize: 10, color: '#64748b' }}>{s.label}</div>
                            </div>
                        ))}
                        <Badge status="processing"
                               text={<Text style={{ color: '#22c55e', fontWeight: 700, fontSize: 12 }}>● LIVE</Text>} />
                        <Button size="small" icon={<ReloadOutlined spin={isFetching} />}
                                onClick={() => refetch()} style={{ borderRadius: 7 }} />
                    </Space>
                </div>

                {/* ── Filters ──────────────────────────────── */}
                <div style={{
                    background: '#fff', borderBottom: '1px solid #e4e9f2',
                    padding: '10px 20px', display: 'flex', gap: 10,
                    alignItems: 'center', flexWrap: 'wrap',
                }}>
                    <Input
                        prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                        placeholder="بحث بالاسم أو الكاميرا…"
                        value={search} onChange={e => setSearch(e.target.value)}
                        style={{ width: 220, borderRadius: 9 }} allowClear
                    />
                    <Select placeholder="جميع الكاميرات" allowClear style={{ width: 170 }}
                            onChange={v => updateFilter({ cameraId: v })}
                            options={cameras.map(c => ({ value: c.cameraId, label: c.name }))} />
                    <Select placeholder="الحالة" allowClear style={{ width: 140 }}
                            onChange={v => updateFilter({ status: v })}
                            options={[0, 1, 2, 3].map(v => ({ value: v, label: RecognitionStatusLabel[v] }))} />
                    {(filters.cameraId || filters.status !== undefined) && (
                        <Button size="small" onClick={clearFilters} style={{ borderRadius: 7 }}>مسح</Button>
                    )}
                    <div style={{ marginRight: 'auto' }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {filtered.length} نتيجة
                        </Text>
                    </div>
                </div>

                {/* ── Cards grid ───────────────────────────── */}
                <div style={{ padding: '16px 20px' }}>
                    {filtered.length === 0 ? (
                        <div style={{
                            textAlign: 'center', padding: 80,
                            background: '#fff', borderRadius: 16, border: '1px solid #e4e9f2',
                        }}>
                            <CheckCircleOutlined style={{ fontSize: 64, color: '#bbf7d0' }} />
                            <br /><br />
                            <Title level={4} type="secondary">لا توجد نتائج بعد</Title>
                            <Text type="secondary">ستظهر نتائج التعرف هنا فور اكتشافها</Text>
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                            gap: 14,
                        }}>
                            {filtered.map((rec, i) => (
                                <PersonCard key={rec.recognitionId} rec={rec} delay={i * 30} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
