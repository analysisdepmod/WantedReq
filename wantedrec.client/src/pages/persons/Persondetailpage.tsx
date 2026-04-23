import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Row, Col, Typography, Tag, Button, Space, Spin, Alert,
    Image, Badge, Descriptions, Tooltip, Avatar, Card,
} from 'antd';
import {
    EditOutlined, ArrowRightOutlined, CheckCircleOutlined,
    StopOutlined, CameraOutlined, UserOutlined, WarningOutlined,
    AimOutlined, CalendarOutlined, IdcardOutlined, PlayCircleOutlined,
    SafetyOutlined, PhoneOutlined, HomeOutlined, FileTextOutlined,
    AlertOutlined, EnvironmentOutlined, CarOutlined,
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
import { message } from 'antd';

const { Title, Text } = Typography;

const CSS = `
  @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
  .detail-card {
    background:#fff; border:1px solid #e4e9f2; border-radius:16px;
    padding:20px; box-shadow:0 2px 8px rgba(15,23,42,.05); animation:fadeIn .3s ease both;
  }
  .security-chip {
    display:inline-flex; align-items:center; gap:6px; padding:8px 12px;
    border-radius:999px; font-size:12px; font-weight:700; border:1px solid transparent;
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

    const invalidate = () => {
        qc.invalidateQueries({ queryKey: ['person', personId] });
        qc.invalidateQueries({ queryKey: ['persons'] });
    };

    const activateMut = useMutation({ mutationFn: () => setActive(personId), onSuccess: () => { msgApi.success('تم تفعيل الشخص'); invalidate(); } });
    const deactivateMut = useMutation({ mutationFn: () => setDisActive(personId), onSuccess: () => { msgApi.success('تم تعطيل الشخص'); invalidate(); } });

    if (isLoading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}><Spin size="large" /></div>;

    if (isError || !person) {
        return <div style={{ padding: 24 }}><Alert type="error" message="لم يتم العثور على الشخص" action={<Button onClick={() => navigate('/Indexpersons')}>العودة</Button>} /></div>;
    }

    const primaryImg = person.faceImages?.find((f) => f.isPrimary)?.faceProcessedImage ?? person.faceImages?.[0]?.faceProcessedImage;
    const isThreat = person.hasActiveAlert || person.isArmedAndDangerous || person.dangerLevel >= 3;

    return (
        <>
            <style>{CSS}</style>
            {ctx}

            <div style={{ padding: '20px 24px', direction: 'rtl', background: '#f4f6fb', minHeight: '100vh' }}>
                <div className="detail-card" style={{ marginBottom: 18, borderColor: isThreat ? '#fecaca' : '#e4e9f2', background: isThreat ? 'linear-gradient(135deg,#fff7f7,#fff)' : '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
                        <Space size={14} align="start">
                            <Tooltip title="رجوع"><Button icon={<ArrowRightOutlined />} onClick={() => navigate('/Indexpersons')} style={{ borderRadius: 9, marginTop: 4 }} /></Tooltip>
                            <div style={{ position: 'relative' }}>
                                {primaryImg ? (
                                    <Image src={`data:image/jpeg;base64,${primaryImg}`} width={72} height={72} style={{ borderRadius: 14, objectFit: 'cover', border: `3px solid ${isThreat ? '#fca5a5' : '#bfdbfe'}` }} preview={false} />
                                ) : (
                                    <Avatar size={72} icon={<UserOutlined />} style={{ background: '#eff6ff', color: '#2563eb', fontSize: 28, borderRadius: 14 }} />
                                )}
                                {isThreat && (
                                    <div style={{ position: 'absolute', bottom: -4, right: -4, width: 22, height: 22, borderRadius: '50%', background: '#dc2626', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>⚠️</div>
                                )}
                            </div>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                    <Title level={4} style={{ margin: 0 }}>{person.fullName}</Title>
                                    <Tag icon={person.isActive ? <CheckCircleOutlined /> : <StopOutlined />} color={person.isActive ? 'success' : 'default'} style={{ cursor: 'pointer' }} onClick={() => person.isActive ? deactivateMut.mutate() : activateMut.mutate()}>
                                        {person.isActive ? 'نشط' : 'غير نشط'}
                                    </Tag>
                                    <Tag color={person.gender === Gender.Male ? 'blue' : 'pink'}>{GenderLabel[person.gender]}</Tag>
                                    <Tag color={PersonSecurityStatusColor[person.securityStatus]}>{PersonSecurityStatusLabel[person.securityStatus]}</Tag>
                                    <Tag color={DangerLevelColor[person.dangerLevel]}>{DangerLevelLabel[person.dangerLevel]}</Tag>
                                </div>
                                <Space size={16} style={{ marginTop: 6, flexWrap: 'wrap' }}>
                                    <Text type="secondary" style={{ fontSize: 12 }}><IdcardOutlined style={{ marginLeft: 4 }} />{person.nationalId || '—'}</Text>
                                    {person.birthDate && <Text type="secondary" style={{ fontSize: 12 }}><CalendarOutlined style={{ marginLeft: 4 }} />{new Date(person.birthDate).toLocaleDateString('ar-IQ')}</Text>}
                                    <Text type="secondary" style={{ fontSize: 12 }}><AimOutlined style={{ marginLeft: 4 }} />{person.totalRecognitions} تعرف</Text>
                                    {person.lastSeenAt && <Text type="secondary" style={{ fontSize: 12 }}><EnvironmentOutlined style={{ marginLeft: 4 }} />آخر ظهور: {new Date(person.lastSeenAt).toLocaleString('ar-IQ')}</Text>}
                                </Space>
                            </div>
                        </Space>

                        <Space wrap>
                            <Button icon={<PlayCircleOutlined />} onClick={() => navigate(`/recognition/person/${person.personId}`)} style={{ borderRadius: 9 }}>سجل التعرف</Button>
                            <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`/editperson/${person.personId}`)} style={{ borderRadius: 9 }}>تعديل البيانات</Button>
                        </Space>
                    </div>
                </div>

                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={16}>
                        <div className="detail-card" style={{ marginBottom: 16 }}>
                            <Title level={5} style={{ marginTop: 0, marginBottom: 16 }}><UserOutlined style={{ marginLeft: 8, color: '#2563eb' }} />البيانات الشخصية</Title>
                            <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
                                <Descriptions.Item label="الاسم الكامل"><Text strong>{person.fullName}</Text></Descriptions.Item>
                                <Descriptions.Item label="الاسم المختصر">{person.displayName || '—'}</Descriptions.Item>
                                <Descriptions.Item label="الهوية الوطنية"><Text style={{ fontFamily: 'monospace' }}>{person.nationalId || '—'}</Text></Descriptions.Item>
                                <Descriptions.Item label="الرمز الخارجي">{person.externalCode || '—'}</Descriptions.Item>
                                <Descriptions.Item label="رقم الهاتف">{person.phoneNumber || '—'}</Descriptions.Item>
                                <Descriptions.Item label="العنوان">{person.address || '—'}</Descriptions.Item>
                                {person.notes && <Descriptions.Item label="ملاحظات" span={2}>{person.notes}</Descriptions.Item>}
                            </Descriptions>
                        </div>

                        <div className="detail-card" style={{ marginBottom: 16 }}>
                            <Title level={5} style={{ marginTop: 0, marginBottom: 16 }}><SafetyOutlined style={{ marginLeft: 8, color: '#dc2626' }} />البيانات الأمنية</Title>
                            <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
                                <Col xs={24} sm={12} md={8}><Card size="small"><Text type="secondary">الحالة الأمنية</Text><div><Tag color={PersonSecurityStatusColor[person.securityStatus]}>{PersonSecurityStatusLabel[person.securityStatus]}</Tag></div></Card></Col>
                                <Col xs={24} sm={12} md={8}><Card size="small"><Text type="secondary">درجة الخطورة</Text><div><Tag color={DangerLevelColor[person.dangerLevel]}>{DangerLevelLabel[person.dangerLevel]}</Tag></div></Card></Col>
                                <Col xs={24} sm={12} md={8}><Card size="small"><Text type="secondary">التعميم</Text><div>{person.hasActiveAlert ? <Tag color="red">فعال</Tag> : <Tag>لا يوجد</Tag>}</div></Card></Col>
                            </Row>
                            <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
                                <Descriptions.Item label="مسلح وخطر">{person.isArmedAndDangerous ? <Tag color="volcano">نعم</Tag> : 'لا'}</Descriptions.Item>
                                <Descriptions.Item label="سبب الإدراج الأمني">{person.securityReason || '—'}</Descriptions.Item>
                                <Descriptions.Item label="رقم القضية">{person.caseNumber || '—'}</Descriptions.Item>
                                <Descriptions.Item label="الجهة المصدرة">{person.issuedBy || '—'}</Descriptions.Item>
                                <Descriptions.Item label="رقم أمر القبض">{person.arrestWarrantNumber || '—'}</Descriptions.Item>
                                <Descriptions.Item label="تاريخ إصدار التعميم">{person.alertIssuedAt ? new Date(person.alertIssuedAt).toLocaleString('ar-IQ') : '—'}</Descriptions.Item>
                                <Descriptions.Item label="تاريخ انتهاء التعميم">{person.alertExpiresAt ? new Date(person.alertExpiresAt).toLocaleString('ar-IQ') : '—'}</Descriptions.Item>
                                <Descriptions.Item label="آخر ظهور">{person.lastSeenAt ? new Date(person.lastSeenAt).toLocaleString('ar-IQ') : '—'}</Descriptions.Item>
                                <Descriptions.Item label="مكان آخر ظهور">{person.lastSeenLocation || '—'}</Descriptions.Item>
                                <Descriptions.Item label="الأسماء المستعارة" span={2}>{person.aliases || '—'}</Descriptions.Item>
                                <Descriptions.Item label="علامات مميزة" span={2}>{person.distinguishingMarks || '—'}</Descriptions.Item>
                                <Descriptions.Item label="معلومات المركبة" span={2}>{person.vehicleInfo || '—'}</Descriptions.Item>
                                <Descriptions.Item label="ملاحظات أمنية" span={2}>{person.securityNotes || '—'}</Descriptions.Item>
                                <Descriptions.Item label="تعليمات عند المشاهدة" span={2}>{person.alertInstructions || '—'}</Descriptions.Item>
                            </Descriptions>
                        </div>

                        <div className="detail-card">
                            <Title level={5} style={{ marginTop: 0, marginBottom: 16 }}><AimOutlined style={{ marginLeft: 8, color: '#2563eb' }} />إحصائيات التعرف</Title>
                            <Row gutter={[12, 12]}>
                                {[
                                    { label: 'إجمالي التعرفات', value: person.totalRecognitions, color: '#2563eb', bg: '#eff6ff' },
                                    { label: 'عدد الصور', value: person.faceImages.length, color: '#7c3aed', bg: '#faf5ff' },
                                    { label: 'آخر تعرف', value: person.lastRecognitionAt ? new Date(person.lastRecognitionAt).toLocaleDateString('ar-IQ') : '—', color: '#16a34a', bg: '#f0fdf4' },
                                ].map((s) => (
                                    <Col key={s.label} xs={12} sm={8}>
                                        <div style={{ background: s.bg, border: '1px solid #e4e9f2', borderRadius: 12, padding: '12px 16px', textAlign: 'center' }}>
                                            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{s.label}</div>
                                        </div>
                                    </Col>
                                ))}
                            </Row>
                        </div>
                    </Col>

                    <Col xs={24} lg={8}>
                        {(person.hasActiveAlert || person.isArmedAndDangerous || person.suspect) && (
                            <div className="detail-card" style={{ marginBottom: 16, borderColor: '#fca5a5', background: 'linear-gradient(135deg,#fff5f5,#fff)' }}>
                                <Title level={5} style={{ marginTop: 0, color: '#dc2626' }}><WarningOutlined style={{ marginLeft: 8 }} />تنبيه أمني</Title>
                                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                                    {person.hasActiveAlert && <Alert type="warning" showIcon message="يوجد تعميم فعال على هذا الشخص" />}
                                    {person.isArmedAndDangerous && <Alert type="error" showIcon message="الشخص مصنف مسلح وخطر" />}
                                    {person.suspect && <Alert type="warning" showIcon message="سجل مشتبه به قديم موجود" description={`القضية: ${person.suspect.caseReference || '—'} / الحالة: ${person.suspect.status || '—'}`} />}
                                </Space>
                            </div>
                        )}

                        <div className="detail-card" style={{ marginBottom: 16 }}>
                            <Title level={5} style={{ marginTop: 0, marginBottom: 16 }}><PhoneOutlined style={{ marginLeft: 8, color: '#2563eb' }} />ملخص سريع</Title>
                            <Space wrap>
                                <Tag color={person.isActive ? 'success' : 'default'}>{person.isActive ? 'نشط' : 'غير نشط'}</Tag>
                                <Tag color={PersonSecurityStatusColor[person.securityStatus]}>{PersonSecurityStatusLabel[person.securityStatus]}</Tag>
                                <Tag color={DangerLevelColor[person.dangerLevel]}>{DangerLevelLabel[person.dangerLevel]}</Tag>
                                {person.hasActiveAlert && <Tag color="red" icon={<AlertOutlined />}>تعميم</Tag>}
                                {person.isArmedAndDangerous && <Tag color="volcano" icon={<WarningOutlined />}>مسلح</Tag>}
                            </Space>
                            <Descriptions column={1} size="small" style={{ marginTop: 12 }}>
                                <Descriptions.Item label="رقم الهاتف">{person.phoneNumber || '—'}</Descriptions.Item>
                                <Descriptions.Item label="العنوان">{person.address || '—'}</Descriptions.Item>
                                <Descriptions.Item label="مكان آخر ظهور">{person.lastSeenLocation || '—'}</Descriptions.Item>
                            </Descriptions>
                        </div>

                        <div className="detail-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                <Title level={5} style={{ margin: 0 }}><CameraOutlined style={{ marginLeft: 8, color: '#2563eb' }} />صور الوجه<Badge count={person.faceImages.length} color="#2563eb" style={{ marginRight: 8 }} /></Title>
                                <Button size="small" icon={<EditOutlined />} onClick={() => navigate(`/editperson/${person.personId}`)} style={{ borderRadius: 7 }}>إدارة</Button>
                            </div>
                            {person.faceImages.length > 0 ? (
                                <RenderPersonImages faceImages={person.faceImages} removeOldImage={() => { }} />
                            ) : (
                                <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8', fontSize: 13 }}>
                                    <CameraOutlined style={{ fontSize: 36, marginBottom: 8, display: 'block' }} />لا توجد صور مضافة
                                </div>
                            )}
                            <Button type="dashed" block icon={<EditOutlined />} onClick={() => navigate(`/editperson/${person.personId}`)} style={{ marginTop: 12 }}>تعديل الصور والبيانات</Button>
                        </div>
                    </Col>
                </Row>
            </div>
        </>
    );
}
