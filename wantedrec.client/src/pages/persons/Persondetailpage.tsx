import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Card, Row, Col, Typography, Tag, Button,
    Descriptions, Space, Spin, Alert, Image,
    Badge, Divider, Empty,
} from 'antd';
import {
    EditOutlined, ArrowRightOutlined,
    CheckCircleOutlined, StopOutlined,
    CameraOutlined, UserOutlined,
} from '@ant-design/icons';
import { getPersonById } from '../../api/personsApi';
import { Gender } from '../../types/person.types';
import type { PersonFaceImageDto } from '../../types/person.types';
import { useEffect } from 'react';
import { base64ToFile } from '../../Interfaces/functions';
import FaceProcessedImage from '../../compontents/person/FaceProcessedImage';
import RenderPersonImages from '../../compontents/person/RenderPersonImages';
const { Title, Text } = Typography;

export default function PersonDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const personId = Number(id);

    // ── Fetch ────────────────────────────────────────────────
    const { data: person, isLoading, isError } = useQuery({
        queryKey: ['person', personId],
        queryFn: () => getPersonById(personId),
        enabled: !!personId && !isNaN(personId),
    });



    // ── Loading ──────────────────────────────────────────────
    if (isLoading) {
        return (
            <div style={{ textAlign: 'center', padding: 80 }}>
                <Spin size="large" />
            </div>
        );
    }

    // ── Error ────────────────────────────────────────────────
    if (isError || !person) {
        return (
            <div style={{ padding: 24 }}>
                <Alert
                    type="error"
                    message="لم يتم العثور على الشخص"
                    action={
                        <Button onClick={() => navigate('/Indexpersons')}>
                            العودة للقائمة
                        </Button>
                    }
                />
            </div>
        );
    }

    function getImage(faceProcessedImage: string, imageFileName: string) {
        base64ToFile(faceProcessedImage, imageFileName)
    }

    // ── Render ───────────────────────────────────────────────
    return (
        <div style={{ padding: 24, direction: 'rtl' }}>

            {/* ── Header ── */}
            <Space style={{ marginBottom: 24, width: '100%', justifyContent: 'space-between' }}>
                <Space align="center">
                    <Button
                        icon={<ArrowRightOutlined />}
                        onClick={() => navigate('/Indexpersons')}
                    >
                        العودة
                    </Button>
                    <Title level={3} style={{ margin: 0 }}>
                        {person.fullName}
                    </Title>
                    <Tag
                        icon={person.isActive ? <CheckCircleOutlined /> : <StopOutlined />}
                        color={person.isActive ? 'success' : 'default'}
                    >
                        {person.isActive ? 'نشط' : 'غير نشط'}
                    </Tag>
                    {person.suspect && (
                        <Tag color="red">⚠️ مشتبه به</Tag>
                    )}
                </Space>

                <Button
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={() => navigate(`/editperson/${person.personId}`)}
                >
                    تعديل البيانات
                </Button>
            </Space>

            <Row gutter={24}>

                {/* ── البيانات الشخصية ── */}
                <Col xs={24} lg={16}>
                    <Card title="البيانات الشخصية" style={{ marginBottom: 16 }}>
                        <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
                            <Descriptions.Item label="الاسم الكامل">
                                <Text strong>{person.fullName}</Text>
                            </Descriptions.Item>

                            <Descriptions.Item label="الاسم المختصر">
                                {person.displayName || '—'}
                            </Descriptions.Item>

                            <Descriptions.Item label="الجنس">
                                <Tag color={person.gender === Gender.Male ? 'blue' : 'pink'}>
                                    {person.gender === Gender.Male ? 'ذكر' : 'أنثى'}
                                </Tag>
                            </Descriptions.Item>

                            <Descriptions.Item label="تاريخ الميلاد">
                                {person.birthDate
                                    ? new Date(person.birthDate).toLocaleDateString('ar-IQ')
                                    : '—'}
                            </Descriptions.Item>

                            <Descriptions.Item label="الهوية الوطنية">
                                {person.nationalId || '—'}
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
                    </Card>

                    {/* ── إحصائيات الاعترافات ── */}
                    <Card title="إحصائيات التعرف">
                        <Row gutter={16} style={{ textAlign: 'center' }}>
                            <Col span={12}>
                                <Text type="secondary">مجموع حالات التعرف</Text>
                                <div style={{ fontSize: 28, fontWeight: 'bold', color: '#1677ff' }}>
                                    {person.totalRecognitions}
                                </div>
                            </Col>
                            <Col span={12}>
                                <Text type="secondary">آخر تعرف</Text>
                                <div style={{ fontSize: 16, fontWeight: 500 }}>
                                    {person.lastRecognitionAt
                                        ? new Date(person.lastRecognitionAt).toLocaleDateString('ar-IQ')
                                        : '—'}
                                </div>
                            </Col>
                        </Row>
                    </Card>
                </Col>

                {/* ── الجانب الأيسر ── */}
                <Col xs={24} lg={8}>

                    {/* ── بيانات المشتبه به ── */}
                    {person.suspect && (
                        <Card
                            title={<Space><UserOutlined /><span>بيانات المشتبه به</span></Space>}
                            style={{ marginBottom: 16, borderColor: '#ff4d4f' }}
                            headStyle={{ color: '#ff4d4f' }}
                        >
                            <Descriptions column={1} size="small">
                                <Descriptions.Item label="الرمز">
                                    <Text code>{person.suspect.code}</Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="مستوى الخطر">
                                    <Tag color="red">{person.suspect.riskLevel || '—'}</Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="الحالة">
                                    {person.suspect.status || '—'}
                                </Descriptions.Item>
                                <Descriptions.Item label="رقم القضية">
                                    {person.suspect.caseReference || '—'}
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>
                    )}

                    {/* ── صور الوجه ── */}
                    <Card
                        title={
                            <Space>
                                <CameraOutlined />
                                <span>صور الوجه</span>
                                <Badge count={person.faceImages.length} color="#1677ff" />
                            </Space>
                        }
                    >
                        {person.faceImages.length > 0 && (
                            <>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    الصور الحالية
                                </Text>
                                <RenderPersonImages faceImages={person.faceImages} />
                                <Divider />
                            </>
                        )}

                    

                        <Button
                            type="dashed"
                            block
                            icon={<EditOutlined />}
                            onClick={() => navigate(`/editperson/${person.personId}`)}
                        >
                            تعديل / إضافة صور
                        </Button>
                    </Card>

                </Col>
            </Row>
        </div>
    );
}