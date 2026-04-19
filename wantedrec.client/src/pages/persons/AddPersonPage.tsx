import { useState, useRef, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Form, Input, Select, DatePicker, Switch,
    Upload, Button, Card, Row, Col,
    Typography, Divider, message, Space, Image, Tabs,
} from 'antd';
import type { UploadFile } from 'antd';
import {
    UserAddOutlined, UploadOutlined,
    SaveOutlined, CameraOutlined, DeleteOutlined,
    StarOutlined, StarFilled, StopOutlined,
} from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import { createPerson } from '../.././api/personsApi';
import { Gender, ImageSource } from '../.././types/person.types';
import type { PersonUpsertDto } from '../.././types/person.types';
import { fileToBase64 } from '../../Interfaces/functions';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// ── نوع الصورة المحلية ───────────────────────────────────
interface LocalImage {
    uid: string;
    base64: string;
    preview: string;
    isPrimary: boolean;
}

// ── Form Values ──────────────────────────────────────────
interface AddPersonFormValues {
    fullName: string;
    displayName?: string;
    gender: Gender;
    birthDate?: Dayjs;
    nationalId?: string;
    externalCode?: string;
    phoneNumber?: string;
    address?: string;
    notes?: string;
    isActive: boolean;
}

// ────────────────────────────────────────────────────────
export default function AddPersonPage() {
    const [form] = Form.useForm<AddPersonFormValues>();
    const queryClient = useQueryClient();
    const [messageApi, contextHolder] = message.useMessage();

    const [images, setImages] = useState<LocalImage[]>([]);
    const [activeTab, setActiveTab] = useState('upload');

    // ── Camera refs ───────────────────────────────────────
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [cameraOn, setCameraOn] = useState(false);

    // ── Mutation ──────────────────────────────────────────
    const { mutate: submitPerson, isPending } = useMutation({
        mutationFn: createPerson,
        onSuccess: () => {
            messageApi.success('تم إضافة الشخص بنجاح ✅');
            form.resetFields();
            setImages([]);
            stopCamera();
            queryClient.invalidateQueries({ queryKey: ['persons'] });
        },
        onError: (err: unknown) => {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            messageApi.error(axiosErr?.response?.data?.message ?? 'حدث خطأ أثناء الحفظ');
        },
    });

    // ── إضافة صورة من ملف ────────────────────────────────
    const handleImageSelect = async (file: File): Promise<false> => {
        try {
            const base64 = await fileToBase64(file);
            const preview = URL.createObjectURL(file);
            const uid = `img-${Date.now()}-${Math.random()}`;
            setImages((prev) => [
                ...prev,
                { uid, base64, preview, isPrimary: prev.length === 0 },
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
        const uid = `cam-${Date.now()}-${Math.random()}`;
        setImages((prev) => [
            ...prev,
            { uid, base64, preview, isPrimary: prev.length === 0 },
        ]);
        messageApi.success('تم التقاط الصورة وإضافتها ✅');
    };

    // ── حذف صورة ─────────────────────────────────────────
    const removeImage = (uid: string) => {
        setImages((prev) => {
            const filtered = prev.filter((img) => img.uid !== uid);
            const hasPrimary = filtered.some((img) => img.isPrimary);
            if (!hasPrimary && filtered.length > 0)
                filtered[0] = { ...filtered[0], isPrimary: true };
            return filtered;
        });
    };

    // ── تعيين صورة كـ primary ─────────────────────────────
    const setPrimary = (uid: string) => {
        setImages((prev) => prev.map((img) => ({ ...img, isPrimary: img.uid === uid })));
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

    // ── التقاط صورة من الكاميرا ──────────────────────────
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
    const handleFinish = (values: AddPersonFormValues): void => {
        const dto: PersonUpsertDto = {
            personId: null,
            fullName: values.fullName,
            displayName: values.displayName ?? null,
            gender: values.gender,
            birthDate: values.birthDate?.toISOString() ?? null,
            nationalId: values.nationalId ?? null,
            externalCode: values.externalCode ?? null,
            phoneNumber: values.phoneNumber ?? null,
            address: values.address ?? null,
            notes: values.notes ?? null,
            isActive: values.isActive ?? true,
            faceImages: images.map((img) => ({
                faceImageId: 0,
                imageFile: img.base64,
                imageSource: ImageSource.Manual,
                capturedAt: new Date().toISOString(),
                isActive: true,
                isPrimary: img.isPrimary,
            })),
        };
        submitPerson(dto);
    };

    // ── Render ────────────────────────────────────────────
    return (
        <div style={{ padding: 24, direction: 'rtl' }}>
            {contextHolder}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            <Space align="center" style={{ marginBottom: 24 }}>
                <UserAddOutlined style={{ fontSize: 28, color: '#1677ff' }} />
                <Title level={3} style={{ margin: 0 }}>إضافة شخص جديد</Title>
            </Space>

            <Form<AddPersonFormValues>
                form={form}
                layout="vertical"
                onFinish={handleFinish}
                initialValues={{ isActive: true, gender: Gender.Male }}
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
                                        <Input placeholder="أدخل الاسم الكامل" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item name="displayName" label="الاسم المختصر">
                                        <Input placeholder="أدخل الاسم المختصر" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item
                                        name="gender" label="الجنس"
                                        rules={[{ required: true, message: 'الجنس مطلوب' }]}
                                    >
                                        <Select>
                                            <Option value={Gender.Male}>ذكر</Option>
                                            <Option value={Gender.Female}>أنثى</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item name="birthDate" label="تاريخ الميلاد">
                                        <DatePicker style={{ width: '100%' }} placeholder="اختر التاريخ" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item name="nationalId" label="الهوية الوطنية">
                                        <Input placeholder="رقم الهوية" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item name="externalCode" label="الرمز الخارجي">
                                        <Input placeholder="الرمز الخارجي" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item name="phoneNumber" label="رقم الهاتف">
                                        <Input placeholder="07XX XXX XXXX" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item name="isActive" label="الحالة" valuePropName="checked">
                                        <Switch checkedChildren="نشط" unCheckedChildren="غير نشط" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24}>
                                    <Form.Item name="address" label="العنوان">
                                        <Input placeholder="أدخل العنوان" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24}>
                                    <Form.Item name="notes" label="ملاحظات">
                                        <TextArea rows={3} placeholder="أي ملاحظات إضافية..." />
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
                                    {images.length > 0 && (
                                        <span style={{
                                            background: '#1677ff', color: '#fff',
                                            borderRadius: 10, padding: '0 8px', fontSize: 12,
                                        }}>
                                            {images.length}
                                        </span>
                                    )}
                                </Space>
                            }
                        >
                            {/* ── معرض الصور المضافة ── */}
                            {images.length > 0 && (
                                <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
                                    {images.map((img) => (
                                        <Col key={img.uid} span={12}>
                                            <div style={{ position: 'relative' }}>
                                                <Image
                                                    src={img.preview}
                                                    alt="صورة وجه"
                                                    style={{
                                                        width: '100%', height: 100,
                                                        objectFit: 'cover', borderRadius: 8,
                                                        border: img.isPrimary
                                                            ? '2px solid #1677ff'
                                                            : '1px solid #d9d9d9',
                                                    }}
                                                />
                                                {/* زر حذف */}
                                                <Button
                                                    danger size="small"
                                                    icon={<DeleteOutlined />}
                                                    style={{
                                                        position: 'absolute', top: 4, left: 4,
                                                        minWidth: 'auto', padding: '0 5px', height: 22,
                                                    }}
                                                    onClick={() => removeImage(img.uid)}
                                                />
                                                {/* زر primary */}
                                                <Button
                                                    size="small"
                                                    icon={img.isPrimary
                                                        ? <StarFilled style={{ color: '#faad14' }} />
                                                        : <StarOutlined />}
                                                    title="تعيين كصورة رئيسية"
                                                    style={{
                                                        position: 'absolute', top: 4, right: 4,
                                                        minWidth: 'auto', padding: '0 5px', height: 22,
                                                        background: img.isPrimary ? '#fff7e6' : '#fff',
                                                        borderColor: img.isPrimary ? '#faad14' : '#d9d9d9',
                                                    }}
                                                    onClick={() => setPrimary(img.uid)}
                                                />
                                                {img.isPrimary && (
                                                    <div style={{
                                                        position: 'absolute', bottom: 4, right: 4,
                                                        background: '#1677ff', color: '#fff',
                                                        fontSize: 10, padding: '0 4px', borderRadius: 4,
                                                    }}>
                                                        رئيسية
                                                    </div>
                                                )}
                                            </div>
                                        </Col>
                                    ))}
                                </Row>
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
                                                    multiple
                                                    beforeUpload={(file) => handleImageSelect(file)}
                                                >
                                                    <Button
                                                        icon={<UploadOutlined />}
                                                        block type="dashed"
                                                        style={{ marginBottom: 12 }}
                                                    >
                                                        {images.length === 0
                                                            ? 'رفع صور الوجه'
                                                            : 'إضافة المزيد'}
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
                                                    background: '#000',
                                                    borderRadius: 8,
                                                    overflow: 'hidden',
                                                    marginBottom: 10,
                                                    minHeight: 160,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
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

                            <Divider />

                            {images.length > 0 ? (
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    ✅ {images.length} صورة جاهزة للرفع
                                    <br />
                                    ⭐ اضغط النجمة لتحديد الصورة الرئيسية
                                </Text>
                            ) : (
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    📌 ملاحظات:
                                    <ul style={{ paddingRight: 16, marginTop: 4 }}>
                                        <li>وجه واضح وغير ملثّم</li>
                                        <li>إضاءة جيدة</li>
                                        <li>يمكن إضافة أكثر من صورة</li>
                                    </ul>
                                </Text>
                            )}
                        </Card>
                    </Col>
                </Row>

                {/* ── زر الحفظ ── */}
                <div style={{ textAlign: 'left', marginTop: 8 }}>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={isPending}
                        icon={<SaveOutlined />}
                        size="large"
                    >
                        {isPending ? 'جاري الحفظ...' : 'حفظ الشخص'}
                    </Button>
                </div>
            </Form>
        </div>
    );
}