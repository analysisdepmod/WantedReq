import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Form, Input, Select, DatePicker, Switch,
    Upload, Button, Card, Row, Col,
    Typography, Space, Image, message,
    Spin, Alert, Divider, Tabs,
} from 'antd';
import type { UploadFile } from 'antd';
import {
    SaveOutlined, ArrowRightOutlined,
    CameraOutlined, UploadOutlined,
    DeleteOutlined, StopOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getPersonById, setActive, setDisActive, updatePerson } from '../../api/personsApi';
import { Gender, ImageSource } from '../../types/person.types';
import type {
    PersonUpsertDto,
    PersonFaceImageUpsertDto,
    PersonFaceImageDto,
} from '../../types/person.types';
import FaceProcessedImage from '../../compontents/person/FaceProcessedImage';
import RenderPersonImages from '../../compontents/person/RenderPersonImages';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// ── تحويل File → base64 ──────────────────────────────────
const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

interface FormValues {
    fullName: string;
    displayName?: string;
    gender: Gender;
    birthDate?: dayjs.Dayjs;
    nationalId?: string;
    externalCode?: string;
    phoneNumber?: string;
    address?: string;
    notes?: string;
    isActive: boolean;
}

interface LocalImage {
    uid: string;
    base64: string;
    preview: string;
}

export default function EditPerson() {
    const queryClient = useQueryClient();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [form] = Form.useForm<FormValues>();
    const [messageApi, contextHolder] = message.useMessage();

    const personId = Number(id);

    const [newImages, setNewImages] = useState<LocalImage[]>([]);
    const [images, setImages] = useState<PersonFaceImageDto[]>([]);
    const [activeTab, setActiveTab] = useState('upload');

    // ── Camera refs ───────────────────────────────────────
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [cameraOn, setCameraOn] = useState(false);

    // ── mutation تغيير الحالة ─────────────────────────────
    const { mutate: UpdateStatus } = useMutation({
        mutationFn: (active: boolean) => active ? setActive(personId) : setDisActive(personId),
        onSuccess: (activesss: boolean) => {
            messageApi.success(activesss ? 'تم التفعيل ✅' : 'تم التعطيل');
            queryClient.invalidateQueries({ queryKey: ['person', personId] });
        },
        onError: () => messageApi.error('فشل تغيير الحالة'),
    });

    const removeOldImage = (imgId: number) => {
        setImages((prev) => prev.filter((img) => img.faceImageId !== imgId));
    };

    // ── Fetch ─────────────────────────────────────────────
    const { data: person, isLoading, isError } = useQuery({
        queryKey: ['person', personId],
        queryFn: () => getPersonById(personId),
        enabled: !!personId,
    });

    useEffect(() => {
        if (!person) return;
        form.setFieldsValue({
            fullName: person.fullName,
            displayName: person.displayName,
            gender: person.gender,
            birthDate: person.birthDate ? dayjs(person.birthDate) : undefined,
            nationalId: person.nationalId,
            externalCode: person.externalCode,
            phoneNumber: person.phoneNumber,
            address: person.address,
            notes: person.notes,
            isActive: person.isActive,
        });
        setImages(person.faceImages);
    }, [person, form]);

    // ── Mutation حفظ ──────────────────────────────────────
    const { mutate: submitUpdate, isPending } = useMutation({
        mutationFn: (dto: PersonUpsertDto) => updatePerson(personId, dto),
        onSuccess: () => {
            messageApi.success('تم تحديث البيانات بنجاح ✅');
            queryClient.invalidateQueries({ queryKey: ['person', personId] });
            queryClient.invalidateQueries({ queryKey: ['persons'] });
            setTimeout(() => navigate(`/persons/${personId}`), 1000);
        },
        onError: () => messageApi.error('حدث خطأ أثناء التحديث'),
    });

    // ── إضافة صورة من ملف ────────────────────────────────
    const handleImageSelect = async (file: File): Promise<false> => {
        try {
            const base64 = await fileToBase64(file);
            const preview = URL.createObjectURL(file);
            setNewImages((prev) => [
                ...prev,
                { uid: `new-${Date.now()}`, base64, preview },
            ]);
        } catch {
            messageApi.error('فشل تحميل الصورة');
        }
        return false;
    };

    // ── إضافة صورة من blob (كاميرا) ─────────────────────
    const addImageFromBlob = async (blob: Blob) => {
        const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
        const base64 = await fileToBase64(file);
        const preview = URL.createObjectURL(blob);
        setNewImages((prev) => [
            ...prev,
            { uid: `cam-${Date.now()}`, base64, preview },
        ]);
        messageApi.success('تم التقاط الصورة وإضافتها ✅');
    };

    // ── حذف صورة جديدة ───────────────────────────────────
    const removeNewImage = (uid: string) => {
        setNewImages((prev) => prev.filter((img) => img.uid !== uid));
    };

    // ── فتح الكاميرا ─────────────────────────────────────
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            streamRef.current = stream;
            setCameraOn(true);
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play().catch(console.error);
                }
            }, 50);
        } catch {
            messageApi.error('لم يتم السماح بالوصول للكاميرا');
        }
    };

    // ── إيقاف الكاميرا ───────────────────────────────────
    const stopCamera = useCallback(() => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setCameraOn(false);
    }, []);

    // ── التقاط صورة ──────────────────────────────────────
    const captureFrame = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d')?.drawImage(video, 0, 0);

        canvas.toBlob(async (blob) => {
            if (!blob) return;
            await addImageFromBlob(blob);
        }, 'image/jpeg', 0.95);
    };

    // ── تغيير التبويب ─────────────────────────────────────
    const handleTabChange = (key: string) => {
        setActiveTab(key);
        if (key !== 'camera') stopCamera();
    };

    // ── إرسال النموذج ────────────────────────────────────
    const handleFinish = (values: FormValues) => {
        const existingImages: PersonFaceImageUpsertDto[] = images.map((img) => ({
            faceImageId: img.faceImageId,
            imageFileName: img.imageFileName,
            imageFilePath: img.imageFilePath,
            imageSource: img.imageSource,
            capturedAt: img.capturedAt,
            isActive: img.isActive,
            isPrimary: img.isPrimary,
        }));

        const newImagesDto: PersonFaceImageUpsertDto[] = newImages.map((img) => ({
            faceImageId: 0,
            imageFile: img.base64,
            imageSource: ImageSource.Manual,
            capturedAt: new Date().toISOString(),
            isActive: true,
            isPrimary: false,
        }));

        const dto: PersonUpsertDto = {
            personId: personId,
            fullName: values.fullName,
            displayName: values.displayName ?? null,
            gender: values.gender,
            birthDate: values.birthDate?.toISOString() ?? null,
            nationalId: values.nationalId ?? null,
            externalCode: values.externalCode ?? null,
            phoneNumber: values.phoneNumber ?? null,
            address: values.address ?? null,
            notes: values.notes ?? null,
            isActive: values.isActive,
            faceImages: [...existingImages, ...newImagesDto],
        };

        submitUpdate(dto);
    };

    // ── Loading / Error ───────────────────────────────────
    if (isLoading) {
        return (
            <div style={{ textAlign: 'center', padding: 80 }}>
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
                    action={
                        <Button onClick={() => navigate('/Indexpersons')}>
                            العودة للقائمة
                        </Button>
                    }
                />
            </div>
        );
    }

    // ── Render ────────────────────────────────────────────
    return (
        <div style={{ padding: 24, direction: 'rtl' }}>
            {contextHolder}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            <Space align="center" style={{ marginBottom: 24 }}>
                <Button
                    icon={<ArrowRightOutlined />}
                    onClick={() => navigate(`/persons/${personId}`)}
                >
                    العودة للتفاصيل
                </Button>
                <Title level={3} style={{ margin: 0 }}>
                    تعديل: {person.fullName}
                </Title>
            </Space>

            <Form<FormValues>
                form={form}
                layout="vertical"
                onFinish={handleFinish}
            >
                <Row gutter={24}>

                    {/* ── البيانات الشخصية ── */}
                    <Col xs={24} lg={16}>
                        <Card title="البيانات الشخصية" style={{ marginBottom: 16 }}>
                            <Row gutter={16}>
                                <Col xs={24} md={12}>
                                    <Form.Item
                                        name="fullName" label="الاسم الكامل"
                                        rules={[{ required: true, message: 'الاسم الكامل مطلوب' }]}
                                    >
                                        <Input />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item name="displayName" label="الاسم المختصر">
                                        <Input />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item name="gender" label="الجنس" rules={[{ required: true }]}>
                                        <Select>
                                            <Option value={Gender.Male}>ذكر</Option>
                                            <Option value={Gender.Female}>أنثى</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item name="birthDate" label="تاريخ الميلاد">
                                        <DatePicker style={{ width: '100%' }} />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item name="nationalId" label="الهوية الوطنية">
                                        <Input />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item name="externalCode" label="الرمز الخارجي">
                                        <Input />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item name="phoneNumber" label="رقم الهاتف">
                                        <Input />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item name="isActive" label="الحالة" valuePropName="checked">
                                        <Switch
                                            checkedChildren="نشط"
                                            unCheckedChildren="غير نشط"
                                            onChange={(e) => UpdateStatus(e)}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24}>
                                    <Form.Item name="address" label="العنوان">
                                        <Input />
                                    </Form.Item>
                                </Col>
                                <Col xs={24}>
                                    <Form.Item name="notes" label="ملاحظات">
                                        <TextArea rows={3} />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Card>
                    </Col>

                    {/* ── صور الوجه ── */}
                    <Col xs={24} lg={8}>
                        <Card
                            title={
                                <Space>
                                    <CameraOutlined />
                                    <span>صور الوجه</span>
                                    {newImages.length > 0 && (
                                        <span style={{
                                            background: '#1677ff', color: '#fff',
                                            borderRadius: 10, padding: '0 8px', fontSize: 12,
                                        }}>
                                            +{newImages.length} جديدة
                                        </span>
                                    )}
                                </Space>
                            }
                        >
                            {/* ── الصور الحالية ── */}
                            {person.faceImages.length > 0 && (
                                <>
                                    <Text type="secondary" style={{ fontSize: 12 }}>الصور الحالية</Text>
                                    <RenderPersonImages faceImages={images} removeOldImage={removeOldImage} />
                                    <Divider />
                                </>
                            )}

                            {/* ── الصور الجديدة ── */}
                            {newImages.length > 0 && (
                                <>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        صور جديدة ({newImages.length})
                                    </Text>
                                    <Row gutter={[8, 8]} style={{ marginTop: 8, marginBottom: 12 }}>
                                        {newImages.map((img) => (
                                            <Col key={img.uid} span={12}>
                                                <div style={{ position: 'relative' }}>
                                                    <Image
                                                        src={img.preview}
                                                        style={{
                                                            width: '100%', height: 90,
                                                            objectFit: 'cover', borderRadius: 6,
                                                            border: '2px dashed #1677ff',
                                                        }}
                                                    />
                                                    <Button
                                                        danger size="small"
                                                        icon={<DeleteOutlined />}
                                                        style={{
                                                            position: 'absolute', top: 2, left: 2,
                                                            minWidth: 'auto', padding: '0 4px',
                                                        }}
                                                        onClick={() => removeNewImage(img.uid)}
                                                    />
                                                </div>
                                            </Col>
                                        ))}
                                    </Row>
                                    <Divider />
                                </>
                            )}

                            {/* ── Tabs: رفع / كاميرا ── */}
                            <Tabs
                                activeKey={activeTab}
                                onChange={handleTabChange}
                                size="small"
                                items={[
                                    // ── تبويب رفع صورة ──
                                    {
                                        key: 'upload',
                                        label: <Space><UploadOutlined />رفع صورة</Space>,
                                        children: (
                                            <>
                                                <Upload<UploadFile>
                                                    accept="image/*"
                                                    showUploadList={false}
                                                    beforeUpload={(file) => handleImageSelect(file)}
                                                >
                                                    <Button
                                                        icon={<UploadOutlined />}
                                                        block type="dashed"
                                                        style={{ marginBottom: 8 }}
                                                    >
                                                        إضافة صورة جديدة
                                                    </Button>
                                                </Upload>
                                                <Text type="secondary" style={{ fontSize: 11 }}>
                                                    📌 الصيغ المدعومة: JPG, PNG
                                                </Text>
                                            </>
                                        ),
                                    },

                                    // ── تبويب الكاميرا ──
                                    {
                                        key: 'camera',
                                        label: <Space><CameraOutlined />كاميرا</Space>,
                                        children: (
                                            <>
                                                {/* شاشة الكاميرا */}
                                                <div style={{
                                                    background: '#000', borderRadius: 8,
                                                    overflow: 'hidden', marginBottom: 10,
                                                    minHeight: 160, display: 'flex',
                                                    alignItems: 'center', justifyContent: 'center',
                                                }}>
                                                    {/* ✅ video دائماً في DOM */}
                                                    <video
                                                        ref={videoRef}
                                                        autoPlay playsInline muted
                                                        style={{
                                                            width: '100%',
                                                            display: cameraOn ? 'block' : 'none',
                                                        }}
                                                    />
                                                    {!cameraOn && (
                                                        <div style={{ textAlign: 'center', padding: 20 }}>
                                                            <CameraOutlined style={{ fontSize: 36, color: '#555' }} />
                                                            <br />
                                                            <Text style={{ color: '#888', fontSize: 12 }}>
                                                                اضغط لفتح الكاميرا
                                                            </Text>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* أزرار الكاميرا */}
                                                <Space direction="vertical" style={{ width: '100%' }}>
                                                    {!cameraOn ? (
                                                        <Button
                                                            icon={<CameraOutlined />}
                                                            block onClick={startCamera}
                                                        >
                                                            فتح الكاميرا
                                                        </Button>
                                                    ) : (
                                                        <Row gutter={8}>
                                                            <Col span={16}>
                                                                <Button
                                                                    type="primary"
                                                                    icon={<CameraOutlined />}
                                                                    block onClick={captureFrame}
                                                                >
                                                                    التقاط صورة
                                                                </Button>
                                                            </Col>
                                                            <Col span={8}>
                                                                <Button
                                                                    danger
                                                                    icon={<StopOutlined />}
                                                                    block onClick={stopCamera}
                                                                >
                                                                    إيقاف
                                                                </Button>
                                                            </Col>
                                                        </Row>
                                                    )}
                                                </Space>

                                                <Text type="secondary" style={{ fontSize: 11, marginTop: 8, display: 'block' }}>
                                                    📌 تأكد من وضوح الوجه والإضاءة
                                                </Text>
                                            </>
                                        ),
                                    },
                                ]}
                            />

                            {newImages.length > 0 && (
                                <div style={{ marginTop: 8 }}>
                                    <Text type="success" style={{ fontSize: 12 }}>
                                        ✅ {newImages.length} صورة جديدة ستُرفع عند الحفظ
                                    </Text>
                                </div>
                            )}
                        </Card>
                    </Col>
                </Row>

                {/* ── أزرار الحفظ ── */}
                <Space style={{ marginTop: 16 }}>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={isPending}
                        icon={<SaveOutlined />}
                        size="large"
                    >
                        {isPending ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                    </Button>
                    <Button
                        size="large"
                        onClick={() => navigate(`/persons/${personId}`)}
                    >
                        إلغاء
                    </Button>
                </Space>
            </Form>
        </div>
    );
}