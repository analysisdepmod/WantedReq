import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Row,
    Col,
    Typography,
    Tag,
    Button,
    Space,
    Spin,
    Alert,
    Image,
    Badge,
    Descriptions,
    Avatar,
    Card,
    message,
} from 'antd';
import {
    EditOutlined,
    ArrowRightOutlined,
    CheckCircleOutlined,
    StopOutlined,
    CameraOutlined,
    UserOutlined,
    WarningOutlined,
    AimOutlined,
    CalendarOutlined,
    IdcardOutlined,
    PlayCircleOutlined,
    SafetyOutlined,
    FileTextOutlined,
    AlertOutlined,
    EnvironmentOutlined,
    TeamOutlined,
    ClockCircleOutlined,
} from '@ant-design/icons';
import { getPersonById, setActive, setDisActive } from '../../api/personsApi';
import {
    Gender,
    GenderLabel,
    PersonSecurityStatusLabel,
    PersonSecurityStatusColor,
    DangerLevelLabel,
    DangerLevelColor,
} from '../../types/person.types';
import RenderPersonImages from '../../compontents/person/RenderPersonImages';

const { Title, Text } = Typography;

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

export default function PersonDetailPage() {
    const { id } = useParams<{ id: string }>();
    const personId = Number(id);
    const navigate = useNavigate();
    const qc = useQueryClient();
    const [msgApi, ctx] = message.useMessage();

    const { data: person, isLoading, isError } = useQuery({
        queryKey: ['person', personId],
        queryFn: () => getPersonById(personId),
        enabled: !!personId && !isNaN(personId),
    });

    const invalidate = () => {
        qc.invalidateQueries({ queryKey: ['person', personId] });
        qc.invalidateQueries({ queryKey: ['persons'] });
    };

    const activateMut = useMutation({
        mutationFn: () => setActive(personId),
        onSuccess: () => {
            msgApi.success('تم تفعيل الشخص');
            invalidate();
        },
    });

    const deactivateMut = useMutation({
        mutationFn: () => setDisActive(personId),
        onSuccess: () => {
            msgApi.success('تم تعطيل الشخص');
            invalidate();
        },
    });

    if (isLoading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (isError || !person) {
        return (
            <div style={{ padding: 24 }}>
                <Alert
                    type="error"
                    message="لم يتم العثور على الشخص"
                    action={<Button onClick={() => navigate('/Indexpersons')}>العودة</Button>}
                />
            </div>
        );
    }

    const primaryImg =
        person.faceImages?.find((f) => f.isPrimary)?.faceProcessedImage ?? person.faceImages?.[0]?.faceProcessedImage;

    const isThreat = person.hasActiveAlert || person.isArmedAndDangerous || person.dangerLevel >= 3;

    return (
        <>
            {ctx}

            <div className="detail-shell">
                <div className="detail-hero">
                    <div className="detail-hero-inner">
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                            <div className="hero-badge">
                                <TeamOutlined style={{ fontSize: 28, color: '#fff' }} />
                            </div>

                            <div>
                                <Title level={2} style={{ margin: 0, color: '#fff', fontWeight: 900 }}>
                                    ملف الشخص
                                </Title>
                                <Text style={{ color: 'rgba(255,255,255,.86)', fontSize: 13 }}>
                                    عرض الهوية والبيانات الأمنية والتنبيهات وسجل التعرف والصور المرتبطة.
                                </Text>
                            </div>
                        </div>

                        <div className="hero-actions">
                            <Button
                                className="hero-btn"
                                icon={<ArrowRightOutlined />}
                                onClick={() => navigate('/Indexpersons')}
                            >
                                العودة
                            </Button>

                            <Button
                                className="hero-btn"
                                icon={<PlayCircleOutlined />}
                                onClick={() => navigate(`/recognition/person/${person.personId}`)}
                            >
                                سجل التعرف
                            </Button>

                            <Button
                                className="hero-btn"
                                type="primary"
                                icon={<EditOutlined />}
                                onClick={() => navigate(`/editperson/${person.personId}`)}
                            >
                                تعديل البيانات
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="stats-strip">
                    <div className="stat-mini-wrap">
                        <StatCard
                            label="إجمالي التعرفات"
                            value={person.totalRecognitions}
                            color="#2563eb"
                            bg="#eff6ff"
                            border="#bfdbfe"
                            icon={<AimOutlined />}
                        />
                    </div>

                    <div className="stat-mini-wrap">
                        <StatCard
                            label="عدد الصور"
                            value={person.faceImages.length}
                            color="#7c3aed"
                            bg="#faf5ff"
                            border="#ddd6fe"
                            icon={<CameraOutlined />}
                        />
                    </div>

                    <div className="stat-mini-wrap">
                        <StatCard
                            label="الحالة الأمنية"
                            value={PersonSecurityStatusLabel[person.securityStatus]}
                            color="#dc2626"
                            bg="#fff5f5"
                            border="#fecaca"
                            icon={<SafetyOutlined />}
                        />
                    </div>

                    <div className="stat-mini-wrap">
                        <StatCard
                            label="درجة الخطورة"
                            value={DangerLevelLabel[person.dangerLevel]}
                            color="#d97706"
                            bg="#fff7ed"
                            border="#fed7aa"
                            icon={<WarningOutlined />}
                        />
                    </div>

                    <div className="stat-mini-wrap">
                        <StatCard
                            label="آخر تعرف"
                            value={
                                person.lastRecognitionAt
                                    ? new Date(person.lastRecognitionAt).toLocaleDateString('ar-IQ')
                                    : '—'
                            }
                            color="#16a34a"
                            bg="#f0fdf4"
                            border="#bbf7d0"
                            icon={<ClockCircleOutlined />}
                        />
                    </div>
                </div>

                <Row gutter={[18, 18]} align="stretch">
                    <Col xs={24} xl={16}>
                        <Card
                            className="surface-card"
                            title={
                                <div className="section-title">
                                    <UserOutlined style={{ color: '#2563eb' }} />
                                    <span>البيانات الشخصية</span>
                                </div>
                            }
                        >
                            <div className="person-profile" style={{ marginBottom: 18 }}>
                                <div className="person-image-wrap">
                                    {primaryImg ? (
                                        <Image
                                            src={`data:image/jpeg;base64,${primaryImg}`}
                                            width={88}
                                            height={88}
                                            style={{
                                                borderRadius: 20,
                                                objectFit: 'cover',
                                                border: `3px solid ${isThreat ? '#fca5a5' : '#bfdbfe'}`,
                                            }}
                                            preview={false}
                                        />
                                    ) : (
                                        <Avatar
                                            size={88}
                                            icon={<UserOutlined />}
                                            style={{
                                                background: '#eff6ff',
                                                color: '#2563eb',
                                                fontSize: 30,
                                                borderRadius: 20,
                                            }}
                                        />
                                    )}

                                    {isThreat && <div className="person-risk-dot">⚠</div>}
                                </div>

                                <div style={{ minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                        <Title level={4} style={{ margin: 0 }}>
                                            {person.fullName}
                                        </Title>

                                        <Tag
                                            icon={person.isActive ? <CheckCircleOutlined /> : <StopOutlined />}
                                            color={person.isActive ? 'success' : 'default'}
                                            style={{ cursor: 'pointer', borderRadius: 999 }}
                                            onClick={() => (person.isActive ? deactivateMut.mutate() : activateMut.mutate())}
                                        >
                                            {person.isActive ? 'نشط' : 'غير نشط'}
                                        </Tag>

                                        <Tag color={person.gender === Gender.Male ? 'blue' : 'pink'} className="small-chip">
                                            {GenderLabel[person.gender]}
                                        </Tag>

                                        <Tag color={PersonSecurityStatusColor[person.securityStatus]} className="small-chip">
                                            {PersonSecurityStatusLabel[person.securityStatus]}
                                        </Tag>

                                        <Tag color={DangerLevelColor[person.dangerLevel]} className="small-chip">
                                            {DangerLevelLabel[person.dangerLevel]}
                                        </Tag>
                                    </div>

                                    <div className="person-meta-line">
                                        <span className="meta">
                                            <IdcardOutlined style={{ marginLeft: 4 }} />
                                            {person.nationalId || '—'}
                                        </span>

                                        {person.birthDate && (
                                            <span className="meta">
                                                <CalendarOutlined style={{ marginLeft: 4 }} />
                                                {new Date(person.birthDate).toLocaleDateString('ar-IQ')}
                                            </span>
                                        )}

                                        {person.lastSeenAt && (
                                            <span className="meta">
                                                <EnvironmentOutlined style={{ marginLeft: 4 }} />
                                                آخر ظهور: {new Date(person.lastSeenAt).toLocaleString('ar-IQ')}
                                            </span>
                                        )}
                                    </div>

                                    <div className="badge-strip">
                                        {person.hasActiveAlert && (
                                            <Tag color="error" icon={<AlertOutlined />} className="small-chip">
                                                تعميم فعال
                                            </Tag>
                                        )}

                                        {person.isArmedAndDangerous && (
                                            <Tag color="volcano" icon={<WarningOutlined />} className="small-chip">
                                                مسلح وخطر
                                            </Tag>
                                        )}

                                        {person.suspect && (
                                            <Tag color="warning" className="small-chip">
                                                سجل مشتبه به
                                            </Tag>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="desc-box">
                                <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
                                    <Descriptions.Item label="الاسم الكامل">
                                        <Text strong>{person.fullName}</Text>
                                    </Descriptions.Item>

                                    <Descriptions.Item label="الاسم المختصر">
                                        {person.displayName || '—'}
                                    </Descriptions.Item>

                                    <Descriptions.Item label="الهوية الوطنية">
                                        <Text className="phone-block">{person.nationalId || '—'}</Text>
                                    </Descriptions.Item>

                                    <Descriptions.Item label="الرمز الخارجي">
                                        {person.externalCode || '—'}
                                    </Descriptions.Item>

                                    <Descriptions.Item label="رقم الهاتف">
                                        <span className="phone-block">{person.phoneNumber || '—'}</span>
                                    </Descriptions.Item>

                                    <Descriptions.Item label="العنوان">
                                        <div className="text-block">{person.address || '—'}</div>
                                    </Descriptions.Item>

                                    {person.notes && (
                                        <Descriptions.Item label="ملاحظات" span={2}>
                                            <div className="text-block">{person.notes}</div>
                                        </Descriptions.Item>
                                    )}
                                </Descriptions>
                            </div>
                        </Card>

                        <Card
                            className="surface-card"
                            title={
                                <div className="section-title">
                                    <SafetyOutlined style={{ color: '#dc2626' }} />
                                    <span>البيانات الأمنية</span>
                                </div>
                            }
                            style={{ marginTop: 18 }}
                        >
                            <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
                                <Col xs={24} sm={12} md={8}>
                                    <div className="metric-card">
                                        <Text type="secondary">الحالة الأمنية</Text>
                                        <div style={{ marginTop: 10 }}>
                                            <Tag color={PersonSecurityStatusColor[person.securityStatus]}>
                                                {PersonSecurityStatusLabel[person.securityStatus]}
                                            </Tag>
                                        </div>
                                    </div>
                                </Col>

                                <Col xs={24} sm={12} md={8}>
                                    <div className="metric-card">
                                        <Text type="secondary">درجة الخطورة</Text>
                                        <div style={{ marginTop: 10 }}>
                                            <Tag color={DangerLevelColor[person.dangerLevel]}>
                                                {DangerLevelLabel[person.dangerLevel]}
                                            </Tag>
                                        </div>
                                    </div>
                                </Col>

                                <Col xs={24} sm={12} md={8}>
                                    <div className="metric-card">
                                        <Text type="secondary">التعميم</Text>
                                        <div style={{ marginTop: 10 }}>
                                            {person.hasActiveAlert ? <Tag color="red">فعال</Tag> : <Tag>لا يوجد</Tag>}
                                        </div>
                                    </div>
                                </Col>
                            </Row>

                            <div className="desc-box">
                                <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
                                    <Descriptions.Item label="مسلح وخطر">
                                        {person.isArmedAndDangerous ? <Tag color="volcano">نعم</Tag> : 'لا'}
                                    </Descriptions.Item>

                                    <Descriptions.Item label="سبب الإدراج الأمني">
                                        <div className="text-block">{person.securityReason || '—'}</div>
                                    </Descriptions.Item>

                                    <Descriptions.Item label="رقم القضية">
                                        <span className="phone-block">{person.caseNumber || '—'}</span>
                                    </Descriptions.Item>

                                    <Descriptions.Item label="الجهة المصدرة">
                                        {person.issuedBy || '—'}
                                    </Descriptions.Item>

                                    <Descriptions.Item label="رقم أمر القبض">
                                        <span className="phone-block">{person.arrestWarrantNumber || '—'}</span>
                                    </Descriptions.Item>

                                    <Descriptions.Item label="تاريخ إصدار التعميم">
                                        {person.alertIssuedAt ? new Date(person.alertIssuedAt).toLocaleString('ar-IQ') : '—'}
                                    </Descriptions.Item>

                                    <Descriptions.Item label="تاريخ انتهاء التعميم">
                                        {person.alertExpiresAt ? new Date(person.alertExpiresAt).toLocaleString('ar-IQ') : '—'}
                                    </Descriptions.Item>

                                    <Descriptions.Item label="آخر ظهور">
                                        {person.lastSeenAt ? new Date(person.lastSeenAt).toLocaleString('ar-IQ') : '—'}
                                    </Descriptions.Item>

                                    <Descriptions.Item label="مكان آخر ظهور">
                                        <div className="text-block">{person.lastSeenLocation || '—'}</div>
                                    </Descriptions.Item>

                                    <Descriptions.Item label="الأسماء المستعارة" span={2}>
                                        <div className="text-block">{person.aliases || '—'}</div>
                                    </Descriptions.Item>

                                    <Descriptions.Item label="علامات مميزة" span={2}>
                                        <div className="text-block">{person.distinguishingMarks || '—'}</div>
                                    </Descriptions.Item>

                                    <Descriptions.Item label="معلومات المركبة" span={2}>
                                        <div className="text-block">{person.vehicleInfo || '—'}</div>
                                    </Descriptions.Item>

                                    <Descriptions.Item label="ملاحظات أمنية" span={2}>
                                        <div className="text-block">{person.securityNotes || '—'}</div>
                                    </Descriptions.Item>

                                    <Descriptions.Item label="تعليمات عند المشاهدة" span={2}>
                                        <div className="text-block">{person.alertInstructions || '—'}</div>
                                    </Descriptions.Item>
                                </Descriptions>
                            </div>
                        </Card>
                    </Col>

                    <Col xs={24} xl={8}>
                        <Space direction="vertical" size={18} style={{ width: '100%' }}>
                            {(person.hasActiveAlert || person.isArmedAndDangerous || person.suspect) && (
                                <Card
                                    className="surface-card"
                                    title={
                                        <div className="section-title">
                                            <WarningOutlined style={{ color: '#dc2626' }} />
                                            <span>تنبيه أمني</span>
                                        </div>
                                    }
                                >
                                    <div className="alert-stack">
                                        {person.hasActiveAlert && (
                                            <Alert type="warning" showIcon message="يوجد تعميم فعال على هذا الشخص" />
                                        )}

                                        {person.isArmedAndDangerous && (
                                            <Alert type="error" showIcon message="الشخص مصنف مسلح وخطر" />
                                        )}

                                        {person.suspect && (
                                            <Alert
                                                type="warning"
                                                showIcon
                                                message="سجل مشتبه به قديم موجود"
                                                description={`القضية: ${person.suspect.caseReference || '—'} / الحالة: ${person.suspect.status || '—'}`}
                                            />
                                        )}
                                    </div>
                                </Card>
                            )}

                            <Card
                                className="surface-card"
                                title={
                                    <div className="section-title">
                                        <FileTextOutlined style={{ color: '#2563eb' }} />
                                        <span>ملخص سريع</span>
                                    </div>
                                }
                            >
                                <div className="quick-summary">
                                    <Space wrap size={8} style={{ marginBottom: 12 }}>
                                        <Tag color={person.isActive ? 'success' : 'default'}>{person.isActive ? 'نشط' : 'غير نشط'}</Tag>
                                        <Tag color={PersonSecurityStatusColor[person.securityStatus]}>{PersonSecurityStatusLabel[person.securityStatus]}</Tag>
                                        <Tag color={DangerLevelColor[person.dangerLevel]}>{DangerLevelLabel[person.dangerLevel]}</Tag>
                                        {person.hasActiveAlert && <Tag color="red" icon={<AlertOutlined />}>تعميم</Tag>}
                                        {person.isArmedAndDangerous && <Tag color="volcano" icon={<WarningOutlined />}>مسلح</Tag>}
                                    </Space>

                                    <Descriptions column={1} size="small">
                                        <Descriptions.Item label="رقم الهاتف">
                                            <span className="phone-block">{person.phoneNumber || '—'}</span>
                                        </Descriptions.Item>

                                        <Descriptions.Item label="العنوان">
                                            <div className="text-block">
                                                <span className="align-item" style={{ wordBreak: 'keep-all', overflowWrap: 'break-word' }}>
                                                    {person.address || '—'}
                                                </span>
                                            </div>
                                        </Descriptions.Item>

                                        <Descriptions.Item label="مكان آخر ظهور">
                                            <div className="text-block">{person.lastSeenLocation || '—'}</div>
                                        </Descriptions.Item>
                                    </Descriptions>
                                </div>
                            </Card>

                            <Card
                                className="surface-card"
                                title={
                                    <div className="section-title">
                                        <CameraOutlined style={{ color: '#2563eb' }} />
                                        <span>صور الوجه</span>
                                        <Badge count={person.faceImages.length} color="#2563eb" style={{ marginRight: 8 }} />
                                    </div>
                                }
                            >
                                <div className="images-wrap">
                                    {person.faceImages.length > 0 ? (
                                        <RenderPersonImages faceImages={person.faceImages} removeOldImage={() => { }} />
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8', fontSize: 13 }}>
                                            <CameraOutlined style={{ fontSize: 36, marginBottom: 8, display: 'block' }} />
                                            لا توجد صور مضافة
                                        </div>
                                    )}
                                </div>

                                <Button
                                    type="dashed"
                                    block
                                    icon={<EditOutlined />}
                                    onClick={() => navigate(`/editperson/${person.personId}`)}
                                    style={{ marginTop: 14, borderRadius: 14, minHeight: 44 }}
                                >
                                    تعديل الصور والبيانات
                                </Button>
                            </Card>
                        </Space>
                    </Col>
                </Row>
            </div>
        </>
    );
}
