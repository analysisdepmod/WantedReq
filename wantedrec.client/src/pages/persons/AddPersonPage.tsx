import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Form,
    Input,
    Select,
    DatePicker,
    Switch,
    Upload,
    Button,
    Card,
    Row,
    Col,
    Typography,
    Divider,
    message,
    Space,
    Image,
    Tabs,
    Tag,
    Empty,
    Tooltip,
    Alert,
} from 'antd';
import type { UploadFile } from 'antd';
import {
    UserAddOutlined,
    UploadOutlined,
    SaveOutlined,
    CameraOutlined,
    DeleteOutlined,
    StarOutlined,
    StarFilled,
    StopOutlined,
    IdcardOutlined,
    PhoneOutlined,
    HomeOutlined,
    CheckCircleOutlined,
    InfoCircleOutlined,
    PictureOutlined,
    SafetyOutlined,
    FileTextOutlined,
    AlertOutlined,
    ThunderboltOutlined,
} from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import { createPerson } from '../../api/personsApi';
import {
    Gender,
    ImageSource,
    PersonSecurityStatus,
    DangerLevel,
    PersonSecurityStatusLabel,
    DangerLevelLabel,
    PersonSecurityStatusColor,
    DangerLevelColor,
} from '../../types/person.types';
import type { PersonUpsertDto } from '../../types/person.types';
import { fileToBase64 } from '../../Interfaces/functions';

const { Title, Text } = Typography;
const { TextArea } = Input;



interface LocalImage {
    uid: string;
    base64: string;
    preview: string;
    isPrimary: boolean;
}

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
    securityStatus: PersonSecurityStatus;
    dangerLevel: DangerLevel;
    hasActiveAlert: boolean;
    isArmedAndDangerous: boolean;
    securityReason?: string;
    caseNumber?: string;
    issuedBy?: string;
    arrestWarrantNumber?: string;
    alertIssuedAt?: Dayjs;
    alertExpiresAt?: Dayjs;
    lastSeenAt?: Dayjs;
    lastSeenLocation?: string;
    distinguishingMarks?: string;
    aliases?: string;
    vehicleInfo?: string;
    securityNotes?: string;
    alertInstructions?: string;
}

const securityOptions = Object.entries(PersonSecurityStatusLabel).map(([value, label]) => ({
    value: Number(value),
    label,
}));

const dangerOptions = Object.entries(DangerLevelLabel).map(([value, label]) => ({
    value: Number(value),
    label,
}));

function SummaryStat({
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
        <div className="add-compact-summary-stat">
            <div>
                <div className="v" style={{ color }}>{value}</div>
                <div className="l">{label}</div>
            </div>

            <div
                className="i"
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

export default function AddPersonPage() {
    const [form] = Form.useForm<AddPersonFormValues>();
    const queryClient = useQueryClient();
    const [messageApi, contextHolder] = message.useMessage();

    const [images, setImages] = useState<LocalImage[]>([]);
    const [activeTab, setActiveTab] = useState('upload');
    const imagesRef = useRef<LocalImage[]>([]);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [cameraOn, setCameraOn] = useState(false);

    const cleanupObjectUrl = (url?: string) => {
        if (url) URL.revokeObjectURL(url);
    };

    const stopCamera = useCallback(() => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setCameraOn(false);
    }, []);

    const { mutate: submitPerson, isPending } = useMutation({
        mutationFn: createPerson,
        onSuccess: () => {
            messageApi.success('تم إضافة الشخص بنجاح ✅');
            form.resetFields();
            imagesRef.current.forEach((img) => cleanupObjectUrl(img.preview));
            setImages([]);
            stopCamera();
            queryClient.invalidateQueries({ queryKey: ['persons'] });
        },
        onError: (err: unknown) => {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            messageApi.error(axiosErr?.response?.data?.message ?? 'حدث خطأ أثناء الحفظ');
        },
    });

    const handleImageSelect = async (file: File): Promise<false> => {
        try {
            const base64 = await fileToBase64(file);
            const preview = URL.createObjectURL(file);
            const uid = `img-${Date.now()}-${Math.random()}`;
            setImages((prev) => [...prev, { uid, base64, preview, isPrimary: prev.length === 0 }]);
        } catch {
            messageApi.error('فشل تحميل الصورة');
        }
        return false;
    };

    const addImageFromBlob = async (blob: Blob) => {
        const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
        const base64 = await fileToBase64(file);
        const preview = URL.createObjectURL(blob);
        const uid = `cam-${Date.now()}-${Math.random()}`;
        setImages((prev) => [...prev, { uid, base64, preview, isPrimary: prev.length === 0 }]);
        messageApi.success('تم التقاط الصورة وإضافتها ✅');
    };

    const removeImage = (uid: string) => {
        setImages((prev) => {
            const target = prev.find((img) => img.uid === uid);
            if (target) cleanupObjectUrl(target.preview);
            const filtered = prev.filter((img) => img.uid !== uid);
            if (!filtered.some((img) => img.isPrimary) && filtered.length > 0) {
                filtered[0] = { ...filtered[0], isPrimary: true };
            }
            return filtered;
        });
    };

    const setPrimary = (uid: string) =>
        setImages((prev) => prev.map((img) => ({ ...img, isPrimary: img.uid === uid })));

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            streamRef.current = stream;
            setCameraOn(true);
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play().catch(() => { });
                }
            }, 50);
        } catch {
            messageApi.error('لم يتم السماح بالوصول للكاميرا');
        }
    };

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

    const handleTabChange = (key: string) => {
        setActiveTab(key);
        if (key !== 'camera') stopCamera();
    };

    const handleFinish = (values: AddPersonFormValues): void => {
        if (images.length === 0) {
            messageApi.warning('أضف صورة وجه واحدة على الأقل');
            return;
        }

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
            securityStatus: values.securityStatus,
            dangerLevel: values.dangerLevel,
            hasActiveAlert: values.hasActiveAlert ?? false,
            isArmedAndDangerous: values.isArmedAndDangerous ?? false,
            securityReason: values.securityReason ?? null,
            caseNumber: values.caseNumber ?? null,
            issuedBy: values.issuedBy ?? null,
            arrestWarrantNumber: values.arrestWarrantNumber ?? null,
            alertIssuedAt: values.alertIssuedAt?.toISOString() ?? null,
            alertExpiresAt: values.alertExpiresAt?.toISOString() ?? null,
            lastSeenAt: values.lastSeenAt?.toISOString() ?? null,
            lastSeenLocation: values.lastSeenLocation ?? null,
            distinguishingMarks: values.distinguishingMarks ?? null,
            aliases: values.aliases ?? null,
            vehicleInfo: values.vehicleInfo ?? null,
            securityNotes: values.securityNotes ?? null,
            alertInstructions: values.alertInstructions ?? null,
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

    const primaryImage = useMemo(() => images.find((img) => img.isPrimary) ?? null, [images]);

    useEffect(() => {
        imagesRef.current = images;
    }, [images]);

    useEffect(
        () => () => {
            stopCamera();
            imagesRef.current.forEach((img) => cleanupObjectUrl(img.preview));
        },
        [stopCamera],
    );

    const watchedFullName = Form.useWatch('fullName', form);
    const watchedSecurityStatus =
        (Form.useWatch('securityStatus', form) as PersonSecurityStatus | undefined) ?? PersonSecurityStatus.Normal;
    const watchedDangerLevel =
        (Form.useWatch('dangerLevel', form) as DangerLevel | undefined) ?? DangerLevel.None;
    const watchedHasAlert = Form.useWatch('hasActiveAlert', form);
    const watchedDangerous = Form.useWatch('isArmedAndDangerous', form);

    return (
        <div className="add-shell">
            
            {contextHolder}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            <div className="add-hero">
                <div className="add-hero-inner">
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                        <div className="hero-badge">
                            <UserAddOutlined style={{ fontSize: 28, color: '#fff' }} />
                        </div>

                        <div>
                            <Title level={2} style={{ margin: 0, color: '#fff', fontWeight: 900 }}>
                                إضافة شخص جديد
                            </Title>
                            <Text style={{ color: 'rgba(255,255,255,.86)', fontSize: 13 }}>
                                أنشئ ملفًا شخصيًا وأمنيًا كاملًا مع صور وجه واضحة وبيانات بحث دقيقة.
                            </Text>
                        </div>
                    </div>

                    <div className="hero-actions">
                        <Button className="hero-btn" icon={<ThunderboltOutlined />}>
                            ملف جديد
                        </Button>

                        <Button className="hero-btn" type="primary" icon={<SaveOutlined />} htmlType="submit" form="add-person-form" loading={isPending}>
                            حفظ الشخص
                        </Button>
                    </div>
                </div>
            </div>

            <div className="add-compact-stats">
                <div className="add-compact-stat-wrap">
                    <SummaryStat
                        label="عدد الصور"
                        value={images.length}
                        color="#2563eb"
                        bg="#eff6ff"
                        border="#bfdbfe"
                        icon={<PictureOutlined />}
                    />
                </div>

                <div className="add-compact-stat-wrap">
                    <SummaryStat
                        label="صورة رئيسية"
                        value={primaryImage ? 1 : 0}
                        color="#16a34a"
                        bg="#f0fdf4"
                        border="#bbf7d0"
                        icon={<CheckCircleOutlined />}
                    />
                </div>

                <div className="add-compact-stat-wrap">
                    <SummaryStat
                        label="الاسم الكامل"
                        value={watchedFullName ? 'جاهز' : 'ناقص'}
                        color={watchedFullName ? '#16a34a' : '#d97706'}
                        bg={watchedFullName ? '#f0fdf4' : '#fff7ed'}
                        border={watchedFullName ? '#bbf7d0' : '#fed7aa'}
                        icon={<FileTextOutlined />}
                    />
                </div>

                <div className="add-compact-stat-wrap">
                    <SummaryStat
                        label="الحالة الأمنية"
                        value={PersonSecurityStatusLabel[watchedSecurityStatus]}
                        color="#dc2626"
                        bg="#fff5f5"
                        border="#fecaca"
                        icon={<SafetyOutlined />}
                    />
                </div>

                <div className="add-compact-stat-wrap">
                    <SummaryStat
                        label="درجة الخطورة"
                        value={DangerLevelLabel[watchedDangerLevel]}
                        color="#7c3aed"
                        bg="#faf5ff"
                        border="#ddd6fe"
                        icon={<AlertOutlined />}
                    />
                </div>
            </div>

            <Form<AddPersonFormValues>
                id="add-person-form"
                form={form}
                layout="vertical"
                onFinish={handleFinish}
                initialValues={{
                    isActive: true,
                    gender: Gender.Male,
                    securityStatus: PersonSecurityStatus.Normal,
                    dangerLevel: DangerLevel.None,
                    hasActiveAlert: false,
                    isArmedAndDangerous: false,
                }}
            >
                <Row gutter={[18, 18]} align="stretch">
                    <Col xs={24} xl={16}>
                        <Card
                            className="surface-card"
                            title={
                                <div className="section-title">
                                    <IdcardOutlined style={{ color: '#1677ff' }} />
                                    <span>البيانات الشخصية</span>
                                </div>
                            }
                        >
                            <div className="field-group">
                                <div className="field-group-title">
                                    <InfoCircleOutlined style={{ color: '#1677ff' }} />
                                    المعلومات الأساسية
                                </div>

                                <Row gutter={16}>
                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            name="fullName"
                                            label="الاسم الكامل"
                                            rules={[{ required: true, message: 'الاسم الكامل مطلوب' }]}
                                        >
                                            <Input placeholder="أدخل الاسم الكامل" size="large" />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} md={12}>
                                        <Form.Item name="displayName" label="الاسم المختصر">
                                            <Input placeholder="أدخل الاسم المختصر" size="large" />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            name="gender"
                                            label="الجنس"
                                            rules={[{ required: true, message: 'الجنس مطلوب' }]}
                                        >
                                            <Select
                                                size="large"
                                                options={[
                                                    { value: Gender.Male, label: 'ذكر' },
                                                    { value: Gender.Female, label: 'أنثى' },
                                                ]}
                                            />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} md={12}>
                                        <Form.Item name="birthDate" label="تاريخ الميلاد" rules={[{ required: true, message: 'تاريخ الميلاد  مطلوب' }]}>
                                            <DatePicker style={{ width: '100%' }} placeholder="اختر التاريخ" size="large" />

                                        </Form.Item>
                                    </Col>
                                </Row>
                            </div>

                            <div className="field-group">
                                <div className="field-group-title">
                                    <IdcardOutlined style={{ color: '#7c3aed' }} />
                                    بيانات التعريف
                                </div>

                                <Row gutter={16}>
                                    <Col xs={24} md={12}>
                                        <Form.Item name="nationalId" label="الهوية الوطنية" rules={[{ required: true, message: 'الهوية مطلوبة' }]}>
                                            <Input placeholder="رقم الهوية" size="large" / >
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} md={12}>
                                        <Form.Item name="externalCode" label="الرمز الخارجي">
                                            <Input placeholder="الرمز الخارجي" size="large" />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </div>

                            <div className="field-group">
                                <div className="field-group-title">
                                    <PhoneOutlined style={{ color: '#16a34a' }} />
                                    بيانات التواصل والحالة
                                </div>

                                <Row gutter={16}>
                                    <Col xs={24} md={12}>
                                        <Form.Item name="phoneNumber" label="رقم الهاتف">
                                            <Input placeholder="07XX XXX XXXX" size="large" />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} md={12}>
                                        <Form.Item name="isActive" label="الحالة" valuePropName="checked">
                                            <Switch checkedChildren="نشط" unCheckedChildren="غير نشط" />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24}>
                                        <Form.Item name="address" label="العنوان">
                                            <Input
                                                placeholder="أدخل العنوان"
                                                size="large"
                                                prefix={<HomeOutlined style={{ color: '#94a3b8' }} />}
                                            />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24}>
                                        <Form.Item name="notes" label="ملاحظات عامة">
                                            <TextArea rows={4} placeholder="أي ملاحظات إضافية..." />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </div>

                            <div className="field-group">
                                <div className="field-group-title">
                                    <SafetyOutlined style={{ color: '#dc2626' }} />
                                    البيانات الأمنية
                                </div>

                                <Row gutter={16}>
                                    <Col xs={24} md={12}>
                                        <Form.Item name="securityStatus" label="الحالة الأمنية" rules={[{ required: true, message: 'الحالة الامنية مطلوبة' }]}>
                                            <Select size="large" options={securityOptions} />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} md={12}>
                                        <Form.Item name="dangerLevel" label="درجة الخطورة" rules={[{ required: true, message: 'درجة الخطورة مطلوبة' }]}>
                                            <Select size="large" options={dangerOptions} />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} md={12}>
                                        <Form.Item name="hasActiveAlert" label="يوجد تعميم فعال" valuePropName="checked">
                                            <Switch checkedChildren="نعم" unCheckedChildren="لا" />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} md={12}>
                                        <Form.Item name="isArmedAndDangerous" label="مسلح وخطر" valuePropName="checked">
                                            <Switch checkedChildren="نعم" unCheckedChildren="لا" />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} md={12}>
                                        <Form.Item name="securityReason" label="سبب الإدراج الأمني">
                                            <Input size="large" placeholder="سبب التعميم أو الإدراج" />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} md={12}>
                                        <Form.Item name="caseNumber" label="رقم القضية">
                                            <Input size="large" placeholder="رقم القضية أو الملف" />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} md={12}>
                                        <Form.Item name="issuedBy" label="الجهة المصدرة">
                                            <Input size="large" placeholder="الجهة المصدرة" />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} md={12}>
                                        <Form.Item name="arrestWarrantNumber" label="رقم أمر القبض">
                                            <Input size="large" placeholder="رقم أمر القبض" />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} md={12}>
                                        <Form.Item name="alertIssuedAt" label="تاريخ إصدار التعميم">
                                            <DatePicker showTime style={{ width: '100%' }} size="large" />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} md={12}>
                                        <Form.Item name="alertExpiresAt" label="تاريخ انتهاء التعميم">
                                            <DatePicker showTime style={{ width: '100%' }} size="large" />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} md={12}>
                                        <Form.Item name="lastSeenAt" label="آخر ظهور">
                                            <DatePicker showTime style={{ width: '100%' }} size="large" />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} md={12}>
                                        <Form.Item name="lastSeenLocation" label="مكان آخر ظهور">
                                            <Input size="large" placeholder="مكان آخر ظهور" />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24}>
                                        <Form.Item name="aliases" label="الأسماء المستعارة">
                                            <Input size="large" placeholder="الأسماء المستعارة" />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24}>
                                        <Form.Item name="distinguishingMarks" label="علامات مميزة">
                                            <TextArea rows={2} placeholder="وشم، ندبة، وصف مميز..." />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24}>
                                        <Form.Item name="vehicleInfo" label="معلومات المركبة">
                                            <TextArea rows={2} placeholder="نوع المركبة، اللون، الرقم..." />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24}>
                                        <Form.Item name="securityNotes" label="ملاحظات أمنية">
                                            <TextArea rows={3} placeholder="ملاحظات أمنية داخلية" />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24}>
                                        <Form.Item name="alertInstructions" label="تعليمات عند المشاهدة">
                                            <TextArea rows={3} placeholder="التصرف المطلوب عند مشاهدة الشخص" />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </div>
                        </Card>
                    </Col>

                    <Col xs={24} xl={8}>
                        <div className="right-stack">
                            <Card
                                className="surface-card"
                                title={
                                    <div className="section-title">
                                        <PictureOutlined style={{ color: '#16a34a' }} />
                                        <span>صور الوجه</span>
                                        {images.length > 0 && <span className="section-badge">{images.length}</span>}
                                    </div>
                                }
                            >
                                {primaryImage ? (
                                    <div
                                        style={{
                                            marginBottom: 16,
                                            borderRadius: 18,
                                            overflow: 'hidden',
                                            border: '1px solid var(--app-border)',
                                            background: 'var(--app-surface-2)',
                                        }}
                                    >
                                        <Image
                                            src={primaryImage.preview}
                                            alt="الصورة الرئيسية"
                                            preview={false}
                                            style={{
                                                width: '100%',
                                                height: 220,
                                                objectFit: 'cover',
                                                display: 'block',
                                            }}
                                        />
                                        <div style={{ padding: 10 }}>
                                            <Tag color="blue" icon={<CheckCircleOutlined />}>
                                                الصورة الرئيسية
                                            </Tag>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="upload-drop">
                                        <CameraOutlined style={{ fontSize: 42, color: '#93c5fd', marginBottom: 10 }} />
                                        <div>
                                            <Text strong style={{ display: 'block', color: 'var(--app-text)' }}>
                                                لا توجد صور مضافة حتى الآن
                                            </Text>
                                            <Text className="muted-note">ارفع صورًا واضحة أو استخدم الكاميرا</Text>
                                        </div>
                                    </div>
                                )}

                                {images.length > 0 ? (
                                    <div className="preview-grid">
                                        {images.map((img) => (
                                            <div key={img.uid} className={`preview-tile${img.isPrimary ? ' primary' : ''}`}>
                                                <Image
                                                    src={img.preview}
                                                    alt="صورة وجه"
                                                    preview={false}
                                                    style={{
                                                        width: '100%',
                                                        height: 110,
                                                        objectFit: 'cover',
                                                        display: 'block',
                                                    }}
                                                />
                                                <div className="preview-actions">
                                                    <Tooltip title="حذف الصورة">
                                                        <Button
                                                            danger
                                                            size="small"
                                                            icon={<DeleteOutlined />}
                                                            onClick={() => removeImage(img.uid)}
                                                            style={{ minWidth: 'auto', paddingInline: 7 }}
                                                        />
                                                    </Tooltip>

                                                    <Tooltip title="تعيين كصورة رئيسية">
                                                        <Button
                                                            size="small"
                                                            icon={img.isPrimary ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
                                                            onClick={() => setPrimary(img.uid)}
                                                            style={{
                                                                minWidth: 'auto',
                                                                paddingInline: 7,
                                                                background: img.isPrimary ? '#fff7e6' : '#fff',
                                                                borderColor: img.isPrimary ? '#faad14' : undefined,
                                                            }}
                                                        />
                                                    </Tooltip>
                                                </div>

                                                {img.isPrimary && <div className="preview-label">رئيسية</div>}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="لم تتم إضافة أي صورة بعد" style={{ marginBottom: 12 }} />
                                )}

                                <Tabs
                                    activeKey={activeTab}
                                    onChange={handleTabChange}
                                    size="small"
                                    items={[
                                        {
                                            key: 'upload',
                                            label: (
                                                <Space>
                                                    <UploadOutlined />
                                                    رفع صورة
                                                </Space>
                                            ),
                                            children: (
                                                <div className="upload-drop">
                                                    <Upload<UploadFile>
                                                        accept="image/*"
                                                        showUploadList={false}
                                                        multiple
                                                        beforeUpload={(file) => handleImageSelect(file)}
                                                    >
                                                        <Button icon={<UploadOutlined />} type="primary" size="large" block>
                                                            {images.length === 0 ? 'رفع صور الوجه' : 'إضافة المزيد'}
                                                        </Button>
                                                    </Upload>

                                                    <div style={{ marginTop: 10 }}>
                                                        <Text className="muted-note">
                                                            الصيغ المدعومة: JPG, PNG — يفضّل أكثر من صورة بزوايا مختلفة
                                                        </Text>
                                                    </div>
                                                </div>
                                            ),
                                        },
                                        {
                                            key: 'camera',
                                            label: (
                                                <Space>
                                                    <CameraOutlined />
                                                    كاميرا
                                                </Space>
                                            ),
                                            children: (
                                                <>
                                                    <div className="camera-box">
                                                        <video
                                                            ref={videoRef}
                                                            autoPlay
                                                            playsInline
                                                            muted
                                                            style={{ width: '100%', display: cameraOn ? 'block' : 'none' }}
                                                        />
                                                        {cameraOn && <div className="camera-overlay-badge">LIVE CAMERA</div>}
                                                        {!cameraOn && (
                                                            <div style={{ textAlign: 'center', padding: 20 }}>
                                                                <CameraOutlined
                                                                    style={{ fontSize: 40, color: '#64748b', marginBottom: 8 }}
                                                                />
                                                                <br />
                                                                <Text style={{ color: '#94a3b8', fontSize: 12 }}>
                                                                    اضغط لفتح الكاميرا
                                                                </Text>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <Space direction="vertical" style={{ width: '100%' }}>
                                                        {!cameraOn ? (
                                                            <Button icon={<CameraOutlined />} block size="large" onClick={startCamera}>
                                                                فتح الكاميرا
                                                            </Button>
                                                        ) : (
                                                            <Row gutter={8}>
                                                                <Col span={16}>
                                                                    <Button
                                                                        type="primary"
                                                                        icon={<CameraOutlined />}
                                                                        block
                                                                        size="large"
                                                                        onClick={captureFrame}
                                                                    >
                                                                        التقاط صورة
                                                                    </Button>
                                                                </Col>
                                                                <Col span={8}>
                                                                    <Button
                                                                        danger
                                                                        icon={<StopOutlined />}
                                                                        block
                                                                        size="large"
                                                                        onClick={stopCamera}
                                                                    >
                                                                        إيقاف
                                                                    </Button>
                                                                </Col>
                                                            </Row>
                                                        )}
                                                    </Space>

                                                    <Text className="muted-note" style={{ display: 'block', marginTop: 10 }}>
                                                        تأكد من وضوح الوجه والإضاءة الجيدة قبل الالتقاط
                                                    </Text>
                                                </>
                                            ),
                                        },
                                    ]}
                                />

                                <Divider />

                                {images.length > 0 ? (
                                    <Alert
                                        type="success"
                                        showIcon
                                        message={`جاهز للرفع: ${images.length} صورة`}
                                        description="يمكنك اختيار الصورة الرئيسية بالنجمة قبل الحفظ"
                                    />
                                ) : (
                                    <Alert
                                        type="info"
                                        showIcon
                                        message="ملاحظات مهمة"
                                        description={
                                            <ul style={{ paddingRight: 18, margin: '8px 0 0' }}>
                                                <li>وجه واضح وغير ملثّم</li>
                                                <li>إضاءة جيدة</li>
                                                <li>يفضل إضافة أكثر من صورة</li>
                                            </ul>
                                        }
                                    />
                                )}
                            </Card>

                            <Card
                                className="surface-card"
                                title={
                                    <div className="section-title">
                                        <SafetyOutlined style={{ color: '#dc2626' }} />
                                        <span>ملخص أمني مباشر</span>
                                    </div>
                                }
                            >
                                <div className="preview-summary">
                                    <Space wrap size={8}>
                                        <Tag color={PersonSecurityStatusColor[watchedSecurityStatus]}>
                                            {PersonSecurityStatusLabel[watchedSecurityStatus]}
                                        </Tag>
                                        <Tag color={DangerLevelColor[watchedDangerLevel]}>
                                            {DangerLevelLabel[watchedDangerLevel]}
                                        </Tag>
                                        {watchedHasAlert ? <Tag color="error">تعميم فعال</Tag> : <Tag>لا يوجد تعميم</Tag>}
                                        {watchedDangerous ? <Tag color="volcano">مسلح وخطر</Tag> : <Tag>غير مسلح</Tag>}
                                    </Space>

                                    <Divider />

                                    <div className="summary-chip-wrap">
                                        <div className="summary-chip">
                                            <div className="v">{images.length}</div>
                                            <div className="l">عدد الصور</div>
                                        </div>

                                        <div className="summary-chip">
                                            <div className="v">{primaryImage ? '1' : '0'}</div>
                                            <div className="l">صورة رئيسية</div>
                                        </div>

                                        <div className="summary-chip">
                                            <div className="v">{watchedFullName ? 'جاهز' : 'ناقص'}</div>
                                            <div className="l">الاسم الكامل</div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </Col>
                </Row>

                <div className="save-bar">
                    <Row gutter={[12, 12]} align="middle" justify="space-between">
                        <Col xs={24} lg={16}>
                            <Space wrap size={10}>
                                <div className="summary-chip">
                                    <div className="v">{PersonSecurityStatusLabel[watchedSecurityStatus]}</div>
                                    <div className="l">الحالة الأمنية</div>
                                </div>

                                <div className="summary-chip">
                                    <div className="v">{DangerLevelLabel[watchedDangerLevel]}</div>
                                    <div className="l">درجة الخطورة</div>
                                </div>

                                <div className="summary-chip">
                                    <div className="v">{watchedHasAlert ? 'نعم' : 'لا'}</div>
                                    <div className="l">تعميم فعّال</div>
                                </div>

                                <div className="summary-chip">
                                    <div className="v">{watchedDangerous ? 'نعم' : 'لا'}</div>
                                    <div className="l">مسلح وخطر</div>
                                </div>
                            </Space>
                        </Col>

                        <Col xs={24} lg={8}>
                            <div style={{ textAlign: 'left' }}>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={isPending}
                                    icon={<SaveOutlined />}
                                    size="large"
                                    style={{ minWidth: 190, height: 48, borderRadius: 14, fontWeight: 800 }}
                                >
                                    {isPending ? 'جاري الحفظ...' : 'حفظ الشخص'}
                                </Button>
                            </div>
                        </Col>
                    </Row>
                </div>
            </Form>
        </div>
    );
}
