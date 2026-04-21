// ════════════════════════════════════════════════════════
//  src/pages/recognition/PersonRecognitionsPage.tsx
//  Route: /recognition/person/:personId
//  صفحة سجل التعرف لشخص محدد مع فلتر تواريخ
// ════════════════════════════════════════════════════════

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Table, Tag, Button, Typography, Space, DatePicker,
    Image, Progress, Tooltip, Row, Col, Spin, Alert,
    Descriptions, Avatar, Divider,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
    ArrowRightOutlined, EyeOutlined, VideoCameraOutlined,
    UserOutlined, CheckCircleOutlined, WarningOutlined,
    BarChartOutlined, CalendarOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getRecognitions } from '../../api/recognitionApi';
import { getPersonById } from '../../api/personsApi';
import type { RecognitionDto } from '../../types/camera.types';
import { RecognitionStatus, RecognitionStatusLabel, RecognitionStatusColor } from '../../types/camera.types';
import { BASIC_URL } from '../../api';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const scoreColor = (s?: number) =>
    !s ? '#8c8c8c' : s >= 0.8 ? '#52c41a' : s >= 0.6 ? '#faad14' : '#ff4d4f';

const buildImgUrl = (path: string) =>
    `${BASIC_URL.replace(/\/api\/?$/, '')}/${path}`;

function MiniStat({ label, value, color, icon }: { label: string; value: string | number; color: string; icon: React.ReactNode }) {
    return (
        <div style={{
            background: '#fff', border: '1px solid #e6eaf0', borderRadius: 12,
            padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
            flex: 1, minWidth: 110, boxShadow: '0 1px 3px rgba(0,0,0,.04)',
        }}>
            <div style={{
                width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                background: `${color}18`, border: `1px solid ${color}33`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color, fontSize: 16,
            }}>
                {icon}
            </div>
            <div>
                <div style={{ fontSize: 20, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 2 }}>{label}</div>
            </div>
        </div>
    );
}

export default function PersonRecognitionsPage() {
    const { personId } = useParams<{ personId: string }>();
    const pid = Number(personId);
    const navigate = useNavigate();

    const [dateRange, setDateRange] = useState<[string, string] | undefined>();

    // ── Person info ──────────────────────────────────────
    const { data: person, isLoading: personLoading } = useQuery({
        queryKey: ['person', pid],
        queryFn: () => getPersonById(pid),
        enabled: !!pid && !isNaN(pid),
    });

    // ── Recognitions ─────────────────────────────────────
    const { data: recognitions = [], isLoading: recLoading, isError, refetch } = useQuery({
        queryKey: ['recognitions-person', pid, dateRange],
        queryFn: () => getRecognitions({
            personId: pid,
            fromDate: dateRange?.[0],
            toDate: dateRange?.[1],
            isMatch: true,
        }),
        enabled: !!pid && !isNaN(pid),
        refetchInterval: 30_000,
    });

    // ── Stats ────────────────────────────────────────────
    const confirmed = recognitions.filter(r => r.recognitionStatus === RecognitionStatus.Confirmed).length;
    const cameras = [...new Set(recognitions.map(r => r.cameraName).filter(Boolean))];
    const avgScore = recognitions.length
        ? recognitions.reduce((s, r) => s + (r.recognitionScore ?? 0), 0) / recognitions.length : 0;
    const lastSeen = recognitions[0]?.recognitionDateTime;

    // ── Columns ──────────────────────────────────────────
    const columns: ColumnsType<RecognitionDto> = [
        {
            title: 'لقطة', key: 'snap', width: 72,
            render: (_, r) => r.snapshotPath ? (
                <Image
                    src={buildImgUrl(r.snapshotPath)}
                    style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 8 }}
                    fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                    preview={{ mask: <EyeOutlined /> }}
                />
            ) : (
                <div style={{
                    width: 50, height: 50, borderRadius: 8,
                    background: '#f5f5f5', border: '1px solid #e6eaf0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <UserOutlined style={{ color: '#bfbfbf', fontSize: 18 }} />
                </div>
            ),
        },
        {
            title: 'الكاميرا', key: 'camera', width: 150,
            render: (_, r) => (
                <Space size={5}>
                    <VideoCameraOutlined style={{ color: '#8c8c8c', fontSize: 12 }} />
                    <Text style={{ fontSize: 13 }}>{r.cameraName ?? '—'}</Text>
                </Space>
            ),
        },
        {
            title: 'نسبة التطابق', key: 'score', width: 130,
            sorter: (a, b) => (a.recognitionScore ?? 0) - (b.recognitionScore ?? 0),
            render: (_, r) => (
                <div>
                    <Text style={{ color: scoreColor(r.recognitionScore), fontSize: 14, fontWeight: 700 }}>
                        {r.recognitionScore ? `${Math.round(r.recognitionScore * 100)}%` : '—'}
                    </Text>
                    {r.recognitionScore !== undefined && (
                        <Progress
                            percent={Math.round(r.recognitionScore * 100)}
                            strokeColor={scoreColor(r.recognitionScore)}
                            size="small" showInfo={false} style={{ margin: '3px 0 0' }}
                        />
                    )}
                </div>
            ),
        },
        {
            title: 'الحالة', key: 'status', width: 130,
            filters: [0, 1, 2, 3].map(v => ({ text: RecognitionStatusLabel[v], value: v })),
            onFilter: (val, r) => r.recognitionStatus === (val as number),
            render: (_, r) => (
                <Tag color={RecognitionStatusColor[r.recognitionStatus]}>
                    {RecognitionStatusLabel[r.recognitionStatus]}
                </Tag>
            ),
        },
        {
            title: 'التاريخ والوقت', key: 'time', width: 150,
            sorter: (a, b) => new Date(a.recognitionDateTime).getTime() - new Date(b.recognitionDateTime).getTime(),
            defaultSortOrder: 'descend',
            render: (_, r) => (
                <div>
                    <Text style={{ fontSize: 13, fontFamily: 'monospace', display: 'block' }}>
                        {dayjs(r.recognitionDateTime).format('HH:mm:ss')}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                        {dayjs(r.recognitionDateTime).format('YYYY/MM/DD')}
                    </Text>
                </div>
            ),
        },
        {
            title: 'الموقع', key: 'location', width: 120,
            render: (_, r) => r.locationDescription
                ? <Text type="secondary" style={{ fontSize: 12 }}>{r.locationDescription}</Text>
                : <Text type="secondary" style={{ fontSize: 12 }}>—</Text>,
        },
    ];

    // ── Loading ──────────────────────────────────────────
    if (personLoading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
            <Spin size="large" />
        </div>
    );

    // ── Render ───────────────────────────────────────────
    return (
        <div style={{ padding: '22px 24px', direction: 'rtl', background: '#f7f9fc', minHeight: '100vh' }}>

            {/* Back + Header */}
            <div style={{
                background: '#fff', border: '1px solid #e6eaf0', borderRadius: 16,
                padding: '16px 22px', marginBottom: 18, boxShadow: '0 1px 4px rgba(0,0,0,.05)',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <Space size={12} align="start">
                        <Tooltip title="رجوع">
                            <Button icon={<ArrowRightOutlined />} onClick={() => navigate(-1)} style={{ borderRadius: 8, marginTop: 2 }} />
                        </Tooltip>

                        {/* Person Avatar */}
                        <Avatar
                            size={52}
                            src={
                                person?.faceImages?.find(f => f.isPrimary)?.faceProcessedImage
                                    ? `data:image/jpeg;base64,${person.faceImages.find(f => f.isPrimary)!.faceProcessedImage}`
                                    : undefined
                            }
                            icon={<UserOutlined />}
                            style={{ background: '#e6f4ff', color: '#1677ff', flexShrink: 0 }}
                        />

                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
                            <Space size={16} style={{ marginTop: 4 }}>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    الهوية: {person?.nationalId || '—'}
                                </Text>
                                {lastSeen && (
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        <ClockCircleOutlined style={{ marginLeft: 3 }} />
                                        آخر رصد: {dayjs(lastSeen).format('YYYY/MM/DD HH:mm')}
                                    </Text>
                                )}
                            </Space>
                        </div>
                    </Space>

                    <Button
                        type="primary" ghost icon={<EyeOutlined />}
                        onClick={() => navigate(`/persons/${pid}`)}
                        style={{ borderRadius: 9 }}
                    >
                        الملف الكامل
                    </Button>
                </div>

                {/* Cameras summary */}
                {cameras.length > 0 && (
                    <>
                        <Divider style={{ margin: '12px 0 8px' }} />
                        <Space size={6} wrap>
                            <Text type="secondary" style={{ fontSize: 12 }}>رُصد في:</Text>
                            {cameras.map(c => (
                                <Tag key={c} icon={<VideoCameraOutlined />} color="blue" style={{ fontSize: 11 }}>
                                    {c}
                                </Tag>
                            ))}
                        </Space>
                    </>
                )}
            </div>

            {/* Stats */}
            <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                {[
                    { label: 'إجمالي التعرفات', value: recognitions.length, color: '#1677ff', icon: <BarChartOutlined /> },
                    { label: 'مؤكدة', value: confirmed, color: '#52c41a', icon: <CheckCircleOutlined /> },
                    { label: 'كاميرات مختلفة', value: cameras.length, color: '#722ed1', icon: <VideoCameraOutlined /> },
                    { label: 'متوسط الدقة', value: `${Math.round(avgScore * 100)}%`, color: '#fa8c16', icon: <EyeOutlined /> },
                ].map(s => (
                    <Col key={s.label} xs={12} sm={6}>
                        <MiniStat {...s} />
                    </Col>
                ))}
            </Row>

            {/* Date filter */}
            <div style={{
                background: '#fff', border: '1px solid #e6eaf0', borderRadius: 12,
                padding: '12px 18px', marginBottom: 14,
                display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
            }}>
                <CalendarOutlined style={{ color: '#8c8c8c' }} />
                <Text type="secondary" style={{ fontSize: 13 }}>فلترة بالتاريخ:</Text>
                <RangePicker
                    onChange={(_, ds) => {
                        const [from, to] = ds;
                        setDateRange(from && to ? [from, to] : undefined);
                    }}
                    placeholder={['من تاريخ', 'إلى تاريخ']}
                    style={{ borderRadius: 8 }}
                    defaultValue={undefined}
                />
                {dateRange && (
                    <Button size="small" onClick={() => setDateRange(undefined)} style={{ borderRadius: 7 }}>
                        مسح
                    </Button>
                )}
                <div style={{ marginRight: 'auto' }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {dateRange
                            ? `${dayjs(dateRange[0]).format('YYYY/MM/DD')} → ${dayjs(dateRange[1]).format('YYYY/MM/DD')}`
                            : 'جميع التواريخ'}
                    </Text>
                </div>
            </div>

            {isError && (
                <Alert message="فشل تحميل السجل" type="error" showIcon style={{ marginBottom: 14, borderRadius: 10 }} />
            )}

            {/* Table */}
            <div style={{
                background: '#fff', border: '1px solid #e6eaf0',
                borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.05)',
            }}>
                <Table<RecognitionDto>
                    columns={columns}
                    dataSource={recognitions}
                    rowKey="recognitionId"
                    loading={recLoading}
                    pagination={{
                        pageSize: 20, showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50'],
                        showTotal: total => <Text type="secondary">{total} سجل</Text>,
                    }}
                    style={{ direction: 'rtl' }}
                    scroll={{ x: 750 }}
                    locale={{ emptyText: 'لا توجد سجلات تعرف لهذا الشخص في الفترة المحددة' }}
                />
            </div>
        </div>
    );
}