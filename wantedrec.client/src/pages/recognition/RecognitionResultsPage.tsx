// ════════════════════════════════════════════════════════
//  src/pages/recognition/RecognitionResultsPage.tsx
//  Route: /recognition/results
// ════════════════════════════════════════════════════════

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Table, Tag, Button, Space, Typography, Select, DatePicker,
    Image, Progress, Tooltip, Row, Col, Alert,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
    CheckCircleOutlined, EyeOutlined, VideoCameraOutlined, UserOutlined,
    ReloadOutlined, FilterOutlined, WarningOutlined, BarChartOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getRecognitions } from '../../api/recognitionApi';
import { getCameras } from '../../api/camerasApi';
import type { RecognitionDto } from '../../types/camera.types';
import { RecognitionStatus, RecognitionStatusLabel, RecognitionStatusColor } from '../../types/camera.types';
import { BASIC_URL } from '../../api';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const scoreColor = (s?: number) =>
    !s ? '#8c8c8c' : s >= 0.8 ? '#52c41a' : s >= 0.6 ? '#faad14' : '#ff4d4f';

const buildImgUrl = (path: string) =>
    `${BASIC_URL.replace(/\/api\/?$/, '')}/${path}`;

function StatCard({ label, value, color, icon, bg }: {
    label: string; value: string | number; color: string; icon: React.ReactNode; bg: string;
}) {
    return (
        <div style={{
            background: bg, border: '1px solid #e6eaf0', borderRadius: 12,
            padding: '14px 18px', display: 'flex', alignItems: 'center',
            gap: 14, flex: 1, minWidth: 130,
            boxShadow: '0 1px 3px rgba(0,0,0,.04)',
        }}>
            <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: `${color}18`, border: `1px solid ${color}33`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color, fontSize: 18,
            }}>
                {icon}
            </div>
            <div>
                <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 2 }}>{label}</div>
            </div>
        </div>
    );
}

export default function RecognitionResultsPage() {
    const navigate = useNavigate();

    const [filters, setFilters] = useState<{
        cameraId?: number;
        status?: number;
        dateRange?: [string, string];
    }>({});

    const { data: cameras = [] } = useQuery({
        queryKey: ['cameras'],
        queryFn: () => getCameras(),
    });

    const { data: recognitions = [], isLoading, isError, refetch, isFetching } = useQuery({
        queryKey: ['recognitions', filters],
        queryFn: () => getRecognitions({
            cameraId: filters.cameraId,
            recognitionStatus: filters.status,
            fromDate: filters.dateRange?.[0],
            toDate: filters.dateRange?.[1],
            isMatch: true,
        }),
        refetchInterval: 20_000,
    });

    const confirmed = recognitions.filter(r => r.recognitionStatus === RecognitionStatus.Confirmed).length;
    const pending = recognitions.filter(r => r.recognitionStatus === RecognitionStatus.Pending).length;
    const avgScore = recognitions.length
        ? recognitions.reduce((s, r) => s + (r.recognitionScore ?? 0), 0) / recognitions.length : 0;

    const columns: ColumnsType<RecognitionDto> = [
        {
            title: 'لقطة', key: 'snapshot', width: 72,
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
            title: 'الشخص', key: 'person',
            render: (_, r) => (
                <div>
                    <Text strong style={{ fontSize: 13 }}>{r.personFullName ?? '—'}</Text>
                    {r.cameraName && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                            <VideoCameraOutlined style={{ color: '#8c8c8c', fontSize: 11 }} />
                            <Text type="secondary" style={{ fontSize: 11 }}>{r.cameraName}</Text>
                        </div>
                    )}
                </div>
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
                            size="small" showInfo={false}
                            style={{ margin: '3px 0 0' }}
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
            title: 'التوقيت', key: 'time', width: 130,
            sorter: (a, b) => new Date(a.recognitionDateTime).getTime() - new Date(b.recognitionDateTime).getTime(),
            defaultSortOrder: 'descend',
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
        {
            title: '', key: 'action', width: 90,
            render: (_, r) => r.personId ? (
                <Tooltip title="سجل هذا الشخص">
                    <Button
                        size="small" type="primary" icon={<EyeOutlined />}
                        onClick={e => { e.stopPropagation(); navigate(`/recognition/person/${r.personId}`); }}
                        style={{ borderRadius: 7, height: 28, fontSize: 11 }}
                    >
                        التفاصيل
                    </Button>
                </Tooltip>
            ) : null,
        },
    ];

    return (
        <div style={{ padding: '22px 24px', direction: 'rtl', background: '#f7f9fc', minHeight: '100vh' }}>

            {/* Header */}
            <div style={{
                background: '#fff', border: '1px solid #e6eaf0', borderRadius: 16,
                padding: '16px 22px', marginBottom: 18, boxShadow: '0 1px 4px rgba(0,0,0,.05)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14,
            }}>
                <Space size={12} align="center">
                    <div style={{
                        width: 44, height: 44, borderRadius: 11,
                        background: '#f6ffed', border: '1px solid #b7eb8f',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <CheckCircleOutlined style={{ fontSize: 22, color: '#52c41a' }} />
                    </div>
                    <div>
                        <Title level={4} style={{ margin: 0 }}>سجل التعرف على الوجوه</Title>
                        <Text type="secondary" style={{ fontSize: 12 }}>جميع عمليات التعرف الناجحة</Text>
                    </div>
                </Space>
                <Button icon={<ReloadOutlined spin={isFetching} />} onClick={() => refetch()} style={{ borderRadius: 9, height: 36 }}>
                    تحديث
                </Button>
            </div>

            {/* Stats */}
            <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                {[
                    { label: 'إجمالي التعرفات', value: recognitions.length, color: '#1677ff', bg: '#e6f4ff', icon: <BarChartOutlined /> },
                    { label: 'مؤكدة', value: confirmed, color: '#52c41a', bg: '#f6ffed', icon: <CheckCircleOutlined /> },
                    { label: 'قيد المراجعة', value: pending, color: '#faad14', bg: '#fffbe6', icon: <WarningOutlined /> },
                    { label: 'متوسط الدقة', value: `${Math.round(avgScore * 100)}%`, color: '#722ed1', bg: '#f9f0ff', icon: <EyeOutlined /> },
                ].map(s => (
                    <Col key={s.label} xs={12} sm={6}>
                        <StatCard {...s} />
                    </Col>
                ))}
            </Row>

            {/* Filters */}
            <div style={{
                background: '#fff', border: '1px solid #e6eaf0', borderRadius: 12,
                padding: '12px 18px', marginBottom: 14,
                display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
            }}>
                <FilterOutlined style={{ color: '#8c8c8c' }} />
                <Select placeholder="جميع الكاميرات" allowClear style={{ width: 180 }}
                    onChange={v => setFilters(f => ({ ...f, cameraId: v }))}
                    options={cameras.map(c => ({ value: c.cameraId, label: c.name }))} />
                <Select placeholder="جميع الحالات" allowClear style={{ width: 160 }}
                    onChange={v => setFilters(f => ({ ...f, status: v }))}
                    options={[0, 1, 2, 3].map(v => ({ value: v, label: RecognitionStatusLabel[v] }))} />
                <RangePicker
                    onChange={(_, ds) => {
                        const [from, to] = ds;
                        setFilters(f => ({ ...f, dateRange: from && to ? [from, to] : undefined }));
                    }}
                    placeholder={['من تاريخ', 'إلى تاريخ']} style={{ borderRadius: 8 }}
                />
                {(filters.cameraId || filters.status !== undefined || filters.dateRange) && (
                    <Button size="small" onClick={() => setFilters({})} style={{ borderRadius: 7 }}>مسح الفلاتر</Button>
                )}
            </div>

            {isError && (
                <Alert message="فشل تحميل السجل" type="error" showIcon style={{ marginBottom: 14, borderRadius: 10 }} />
            )}

            {/* Table */}
            <div style={{ background: '#fff', border: '1px solid #e6eaf0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
                <Table<RecognitionDto>
                    columns={columns}
                    dataSource={recognitions}
                    rowKey="recognitionId"
                    loading={isLoading}
                    pagination={{
                        pageSize: 20, showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50', '100'],
                        showTotal: total => <Text type="secondary">{total} نتيجة</Text>,
                    }}
                    onRow={r => ({
                        onClick: () => r.personId && navigate(`/recognition/person/${r.personId}`),
                        style: { cursor: r.personId ? 'pointer' : 'default' },
                    })}
                    style={{ direction: 'rtl' }}
                    scroll={{ x: 700 }}
                />
            </div>
        </div>
    );
}