import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Table,
    Tag,
    Button,
    Space,
    Typography,
    Select,
    DatePicker,
    Image,
    Progress,
    Tooltip,
    Alert,
    Badge,
    Card,
    Avatar,
    Empty,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { ReactNode } from 'react';
import {
    CheckCircleOutlined,
    EyeOutlined,
    VideoCameraOutlined,
    UserOutlined,
    ReloadOutlined,
    FilterOutlined,
    WarningOutlined,
    BarChartOutlined,
    ThunderboltOutlined,
    AlertOutlined,
    SafetyOutlined,
    EnvironmentOutlined,
    ExclamationCircleOutlined,
    ScanOutlined,
    AimOutlined,
    ClockCircleOutlined,
    RadarChartOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useRecognitions } from '../../hooks/useRecognitions';
import { useSignalRRecognition } from '../../hooks/useSignalRRecognition';
import { getRecognitions } from '../../api/recognitionApi';
import type { RecognitionDto } from '../../types/camera.types';
import { RecognitionStatusLabel, RecognitionStatusColor } from '../../types/camera.types';
import {
    DangerLevel,
    DangerLevelColor,
    DangerLevelLabel,
    PersonSecurityStatus,
    PersonSecurityStatusColor,
    PersonSecurityStatusLabel,
} from '../../types/person.types';
import { buildImgUrl } from '../../Interfaces/functions';

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



const scoreColor = (s?: number) => (!s ? '#94a3b8' : s >= 0.8 ? '#16a34a' : s >= 0.6 ? '#d97706' : '#dc2626');

const dangerTone: Record<number, { bg: string; border: string; color: string }> = {
    [DangerLevel.None]: { bg: '#f8fafc', border: '#e2e8f0', color: '#475569' },
    [DangerLevel.Low]: { bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d' },
    [DangerLevel.Medium]: { bg: '#fffbeb', border: '#fde68a', color: '#b45309' },
    [DangerLevel.High]: { bg: '#fff7ed', border: '#fdba74', color: '#c2410c' },
    [DangerLevel.Critical]: { bg: '#fff1f2', border: '#fecaca', color: '#dc2626' },
};

const securityTone: Record<number, { bg: string; border: string; color: string }> = {
    [PersonSecurityStatus.Normal]: { bg: '#f8fafc', border: '#e2e8f0', color: '#475569' },
    [PersonSecurityStatus.Suspect]: { bg: '#fff7ed', border: '#fdba74', color: '#c2410c' },
    [PersonSecurityStatus.Wanted]: { bg: '#fff1f2', border: '#fecaca', color: '#dc2626' },
    [PersonSecurityStatus.WantedAndSuspect]: { bg: '#fff1f2', border: '#fda4af', color: '#be123c' },
    [PersonSecurityStatus.Arrested]: { bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8' },
    [PersonSecurityStatus.Closed]: { bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d' },
};

function Pill({
    text,
    tone,
    icon,
}: {
    text: string;
    tone?: { bg: string; border: string; color: string };
    icon?: ReactNode;
}) {
    const t = tone ?? { bg: '#f8fafc', border: '#e2e8f0', color: '#475569' };
    return (
        <span className="pill" style={{ background: t.bg, borderColor: t.border, color: t.color }}>
            {icon}
            {text}
        </span>
    );
}

function isRiskyRow(row: RecognitionRow | any): boolean {
    return !!row?.hasActiveAlert || !!row?.isArmedAndDangerous || (row?.dangerLevel ?? DangerLevel.None) >= DangerLevel.High;
}

function StatMini({
    label,
    value,
    color,
    icon,
    bg,
}: {
    label: string;
    value: string | number;
    color: string;
    icon: ReactNode;
    bg: string;
}) {
    return (
        <div className="metric-card" style={{ background: bg, borderColor: `${color}22` }}>
            <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
                <div>
                    <div className="metric-value" style={{ color }}>{value}</div>
                    <div className="metric-label">{label}</div>
                </div>
                <Avatar shape="square" size={38} style={{ background: `${color}16`, color, borderRadius: 12 }} icon={icon as any} />
            </Space>
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

    const rows = useMemo(() => recognitions as RecognitionRow[], [recognitions]);
    const { events: liveEvents, isConnected } = useSignalRRecognition();
    const statBag = stats as any;
    const latestEvents = ((liveEvents as any[]) ?? []).slice(0, 5);

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
                    (recognitionCameraSource as RecognitionRow[])
                        .filter((r) => r.cameraId !== undefined && r.cameraId !== null)
                        .map((r) => [
                            r.cameraId!,
                            { value: r.cameraId!, label: r.cameraName?.trim() || `كاميرا #${r.cameraId}` },
                        ]),
                ).values(),
            ).sort((a, b) => a.label.localeCompare(b.label, 'ar')),
        [recognitionCameraSource],
    );

    const columns: ColumnsType<RecognitionRow> = [
        {
            title: 'لقطة',
            key: 'snapshot',
            width: 86,
            render: (_, r) =>
                r.snapshotPath ? (
                    <Image
                        src={buildImgUrl(r.snapshotPath)}
                        style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 12 }}
                        preview={{ mask: <EyeOutlined /> }}
                    />
                ) : (
                    <div
                        style={{
                            width: 56,
                            height: 56,
                            borderRadius: 12,
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
            title: 'الشخص والكاميرا',
            key: 'person',
            width: 340,
            render: (_, r) => {
                const securityStatus = (r.securityStatus ?? PersonSecurityStatus.Normal) as PersonSecurityStatus;
                const dangerLevel = (r.dangerLevel ?? DangerLevel.None) as DangerLevel;
                return (
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <Text strong style={{ fontSize: 13 }}>{r.personFullName ?? '—'}</Text>
                            {r.personDisplayName && <Text type="secondary" style={{ fontSize: 11 }}>{r.personDisplayName}</Text>}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                            {r.nationalId && <Text type="secondary" style={{ fontSize: 11 }}>هوية: {r.nationalId}</Text>}
                            {r.cameraName && (
                                <Text type="secondary" style={{ fontSize: 11 }}>
                                    <VideoCameraOutlined style={{ marginLeft: 4 }} />
                                    {r.cameraName}
                                </Text>
                            )}
                            {r.lastSeenLocation && (
                                <Text type="secondary" style={{ fontSize: 11 }}>
                                    <EnvironmentOutlined style={{ marginLeft: 4 }} />
                                    {r.lastSeenLocation}
                                </Text>
                            )}
                        </div>

                        <Space size={[6, 6]} wrap style={{ marginTop: 6 }}>
                            <Pill text={PersonSecurityStatusLabel[securityStatus]} tone={securityTone[securityStatus]} icon={<SafetyOutlined />} />
                            <Pill text={DangerLevelLabel[dangerLevel]} tone={dangerTone[dangerLevel]} icon={<ExclamationCircleOutlined />} />
                            {r.hasActiveAlert && <Pill text="تعميم فعّال" tone={{ bg: '#fff1f2', border: '#fecaca', color: '#dc2626' }} icon={<AlertOutlined />} />}
                            {r.isArmedAndDangerous && <Pill text="مسلح وخطر" tone={{ bg: '#fff7ed', border: '#fdba74', color: '#c2410c' }} />}
                        </Space>
                    </div>
                );
            },
        },
        {
            title: 'التطابق',
            key: 'score',
            width: 150,
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
                            style={{ margin: '5px 0 0' }}
                        />
                    )}
                </div>
            ),
        },
        {
            title: 'النتيجة',
            key: 'status',
            width: 120,
            render: (_, r) => <Tag color={RecognitionStatusColor[r.recognitionStatus]}>{RecognitionStatusLabel[r.recognitionStatus]}</Tag>,
        },
        {
            title: 'المعلومات الأمنية',
            key: 'security',
            width: 240,
            render: (_, r) => (
                <div className="info-strip">
                    {r.securityReason ? (
                        <div className="info-box">
                            <div className="k">السبب</div>
                            <div className="v">{r.securityReason}</div>
                        </div>
                    ) : null}

                    {r.caseNumber ? (
                        <div className="info-box">
                            <div className="k">رقم القضية</div>
                            <div className="v">{r.caseNumber}</div>
                        </div>
                    ) : null}

                    {r.alertInstructions ? (
                        <div className="info-box" style={{ gridColumn: '1 / -1' }}>
                            <div className="k">التعليمات</div>
                            <div className="v">{r.alertInstructions}</div>
                        </div>
                    ) : null}

                    {!r.securityReason && !r.caseNumber && !r.alertInstructions && (
                        <Text type="secondary" style={{ fontSize: 12 }}>—</Text>
                    )}
                </div>
            ),
        },
        {
            title: 'التوقيت',
            key: 'time',
            width: 150,
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
                    {r.lastSeenAt && (
                        <Text type="secondary" style={{ fontSize: 10, display: 'block' }}>
                            آخر ظهور: {dayjs(r.lastSeenAt).format('MM/DD HH:mm')}
                        </Text>
                    )}
                </div>
            ),
        },
        {
            title: '',
            key: 'action',
            width: 96,
            render: (_, r) =>
                r.personId ? (
                    <Tooltip title="سجل هذا الشخص">
                        <Button
                            size="small"
                            type="primary"
                            ghost
                            icon={<EyeOutlined />}
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/recognition/person/${r.personId}`);
                            }}
                            style={{ borderRadius: 10, height: 30, fontWeight: 700 }}
                        >
                            التفاصيل
                        </Button>
                    </Tooltip>
                ) : null,
        },
    ];

    return (
        <div className="rec-shell">
          

            <div className="rec-hero">
                <Space align="center" size={16} wrap style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Space align="center" size={16} wrap>
                        <div className="rec-hero-badge">
                            <ScanOutlined style={{ fontSize: 28, color: '#fff' }} />
                        </div>

                        <div>
                            <Title level={2} style={{ margin: 0, color: '#fff', fontWeight: 900 }}>
                                سجل التعرف على الوجوه
                            </Title>
                            <Text style={{ color: 'rgba(255,255,255,.86)', fontSize: 13 }}>
                                واجهة تحليل شاملة للنتائج مع الإنذارات الأمنية والخطورة والكامرات والتحديثات الحية.
                            </Text>
                        </div>
                    </Space>

                    <Space size={8} wrap>
                        <Button
                            icon={<ThunderboltOutlined />}
                            onClick={() => navigate('/cameras/results')}
                            style={{ borderRadius: 12, height: 40 }}
                        >
                            المباشر
                        </Button>

                        <Button
                            icon={<ReloadOutlined spin={isFetching} />}
                            onClick={() => refetch()}
                            style={{ borderRadius: 12, height: 40 }}
                        >
                            تحديث
                        </Button>
                    </Space>
                </Space>
            </div>

            <div className="metrics-strip">
                <div className="metric-wrap">
                    <StatMini label="إجمالي التعرفات" value={rows.length} color="#2563eb" bg="#eff6ff" icon={<BarChartOutlined />} />
                </div>
                <div className="metric-wrap">
                    <StatMini label="مؤكدة" value={statBag.confirmed ?? 0} color="#16a34a" bg="#f0fdf4" icon={<CheckCircleOutlined />} />
                </div>
                <div className="metric-wrap">
                    <StatMini label="تعاميم فعالة" value={statBag.activeAlerts ?? 0} color="#dc2626" bg="#fff5f5" icon={<AlertOutlined />} />
                </div>
                <div className="metric-wrap">
                    <StatMini label="حرجة" value={statBag.critical ?? 0} color="#7f1d1d" bg="#fef2f2" icon={<WarningOutlined />} />
                </div>
                <div className="metric-wrap">
                    <StatMini label="مطلوبون" value={statBag.wanted ?? 0} color="#d97706" bg="#fff7ed" icon={<SafetyOutlined />} />
                </div>
                <div className="metric-wrap">
                    <StatMini label="متوسط الدقة" value={`${Math.round((statBag.avgScore ?? 0) * 100)}%`} color="#7c3aed" bg="#faf5ff" icon={<AimOutlined />} />
                </div>
            </div>

            {latestEvents.length > 0 && (
                <Card
                    className="rec-card"
                    title={
                        <div className="section-title">
                            <ClockCircleOutlined style={{ color: '#dc2626' }} />
                            <span>آخر التنبيهات الحية</span>
                            <Badge count={latestEvents.length} size="small" />
                        </div>
                    }
                    style={{ marginBottom: 18 }}
                    extra={
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {isConnected ? 'متصل الآن' : 'غير متصل'}
                        </Text>
                    }
                >
                    <div className="alerts-strip">
                        {latestEvents.map((evt, idx) => {
                            const e = evt as any;
                            const risky = isRiskyRow(e);
                            const sec = (e.securityStatus ?? PersonSecurityStatus.Normal) as PersonSecurityStatus;
                            const danger = (e.dangerLevel ?? DangerLevel.None) as DangerLevel;
                            return (
                                <div
                                    key={`${e.recognitionId ?? idx}-${e.recognitionDateTime}`}
                                    className={`live-item${risky ? ' risky' : ''}`}
                                >
                                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                        {e.primaryImageBase64 ? (
                                            <Image
                                                src={`data:image/jpeg;base64,${e.primaryImageBase64}`}
                                                preview={false}
                                                style={{ width: 54, height: 54, objectFit: 'cover', borderRadius: 12 }}
                                            />
                                        ) : (
                                            <Avatar size={54} icon={<UserOutlined />} style={{ background: '#eff6ff', color: '#2563eb' }} />
                                        )}

                                        <div style={{ minWidth: 0 }}>
                                            <Text strong ellipsis style={{ display: 'block' }}>
                                                {e.personFullName ?? 'غير معروف'}
                                            </Text>
                                            <Text type="secondary" style={{ fontSize: 11 }}>
                                                {e.cameraName ?? 'كاميرا'}
                                            </Text>
                                            <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                                                {dayjs(e.recognitionDateTime).format('HH:mm:ss')}
                                            </Text>
                                        </div>
                                    </div>

                                    <Space size={[6, 6]} wrap style={{ marginTop: 10 }}>
                                        <Pill text={PersonSecurityStatusLabel[sec]} tone={securityTone[sec]} icon={<SafetyOutlined />} />
                                        <Pill text={DangerLevelLabel[danger]} tone={dangerTone[danger]} icon={<ExclamationCircleOutlined />} />
                                        {e.hasActiveAlert && <Pill text="تعميم" tone={{ bg: '#fff1f2', border: '#fecaca', color: '#dc2626' }} />}
                                    </Space>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            )}

            {isError && (
                <Alert
                    message="فشل تحميل السجل"
                    type="error"
                    showIcon
                    style={{ marginBottom: 14, borderRadius: 16 }}
                />
            )}

            <Card
                className="rec-card"
                title={
                    <div className="section-title">
                        <EyeOutlined style={{ color: '#7c3aed' }} />
                        <span>النتائج التفصيلية</span>
                    </div>
                }
                extra={
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {rows.length} نتيجة
                    </Text>
                }
            >
                <div className="filter-row">
                    <div className="filter-item">
                        <Select
                            placeholder="جميع الكاميرات"
                            allowClear
                            size="large"
                            onChange={(v) => updateFilter({ cameraId: v })}
                            options={cameraOptions}
                        />
                    </div>

                    <div className="filter-item">
                        <Select
                            placeholder="جميع الحالات"
                            allowClear
                            size="large"
                            onChange={(v) => updateFilter({ status: v })}
                            options={[0, 1, 2, 3].map((v) => ({ value: v, label: RecognitionStatusLabel[v] }))}
                        />
                    </div>

                    <div className="filter-item date">
                        <RangePicker
                            size="large"
                            style={{ width: '100%' }}
                            onChange={(_, ds) => {
                                const [from, to] = ds;
                                updateFilter({ dateRange: from && to ? [from, to] : undefined });
                            }}
                            placeholder={['من تاريخ', 'إلى تاريخ']}
                        />
                    </div>

                    {(filters.cameraId || filters.status !== undefined || filters.dateRange) && (
                        <div className="filter-item" style={{ flex: '0 0 150px', minWidth: 150 }}>
                            <Button onClick={clearFilters} block>
                                مسح الفلاتر
                            </Button>
                        </div>
                    )}

                    <div className="filter-item" style={{ flex: '0 0 210px', minWidth: 210 }}>
                        <Alert
                            type={isConnected ? 'success' : 'warning'}
                            showIcon
                            message={isConnected ? 'الاتصال الحي يعمل' : 'الاتصال الحي منقطع'}
                            style={{ borderRadius: 12, padding: '8px 12px' }}
                        />
                    </div>
                </div>

                <div className="table-wrap">
                    <Table<RecognitionRow>
                        columns={columns}
                        dataSource={rows}
                        rowKey="recognitionId"
                        loading={isLoading}
                        pagination={{
                            pageSize: 20,
                            showSizeChanger: true,
                            pageSizeOptions: ['10', '20', '50', '100'],
                            showTotal: (total) => <Text type="secondary">{total} نتيجة</Text>,
                        }}
                        onRow={(r) => ({
                            onClick: () => r.personId && navigate(`/recognition/person/${r.personId}`),
                            style: {
                                cursor: r.personId ? 'pointer' : 'default',
                                background:
                                    r.dangerLevel === DangerLevel.Critical
                                        ? '#fff7f7'
                                        : r.hasActiveAlert
                                            ? '#fffdf5'
                                            : undefined,
                            },
                        })}
                        scroll={{ x: 1380 }}
                        style={{ width: '100%' }}
                    />
                </div>
            </Card>
        </div>
    );
}
