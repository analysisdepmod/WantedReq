import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
    Space,
    Image,
    message,
    Spin,
    Alert,
    Divider,
    Tabs,
    Tag,
    Tooltip,
    Empty,
    Badge,
} from 'antd';
import type { UploadFile } from 'antd';
import {
    SaveOutlined,
    ArrowRightOutlined,
    CameraOutlined,
    UploadOutlined,
    DeleteOutlined,
    StopOutlined,
    StarOutlined,
    StarFilled,
    SafetyOutlined,
    WarningOutlined,
    CheckCircleOutlined,
    InfoCircleOutlined,
    EditOutlined,
    PictureOutlined,
    FileTextOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getPersonById, setActive, setDisActive, updatePerson } from '../../api/personsApi';
import {
    Gender,
    ImageSource,
    PersonSecurityStatus,
    DangerLevel,
    PersonSecurityStatusLabel,
    PersonSecurityStatusColor,
    DangerLevelLabel,
    DangerLevelColor,
} from '../../types/person.types';
import type {
    PersonUpsertDto,
    PersonFaceImageUpsertDto,
    PersonFaceImageDto,
} from '../../types/person.types';

const { Title, Text } = Typography;
const { TextArea } = Input;

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
    securityStatus: PersonSecurityStatus;
    dangerLevel: DangerLevel;
    hasActiveAlert: boolean;
    isArmedAndDangerous: boolean;
    securityReason?: string;
    caseNumber?: string;
    issuedBy?: string;
    arrestWarrantNumber?: string;
    alertIssuedAt?: dayjs.Dayjs;
    alertExpiresAt?: dayjs.Dayjs;
    lastSeenAt?: dayjs.Dayjs;
    lastSeenLocation?: string;
    distinguishingMarks?: string;
    aliases?: string;
    vehicleInfo?: string;
    securityNotes?: string;
    alertInstructions?: string;
}

interface LocalImage {
    uid: string;
    base64: string;
    preview: string;
    isPrimary: boolean;
}

const securityOptions = Object.entries(PersonSecurityStatusLabel).map(([value, label]) => ({
    value: Number(value),
    label,
}));

const dangerOptions = Object.entries(DangerLevelLabel).map(([value, label]) => ({
    value: Number(value),
    label,
}));

const buildExistingPreview = (img?: PersonFaceImageDto | null): string | undefined => {
    if (!img) return undefined;
    if (img.faceProcessedImage) return `data:image/jpeg;base64,${img.faceProcessedImage}`;
    if (img.imageFilePath) return img.imageFilePath;
    return undefined;
};

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
        <div className="summary-stat">
            <div>
                <div style={{ fontSize: 18, color, fontWeight: 900, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 11, color: 'var(--app-muted)', marginTop: 6 }}>{label}</div>
            </div>

            <div
                className="summary-stat-icon"
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
    const newImagesRef = useRef<LocalImage[]>([]);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [cameraOn, setCameraOn] = useState(false);

    const { mutate: updateStatus } = useMutation({
        mutationFn: async (active: boolean) => (active ? setActive(personId) : setDisActive(personId)),
        onSuccess: (_data, active) => {
            messageApi.success(active ? 'تم التفعيل ✅' : 'تم التعطيل ✅');
            queryClient.invalidateQueries({ queryKey: ['person', personId] });
            queryClient.invalidateQueries({ queryKey: ['persons'] });
        },
        onError: () => messageApi.error('فشل تغيير الحالة'),
    });

    const { data: person, isLoading, isError } = useQuery({
        queryKey: ['person', personId],
        queryFn: () => getPersonById(personId),
        enabled: !!personId,
    });

    useEffect(() => {
        if (!person) return;
        form.setFieldsValue({
            fullName: person.fullName,
            displayName: person.displayName ?? undefined,
            gender: person.gender,
            birthDate: person.birthDate ? dayjs(person.birthDate) : undefined,
            nationalId: person.nationalId ?? undefined,
            externalCode: person.externalCode ?? undefined,
            phoneNumber: person.phoneNumber ?? undefined,
            address: person.address ?? undefined,
            notes: person.notes ?? undefined,
            isActive: person.isActive,
            securityStatus: person.securityStatus ?? PersonSecurityStatus.Normal,
            dangerLevel: person.dangerLevel ?? DangerLevel.None,
            hasActiveAlert: !!person.hasActiveAlert,
            isArmedAndDangerous: !!person.isArmedAndDangerous,
            securityReason: person.securityReason ?? undefined,
            caseNumber: person.caseNumber ?? undefined,
            issuedBy: person.issuedBy ?? undefined,
            arrestWarrantNumber: person.arrestWarrantNumber ?? undefined,
            alertIssuedAt: person.alertIssuedAt ? dayjs(person.alertIssuedAt) : undefined,
            alertExpiresAt: person.alertExpiresAt ? dayjs(person.alertExpiresAt) : undefined,
            lastSeenAt: person.lastSeenAt ? dayjs(person.lastSeenAt) : undefined,
            lastSeenLocation: person.lastSeenLocation ?? undefined,
            distinguishingMarks: person.distinguishingMarks ?? undefined,
            aliases: person.aliases ?? undefined,
            vehicleInfo: person.vehicleInfo ?? undefined,
            securityNotes: person.securityNotes ?? undefined,
            alertInstructions: person.alertInstructions ?? undefined,
        });
        setImages(person.faceImages ?? []);
    }, [person, form]);

    const { mutate: submitUpdate, isPending } = useMutation({
        mutationFn: (dto: PersonUpsertDto) => updatePerson(personId, dto),
        onSuccess: () => {
            messageApi.success('تم تحديث البيانات بنجاح ✅');
            queryClient.invalidateQueries({ queryKey: ['person', personId] });
            queryClient.invalidateQueries({ queryKey: ['persons'] });
            setTimeout(() => navigate(`/persons/${personId}`), 900);
        },
        onError: (err: unknown) => {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            messageApi.error(axiosErr?.response?.data?.message ?? 'حدث خطأ أثناء التحديث');
        },
    });

    const handleImageSelect = async (file: File): Promise<false> => {
        try {
            const base64 = await fileToBase64(file);
            const preview = URL.createObjectURL(file);
            const hasPrimary = images.some((img) => img.isPrimary) || newImages.some((img) => img.isPrimary);
            setNewImages((prev) => [
                ...prev,
                {
                    uid: `new-${Date.now()}-${Math.random()}`,
                    base64,
                    preview,
                    isPrimary: !hasPrimary && prev.length === 0,
                },
            ]);
        } catch {
            messageApi.error('فشل تحميل الصورة');
        }
        return false;
    };

    const addImageFromBlob = async (blob: Blob) => {
        const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
        const base64 = await fileToBase64(file);
        const preview = URL.createObjectURL(blob);
        const hasPrimary = images.some((img) => img.isPrimary) || newImages.some((img) => img.isPrimary);
        setNewImages((prev) => [
            ...prev,
            {
                uid: `cam-${Date.now()}-${Math.random()}`,
                base64,
                preview,
                isPrimary: !hasPrimary && prev.length === 0,
            },
        ]);
        messageApi.success('تم التقاط الصورة وإضافتها ✅');
    };

    const removeOldImage = (imgId: number) => {
        setImages((prev) => {
            const filtered = prev.filter((img) => img.faceImageId !== imgId);
            if (!filtered.some((img) => img.isPrimary) && filtered.length > 0 && !newImages.some((img) => img.isPrimary)) {
                filtered[0] = { ...filtered[0], isPrimary: true };
            }
            return filtered;
        });
    };

    const removeNewImage = (uid: string) => {
        setNewImages((prev) => {
            const target = prev.find((img) => img.uid === uid);
            if (target?.preview) URL.revokeObjectURL(target.preview);
            const filtered = prev.filter((img) => img.uid !== uid);
            if (!filtered.some((img) => img.isPrimary) && filtered.length > 0 && !images.some((img) => img.isPrimary)) {
                filtered[0] = { ...filtered[0], isPrimary: true };
            }
            return filtered;
        });
    };

    const setOldPrimary = (faceImageId: number) => {
        setImages((prev) => prev.map((img) => ({ ...img, isPrimary: img.faceImageId === faceImageId })));
        setNewImages((prev) => prev.map((img) => ({ ...img, isPrimary: false })));
    };

    const setNewPrimary = (uid: string) => {
        setNewImages((prev) => prev.map((img) => ({ ...img, isPrimary: img.uid === uid })));
        setImages((prev) => prev.map((img) => ({ ...img, isPrimary: false })));
    };

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

    const stopCamera = useCallback(() => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setCameraOn(false);
    }, []);

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
            isPrimary: img.isPrimary,
        }));

        const dto: PersonUpsertDto = {
            personId,
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
            faceImages: [...existingImages, ...newImagesDto],
        };

        submitUpdate(dto);
    };

    useEffect(() => {
        newImagesRef.current = newImages;
    }, [newImages]);

    useEffect(() => {
        return () => {
            stopCamera();
            newImagesRef.current.forEach((img) => {
                if (img.preview) URL.revokeObjectURL(img.preview);
            });
        };
    }, [stopCamera]);

    const watchedFullName = Form.useWatch('fullName', form);
    const watchedSecurityStatus =
        (Form.useWatch('securityStatus', form) as PersonSecurityStatus | undefined) ??
        person?.securityStatus ??
        PersonSecurityStatus.Normal;

    const watchedDangerLevel =
        (Form.useWatch('dangerLevel', form) as DangerLevel | undefined) ??
        person?.dangerLevel ??
        DangerLevel.None;

    const watchedHasAlert = Form.useWatch('hasActiveAlert', form);
    const watchedDangerous = Form.useWatch('isArmedAndDangerous', form);

    const primaryExisting = useMemo(
        () => images.find((img) => img.isPrimary),
        [images],
    );

    const primaryNew = useMemo(
        () => newImages.find((img) => img.isPrimary),
        [newImages],
    );

    const previewPrimary = primaryNew?.preview || buildExistingPreview(primaryExisting) || '';

    if (isLoading) {
        return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
    }

    if (isError || !person) {
        return (
            <div style={{ padding: 24 }}>
                <Alert
                    type="error"
                    message="لم يتم العثور على الشخص"
                    action={<Button onClick={() => navigate('/Indexpersons')}>العودة للقائمة</Button>}
                />
            </div>
        );
    }

    return (
        <div className="edit-shell">
            {contextHolder}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            <div className="edit-hero">
                <div className="edit-hero-inner">
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                        <div className="hero-badge">
                            <EditOutlined style={{ fontSize: 28, color: '#fff' }} />
                        </div>

                        <div>
                            <Title level={2} style={{ margin: 0, color: '#fff', fontWeight: 900 }}>
                                تعديل بيانات شخص
                            </Title>
                            <Text style={{ color: 'rgba(255,255,255,.86)', fontSize: 13 }}>
                                حدث البيانات الشخصية والأمنية والصور.
                            </Text>
                        </div>
                    </div>

                    <div className="hero-actions">
                        <Button className="hero-btn" icon={<ArrowRightOutlined />} onClick={() => navigate(`/persons/${personId}`)}>
                            العودة للتفاصيل
                        </Button>

                        <Button className="hero-btn" type="primary" icon={<SaveOutlined />} htmlType="submit" form="edit-person-form" loading={isPending}>
                            حفظ التعديلات
                        </Button>
                    </div>
                </div>
            </div>

            <div className="stats-strip">
                <div className="stat-mini-wrap">
                    <SummaryStat
                        label="الصور الحالية"
                        value={images.length}
                        color="#2563eb"
                        bg="#eff6ff"
                        border="#bfdbfe"
                        icon={<PictureOutlined />}
                    />
                </div>

                <div className="stat-mini-wrap">
                    <SummaryStat
                        label="صور جديدة"
                        value={newImages.length}
                        color="#16a34a"
                        bg="#f0fdf4"
                        border="#bbf7d0"
                        icon={<UploadOutlined />}
                    />
                </div>

                <div className="stat-mini-wrap">
                    <SummaryStat
                        label="الاسم الكامل"
                        value={watchedFullName ? 'جاهز' : 'ناقص'}
                        color={watchedFullName ? '#16a34a' : '#d97706'}
                        bg={watchedFullName ? '#f0fdf4' : '#fff7ed'}
                        border={watchedFullName ? '#bbf7d0' : '#fed7aa'}
                        icon={<FileTextOutlined />}
                    />
                </div>

                <div className="stat-mini-wrap">
                    <SummaryStat
                        label="الحالة الأمنية"
                        value={PersonSecurityStatusLabel[watchedSecurityStatus]}
                        color="#dc2626"
                        bg="#fff5f5"
                        border="#fecaca"
                        icon={<SafetyOutlined />}
                    />
                </div>

                <div className="stat-mini-wrap">
                    <SummaryStat
                        label="درجة الخطورة"
                        value={DangerLevelLabel[watchedDangerLevel]}
                        color="#7c3aed"
                        bg="#faf5ff"
                        border="#ddd6fe"
                        icon={<WarningOutlined />}
                    />
                </div>
            </div>

            <Form<FormValues> id="edit-person-form" form={form} layout="vertical" onFinish={handleFinish}>
                <Row gutter={[18, 18]} align="stretch">
                    <Col xs={24} xl={16}>
                        <Card
                            className="surface-card"
                            title={
                                <div className="section-title">
                                    <InfoCircleOutlined style={{ color: '#1677ff' }} />
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
                                        <Form.Item name="fullName" label="الاسم الكامل" rules={[{ required: true, message: 'الاسم الكامل مطلوب' }]}>
                                            <Input size="large" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Form.Item name="displayName" label="الاسم المختصر">
                                            <Input size="large" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Form.Item name="gender" label="الجنس" rules={[{ required: true }]}>
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
                                        <Form.Item name="birthDate" label="تاريخ الميلاد">
                                            <DatePicker style={{ width: '100%' }} size="large" />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </div>

                            <div className="field-group">
                                <div className="field-group-title">
                                    <FileTextOutlined style={{ color: '#7c3aed' }} />
                                    بيانات التعريف والتواصل
                                </div>

                                <Row gutter={16}>
                                    <Col xs={24} md={12}>
                                        <Form.Item name="nationalId" label="الهوية الوطنية">
                                            <Input size="large" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Form.Item name="externalCode" label="الرمز الخارجي">
                                            <Input size="large" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Form.Item name="phoneNumber" label="رقم الهاتف">
                                            <Input size="large" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Form.Item name="isActive" label="الحالة" valuePropName="checked">
                                            <Switch
                                                checkedChildren="نشط"
                                                unCheckedChildren="غير نشط"
                                                onChange={(active) => updateStatus(active)}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24}>
                                        <Form.Item name="address" label="العنوان">
                                            <Input size="large" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24}>
                                        <Form.Item name="notes" label="ملاحظات عامة">
                                            <TextArea rows={3} />
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
                                        <Form.Item name="securityStatus" label="الحالة الأمنية">
                                            <Select size="large" options={securityOptions} />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Form.Item name="dangerLevel" label="درجة الخطورة">
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
                                            <Input size="large" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Form.Item name="caseNumber" label="رقم القضية">
                                            <Input size="large" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Form.Item name="issuedBy" label="الجهة المصدرة">
                                            <Input size="large" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Form.Item name="arrestWarrantNumber" label="رقم أمر القبض">
                                            <Input size="large" />
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
                                            <Input size="large" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24}>
                                        <Form.Item name="aliases" label="الأسماء المستعارة">
                                            <Input size="large" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24}>
                                        <Form.Item name="distinguishingMarks" label="علامات مميزة">
                                            <TextArea rows={2} />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24}>
                                        <Form.Item name="vehicleInfo" label="معلومات المركبة">
                                            <TextArea rows={2} />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24}>
                                        <Form.Item name="securityNotes" label="ملاحظات أمنية">
                                            <TextArea rows={3} />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24}>
                                        <Form.Item name="alertInstructions" label="تعليمات عند المشاهدة">
                                            <TextArea rows={3} />
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
                                        <span className="section-badge">{images.length + newImages.length}</span>
                                    </div>
                                }
                            >
                                {previewPrimary ? (
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
                                            src={previewPrimary}
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
                                            <Tag color="blue" icon={<CheckCircleOutlined />}>الصورة الرئيسية</Tag>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="upload-drop">
                                        <CameraOutlined style={{ fontSize: 42, color: '#93c5fd', marginBottom: 10 }} />
                                        <div>
                                            <Text strong style={{ display: 'block', color: 'var(--app-text)' }}>
                                                لا توجد صور متاحة حاليًا
                                            </Text>
                                            <Text className="muted-note">أضف صورًا جديدة أو التقط صورة من الكاميرا</Text>
                                        </div>
                                    </div>
                                )}

                                {images.length > 0 && (
                                    <>
                                        <Text type="secondary" style={{ fontSize: 12 }}>الصور الحالية</Text>
                                        <div className="preview-grid" style={{ marginTop: 8 }}>
                                            {images.map((img) => (
                                                <div key={img.faceImageId} className={`preview-tile${img.isPrimary ? ' primary' : ''}`}>
                                                    {buildExistingPreview(img) ? (
                                                        <Image
                                                            src={buildExistingPreview(img)}
                                                            style={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }}
                                                            preview={false}
                                                        />
                                                    ) : (
                                                        <div style={{ height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Text type="secondary">لا توجد معاينة</Text>
                                                        </div>
                                                    )}
                                                    <div className="preview-actions">
                                                        <Tooltip title="حذف الصورة">
                                                            <Button
                                                                danger
                                                                size="small"
                                                                icon={<DeleteOutlined />}
                                                                style={{ minWidth: 'auto', paddingInline: 7 }}
                                                                onClick={() => removeOldImage(img.faceImageId)}
                                                            />
                                                        </Tooltip>

                                                        <Tooltip title="تعيين كصورة رئيسية">
                                                            <Button
                                                                size="small"
                                                                icon={img.isPrimary ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
                                                                style={{ minWidth: 'auto', paddingInline: 7 }}
                                                                onClick={() => setOldPrimary(img.faceImageId)}
                                                            />
                                                        </Tooltip>
                                                    </div>
                                                    {img.isPrimary && <div className="preview-label">رئيسية</div>}
                                                </div>
                                            ))}
                                        </div>
                                        <Divider />
                                    </>
                                )}

                                {newImages.length > 0 && (
                                    <>
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            صور جديدة <Badge count={newImages.length} color="#16a34a" />
                                        </Text>
                                        <div className="preview-grid" style={{ marginTop: 8 }}>
                                            {newImages.map((img) => (
                                                <div key={img.uid} className={`preview-tile${img.isPrimary ? ' primary' : ''}`}>
                                                    <Image
                                                        src={img.preview}
                                                        style={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }}
                                                        preview={false}
                                                    />
                                                    <div className="preview-actions">
                                                        <Tooltip title="حذف الصورة">
                                                            <Button
                                                                danger
                                                                size="small"
                                                                icon={<DeleteOutlined />}
                                                                style={{ minWidth: 'auto', paddingInline: 7 }}
                                                                onClick={() => removeNewImage(img.uid)}
                                                            />
                                                        </Tooltip>

                                                        <Tooltip title="تعيين كصورة رئيسية">
                                                            <Button
                                                                size="small"
                                                                icon={img.isPrimary ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
                                                                style={{ minWidth: 'auto', paddingInline: 7 }}
                                                                onClick={() => setNewPrimary(img.uid)}
                                                            />
                                                        </Tooltip>
                                                    </div>
                                                    {img.isPrimary && <div className="preview-label">رئيسية</div>}
                                                </div>
                                            ))}
                                        </div>
                                        <Divider />
                                    </>
                                )}

                                {images.length === 0 && newImages.length === 0 && (
                                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="لا توجد صور" style={{ marginBottom: 12 }} />
                                )}

                                <Tabs
                                    activeKey={activeTab}
                                    onChange={handleTabChange}
                                    size="small"
                                    items={[
                                        {
                                            key: 'upload',
                                            label: <Space><UploadOutlined />رفع صورة</Space>,
                                            children: (
                                                <div className="upload-drop">
                                                    <Upload<UploadFile>
                                                        accept="image/*"
                                                        showUploadList={false}
                                                        multiple
                                                        beforeUpload={(file) => handleImageSelect(file)}
                                                    >
                                                        <Button icon={<UploadOutlined />} type="primary" size="large" block>
                                                            إضافة صور جديدة
                                                        </Button>
                                                    </Upload>
                                                    <div style={{ marginTop: 10 }}>
                                                        <Text className="muted-note">الصيغ المدعومة: JPG, PNG</Text>
                                                    </div>
                                                </div>
                                            ),
                                        },
                                        {
                                            key: 'camera',
                                            label: <Space><CameraOutlined />كاميرا</Space>,
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
                                                                <CameraOutlined style={{ fontSize: 40, color: '#64748b', marginBottom: 8 }} />
                                                                <br />
                                                                <Text style={{ color: '#94a3b8', fontSize: 12 }}>اضغط لفتح الكاميرا</Text>
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
                                                                    <Button type="primary" icon={<CameraOutlined />} block size="large" onClick={captureFrame}>
                                                                        التقاط صورة
                                                                    </Button>
                                                                </Col>
                                                                <Col span={8}>
                                                                    <Button danger icon={<StopOutlined />} block size="large" onClick={stopCamera}>
                                                                        إيقاف
                                                                    </Button>
                                                                </Col>
                                                            </Row>
                                                        )}
                                                    </Space>
                                                </>
                                            ),
                                        },
                                    ]}
                                />
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
                                            <div className="l">حالياً</div>
                                        </div>

                                        <div className="summary-chip">
                                            <div className="v">{newImages.length}</div>
                                            <div className="l">جديدة</div>
                                        </div>

                                        <div className="summary-chip">
                                            <div className="v">{previewPrimary ? '1' : '0'}</div>
                                            <div className="l">رئيسية</div>
                                        </div>

                                        <div className="summary-chip">
                                            <div className="v">{watchedFullName ? 'جاهز' : 'ناقص'}</div>
                                            <div className="l">الاسم الكامل</div>
                                        </div>
                                    </div>

                                    {person.suspect && (
                                        <Alert
                                            style={{ marginTop: 14 }}
                                            type="warning"
                                            showIcon
                                            message="سجل مشتبه به قديم موجود"
                                            description={`القضية: ${person.suspect.caseReference || '—'} / الحالة: ${person.suspect.status || '—'}`}
                                        />
                                    )}
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
                                    {isPending ? 'جاري التحديث...' : 'حفظ التعديلات'}
                                </Button>
                            </div>
                        </Col>
                    </Row>
                </div>
            </Form>
        </div>
    );
}
