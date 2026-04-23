import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Upload, Button, Card, Row, Col, Typography, Space,
    Image, Progress, Alert, Spin, Tag, Empty, message, Divider,
} from 'antd';
import type { UploadFile } from 'antd';
import {
    SearchOutlined, UploadOutlined,
    CheckCircleOutlined, CloseCircleOutlined,
    UserOutlined, EyeOutlined, DeleteOutlined, ClearOutlined,
} from '@ant-design/icons';
import { ValidFile } from '../../Interfaces/functions';
import type { RecognitionFaceDto, LiveRecognitionResultDto } from '../../types/camera.types';
import { identifyFace } from '../../api/recognitionApi';

const { Title, Text } = Typography;

const scoreColor = (s: number) =>
    s >= 0.8 ? '#52c41a' : s >= 0.6 ? '#faad14' : '#ff4d4f';

const scoreLabel = (s: number) =>
    s >= 0.8 ? 'تطابق عالي' : s >= 0.6 ? 'تطابق متوسط' : 'تطابق ضعيف';

type BatchImageItem = {
    id: string;
    file: File;
    name: string;
    previewUrl: string;
    result: LiveRecognitionResultDto | null;
    error: string | null;
    isPending: boolean;
};

function FaceCard({ face }: { face: RecognitionFaceDto }) {
    const navigate = useNavigate();

    return (
        <div
            style={{
                border: `1px solid ${face.isKnown ? '#b7eb8f' : '#e6eaf0'}`,
                borderRadius: 12,
                padding: 14,
                marginBottom: 10,
                background: face.isKnown ? 'var(--app-soft-green)' : 'var(--app-surface)',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: face.isKnown ? 10 : 0,
                }}
            >
                <Space size={8} align="start">
                    {face.isKnown ? (
                        <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 15, marginTop: 2 }} />
                    ) : (
                        <CloseCircleOutlined style={{ color: 'var(--app-muted)', fontSize: 15, marginTop: 2 }} />
                    )}

                    <div>
                        <Text strong style={{ fontSize: 13, display: 'block' }}>
                            {face.isKnown ? face.name : 'وجه غير معروف'}
                        </Text>

                        {face.isKnown && (
                            <Text style={{ color: scoreColor(face.score), fontSize: 11 }}>
                                {scoreLabel(face.score)} — {Math.round(face.score * 100)}%
                            </Text>
                        )}
                    </div>
                </Space>

                {face.isKnown && face.person && (
                    <Button
                        size="small"
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={() => navigate(`/persons/${face.person!.personId}`)}
                    >
                        الملف
                    </Button>
                )}
            </div>

            {face.isKnown && face.person && (
                <Row gutter={8} align="middle">
                    {face.primaryImageBase64 && (
                        <Col span={6}>
                            <Image
                                src={`data:image/jpeg;base64,${face.primaryImageBase64}`}
                                style={{
                                    width: 60,
                                    height: 60,
                                    objectFit: 'cover',
                                    borderRadius: 6,
                                    border: `2px solid ${scoreColor(face.score)}`,
                                }}
                                preview={false}
                            />
                        </Col>
                    )}

                    <Col span={face.primaryImageBase64 ? 18 : 24}>
                        <div>
                            <Text type="secondary" style={{ fontSize: 11 }}>الهوية: </Text>
                            <Text style={{ fontSize: 12 }}>{face.person.nationalId || '—'}</Text>
                        </div>

                        <div>
                            <Text type="secondary" style={{ fontSize: 11 }}>الحالة: </Text>
                            <Tag color={face.person.isActive ? 'green' : 'red'} style={{ fontSize: 11 }}>
                                {face.person.isActive ? 'نشط' : 'غير نشط'}
                            </Tag>
                        </div>

                        {face.person.hasSuspectRecord && (
                            <Tag color="red" style={{ marginTop: 4, fontSize: 11 }}>
                                ⚠️ مشتبه به
                            </Tag>
                        )}

                        <Progress
                            percent={Math.round(face.score * 100)}
                            strokeColor={scoreColor(face.score)}
                            size="small"
                            style={{ marginTop: 4 }}
                        />
                    </Col>
                </Row>
            )}
        </div>
    );
}

function SingleImageResultCard({
    item,
    index,
}: {
    item: BatchImageItem;
    index: number;
}) {
    return (
        <Card
            size="small"
            title={
                <Space>
                    <span>الصورة {index + 1}</span>
                    <Text type="secondary" style={{ fontSize: 12 }}>{item.name}</Text>
                    {item.result && (
                        <Tag color={item.result.knownFaces > 0 ? 'success' : 'default'}>
                            {item.result.knownFaces}/{item.result.totalFaces}
                        </Tag>
                    )}
                    {item.isPending && <Tag color="processing">جارٍ التحليل</Tag>}
                    {item.error && <Tag color="error">فشل</Tag>}
                </Space>
            }
            style={{ marginBottom: 16 }}
        >
            <Row gutter={16}>
                <Col xs={24} md={8}>
                    <Image
                        src={item.previewUrl}
                        style={{
                            width: '100%',
                            maxHeight: 220,
                            objectFit: 'cover',
                            borderRadius: 8,
                        }}
                    />
                </Col>

                <Col xs={24} md={16}>
                    {item.isPending && (
                        <div style={{ textAlign: 'center', padding: 30 }}>
                            <Spin />
                            <br />
                            <br />
                            <Text type="secondary">جاري تحليل هذه الصورة...</Text>
                        </div>
                    )}

                    {!item.isPending && item.error && (
                        <Alert
                            type="error"
                            showIcon
                            message="فشل التعرف"
                            description={item.error}
                        />
                    )}

                    {!item.isPending && !item.error && !item.result && (
                        <Empty description="بانتظار المعالجة" />
                    )}

                    {item.result && (
                        <>
                            <Row gutter={12} style={{ marginBottom: 16 }}>
                                <Col span={12}>
                                    <Card size="small" style={{ textAlign: 'center', background: '#f0f5ff' }}>
                                        <div style={{ fontSize: 22, fontWeight: 'bold', color: '#1677ff' }}>
                                            {item.result.totalFaces}
                                        </div>
                                        <Text type="secondary" style={{ fontSize: 12 }}>وجه مكتشف</Text>
                                    </Card>
                                </Col>

                                <Col span={12}>
                                    <Card
                                        size="small"
                                        style={{
                                            textAlign: 'center',
                                            background: item.result.knownFaces > 0 ? '#f6ffed' : '#fff7e6',
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: 22,
                                                fontWeight: 'bold',
                                                color: item.result.knownFaces > 0 ? '#52c41a' : '#faad14',
                                            }}
                                        >
                                            {item.result.knownFaces}
                                        </div>
                                        <Text type="secondary" style={{ fontSize: 12 }}>تم التعرف</Text>
                                    </Card>
                                </Col>
                            </Row>

                            {item.result.faces.length === 0 && (
                                <Alert type="warning" showIcon message="لم يتم كشف أي وجه في الصورة" />
                            )}

                            {item.result.faces.map((face, idx) => (
                                <FaceCard key={`${item.id}-face-${idx}`} face={face} />
                            ))}
                        </>
                    )}
                </Col>
            </Row>
        </Card>
    );
}

export default function RecognitionPage() {
    const [messageApi, contextHolder] = message.useMessage();
    const [items, setItems] = useState<BatchImageItem[]>([]);
    const [isBatchRunning, setIsBatchRunning] = useState(false);
    const [processedCount, setProcessedCount] = useState(0);

    const totalCount = items.length;

    const completedCount = useMemo(
        () => items.filter(x => x.result || x.error).length,
        [items]
    );

    const successCount = useMemo(
        () => items.filter(x => x.result !== null).length,
        [items]
    );

    const recognizedCount = useMemo(
        () => items.reduce((sum, x) => sum + (x.result?.knownFaces ?? 0), 0),
        [items]
    );

    const progressPercent = totalCount > 0
        ? Math.round((processedCount / totalCount) * 100)
        : 0;

    const addFiles = (incomingFiles: File[]) => {
        const validFiles: File[] = [];

        for (const file of incomingFiles) {
            if (ValidFile && ValidFile(file) === false) {
                messageApi.error(`الملف غير صالح: ${file.name}`);
                continue;
            }
            validFiles.push(file);
        }

        if (validFiles.length === 0) return;

        setItems(prev => {
            const existingKeys = new Set(
                prev.map(x => `${x.file.name}__${x.file.size}__${x.file.lastModified}`)
            );

            const next = [...prev];

            for (const file of validFiles) {
                const key = `${file.name}__${file.size}__${file.lastModified}`;
                if (existingKeys.has(key)) continue;

                next.push({
                    id: `${Date.now()}-${Math.random()}-${file.name}`,
                    file,
                    name: file.name,
                    previewUrl: URL.createObjectURL(file),
                    result: null,
                    error: null,
                    isPending: false,
                });
            }

            return next;
        });
    };

    const handleUpload = (file: File): false => {
        addFiles([file]);
        return false;
    };

    const handleRemoveItem = (id: string) => {
        if (isBatchRunning) return;

        setItems(prev => {
            const target = prev.find(x => x.id === id);
            if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
            return prev.filter(x => x.id !== id);
        });
    };

    const handleClearAll = () => {
        if (isBatchRunning) return;

        items.forEach(x => {
            if (x.previewUrl) URL.revokeObjectURL(x.previewUrl);
        });

        setItems([]);
        setProcessedCount(0);
    };

    const resetResultsOnly = () => {
        if (isBatchRunning) return;

        setItems(prev =>
            prev.map(x => ({
                ...x,
                result: null,
                error: null,
                isPending: false,
            }))
        );
        setProcessedCount(0);
    };

    const runBatchIdentify = async () => {
        if (items.length === 0) {
            messageApi.warning('اختر صورة واحدة أو أكثر أولًا');
            return;
        }

        setIsBatchRunning(true);
        setProcessedCount(0);

        setItems(prev =>
            prev.map(x => ({
                ...x,
                result: null,
                error: null,
                isPending: false,
            }))
        );

        for (const item of items) {
            setItems(prev =>
                prev.map(x =>
                    x.id === item.id ? { ...x, isPending: true, error: null, result: null } : x
                )
            );

            try {
                const data = await identifyFace(item.file);

                setItems(prev =>
                    prev.map(x =>
                        x.id === item.id ? { ...x, result: data, error: null, isPending: false } : x
                    )
                );
            } catch {
                setItems(prev =>
                    prev.map(x =>
                        x.id === item.id
                            ? {
                                ...x,
                                error: 'تعذر تحليل هذه الصورة. تأكد من وضوحها ثم حاول مجددًا.',
                                isPending: false,
                            }
                            : x
                    )
                );
            } finally {
                setProcessedCount(c => c + 1);
            }
        }

        setIsBatchRunning(false);
        messageApi.success('اكتملت معالجة الصور');
    };

    useEffect(() => {
        return () => {
            items.forEach(x => {
                if (x.previewUrl) URL.revokeObjectURL(x.previewUrl);
            });
        };
    }, [items]);

    return (
        <div
            style={{
                padding: 24,
                direction: 'rtl',
                background: 'var(--app-page-bg)',
                minHeight: '100vh',
                color: 'var(--app-text)',
            }}
        >
            {contextHolder}

            <Space align="center" style={{ marginBottom: 24, flexWrap: 'wrap' }}>
                <SearchOutlined style={{ fontSize: 28, color: '#1677ff' }} />
                <Title level={3} style={{ margin: 0 }}>التعرف على الوجه من الصور</Title>
            </Space>

            <Row gutter={24}>
                <Col xs={24} lg={8}>
                    <Card title="الصور المختارة">
                        {items.length === 0 ? (
                            <div
                                style={{
                                    height: 220,
                                    border: '2px dashed var(--app-border)',
                                    borderRadius: 8,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 16,
                                    background: 'var(--app-surface-2)',
                                }}
                            >
                                <UploadOutlined
                                    style={{
                                        fontSize: 48,
                                        color: 'var(--app-muted)',
                                        marginBottom: 8,
                                    }}
                                />
                                <Text type="secondary">اختر صورة أو مجموعة صور</Text>
                            </div>
                        ) : (
                            <div style={{ marginBottom: 16 }}>
                                <Row gutter={[8, 8]}>
                                    {items.map((item) => (
                                        <Col span={8} key={item.id}>
                                            <div
                                                style={{
                                                    position: 'relative',
                                                    border: '1px solid var(--app-border)',
                                                    borderRadius: 8,
                                                    overflow: 'hidden',
                                                    background: 'var(--app-surface)',
                                                }}
                                            >
                                                <Image
                                                    src={item.previewUrl}
                                                    preview={false}
                                                    style={{
                                                        width: '100%',
                                                        height: 90,
                                                        objectFit: 'cover',
                                                        display: 'block',
                                                    }}
                                                />
                                                <Button
                                                    size="small"
                                                    danger
                                                    icon={<DeleteOutlined />}
                                                    onClick={() => handleRemoveItem(item.id)}
                                                    disabled={isBatchRunning}
                                                    style={{
                                                        position: 'absolute',
                                                        top: 4,
                                                        left: 4,
                                                        borderRadius: 6,
                                                    }}
                                                />
                                            </div>
                                        </Col>
                                    ))}
                                </Row>
                            </div>
                        )}

                        <Upload<UploadFile>
                            accept="image/*"
                            multiple
                            showUploadList={false}
                            beforeUpload={(f) => handleUpload(f as unknown as File)}
                        >
                            <Button icon={<UploadOutlined />} block style={{ marginBottom: 12 }}>
                                {items.length > 0 ? 'إضافة صور أخرى' : 'اختيار صور'}
                            </Button>
                        </Upload>

                        <Button
                            type="primary"
                            icon={<SearchOutlined />}
                            onClick={runBatchIdentify}
                            loading={isBatchRunning}
                            disabled={items.length === 0}
                            block
                            size="large"
                        >
                            {isBatchRunning ? 'جاري تحليل الصور...' : 'ابدأ التعرف على كل الصور'}
                        </Button>

                        <Space style={{ marginTop: 12, width: '100%' }} direction="vertical">
                            <Button
                                icon={<ClearOutlined />}
                                onClick={resetResultsOnly}
                                disabled={items.length === 0 || isBatchRunning}
                                block
                            >
                                تصفير النتائج فقط
                            </Button>

                            <Button
                                danger
                                onClick={handleClearAll}
                                disabled={items.length === 0 || isBatchRunning}
                                block
                            >
                                حذف كل الصور
                            </Button>
                        </Space>

                        <Divider />

                        <Space direction="vertical" style={{ width: '100%' }} size={10}>
                            <div>
                                <Text strong>التقدم العام</Text>
                                <Progress percent={progressPercent} />
                            </div>

                            <Row gutter={8}>
                                <Col span={8}>
                                    <Card size="small" style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 20, fontWeight: 700 }}>{totalCount}</div>
                                        <Text type="secondary" style={{ fontSize: 11 }}>المجموع</Text>
                                    </Card>
                                </Col>
                                <Col span={8}>
                                    <Card size="small" style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 20, fontWeight: 700, color: '#1677ff' }}>{completedCount}</div>
                                        <Text type="secondary" style={{ fontSize: 11 }}>المعالج</Text>
                                    </Card>
                                </Col>
                                <Col span={8}>
                                    <Card size="small" style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 20, fontWeight: 700, color: '#52c41a' }}>{recognizedCount}</div>
                                        <Text type="secondary" style={{ fontSize: 11 }}>المعروف</Text>
                                    </Card>
                                </Col>
                            </Row>

                            <Text type="secondary" style={{ fontSize: 12 }}>
                                📌 يتم إرسال الصور إلى السيرفر واحدة واحدة بالتسلسل
                            </Text>
                        </Space>
                    </Card>
                </Col>

                <Col xs={24} lg={16}>
                    <Card title="نتائج التعرف">
                        {items.length === 0 ? (
                            <Empty
                                image={<UserOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
                                description="اختر صورة أو عدة صور ثم ابدأ التعرف"
                            />
                        ) : (
                            <>
                                {items.map((item, index) => (
                                    <SingleImageResultCard
                                        key={item.id}
                                        item={item}
                                        index={index}
                                    />
                                ))}
                            </>
                        )}
                    </Card>
                </Col>
            </Row>
        </div>
    );
}