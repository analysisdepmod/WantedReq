// ════════════════════════════════════════════════════════
//  src/pages/persons/PersonDetailPage.tsx
//  تفاصيل الشخص — تصميم احترافي
// ════════════════════════════════════════════════════════

import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Row, Col, Typography, Tag, Button, Space, Spin, Alert,
    Image, Badge, Descriptions, Tooltip, Avatar,
} from 'antd';
import {
    EditOutlined, ArrowRightOutlined, CheckCircleOutlined,
    StopOutlined, CameraOutlined, UserOutlined, WarningOutlined,
    AimOutlined, CalendarOutlined, IdcardOutlined, PlayCircleOutlined,
} from '@ant-design/icons';
import { getPersonById } from '../../api/personsApi';
import { setActive, setDisActive } from '../../api/personsApi';
import { Gender } from '../../types/person.types';
import RenderPersonImages from '../../compontents/person/RenderPersonImages';
import { message } from 'antd';

const { Title, Text } = Typography;

const CSS = `
  @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
  .detail-card {
    background:#fff; border:1px solid #e4e9f2; border-radius:16px;
    padding:20px; box-shadow:0 2px 8px rgba(15,23,42,.05);
    animation:fadeIn .3s ease both;
  }
`;

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

    const invalidate = () => qc.invalidateQueries({ queryKey: ['person', personId] });

    const activateMut = useMutation({
        mutationFn: () => setActive(personId),
        onSuccess: () => { msgApi.success('تم تفعيل الشخص'); invalidate(); },
    });

    const deactivateMut = useMutation({
        mutationFn: () => setDisActive(personId),
        onSuccess: () => { msgApi.success('تم تعطيل الشخص'); invalidate(); },
    });

    if (isLoading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <Spin size="large" />
        </div>
    );

    if (isError || !person) return (
        <div style={{ padding: 24 }}>
            <Alert type="error" message="لم يتم العثور على الشخص"
                action={<Button onClick={() => navigate('/Indexpersons')}>العودة</Button>} />
        </div>
    );

    const primaryImg = person.faceImages?.find(f => f.isPrimary)?.faceProcessedImage
        ?? person.faceImages?.[0]?.faceProcessedImage;

    return (
        <>
            <style>{CSS}</style>
            {ctx}

            <div style={{ padding: '20px 24px', direction: 'rtl', background: '#f4f6fb', minHeight: '100vh' }}>

                {/* ── Header ──────────────────────────────── */}
                <div className="detail-card" style={{ marginBottom: 18 }}>
                    <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'flex-start', flexWrap: 'wrap', gap: 14
                    }}>

                        <Space size={14} align="start">
                            <Tooltip title="رجوع">
                                <Button icon={<ArrowRightOutlined />}
                                    onClick={() => navigate('/Indexpersons')}
                                    style={{ borderRadius: 9, marginTop: 4 }} />
                            </Tooltip>

                            {/* Avatar */}
                            <div style={{ position: 'relative' }}>
                                {primaryImg ? (
                                    <Image
                                        src={`data:image/jpeg;base64,${primaryImg}`}
                                        width={72} height={72}
                                        style={{
                                            borderRadius: 14, objectFit: 'cover',
                                            border: `3px solid ${person.suspect ? '#fca5a5' : '#bfdbfe'}`
                                        }}
                                        preview={false}
                                    />
                                ) : (
                                    <Avatar size={72} icon={<UserOutlined />}
                                        style={{
                                            background: '#eff6ff', color: '#2563eb',
                                            fontSize: 28, borderRadius: 14
                                        }} />
                                )}
                                {person.suspect && (
                                    <div style={{
                                        position: 'absolute', bottom: -4, right: -4,
                                        width: 22, height: 22, borderRadius: '50%',
                                        background: '#dc2626', border: '2px solid #fff',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 12,
                                    }}>⚠️</div>
                                )}
                            </div>

                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                    <Title level={4} style={{ margin: 0 }}>{person.fullName}</Title>
                                    <Tag
                                        icon={person.isActive ? <CheckCircleOutlined /> : <StopOutlined />}
                                        color={person.isActive ? 'success' : 'default'}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => person.isActive ? deactivateMut.mutate() : activateMut.mutate()}
                                    >
                                        {person.isActive ? 'نشط' : 'غير نشط'}
                                    </Tag>
                                    <Tag color={person.gender === Gender.Male ? 'blue' : 'pink'}>
                                        {person.gender === Gender.Male ? 'ذكر' : 'أنثى'}
                                    </Tag>
                                    {person.suspect && <Tag color="red">⚠️ مشتبه به</Tag>}
                                </div>
                                <Space size={16} style={{ marginTop: 6 }}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        <IdcardOutlined style={{ marginLeft: 4 }} />
                                        {person.nationalId || '—'}
                                    </Text>
                                    {person.birthDate && (
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            <CalendarOutlined style={{ marginLeft: 4 }} />
                                            {new Date(person.birthDate).toLocaleDateString('ar-IQ')}
                                        </Text>
                                    )}
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        <AimOutlined style={{ marginLeft: 4 }} />
                                        {person.totalRecognitions} تعرف
                                    </Text>
                                </Space>
                            </div>
                        </Space>

                        <Space wrap>
                            <Button icon={<PlayCircleOutlined />}
                                onClick={() => navigate(`/recognition/person/${person.personId}`)}
                                style={{ borderRadius: 9 }}>
                                سجل التعرف
                            </Button>
                            <Button type="primary" icon={<EditOutlined />}
                                onClick={() => navigate(`/editperson/${person.personId}`)}
                                style={{ borderRadius: 9 }}>
                                تعديل البيانات
                            </Button>
                        </Space>
                    </div>
                </div>

                <Row gutter={[16, 16]}>

                    {/* ── Right: Info ──────────────────────── */}
                    <Col xs={24} lg={16}>

                        {/* البيانات الشخصية */}
                        <div className="detail-card" style={{ marginBottom: 16 }}>
                            <Title level={5} style={{ marginTop: 0, marginBottom: 16 }}>
                                <UserOutlined style={{ marginLeft: 8, color: '#2563eb' }} />
                                البيانات الشخصية
                            </Title>
                            <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
                                <Descriptions.Item label="الاسم الكامل">
                                    <Text strong>{person.fullName}</Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="الاسم المختصر">
                                    {person.displayName || '—'}
                                </Descriptions.Item>
                                <Descriptions.Item label="الهوية الوطنية">
                                    <Text style={{ fontFamily: 'monospace' }}>{person.nationalId || '—'}</Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="الرمز الخارجي">
                                    {person.externalCode || '—'}
                                </Descriptions.Item>
                                <Descriptions.Item label="رقم الهاتف">
                                    {person.phoneNumber || '—'}
                                </Descriptions.Item>
                                <Descriptions.Item label="العنوان">
                                    {person.address || '—'}
                                </Descriptions.Item>
                                {person.notes && (
                                    <Descriptions.Item label="ملاحظات" span={2}>
                                        {person.notes}
                                    </Descriptions.Item>
                                )}
                            </Descriptions>
                        </div>

                        {/* إحصائيات التعرف */}
                        <div className="detail-card">
                            <Title level={5} style={{ marginTop: 0, marginBottom: 16 }}>
                                <AimOutlined style={{ marginLeft: 8, color: '#2563eb' }} />
                                إحصائيات التعرف
                            </Title>
                            <Row gutter={[12, 12]}>
                                {[
                                    { label: 'إجمالي التعرفات', value: person.totalRecognitions, color: '#2563eb', bg: '#eff6ff' },
                                    { label: 'عدد الصور', value: person.faceImages.length, color: '#7c3aed', bg: '#faf5ff' },
                                    {
                                        label: 'آخر تعرف',
                                        value: person.lastRecognitionAt
                                            ? new Date(person.lastRecognitionAt).toLocaleDateString('ar-IQ')
                                            : '—',
                                        color: '#16a34a', bg: '#f0fdf4',
                                    },
                                ].map(s => (
                                    <Col key={s.label} xs={12} sm={8}>
                                        <div style={{
                                            background: s.bg, border: '1px solid #e4e9f2',
                                            borderRadius: 12, padding: '12px 16px', textAlign: 'center',
                                        }}>
                                            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{s.label}</div>
                                        </div>
                                    </Col>
                                ))}
                            </Row>
                        </div>
                    </Col>

                    {/* ── Left: Sidebar ──────────────────── */}
                    <Col xs={24} lg={8}>

                        {/* بيانات المشتبه به */}
                        {person.suspect && (
                            <div className="detail-card" style={{
                                marginBottom: 16,
                                borderColor: '#fca5a5',
                                background: 'linear-gradient(135deg,#fff5f5,#fff)',
                            }}>
                                <Title level={5} style={{ marginTop: 0, color: '#dc2626' }}>
                                    <WarningOutlined style={{ marginLeft: 8 }} />
                                    بيانات المشتبه به
                                </Title>
                                <Descriptions column={1} size="small">
                                    <Descriptions.Item label="الرمز">
                                        <Text code style={{ fontFamily: 'monospace' }}>{person.suspect.code}</Text>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="مستوى الخطر">
                                        <Tag color="red">{person.suspect.riskLevel || '—'}</Tag>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="الحالة">{person.suspect.status || '—'}</Descriptions.Item>
                                    <Descriptions.Item label="رقم القضية">{person.suspect.caseReference || '—'}</Descriptions.Item>
                                </Descriptions>
                            </div>
                        )}

                        {/* صور الوجه */}
                        <div className="detail-card">
                            <div style={{
                                display: 'flex', justifyContent: 'space-between',
                                alignItems: 'center', marginBottom: 14
                            }}>
                                <Title level={5} style={{ margin: 0 }}>
                                    <CameraOutlined style={{ marginLeft: 8, color: '#2563eb' }} />
                                    صور الوجه
                                    <Badge count={person.faceImages.length} color="#2563eb"
                                        style={{ marginRight: 8 }} />
                                </Title>
                                <Button size="small" icon={<EditOutlined />}
                                    onClick={() => navigate(`/editperson/${person.personId}`)}
                                    style={{ borderRadius: 7 }}>
                                    إدارة
                                </Button>
                            </div>

                            {person.faceImages.length > 0 ? (
                                <RenderPersonImages
                                    faceImages={person.faceImages}
                                    removeOldImage={() => { }}
                                />
                            ) : (
                                <div style={{
                                    textAlign: 'center', padding: '24px 0',
                                    color: '#94a3b8', fontSize: 13,
                                }}>
                                    <CameraOutlined style={{ fontSize: 36, marginBottom: 8, display: 'block' }} />
                                    لا توجد صور مضافة
                                </div>
                            )}

                            <Button type="dashed" block icon={<EditOutlined />}
                                onClick={() => navigate(`/editperson/${person.personId}`)}
                                style={{ borderRadius: 10, marginTop: 10 }}>
                                إضافة / تعديل الصور
                            </Button>
                        </div>
                    </Col>
                </Row>
            </div>
        </>
    );
}