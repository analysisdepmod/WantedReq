import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Row,
    Col,
    Typography,
    Space,
    Spin,
    Tag,
    Button,
    Image,
    Progress,
    DatePicker,
    Table,
    Avatar,
 
    Timeline,
    Alert,
    Card,
    Descriptions,
    Badge,
    Empty,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
    ArrowRightOutlined,
    EyeOutlined,
    VideoCameraOutlined,
    UserOutlined,
    CheckCircleOutlined,
    WarningOutlined,
    ClockCircleOutlined,
    EnvironmentOutlined,
    BarChartOutlined,
    AimOutlined,
    RadarChartOutlined,

    PhoneOutlined,

    FileTextOutlined,
    AlertOutlined,
    ThunderboltOutlined,
    TeamOutlined,
    CalendarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { usePersonRecognitions } from '../../hooks/useRecognitions';
import { getPersonById } from '../../api/personsApi';
import type { RecognitionDto } from '../../types/camera.types';
import { RecognitionStatusLabel, RecognitionStatusColor } from '../../types/camera.types';
import {
    DangerLevel,
    DangerLevelColor,
    DangerLevelLabel,
    Gender,
    GenderLabel,
    PersonSecurityStatus,
    PersonSecurityStatusColor,
    PersonSecurityStatusLabel,
} from '../../types/person.types';
import { buildImgUrl } from '../../Interfaces/functions';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;



const scoreColor = (s?: number) =>
    !s ? '#94a3b8' : s >= 0.8 ? '#16a34a' : s >= 0.6 ? '#d97706' : '#dc2626';

type RecognitionRow = RecognitionDto & {
    securityStatus?: PersonSecurityStatus;
    dangerLevel?: DangerLevel;
    hasActiveAlert?: boolean;
    isArmedAndDangerous?: boolean;
    lastSeenAt?: string;
    lastSeenLocation?: string;
    securityReason?: string;
    alertInstructions?: string;
};

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
                <div style={{ fontSize: 18, color, fontWeight: 900, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 11, color: 'var(--app-muted)', marginTop: 6 }}>{label}</div>
            </div>

            <div
                className="stat-icon"
                style={{
                    background: bg,
                    borderColor: border,
                    color,
                }}
            >
                {icon}
            </div>
        </div>
    );
}

function MovementMap({ records }: { records: RecognitionRow[] }) {
    if (records.length < 2) {
        return (
            <div
                style={{
                    height: 220,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--app-surface-2)',
                    borderRadius: 18,
                    border: '1px dashed #dbe7f0',
                }}
            >
                <Space direction="vertical" style={{ textAlign: 'center' }}>
                    <RadarChartOutlined style={{ fontSize: 34, color: '#cbd5e1' }} />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        يحتاج أكثر من تعرف لرسم المسار
                    </Text>
                </Space>
            </div>
        );
    }

    const cameras = records
        .filter((r, i, a) => a.findIndex((x) => x.cameraId === r.cameraId) === i)
        .map((r, i) => ({
            id: r.cameraId,
            name: r.cameraName ?? `CAM-${r.cameraId}`,
            x: 60 + (i % 4) * 160,
            y: 60 + Math.floor(i / 4) * 100,
        }));

    const H = 60 + Math.ceil(cameras.length / 4) * 100 + 40;
    const path = [...records]
        .sort((a, b) => new Date(a.recognitionDateTime).getTime() - new Date(b.recognitionDateTime).getTime())
        .map((r) => cameras.find((c) => c.id === r.cameraId))
        .filter(Boolean) as typeof cameras;

    const d = path.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    return (
        <div
            style={{
                background: 'linear-gradient(135deg,var(--app-surface-2),var(--app-soft-blue))',
                borderRadius: 18,
                border: '1px solid var(--app-border)',
                overflow: 'hidden',
                position: 'relative',
            }}
        >
            <div
                style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--app-border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                }}
            >
                <AimOutlined style={{ color: '#2563eb' }} />
                <Text strong style={{ fontSize: 13 }}>
                    مسار الحركة
                </Text>
            </div>

            <svg
                width="100%"
                height={H}
                viewBox={`0 0 ${Math.max(640, cameras.length * 160)} ${H}`}
                style={{ display: 'block' }}
            >
                <path d={d} fill="none" stroke="#2563eb" strokeWidth={2.5} opacity={0.7} />
                {cameras.map((cam) => (
                    <g key={cam.id}>
                        <circle cx={cam.x} cy={cam.y} r={18} fill="#fff" stroke="#2563eb" strokeWidth={2.5} />
                        <text x={cam.x} y={cam.y + 5} textAnchor="middle" fontSize={13}>
                            📷
                        </text>
                        <text
                            x={cam.x}
                            y={cam.y + 34}
                            textAnchor="middle"
                            fontSize={10}
                            fill="#475569"
                            fontWeight="600"
                        >
                            {cam.name.length > 10 ? cam.name.slice(0, 10) + '…' : cam.name}
                        </text>
                    </g>
                ))}
            </svg>
        </div>
    );
}

function MovementTimeline({ records }: { records: RecognitionRow[] }) {
    const sorted = [...records].sort(
        (a, b) => new Date(a.recognitionDateTime).getTime() - new Date(b.recognitionDateTime).getTime(),
    );

    return (
        <Timeline mode="right" style={{ direction: 'rtl' }}>
            {sorted.map((rec) => (
                <Timeline.Item key={rec.recognitionId} color={scoreColor(rec.recognitionScore)}>
                    <div
                        style={{
                            background: 'var(--app-surface)',
                            border: '1px solid var(--app-border)',
                            borderRadius: 12,
                            padding: '10px 12px',
                            marginBottom: 4,
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                            <Text strong style={{ fontSize: 12 }}>
                                {rec.cameraName ?? '—'}
                            </Text>

                            <Text style={{ fontSize: 11, color: '#94a3b8' }} className="phone-block">
                                {dayjs(rec.recognitionDateTime).format('HH:mm:ss')}
                            </Text>
                        </div>

                        {rec.recognitionScore !== undefined && (
                            <Text
                                style={{
                                    fontSize: 11,
                                    color: scoreColor(rec.recognitionScore),
                                    fontWeight: 600,
                                }}
                            >
                                {Math.round(rec.recognitionScore * 100)}% تطابق
                            </Text>
                        )}

                        {rec.locationDescription && (
                            <div style={{ fontSize: 11, color: 'var(--app-muted)', marginTop: 4 }}>
                                <EnvironmentOutlined style={{ marginLeft: 4 }} />
                                {rec.locationDescription}
                            </div>
                        )}
                    </div>
                </Timeline.Item>
            ))}
        </Timeline>
    );
}

export default function PersonRecognitionsPage() {
    const { personId } = useParams<{ personId: string }>();
    const pid = Number(personId);
    const navigate = useNavigate();
    const [dateRange, setDateRange] = useState<[string, string] | undefined>();

    const { recognitions, isLoading, isFetching, refetch, stats } = usePersonRecognitions(pid);
    const { data: person } = useQuery({
        queryKey: ['person', pid],
        queryFn: () => getPersonById(pid),
        enabled: !!pid,
    });

    const rows = recognitions as RecognitionRow[];

    const filtered = useMemo(() => {
        if (!dateRange) return rows;
        return rows.filter((r) => {
            const d = dayjs(r.recognitionDateTime);
            return d.isAfter(dateRange[0]) && d.isBefore(dayjs(dateRange[1]).add(1, 'day'));
        });
    }, [rows, dateRange]);

    const columns: ColumnsType<RecognitionRow> = [
        {
            title: 'لقطة',
            key: 'snap',
            width: 76,
            render: (_, r) =>
                r.snapshotPath ? (
                    <Image
                        src={buildImgUrl(r.snapshotPath)}
                        style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 10 }}
                        preview={{ mask: <EyeOutlined /> }}
                    />
                ) : (
                    <div
                        style={{
                            width: 52,
                            height: 52,
                            borderRadius: 10,
                            background: 'var(--app-surface-2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <UserOutlined style={{ color: '#94a3b8' }} />
                    </div>
                ),
        },
        {
            title: 'الكاميرا',
            key: 'cam',
            width: 170,
            render: (_, r) => (
                <Space size={6}>
                    <VideoCameraOutlined style={{ color: '#94a3b8', fontSize: 12 }} />
                    <Text style={{ fontSize: 13 }}>{r.cameraName ?? '—'}</Text>
                </Space>
            ),
        },
        {
            title: 'الدقة',
            key: 'score',
            width: 140,
            render: (_, r) => (
                <div>
                    <Text style={{ color: scoreColor(r.recognitionScore), fontWeight: 700, fontSize: 13 }}>
                        {r.recognitionScore ? `${Math.round(r.recognitionScore * 100)}%` : '—'}
                    </Text>

                    {r.recognitionScore && (
                        <Progress
                            percent={Math.round(r.recognitionScore * 100)}
                            strokeColor={scoreColor(r.recognitionScore)}
                            size="small"
                            showInfo={false}
                            style={{ margin: '4px 0 0' }}
                        />
                    )}
                </div>
            ),
        },
        {
            title: 'الحالة',
            key: 'status',
            width: 130,
            render: (_, r) => (
                <Tag color={RecognitionStatusColor[r.recognitionStatus]}>
                    {RecognitionStatusLabel[r.recognitionStatus]}
                </Tag>
            ),
        },
        {
            title: 'الموقع',
            key: 'location',
            width: 220,
            render: (_, r) => (
                <div>
                    <Text style={{ fontSize: 12, display: 'block' }}>{r.locationDescription || '—'}</Text>
                    <Text type="secondary" style={{ fontSize: 10, display: 'block', marginTop: 4 }}>
                        {r.lastSeenLocation || '—'}
                    </Text>
                </div>
            ),
        },
        {
            title: 'الوقت',
            key: 'time',
            width: 150,
            render: (_, r) => (
                <div>
                    <Text style={{ fontSize: 13 }} className="phone-block">
                        {dayjs(r.recognitionDateTime).format('HH:mm:ss')}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                        {dayjs(r.recognitionDateTime).format('YYYY/MM/DD')}
                    </Text>
                </div>
            ),
        },
    ];

    if (isLoading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <Spin size="large" />
            </div>
        );
    }

    const p: any = person;
    const primaryImg =
        p?.faceImages?.find((f: any) => f.isPrimary)?.faceProcessedImage ??
        p?.faceImages?.[0]?.faceProcessedImage;

    return (
        <div className="rec-shell">
         

            {(p?.hasActiveAlert || p?.isArmedAndDangerous || p?.dangerLevel === DangerLevel.Critical) && (
                <Alert
                    type="error"
                    showIcon
                    style={{ marginBottom: 16, borderRadius: 16 }}
                    message="تنبيه أمني مهم"
                    description={
                        p?.alertInstructions ||
                        p?.securityReason ||
                        'هذا الشخص يحمل حالة أمنية مهمة وتتطلب مراجعة فورية.'
                    }
                />
            )}

            <div className="rec-hero">
                <div className="rec-hero-inner">
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                        <div className="hero-badge">
                            <RadarChartOutlined style={{ fontSize: 28, color: '#fff' }} />
                        </div>

                        <div>
                            <Title level={2} style={{ margin: 0, color: '#fff', fontWeight: 900 }}>
                                سجل تعرف الشخص
                            </Title>
                            <Text style={{ color: 'rgba(255,255,255,.86)', fontSize: 13 }}>
                                تتبع رصد الشخص عبر الكاميرات مع المسار والبيانات الأمنية والملخص الزمني.
                            </Text>
                        </div>
                    </div>

                    <div className="hero-actions">
                        <Button className="hero-btn" icon={<ArrowRightOutlined />} onClick={() => navigate(-1)}>
                            رجوع
                        </Button>

                        <Button className="hero-btn" icon={<EyeOutlined />} onClick={() => navigate(`/persons/${pid}`)}>
                            الملف الكامل
                        </Button>

                        <Button
                            className="hero-btn"
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            onClick={() => refetch()}
                            loading={isFetching}
                        >
                            تحديث
                        </Button>
                    </div>
                </div>
            </div>

            <Row gutter={[14, 14]} className="stats-grid">
                <Col xs={12} md={8} lg={6}>
                    <StatCard
                        label="إجمالي التعرفات"
                        value={rows.length}
                        color="#2563eb"
                        bg="#eff6ff"
                        border="#bfdbfe"
                        icon={<BarChartOutlined />}
                    />
                </Col>

                <Col xs={12} md={8} lg={6}>
                    <StatCard
                        label="مؤكدة"
                        value={stats.confirmed}
                        color="#16a34a"
                        bg="#f0fdf4"
                        border="#bbf7d0"
                        icon={<CheckCircleOutlined />}
                    />
                </Col>

                <Col xs={12} md={8} lg={6}>
                    <StatCard
                        label="كاميرات مختلفة"
                        value={stats.cameras.length}
                        color="#7c3aed"
                        bg="#faf5ff"
                        border="#ddd6fe"
                        icon={<VideoCameraOutlined />}
                    />
                </Col>

                <Col xs={12} md={8} lg={6}>
                    <StatCard
                        label="متوسط الدقة"
                        value={`${Math.round(stats.avgScore * 100)}%`}
                        color="#d97706"
                        bg="#fefce8"
                        border="#fde68a"
                        icon={<AimOutlined />}
                    />
                </Col>
            </Row>

            <Row gutter={[18, 18]} align="stretch">
                <Col xs={24} xl={8}>
                    <Space direction="vertical" size={18} style={{ width: '100%' }}>
                        <Card
                            className="surface-card"
                            title={
                                <div className="section-title">
                                    <TeamOutlined style={{ color: '#2563eb' }} />
                                    <span>ملخص الشخص</span>
                                </div>
                            }
                        >
                            <div className="profile-box">
                                <Avatar
                                    size={84}
                                    src={primaryImg ? `data:image/jpeg;base64,${primaryImg}` : undefined}
                                    icon={<UserOutlined />}
                                    style={{
                                        background: 'var(--app-soft-blue)',
                                        color: '#2563eb',
                                        border: `3px solid ${(p?.hasActiveAlert || p?.isArmedAndDangerous) ? '#fca5a5' : '#bfdbfe'}`,
                                        flexShrink: 0,
                                    }}
                                />

                                <div style={{ minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                        <Title level={4} style={{ margin: 0 }}>
                                            {p?.fullName ?? `شخص #${pid}`}
                                        </Title>

                                        <Tag color={p?.isActive ? 'success' : 'error'} className="small-chip">
                                            {p?.isActive ? 'نشط' : 'غير نشط'}
                                        </Tag>

                                        {p?.gender !== undefined && (
                                            <Tag color={p.gender === Gender.Male ? 'blue' : 'pink'} className="small-chip">
                                                {GenderLabel[p.gender as Gender]}
                                            </Tag>
                                        )}
                                    </div>

                                    <div className="profile-meta">
                                        <span className="meta">
                                            <FileTextOutlined style={{ marginLeft: 4 }} />
                                            {p?.nationalId || '—'}
                                        </span>

                                        <span className="meta">
                                            <PhoneOutlined style={{ marginLeft: 4 }} />
                                            {p?.phoneNumber || '—'}
                                        </span>

                                        {stats.lastSeen && (
                                            <span className="meta">
                                                <ClockCircleOutlined style={{ marginLeft: 4 }} />
                                                {dayjs(stats.lastSeen).format('YYYY/MM/DD HH:mm')}
                                            </span>
                                        )}
                                    </div>

                                    <div className="badge-strip">
                                        {p?.securityStatus !== undefined && (
                                            <Tag color={PersonSecurityStatusColor[p.securityStatus as PersonSecurityStatus]} className="small-chip">
                                                {PersonSecurityStatusLabel[p.securityStatus as PersonSecurityStatus]}
                                            </Tag>
                                        )}

                                        {p?.dangerLevel !== undefined && (
                                            <Tag color={DangerLevelColor[p.dangerLevel as DangerLevel]} className="small-chip">
                                                {DangerLevelLabel[p.dangerLevel as DangerLevel]}
                                            </Tag>
                                        )}

                                        {p?.hasActiveAlert && (
                                            <Tag color="error" icon={<AlertOutlined />} className="small-chip">
                                                تعميم فعال
                                            </Tag>
                                        )}

                                        {p?.isArmedAndDangerous && (
                                            <Tag color="volcano" icon={<WarningOutlined />} className="small-chip">
                                                مسلح وخطر
                                            </Tag>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="desc-box" style={{ marginTop: 16 }}>
                                <Descriptions bordered column={1} size="small">
                                    <Descriptions.Item label="الحالة الأمنية">
                                        {p?.securityStatus !== undefined ? (
                                            <Tag color={PersonSecurityStatusColor[p.securityStatus as PersonSecurityStatus]}>
                                                {PersonSecurityStatusLabel[p.securityStatus as PersonSecurityStatus]}
                                            </Tag>
                                        ) : '—'}
                                    </Descriptions.Item>

                                    <Descriptions.Item label="درجة الخطورة">
                                        {p?.dangerLevel !== undefined ? (
                                            <Tag color={DangerLevelColor[p.dangerLevel as DangerLevel]}>
                                                {DangerLevelLabel[p.dangerLevel as DangerLevel]}
                                            </Tag>
                                        ) : '—'}
                                    </Descriptions.Item>

                                    <Descriptions.Item label="السبب">
                                        <div className="location-text">{p?.securityReason || '—'}</div>
                                    </Descriptions.Item>

                                    <Descriptions.Item label="رقم القضية">
                                        {p?.caseNumber || '—'}
                                    </Descriptions.Item>

                                    <Descriptions.Item label="الجهة المصدرة">
                                        {p?.issuedBy || '—'}
                                    </Descriptions.Item>

                                    <Descriptions.Item label="آخر ظهور">
                                        {p?.lastSeenAt ? dayjs(p.lastSeenAt).format('YYYY/MM/DD HH:mm') : '—'}
                                    </Descriptions.Item>

                                    <Descriptions.Item label="الموقع الأخير">
                                        <div className="location-text">{p?.lastSeenLocation || '—'}</div>
                                    </Descriptions.Item>

                                    <Descriptions.Item label="العنوان">
                                        <div className="location-text">{p?.address || '—'}</div>
                                    </Descriptions.Item>
                                </Descriptions>
                            </div>

                            {p?.alertInstructions && (
                                <Alert
                                    style={{ marginTop: 14, borderRadius: 14 }}
                                    type="warning"
                                    showIcon
                                    message="تعليمات عند المشاهدة"
                                    description={p.alertInstructions}
                                />
                            )}
                        </Card>

                        <Card
                            className="surface-card"
                            title={
                                <div className="section-title">
                                    <CalendarOutlined style={{ color: '#2563eb' }} />
                                    <span>فلترة بالتاريخ</span>
                                </div>
                            }
                        >
                            <div className="filter-box">
                                <RangePicker
                                    style={{ width: '100%', borderRadius: 12 }}
                                    onChange={(_, ds) => {
                                        const [from, to] = ds;
                                        setDateRange(from && to ? [from, to] : undefined);
                                    }}
                                    placeholder={['من', 'إلى']}
                                />

                                {dateRange && (
                                    <Button
                                        size="small"
                                        onClick={() => setDateRange(undefined)}
                                        style={{ marginTop: 10, borderRadius: 10, width: '100%' }}
                                    >
                                        مسح الفلتر — {filtered.length} نتيجة
                                    </Button>
                                )}
                            </div>
                        </Card>

                        <Card
                            className="surface-card"
                            title={
                                <div className="section-title">
                                    <AimOutlined style={{ color: '#2563eb' }} />
                                    <span>خريطة مسار الحركة</span>
                                </div>
                            }
                        >
                            <MovementMap records={filtered} />
                        </Card>

                        <Card
                            className="surface-card"
                            title={
                                <div className="section-title">
                                    <ClockCircleOutlined style={{ color: '#2563eb' }} />
                                    <span>الجدول الزمني للرصد</span>
                                </div>
                            }
                        >
                            <div className="timeline-wrap">
                                <MovementTimeline records={filtered} />
                            </div>
                        </Card>
                    </Space>
                </Col>

                <Col xs={24} xl={16}>
                    <Card
                        className="surface-card"
                        title={
                            <div className="section-title">
                                <ThunderboltOutlined style={{ color: '#2563eb' }} />
                                <span>سجل التعرف المفصل</span>
                                <Badge count={filtered.length} color="#2563eb" style={{ marginRight: 8 }} />
                            </div>
                        }
                        extra={
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                {filtered.length} سجل
                            </Text>
                        }
                    >
                        <div className="rec-table">
                            <Table<RecognitionRow>
                                columns={columns}
                                dataSource={filtered}
                                rowKey="recognitionId"
                                loading={isLoading}
                                pagination={{
                                    pageSize: 15,
                                    showSizeChanger: false,
                                    showTotal: (total) => <Text type="secondary">{total} سجل</Text>,
                                }}
                                style={{ direction: 'rtl' }}
                                scroll={{ x: 860 }}
                                locale={{
                                    emptyText: (
                                        <Empty
                                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                                            description="لا توجد سجلات في هذه الفترة"
                                        />
                                    ),
                                }}
                            />
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
