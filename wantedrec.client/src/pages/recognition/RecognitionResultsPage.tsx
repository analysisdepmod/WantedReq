import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Table, Tag, Button, Space, Typography, Select, DatePicker,
    Image, Progress, Tooltip, Row, Col, Alert, Badge,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
    CheckCircleOutlined, EyeOutlined, VideoCameraOutlined, UserOutlined,
    ReloadOutlined, FilterOutlined, WarningOutlined, BarChartOutlined,
    ThunderboltOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useRecognitions } from '../../hooks/useRecognitions';
import { useSignalRRecognition } from '../../hooks/useSignalRRecognition';
import { getRecognitions } from '../../api/recognitionApi';
import type { RecognitionDto } from '../../types/camera.types';
import { RecognitionStatus, RecognitionStatusLabel, RecognitionStatusColor } from '../../types/camera.types';
import { BASIC_URL } from '../../api';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const scoreColor = (s?: number) =>
    !s ? '#94a3b8' : s >= 0.8 ? '#16a34a' : s >= 0.6 ? '#d97706' : '#dc2626';

const buildImgUrl = (p: string) => `${BASIC_URL.replace(/\/api\/?$/, '')}/${p}`;

function StatCard({
    label,
    value,
    color,
    icon,
    bg,
}: {
    label: string;
    value: string | number;
    color: string;
    icon: React.ReactNode;
    bg: string;
}) {
    return (
        <div
            style={{
                background: bg,
                border: '1px solid var(--app-border)',
                borderRadius: 12,
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                boxShadow: '0 1px 4px rgba(15,23,42,.04)',
            }}
        >
            <div
                style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    flexShrink: 0,
                    background: `${color}18`,
                    border: `1px solid ${color}33`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color,
                    fontSize: 18,
                }}
            >
                {icon}
            </div>

            <div>
                <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 11, color: 'var(--app-muted)', marginTop: 2 }}>{label}</div>
            </div>
        </div>
    );
}

export default function RecognitionResultsPage() {
    const navigate = useNavigate();

    const {
        recognitions,
        isLoading,
        isError,
        isFetching,
        refetch,
        filters,
        updateFilter,
        clearFilters,
        stats,
    } = useRecognitions({ isMatch: true });

    const { events: liveEvents, isConnected } = useSignalRRecognition();

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

    const columns: ColumnsType<RecognitionDto> = [
        {
            title: 'لقطة',
            key: 'snapshot',
            width: 72,
            render: (_, r) =>
                r.snapshotPath ? (
                    <Image
                        src={buildImgUrl(r.snapshotPath)}
                        style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 8 }}
                        fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                        preview={{ mask: <EyeOutlined /> }}
                    />
                ) : (
                    <div
                        style={{
                            width: 50,
                            height: 50,
                            borderRadius: 8,
                            background: 'var(--app-surface-2)',
                            border: '1px solid var(--app-border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <UserOutlined style={{ color: '#94a3b8', fontSize: 18 }} />
                    </div>
                ),
        },
        {
            title: 'الشخص',
            key: 'person',
            render: (_, r) => (
                <div>
                    <Text strong style={{ fontSize: 13 }}>{r.personFullName ?? '—'}</Text>
                    {r.cameraName && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                            <VideoCameraOutlined style={{ color: '#94a3b8', fontSize: 11 }} />
                            <Text type="secondary" style={{ fontSize: 11 }}>{r.cameraName}</Text>
                        </div>
                    )}
                </div>
            ),
        },
        {
            title: 'نسبة التطابق',
            key: 'score',
            width: 130,
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
                            size="small"
                            showInfo={false}
                            style={{ margin: '3px 0 0' }}
                        />
                    )}
                </div>
            ),
        },
        {
            title: 'الحالة',
            key: 'status',
            width: 130,
            filters: [0, 1, 2, 3].map(v => ({ text: RecognitionStatusLabel[v], value: v })),
            onFilter: (val, r) => r.recognitionStatus === (val as number),
            render: (_, r) => (
                <Tag color={RecognitionStatusColor[r.recognitionStatus]} style={{ fontSize: 11 }}>
                    {RecognitionStatusLabel[r.recognitionStatus]}
                </Tag>
            ),
        },
        {
            title: 'التوقيت',
            key: 'time',
            width: 130,
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
            title: '',
            key: 'action',
            width: 90,
            render: (_, r) =>
                r.personId ? (
                    <Tooltip title="سجل هذا الشخص">
                        <Button
                            size="small"
                            type="primary"
                            icon={<EyeOutlined />}
                            onClick={e => {
                                e.stopPropagation();
                                navigate(`/recognition/person/${r.personId}`);
                            }}
                            style={{ borderRadius: 7, height: 28, fontSize: 11 }}
                        >
                            التفاصيل
                        </Button>
                    </Tooltip>
                ) : null,
        },
    ];

    return (
        <div
            style={{
                padding: '20px 24px',
                direction: 'rtl',
                background: 'var(--app-page-bg)',
                minHeight: '100vh',
            }}
        >

            {/* Header */}
            <div
                style={{
                    background: 'var(--app-surface)',
                    border: '1px solid var(--app-border)',
                    borderRadius: 16,
                    padding: '16px 22px',
                    marginBottom: 18,
                    boxShadow: 'var(--app-shadow)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 14,
                }}
            >
                <Space size={12} align="center">
                    <div
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: 11,
                            background: 'linear-gradient(135deg,var(--app-hero-start),var(--app-hero-end))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(22,163,74,.3)',
                        }}
                    >
                        <CheckCircleOutlined style={{ fontSize: 22, color: '#fff' }} />
                    </div>

                    <div>
                        <Title level={4} style={{ margin: 0 }}>سجل التعرف على الوجوه</Title>

                        <Space size={10} wrap>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                يعرض نتائج التعرف من جميع الأجهزة والكامرات
                            </Text>


                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span
                                    style={{
                                        width: 7,
                                        height: 7,
                                        borderRadius: '50%',
                                        display: 'inline-block',
                                        background: isConnected ? '#22c55e' : '#ef4444',
                                    }}
                                />
                                <Text style={{ fontSize: 11, color: isConnected ? '#16a34a' : '#dc2626' }}>
                                    SignalR {isConnected ? 'متصل' : 'منقطع'}
                                </Text>

                                {liveEvents.length > 0 && (
                                    <Badge
                                        count={liveEvents.length}
                                        style={{ background: '#16a34a', cursor: 'pointer' }}
                                        onClick={() => navigate('/cameras/results')}
                                    />
                                )}
                            </div>
                        </Space>
                    </div>
                </Space>

                <Space>
                    <Button
                        icon={<ThunderboltOutlined />}
                        onClick={() => navigate('/cameras/results')}
                        style={{ borderRadius: 9, height: 36 }}
                    >
                        المباشر
                    </Button>

                    <Button
                        icon={<ReloadOutlined spin={isFetching} />}
                        onClick={() => refetch()}
                        style={{ borderRadius: 9, height: 36 }}
                    >
                        تحديث
                    </Button>
                </Space>
            </div>

            {/* Stats */}
            <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                {[
                    {
                        label: 'إجمالي التعرفات',
                        value: recognitions.length,
                        color: '#2563eb',
                        bg: '#eff6ff',
                        icon: <BarChartOutlined />,
                    },
                    {
                        label: 'مؤكدة',
                        value: stats.confirmed,
                        color: '#16a34a',
                        bg: '#f0fdf4',
                        icon: <CheckCircleOutlined />,
                    },
                    {
                        label: 'قيد المراجعة',
                        value: stats.pending,
                        color: '#d97706',
                        bg: '#fefce8',
                        icon: <WarningOutlined />,
                    },
                    {
                        label: 'متوسط الدقة',
                        value: `${Math.round(stats.avgScore * 100)}%`,
                        color: '#7c3aed',
                        bg: '#faf5ff',
                        icon: <EyeOutlined />,
                    },
                ].map(s => (
                    <Col key={s.label} xs={12} sm={6}>
                        <StatCard {...s} />
                    </Col>
                ))}
            </Row>

            {/* Filters */}
            <div
                style={{
                    background: 'var(--app-surface)',
                    border: '1px solid var(--app-border)',
                    borderRadius: 12,
                    padding: '12px 18px',
                    marginBottom: 14,
                    display: 'flex',
                    gap: 10,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                }}
            >
                <FilterOutlined style={{ color: 'var(--app-muted)' }} />

                <Select
                    placeholder="جميع الكاميرات"
                    allowClear
                    style={{ width: 180 }}
                    onChange={v => updateFilter({ cameraId: v })}
                    options={cameraOptions}
                />

                <Select
                    placeholder="جميع الحالات"
                    allowClear
                    style={{ width: 160 }}
                    onChange={v => updateFilter({ status: v })}
                    options={[0, 1, 2, 3].map(v => ({ value: v, label: RecognitionStatusLabel[v] }))}
                />

                <RangePicker
                    onChange={(_, ds) => {
                        const [from, to] = ds;
                        updateFilter({ dateRange: from && to ? [from, to] : undefined });
                    }}
                    placeholder={['من تاريخ', 'إلى تاريخ']}
                    style={{ borderRadius: 8 }}
                />

                {(filters.cameraId || filters.status !== undefined || filters.dateRange) && (
                    <Button size="small" onClick={clearFilters} style={{ borderRadius: 7 }}>
                        مسح
                    </Button>
                )}
            </div>

            {isError && (
                <Alert
                    message="فشل تحميل السجل"
                    type="error"
                    showIcon
                    style={{ marginBottom: 14, borderRadius: 10 }}
                />
            )}

            {/* Table */}
            <div
                style={{
                    background: 'var(--app-surface)',
                    border: '1px solid var(--app-border)',
                    borderRadius: 14,
                    overflow: 'hidden',
                    boxShadow: 'var(--app-shadow)',
                }}
            >
                <Table<RecognitionDto>
                    columns={columns}
                    dataSource={recognitions}
                    rowKey="recognitionId"
                    loading={isLoading}
                    pagination={{
                        pageSize: 20,
                        showSizeChanger: true,
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