
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Table, Tag, Button, Space, Typography, Select, DatePicker,
    Image, Progress, Tooltip, Row, Col, Alert, Badge, Card,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { ReactNode } from 'react';
import {
    CheckCircleOutlined, EyeOutlined, VideoCameraOutlined, UserOutlined,
    ReloadOutlined, FilterOutlined, WarningOutlined, BarChartOutlined,
    ThunderboltOutlined, AlertOutlined, SafetyOutlined, EnvironmentOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useRecognitions } from '../../hooks/useRecognitions';
import { useSignalRRecognition } from '../../hooks/useSignalRRecognition';
import { getRecognitions } from '../../api/recognitionApi';
import type { RecognitionDto } from '../../types/camera.types';
import { RecognitionStatus, RecognitionStatusLabel, RecognitionStatusColor } from '../../types/camera.types';
import {
    DangerLevel,
    DangerLevelColor,
    DangerLevelLabel,
    PersonSecurityStatus,
    PersonSecurityStatusColor,
    PersonSecurityStatusLabel,
} from '../../types/person.types';
import { BASIC_URL } from '../../api';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

type RecognitionRow = RecognitionDto & {
    personDisplayName?: string;
    nationalId?: string;
    personIsActive?: boolean;
    hasSuspectRecord?: boolean;
    securityStatus?: PersonSecurityStatus;
    dangerLevel?: DangerLevel;
    hasActiveAlert?: boolean;
    isArmedAndDangerous?: boolean;
    securityReason?: string;
    caseNumber?: string;
    issuedBy?: string;
    lastSeenAt?: string;
    lastSeenLocation?: string;
    alertInstructions?: string;
    aliases?: string;
    vehicleInfo?: string;
};

const scoreColor = (s?: number) => !s ? '#94a3b8' : s >= 0.8 ? '#16a34a' : s >= 0.6 ? '#d97706' : '#dc2626';
const buildImgUrl = (p: string) => `${BASIC_URL.replace(/\/api\/?$/, '')}/${p.replace(/^\/+/, '')}`;

function StatCard({ label, value, color, icon, bg }: { label: string; value: string | number; color: string; icon: ReactNode; bg: string }) {
    return (
        <div style={{ background: bg, border: '1px solid var(--app-border)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 1px 4px rgba(15,23,42,.04)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: `${color}18`, border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, fontSize: 18 }}>{icon}</div>
            <div>
                <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 11, color: 'var(--app-muted)', marginTop: 2 }}>{label}</div>
            </div>
        </div>
    );
}

function PersonSecurityBadges({ row }: { row: RecognitionRow }) {
    return (
        <Space size={4} wrap style={{ marginTop: 6 }}>
            {row.securityStatus !== undefined && <Tag color={PersonSecurityStatusColor[row.securityStatus]}>{PersonSecurityStatusLabel[row.securityStatus]}</Tag>}
            {row.dangerLevel !== undefined && <Tag color={DangerLevelColor[row.dangerLevel]}>{DangerLevelLabel[row.dangerLevel]}</Tag>}
            {row.hasActiveAlert && <Tag color="error">تعميم فعال</Tag>}
            {row.isArmedAndDangerous && <Tag color="volcano">مسلح وخطر</Tag>}
            {row.personIsActive === false && <Tag>غير نشط</Tag>}
        </Space>
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

    const rows = useMemo(() => recognitions as RecognitionRow[], [recognitions]);
    const { events: liveEvents, isConnected } = useSignalRRecognition();

    const { data: recognitionCameraSource = [] } = useQuery<RecognitionDto[]>({
        queryKey: ['recognitions-camera-options'],
        queryFn: () => getRecognitions({ isMatch: true, pageSize: 500 }),
        staleTime: 60_000,
        refetchInterval: 60_000,
    });

    const cameraOptions = useMemo(() =>
        Array.from(new Map((recognitionCameraSource as RecognitionRow[])
            .filter(r => r.cameraId !== undefined && r.cameraId !== null)
            .map(r => [r.cameraId!, { value: r.cameraId!, label: r.cameraName?.trim() || `كاميرا #${r.cameraId}` }])).values())
            .sort((a, b) => a.label.localeCompare(b.label, 'ar')),
        [recognitionCameraSource]);

    const columns: ColumnsType<RecognitionRow> = [
        {
            title: 'لقطة', key: 'snapshot', width: 72,
            render: (_, r) => r.snapshotPath ? (
                <Image src={buildImgUrl(r.snapshotPath)} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 8 }} preview={{ mask: <EyeOutlined /> }} />
            ) : (
                <div style={{ width: 50, height: 50, borderRadius: 8, background: 'var(--app-surface-2)', border: '1px solid var(--app-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UserOutlined style={{ color: '#94a3b8', fontSize: 18 }} />
                </div>
            ),
        },
        {
            title: 'الشخص', key: 'person', width: 320,
            render: (_, r) => (
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <Text strong style={{ fontSize: 13 }}>{r.personFullName ?? '—'}</Text>
                        {r.personDisplayName && <Text type="secondary" style={{ fontSize: 11 }}>{r.personDisplayName}</Text>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                        {r.nationalId && <Text type="secondary" style={{ fontSize: 11 }}>هوية: {r.nationalId}</Text>}
                        {r.cameraName && <Text type="secondary" style={{ fontSize: 11 }}><VideoCameraOutlined style={{ marginLeft: 4 }} />{r.cameraName}</Text>}
                        {r.lastSeenLocation && <Text type="secondary" style={{ fontSize: 11 }}><EnvironmentOutlined style={{ marginLeft: 4 }} />{r.lastSeenLocation}</Text>}
                    </div>
                    <PersonSecurityBadges row={r} />
                </div>
            ),
        },
        {
            title: 'التطابق', key: 'score', width: 130,
            sorter: (a, b) => (a.recognitionScore ?? 0) - (b.recognitionScore ?? 0),
            render: (_, r) => (
                <div>
                    <Text style={{ color: scoreColor(r.recognitionScore), fontSize: 14, fontWeight: 700 }}>{r.recognitionScore ? `${Math.round(r.recognitionScore * 100)}%` : '—'}</Text>
                    {r.recognitionScore !== undefined && <Progress percent={Math.round(r.recognitionScore * 100)} strokeColor={scoreColor(r.recognitionScore)} size="small" showInfo={false} style={{ margin: '3px 0 0' }} />}
                </div>
            ),
        },
        {
            title: 'الحالة', key: 'status', width: 130,
            render: (_, r) => <Tag color={RecognitionStatusColor[r.recognitionStatus]}>{RecognitionStatusLabel[r.recognitionStatus]}</Tag>,
        },
        {
            title: 'أمنياً', key: 'security', width: 200,
            render: (_, r) => (
                <Space direction="vertical" size={3}>
                    {r.securityReason && <Text style={{ fontSize: 11 }}>السبب: {r.securityReason}</Text>}
                    {r.caseNumber && <Text type="secondary" style={{ fontSize: 11 }}>القضية: {r.caseNumber}</Text>}
                    {r.alertInstructions && <Text type="secondary" style={{ fontSize: 11 }}>التعليمات: {r.alertInstructions}</Text>}
                </Space>
            ),
        },
        {
            title: 'التوقيت', key: 'time', width: 130,
            sorter: (a, b) => new Date(a.recognitionDateTime).getTime() - new Date(b.recognitionDateTime).getTime(),
            defaultSortOrder: 'descend',
            render: (_, r) => (
                <div>
                    <Text style={{ fontSize: 13, fontFamily: 'monospace' }}>{dayjs(r.recognitionDateTime).format('HH:mm:ss')}</Text>
                    <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>{dayjs(r.recognitionDateTime).format('YYYY/MM/DD')}</Text>
                    {r.lastSeenAt && <Text type="secondary" style={{ fontSize: 10, display: 'block' }}>آخر ظهور: {dayjs(r.lastSeenAt).format('MM/DD HH:mm')}</Text>}
                </div>
            ),
        },
        {
            title: '', key: 'action', width: 90,
            render: (_, r) => r.personId ? (
                <Tooltip title="سجل هذا الشخص"><Button size="small" type="primary" icon={<EyeOutlined />} onClick={e => { e.stopPropagation(); navigate(`/recognition/person/${r.personId}`); }} style={{ borderRadius: 7, height: 28, fontSize: 11 }}>التفاصيل</Button></Tooltip>
            ) : null,
        },
    ];

    const latestEvents = liveEvents.slice(0, 4);

    return (
        <div style={{ padding: '20px 24px', direction: 'rtl', background: 'var(--app-page-bg)', minHeight: '100vh' }}>
            <div style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)', borderRadius: 16, padding: '16px 22px', marginBottom: 18, boxShadow: 'var(--app-shadow)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
                <Space size={12} align="center">
                    <div style={{ width: 44, height: 44, borderRadius: 11, background: 'linear-gradient(135deg,var(--app-hero-start),var(--app-hero-end))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(22,163,74,.3)' }}>
                        <CheckCircleOutlined style={{ fontSize: 22, color: '#fff' }} />
                    </div>
                    <div>
                        <Title level={4} style={{ margin: 0 }}>سجل التعرف على الوجوه</Title>
                        <Space size={10} wrap>
                            <Text type="secondary" style={{ fontSize: 12 }}>يعرض نتائج التعرف مع الحالة الأمنية والخطورة والتنبيهات</Text>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ width: 7, height: 7, borderRadius: '50%', display: 'inline-block', background: isConnected ? '#22c55e' : '#ef4444' }} />
                                <Text style={{ fontSize: 11, color: isConnected ? '#16a34a' : '#dc2626' }}>SignalR {isConnected ? 'متصل' : 'منقطع'}</Text>
                                {liveEvents.length > 0 && <Badge count={liveEvents.length} style={{ background: '#16a34a' }} />}
                            </div>
                        </Space>
                    </div>
                </Space>
                <Space>
                    <Button icon={<ThunderboltOutlined />} onClick={() => navigate('/cameras/results')} style={{ borderRadius: 9, height: 36 }}>المباشر</Button>
                    <Button icon={<ReloadOutlined spin={isFetching} />} onClick={() => refetch()} style={{ borderRadius: 9, height: 36 }}>تحديث</Button>
                </Space>
            </div>

            <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                {[
                    { label: 'إجمالي التعرفات', value: rows.length, color: '#2563eb', bg: '#eff6ff', icon: <BarChartOutlined /> },
                    { label: 'مؤكدة', value: stats.confirmed, color: '#16a34a', bg: '#f0fdf4', icon: <CheckCircleOutlined /> },
                    { label: 'تعاميم فعالة', value: stats.activeAlerts, color: '#dc2626', bg: '#fff5f5', icon: <AlertOutlined /> },
                    { label: 'حرجة', value: stats.critical, color: '#7f1d1d', bg: '#fef2f2', icon: <WarningOutlined /> },
                    { label: 'مطلوبون', value: stats.wanted, color: '#d97706', bg: '#fff7ed', icon: <SafetyOutlined /> },
                    { label: 'متوسط الدقة', value: `${Math.round(stats.avgScore * 100)}%`, color: '#7c3aed', bg: '#faf5ff', icon: <EyeOutlined /> },
                ].map(s => <Col key={s.label} xs={12} sm={8} md={6} lg={4}><StatCard {...s} /></Col>)}
            </Row>

            {latestEvents.length > 0 && (
                <Card size="small" title="آخر التنبيهات الحية" style={{ marginBottom: 16, borderRadius: 16 }}>
                    <Row gutter={[12, 12]}>
                        {latestEvents.map((evt, idx) => (
                            <Col xs={24} md={12} xl={6} key={`${evt.recognitionId ?? idx}-${evt.recognitionDateTime}`}>
                                <div style={{ border: '1px solid var(--app-border)', borderRadius: 12, padding: 12, background: evt.hasActiveAlert || evt.isArmedAndDangerous ? '#fff7ed' : 'var(--app-surface-2)' }}>
                                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                        {evt.primaryImageBase64 ? <Image src={`data:image/jpeg;base64,${evt.primaryImageBase64}`} preview={false} style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 10 }} /> : <div style={{ width: 52, height: 52, borderRadius: 10, background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><UserOutlined /></div>}
                                        <div style={{ minWidth: 0 }}>
                                            <Text strong ellipsis style={{ display: 'block' }}>{evt.personFullName ?? 'غير معروف'}</Text>
                                            <Text type="secondary" style={{ fontSize: 11 }}>{evt.cameraName ?? 'كاميرا'}</Text>
                                            <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>{dayjs(evt.recognitionDateTime).format('HH:mm:ss')}</Text>
                                        </div>
                                    </div>
                                    <Space wrap size={4} style={{ marginTop: 8 }}>
                                        {evt.securityStatus !== undefined && <Tag color={PersonSecurityStatusColor[evt.securityStatus]}>{PersonSecurityStatusLabel[evt.securityStatus]}</Tag>}
                                        {evt.dangerLevel !== undefined && <Tag color={DangerLevelColor[evt.dangerLevel]}>{DangerLevelLabel[evt.dangerLevel]}</Tag>}
                                        {evt.hasActiveAlert && <Tag color="error">تعميم</Tag>}
                                    </Space>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </Card>
            )}

            <div style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)', borderRadius: 12, padding: '12px 18px', marginBottom: 14, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <FilterOutlined style={{ color: 'var(--app-muted)' }} />
                <Select placeholder="جميع الكاميرات" allowClear style={{ width: 180 }} onChange={v => updateFilter({ cameraId: v })} options={cameraOptions} />
                <Select placeholder="جميع الحالات" allowClear style={{ width: 160 }} onChange={v => updateFilter({ status: v })} options={[0, 1, 2, 3].map(v => ({ value: v, label: RecognitionStatusLabel[v] }))} />
                <RangePicker onChange={(_, ds) => { const [from, to] = ds; updateFilter({ dateRange: from && to ? [from, to] : undefined }); }} placeholder={['من تاريخ', 'إلى تاريخ']} style={{ borderRadius: 8 }} />
                {(filters.cameraId || filters.status !== undefined || filters.dateRange) && <Button size="small" onClick={clearFilters} style={{ borderRadius: 7 }}>مسح</Button>}
            </div>

            {isError && <Alert message="فشل تحميل السجل" type="error" showIcon style={{ marginBottom: 14, borderRadius: 10 }} />}

            <div style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--app-shadow)' }}>
                <Table<RecognitionRow>
                    columns={columns}
                    dataSource={rows}
                    rowKey="recognitionId"
                    loading={isLoading}
                    pagination={{ pageSize: 20, showSizeChanger: true, pageSizeOptions: ['10', '20', '50', '100'], showTotal: total => <Text type="secondary">{total} نتيجة</Text> }}
                    onRow={r => ({ onClick: () => r.personId && navigate(`/recognition/person/${r.personId}`), style: { cursor: r.personId ? 'pointer' : 'default', background: r.dangerLevel === DangerLevel.Critical ? '#fff7f7' : r.hasActiveAlert ? '#fffdf5' : undefined } })}
                    style={{ direction: 'rtl' }}
                    scroll={{ x: 1200 }}
                />
            </div>
        </div>
    );
}
