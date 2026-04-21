// ═══════════════════════════════════════════════════════
//  src/pages/recognition/PersonRecognitionsPage.tsx
//  Route: /recognition/person/:personId
//  سجل التعرف لشخص واحد + خريطة مسار الحركة
// ═══════════════════════════════════════════════════════
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Row, Col, Typography, Space, Spin, Tag, Button,
    Image, Progress, DatePicker, Table, Avatar,
    Descriptions, Divider, Tooltip, Timeline,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
    ArrowRightOutlined, EyeOutlined, VideoCameraOutlined,
    UserOutlined, CheckCircleOutlined, WarningOutlined,
    ClockCircleOutlined, EnvironmentOutlined, BarChartOutlined,
    AimOutlined, RadarChartOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { usePersonRecognitions } from '../../hooks/useRecognitions';
import { getPersonById } from '../../api/personsApi';
import type { RecognitionDto } from '../../types/camera.types';
import { RecognitionStatus, RecognitionStatusLabel, RecognitionStatusColor } from '../../types/camera.types';
import { BASIC_URL } from '../../api';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const scoreColor = (s?: number) =>
    !s ? '#94a3b8' : s >= 0.8 ? '#16a34a' : s >= 0.6 ? '#d97706' : '#dc2626';

const buildUrl = (p: string) => `${BASIC_URL.replace(/\/api\/?$/, '')}/${p}`;

const CSS = `
  @keyframes pathDraw {
    from { stroke-dashoffset:1000; }
    to   { stroke-dashoffset:0; }
  }
  @keyframes nodeIn {
    from { opacity:0; transform:scale(0); }
    to   { opacity:1; transform:scale(1); }
  }
  @keyframes pulse {
    0%,100% { box-shadow:0 0 0 0 rgba(37,99,235,.5); }
    50%      { box-shadow:0 0 0 8px rgba(37,99,235,0); }
  }
`;

// ── MovementMap — SVG خريطة مسار الحركة ──────────────────
function MovementMap({ records }: { records: RecognitionDto[] }) {
    if (records.length < 2) return (
        <div style={{
            height: 200, display: 'flex', alignItems: 'center',
            justifyContent: 'center', background: '#f8fafc', borderRadius: 12,
            border: '1px dashed #e4e9f2',
        }}>
            <Space direction="vertical" style={{ textAlign: 'center' }}>
                <RadarChartOutlined style={{ fontSize: 32, color: '#cbd5e1' }} />
                <Text type="secondary" style={{ fontSize: 12 }}>يحتاج أكثر من تعرف لرسم المسار</Text>
            </Space>
        </div>
    );

    // بناء قائمة الكاميرات الفريدة
    const cameras = records
        .filter((r, i, a) => a.findIndex(x => x.cameraId === r.cameraId) === i)
        .map((r, i) => ({
            id:   r.cameraId,
            name: r.cameraName ?? `CAM-${r.cameraId}`,
            x:    60 + (i % 4) * 160,
            y:    60 + Math.floor(i / 4) * 100,
            lat:  r.latitude,
            lng:  r.longitude,
        }));

    const H = 60 + Math.ceil(cameras.length / 4) * 100 + 40;

    // مسار الحركة بالترتيب الزمني
    const path = records
        .sort((a, b) => new Date(a.recognitionDateTime).getTime() - new Date(b.recognitionDateTime).getTime())
        .map(r => cameras.find(c => c.id === r.cameraId))
        .filter(Boolean) as typeof cameras;

    // بناء D لـ polyline
    const d = path.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    return (
        <div style={{
            background: 'linear-gradient(135deg,#f8fafc,#eff6ff)',
            borderRadius: 14, border: '1px solid #e4e9f2',
            overflow: 'hidden', position: 'relative',
        }}>
            {/* Legend */}
            <div style={{ padding: '10px 16px', borderBottom: '1px solid #e4e9f2',
                          display: 'flex', alignItems: 'center', gap: 8 }}>
                <AimOutlined style={{ color: '#2563eb' }} />
                <Text strong style={{ fontSize: 13 }}>مسار حركة الهدف</Text>
                <div style={{ marginRight: 'auto', display: 'flex', gap: 12 }}>
                    <span style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#2563eb', display: 'inline-block' }} />
                        نقطة رصد
                    </span>
                    <span style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 20, height: 2, background: '#2563eb', display: 'inline-block' }} />
                        مسار الحركة
                    </span>
                </div>
            </div>

            <svg width="100%" height={H} viewBox={`0 0 ${Math.max(640, cameras.length * 160)} ${H}`}
                 style={{ display: 'block' }}>
                {/* Grid lines */}
                {Array.from({ length: 10 }, (_, i) => (
                    <line key={i} x1={0} y1={i * 30} x2={700} y2={i * 30}
                          stroke="#e4e9f2" strokeWidth={0.5} />
                ))}

                {/* Movement path */}
                <path d={d} fill="none" stroke="#2563eb" strokeWidth={2.5}
                      strokeDasharray="1000" strokeDashoffset="1000"
                      style={{ animation: 'pathDraw 2s ease forwards' }}
                      markerEnd="url(#arrow)" opacity={0.7} />

                {/* Arrow marker */}
                <defs>
                    <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L9,3 z" fill="#2563eb" />
                    </marker>
                </defs>

                {/* Camera nodes */}
                {cameras.map((cam, i) => {
                    const isFirst = path[0]?.id === cam.id;
                    const isLast  = path[path.length - 1]?.id === cam.id;
                    const visits  = records.filter(r => r.cameraId === cam.id).length;
                    return (
                        <g key={cam.id} style={{ animation: `nodeIn .4s ease ${i * .1}s both` }}>
                            {/* Circle */}
                            <circle cx={cam.x} cy={cam.y} r={18}
                                    fill={isLast ? '#2563eb' : isFirst ? '#16a34a' : '#fff'}
                                    stroke={isLast ? '#1d4ed8' : isFirst ? '#15803d' : '#2563eb'}
                                    strokeWidth={2.5} />

                            {/* Icon */}
                            <text x={cam.x} y={cam.y + 5} textAnchor="middle"
                                  fontSize={13} fill={isLast || isFirst ? '#fff' : '#2563eb'}>
                                📷
                            </text>

                            {/* Label */}
                            <text x={cam.x} y={cam.y + 34} textAnchor="middle"
                                  fontSize={10} fill="#475569" fontWeight="600">
                                {cam.name.length > 10 ? cam.name.slice(0, 10) + '…' : cam.name}
                            </text>

                            {/* Visit count */}
                            {visits > 1 && (
                                <>
                                    <circle cx={cam.x + 15} cy={cam.y - 14} r={9} fill="#dc2626" />
                                    <text x={cam.x + 15} y={cam.y - 10} textAnchor="middle"
                                          fontSize={9} fill="#fff" fontWeight="700">
                                        {visits}
                                    </text>
                                </>
                            )}

                            {/* Start / End */}
                            {(isFirst || isLast) && (
                                <text x={cam.x} y={cam.y - 26} textAnchor="middle"
                                      fontSize={9} fill={isFirst ? '#16a34a' : '#2563eb'} fontWeight="700">
                                    {isFirst ? 'START' : 'LAST'}
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

// ── MovementTimeline ──────────────────────────────────────
function MovementTimeline({ records }: { records: RecognitionDto[] }) {
    const sorted = [...records].sort(
        (a, b) => new Date(a.recognitionDateTime).getTime() - new Date(b.recognitionDateTime).getTime(),
    );

    return (
        <Timeline mode="right" style={{ direction: 'rtl' }}>
            {sorted.map((rec, i) => (
                <Timeline.Item
                    key={rec.recognitionId}
                    color={scoreColor(rec.recognitionScore)}
                    dot={i === sorted.length - 1
                        ? <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#2563eb',
                                        animation: 'pulse 2s infinite', border: '2px solid #fff' }} />
                        : undefined
                    }
                >
                    <div style={{
                        background: '#fff', border: '1px solid #e4e9f2', borderRadius: 10,
                        padding: '8px 12px', marginBottom: 4,
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Text strong style={{ fontSize: 12 }}>{rec.cameraName ?? '—'}</Text>
                            <Text style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>
                                {dayjs(rec.recognitionDateTime).format('HH:mm:ss')}
                            </Text>
                        </div>
                        {rec.recognitionScore !== undefined && (
                            <Text style={{ fontSize: 11, color: scoreColor(rec.recognitionScore), fontWeight: 600 }}>
                                {Math.round(rec.recognitionScore * 100)}% تطابق
                            </Text>
                        )}
                        {rec.locationDescription && (
                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                                <EnvironmentOutlined style={{ marginLeft: 3 }} />
                                {rec.locationDescription}
                            </div>
                        )}
                    </div>
                </Timeline.Item>
            ))}
        </Timeline>
    );
}

// ── PersonRecognitionsPage ────────────────────────────────
export default function PersonRecognitionsPage() {
    const { personId } = useParams<{ personId: string }>();
    const pid = Number(personId);
    const navigate = useNavigate();
    const [dateRange, setDateRange] = useState<[string, string] | undefined>();
    const [view, setView] = useState<'cards' | 'table'>('cards');

    const { recognitions, isLoading, isFetching, refetch, stats } = usePersonRecognitions(pid);
    const { data: person } = useQuery({
        queryKey: ['person', pid],
        queryFn:  () => getPersonById(pid),
        enabled:  !!pid,
    });

    // فلتر التاريخ
    const filtered = dateRange
        ? recognitions.filter(r => {
            const d = dayjs(r.recognitionDateTime);
            return d.isAfter(dateRange[0]) && d.isBefore(dayjs(dateRange[1]).add(1, 'day'));
          })
        : recognitions;

    // Columns للجدول
    const columns: ColumnsType<RecognitionDto> = [
        {
            title: 'لقطة', key: 'snap', width: 70,
            render: (_, r) => r.snapshotPath
                ? <Image src={buildUrl(r.snapshotPath)} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8 }} />
                : <div style={{ width: 48, height: 48, borderRadius: 8, background: '#f1f5f9',
                                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UserOutlined style={{ color: '#94a3b8' }} />
                  </div>,
        },
        {
            title: 'الكاميرا', key: 'cam',
            render: (_, r) => (
                <Space size={4}>
                    <VideoCameraOutlined style={{ color: '#94a3b8', fontSize: 12 }} />
                    <Text style={{ fontSize: 13 }}>{r.cameraName ?? '—'}</Text>
                </Space>
            ),
        },
        {
            title: 'الدقة', key: 'score', width: 120,
            sorter: (a, b) => (a.recognitionScore ?? 0) - (b.recognitionScore ?? 0),
            render: (_, r) => (
                <div>
                    <Text style={{ color: scoreColor(r.recognitionScore), fontWeight: 700, fontSize: 13 }}>
                        {r.recognitionScore ? `${Math.round(r.recognitionScore * 100)}%` : '—'}
                    </Text>
                    {r.recognitionScore && (
                        <Progress percent={Math.round(r.recognitionScore * 100)}
                                  strokeColor={scoreColor(r.recognitionScore)}
                                  size="small" showInfo={false} style={{ margin: '2px 0 0' }} />
                    )}
                </div>
            ),
        },
        {
            title: 'الحالة', key: 'status', width: 130,
            render: (_, r) => (
                <Tag color={RecognitionStatusColor[r.recognitionStatus]}>
                    {RecognitionStatusLabel[r.recognitionStatus]}
                </Tag>
            ),
        },
        {
            title: 'الوقت', key: 'time', width: 120,
            defaultSortOrder: 'descend',
            sorter: (a, b) => new Date(a.recognitionDateTime).getTime() - new Date(b.recognitionDateTime).getTime(),
            render: (_, r) => (
                <div>
                    <Text style={{ fontSize: 13, fontFamily: 'monospace' }}>
                        {dayjs(r.recognitionDateTime).format('HH:mm:ss')}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                        {dayjs(r.recognitionDateTime).format('YYYY/MM/DD')}
                    </Text>
                </div>
            ),
        },
    ];

    if (isLoading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
            <Spin size="large" />
        </div>
    );

    const primaryImg = person?.faceImages?.find(f => f.isPrimary)?.faceProcessedImage
        ?? person?.faceImages?.[0]?.faceProcessedImage;

    return (
        <>
            <style>{CSS}</style>
            <div style={{ padding: '20px 24px', direction: 'rtl', background: '#f4f6fb', minHeight: '100vh' }}>

                {/* ── Header ──────────────────────────────── */}
                <div style={{
                    background: '#fff', border: '1px solid #e4e9f2', borderRadius: 18,
                    padding: '16px 22px', marginBottom: 18,
                    boxShadow: '0 2px 8px rgba(15,23,42,.06)',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between',
                                  alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                        <Space size={14} align="start">
                            <Tooltip title="رجوع">
                                <Button icon={<ArrowRightOutlined />} onClick={() => navigate(-1)}
                                        style={{ borderRadius: 9, marginTop: 4 }} />
                            </Tooltip>

                            {/* Avatar */}
                            <Avatar size={56}
                                    src={primaryImg ? `data:image/jpeg;base64,${primaryImg}` : undefined}
                                    icon={<UserOutlined />}
                                    style={{ background: '#eff6ff', color: '#2563eb',
                                             border: '3px solid #bfdbfe', flexShrink: 0 }} />

                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                    <Title level={4} style={{ margin: 0 }}>
                                        {person?.fullName ?? `شخص #${pid}`}
                                    </Title>
                                    {person?.suspect && (
                                        <Tag color="red" style={{ fontSize: 11 }}>
                                            <WarningOutlined style={{ marginLeft: 3 }} />مشتبه به
                                        </Tag>
                                    )}
                                    <Tag color={person?.isActive ? 'success' : 'error'} style={{ fontSize: 11 }}>
                                        {person?.isActive ? 'نشط' : 'غير نشط'}
                                    </Tag>
                                </div>
                                <Space size={16} style={{ marginTop: 4, flexWrap: 'wrap' }}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        الهوية: {person?.nationalId || '—'}
                                    </Text>
                                    {stats.lastSeen && (
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            <ClockCircleOutlined style={{ marginLeft: 3 }} />
                                            آخر رصد: {dayjs(stats.lastSeen).format('YYYY/MM/DD HH:mm')}
                                        </Text>
                                    )}
                                </Space>

                                {/* Cameras */}
                                {stats.cameras.length > 0 && (
                                    <div style={{ marginTop: 8, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                                        <Text style={{ fontSize: 11, color: '#64748b' }}>رُصد في:</Text>
                                        {stats.cameras.map(c => (
                                            <Tag key={c} icon={<VideoCameraOutlined />} color="blue" style={{ fontSize: 10 }}>
                                                {c}
                                            </Tag>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Space>

                        <Space>
                            <Button type="primary" ghost icon={<EyeOutlined />}
                                    onClick={() => navigate(`/persons/${pid}`)} style={{ borderRadius: 9 }}>
                                الملف الكامل
                            </Button>
                        </Space>
                    </div>
                </div>

                {/* ── Stats row ───────────────────────────── */}
                <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                    {[
                        { label: 'إجمالي التعرفات', value: recognitions.length, color: '#2563eb', bg: '#eff6ff', icon: <BarChartOutlined /> },
                        { label: 'مؤكدة',            value: stats.confirmed,     color: '#16a34a', bg: '#f0fdf4', icon: <CheckCircleOutlined /> },
                        { label: 'كاميرات مختلفة',   value: stats.cameras.length, color: '#7c3aed', bg: '#faf5ff', icon: <VideoCameraOutlined /> },
                        { label: 'متوسط الدقة',      value: `${Math.round(stats.avgScore * 100)}%`, color: '#d97706', bg: '#fefce8', icon: <AimOutlined /> },
                    ].map(s => (
                        <Col key={s.label} xs={12} sm={6}>
                            <div style={{
                                background: s.bg, border: '1px solid #e4e9f2', borderRadius: 12,
                                padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
                                boxShadow: '0 1px 4px rgba(15,23,42,.04)',
                            }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                                    background: `${s.color}18`, border: `1px solid ${s.color}33`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: s.color, fontSize: 16,
                                }}>
                                    {s.icon}
                                </div>
                                <div>
                                    <div style={{ fontSize: 20, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{s.label}</div>
                                </div>
                            </div>
                        </Col>
                    ))}
                </Row>

                {/* ── Main layout ──────────────────────────── */}
                <Row gutter={[16, 16]}>

                    {/* ── Right: Map + Timeline ─────────────── */}
                    <Col xs={24} lg={8}>
                        {/* Date Filter */}
                        <div style={{
                            background: '#fff', border: '1px solid #e4e9f2', borderRadius: 14,
                            padding: '12px 14px', marginBottom: 14,
                            boxShadow: '0 1px 4px rgba(15,23,42,.04)',
                        }}>
                            <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 10 }}>
                                <ClockCircleOutlined style={{ marginLeft: 6, color: '#2563eb' }} />
                                فلترة بالتاريخ
                            </Text>
                            <RangePicker
                                style={{ width: '100%', borderRadius: 9 }}
                                onChange={(_, ds) => {
                                    const [f, t] = ds;
                                    setDateRange(f && t ? [f, t] : undefined);
                                }}
                                placeholder={['من', 'إلى']}
                            />
                            {dateRange && (
                                <Button size="small" onClick={() => setDateRange(undefined)}
                                        style={{ marginTop: 8, borderRadius: 7, width: '100%' }}>
                                    مسح الفلتر — {filtered.length} نتيجة
                                </Button>
                            )}
                        </div>

                        {/* Movement Map */}
                        <div style={{
                            background: '#fff', border: '1px solid #e4e9f2', borderRadius: 14,
                            padding: '12px 14px', marginBottom: 14,
                            boxShadow: '0 1px 4px rgba(15,23,42,.04)',
                        }}>
                            <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 10 }}>
                                <AimOutlined style={{ marginLeft: 6, color: '#2563eb' }} />
                                خريطة مسار الحركة
                            </Text>
                            <MovementMap records={filtered} />
                        </div>

                        {/* Timeline */}
                        <div style={{
                            background: '#fff', border: '1px solid #e4e9f2', borderRadius: 14,
                            padding: '12px 14px', maxHeight: 400, overflowY: 'auto',
                            boxShadow: '0 1px 4px rgba(15,23,42,.04)',
                        }}>
                            <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 12 }}>
                                <ClockCircleOutlined style={{ marginLeft: 6, color: '#7c3aed' }} />
                                الجدول الزمني للرصد
                            </Text>
                            <MovementTimeline records={filtered} />
                        </div>
                    </Col>

                    {/* ── Left: Records table ───────────────── */}
                    <Col xs={24} lg={16}>
                        <div style={{
                            background: '#fff', border: '1px solid #e4e9f2',
                            borderRadius: 14, overflow: 'hidden',
                            boxShadow: '0 1px 4px rgba(15,23,42,.04)',
                        }}>
                            <div style={{
                                padding: '12px 16px', borderBottom: '1px solid #f1f5f9',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            }}>
                                <Text strong style={{ fontSize: 14 }}>
                                    سجل التعرف المفصّل
                                    <Text type="secondary" style={{ fontSize: 12, marginRight: 8 }}>
                                        ({filtered.length} سجل)
                                    </Text>
                                </Text>
                                <Button size="small" icon={<CheckCircleOutlined />}
                                        onClick={() => refetch()}
                                        loading={isFetching} style={{ borderRadius: 7 }}>
                                    تحديث
                                </Button>
                            </div>

                            <Table<RecognitionDto>
                                columns={columns}
                                dataSource={filtered}
                                rowKey="recognitionId"
                                loading={isLoading}
                                pagination={{
                                    pageSize: 15, showSizeChanger: false,
                                    showTotal: total => <Text type="secondary">{total} سجل</Text>,
                                }}
                                style={{ direction: 'rtl' }}
                                scroll={{ x: 600 }}
                                locale={{ emptyText: 'لا توجد سجلات في هذه الفترة' }}
                            />
                        </div>
                    </Col>
                </Row>
            </div>
        </>
    );
}
