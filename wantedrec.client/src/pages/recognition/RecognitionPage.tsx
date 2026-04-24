import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Upload,
    Button,
    Card,
    Row,
    Col,
    Typography,
    Space,
    Image,
    Progress,
    Alert,
    Spin,
    Tag,
    Empty,
    message,
    Divider,
    Tooltip,
    Avatar,
} from 'antd';
import type { UploadFile } from 'antd';
import {
    SearchOutlined,
    UploadOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    UserOutlined,
    EyeOutlined,
    DeleteOutlined,
    ClearOutlined,
    SafetyOutlined,
    EnvironmentOutlined,
    AlertOutlined,
    ReloadOutlined,
    ScanOutlined,
    IdcardOutlined,
    ThunderboltOutlined,
    InfoCircleOutlined,
    FolderOpenOutlined,
    FileImageOutlined,
    ExclamationCircleOutlined,
} from '@ant-design/icons';
import { ValidFile } from '../../Interfaces/functions';
import type { RecognitionFaceDto, LiveRecognitionResultDto } from '../../types/camera.types';
import { identifyFace } from '../../api/recognitionApi';
import {
    DangerLevel,
    DangerLevelLabel,
    PersonSecurityStatus,
    PersonSecurityStatusLabel,
} from '../../types/person.types';

const { Title, Text } = Typography;

const LOCAL_COMPACT_CSS = `
.rec-compact-stats {
  display: flex;
  gap: 12px;
  flex-wrap: nowrap;
  overflow-x: auto;
  padding-bottom: 4px;
  margin-bottom: 18px;
  scrollbar-width: thin;
}

.rec-compact-stats::-webkit-scrollbar {
  height: 8px;
}

.rec-compact-stats::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 999px;
}

.rec-compact-stat-wrap {
  flex: 0 0 165px;
  min-width: 165px;
  max-width: 165px;
}

.rec-compact-stat-card {
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: 18px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 78px;
  box-shadow: var(--app-shadow);
}

.rec-compact-stat-card .v {
  font-size: 18px;
  line-height: 1;
  font-weight: 900;
}

.rec-compact-stat-card .l {
  font-size: 11px;
  color: var(--app-muted);
  margin-top: 6px;
}

.rec-compact-stat-card .i {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid transparent;
  font-size: 16px;
}

@media (max-width: 992px) {
  .rec-compact-stat-wrap {
    flex-basis: 150px;
    min-width: 150px;
    max-width: 150px;
  }
}
`;

type BatchImageItem = {
    id: string;
    file: File;
    name: string;
    previewUrl: string;
    result: LiveRecognitionResultDto | null;
    error: string | null;
    isPending: boolean;
};

const scoreColor = (s: number) => (s >= 0.8 ? '#16a34a' : s >= 0.6 ? '#d97706' : '#dc2626');
const scoreLabel = (s: number) => (s >= 0.8 ? 'تطابق عالي' : s >= 0.6 ? 'تطابق متوسط' : 'تطابق ضعيف');

const dangerTone: Record<number, { bg: string; border: string; color: string }> = {
    [DangerLevel.None]: { bg: '#f8fafc', border: '#e2e8f0', color: '#475569' },
    [DangerLevel.Low]: { bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d' },
    [DangerLevel.Medium]: { bg: '#fffbeb', border: '#fde68a', color: '#b45309' },
    [DangerLevel.High]: { bg: '#fff7ed', border: '#fdba74', color: '#c2410c' },
    [DangerLevel.Critical]: { bg: '#fff1f2', border: '#fecaca', color: '#dc2626' },
};

const securityTone: Record<number, { bg: string; border: string; color: string }> = {
    [PersonSecurityStatus.Normal]: { bg: '#f8fafc', border: '#e2e8f0', color: '#475569' },
    [PersonSecurityStatus.Suspect]: { bg: '#fff7ed', border: '#fdba74', color: '#c2410c' },
    [PersonSecurityStatus.Wanted]: { bg: '#fff1f2', border: '#fecaca', color: '#dc2626' },
    [PersonSecurityStatus.WantedAndSuspect]: { bg: '#fff1f2', border: '#fda4af', color: '#be123c' },
    [PersonSecurityStatus.Arrested]: { bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8' },
    [PersonSecurityStatus.Closed]: { bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d' },
};

function CompactStat({
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
        <div className="rec-compact-stat-card">
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

function Pill({ text, tone, icon }: { text: string; tone?: { bg: string; border: string; color: string }; icon?: React.ReactNode }) {
    const t = tone ?? { bg: '#f8fafc', border: '#e2e8f0', color: '#475569' };
    return (
        <span className="pill" style={{ background: t.bg, borderColor: t.border, color: t.color }}>
            {icon}
            {text}
        </span>
    );
}

function isRiskyPerson(person: any): boolean {
    if (!person) return false;
    return !!person.hasActiveAlert || !!person.isArmedAndDangerous || (person.dangerLevel ?? DangerLevel.None) >= DangerLevel.High;
}

function FaceCard({ face }: { face: RecognitionFaceDto }) {
    const navigate = useNavigate();
    const person = face.person as any;
    const risky = face.isKnown && isRiskyPerson(person);
    const securityStatus = (person?.securityStatus ?? PersonSecurityStatus.Normal) as PersonSecurityStatus;
    const dangerLevel = (person?.dangerLevel ?? DangerLevel.None) as DangerLevel;

    return (
        <div className={`face-card${face.isKnown ? ' face-hit' : ''}${risky ? ' face-risk' : ''}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: face.isKnown ? 12 : 0, flexWrap: 'wrap' }}>
                <Space size={10} align="start">
                    {face.isKnown ? (
                        <CheckCircleOutlined style={{ color: risky ? '#dc2626' : '#16a34a', fontSize: 16, marginTop: 3 }} />
                    ) : (
                        <CloseCircleOutlined style={{ color: '#94a3b8', fontSize: 16, marginTop: 3 }} />
                    )}

                    <div>
                        <Text strong style={{ fontSize: 14, display: 'block' }}>
                            {face.isKnown ? face.name : 'وجه غير معروف'}
                        </Text>
                        {face.isKnown && (
                            <Text style={{ color: scoreColor(face.score), fontSize: 11, fontWeight: 700 }}>
                                {scoreLabel(face.score)} — {Math.round(face.score * 100)}%
                            </Text>
                        )}
                    </div>
                </Space>

                {face.isKnown && person && (
                    <Button
                        size="small"
                        type="primary"
                        ghost
                        icon={<EyeOutlined />}
                        onClick={() => navigate(`/persons/${person.personId}`)}
                        style={{ borderRadius: 8, height: 30, fontWeight: 700 }}
                    >
                        الملف الكامل
                    </Button>
                )}
            </div>

            {face.isKnown && person && (
                <>
                    <Row gutter={12} align="middle">
                        <Col xs={24} sm={6} md={5}>
                            {face.primaryImageBase64 ? (
                                <Image
                                    src={`data:image/jpeg;base64,${face.primaryImageBase64}`}
                                    style={{
                                        width: 74,
                                        height: 74,
                                        objectFit: 'cover',
                                        borderRadius: 12,
                                        border: `2px solid ${scoreColor(face.score)}`,
                                    }}
                                    preview={false}
                                />
                            ) : (
                                <Avatar
                                    size={74}
                                    icon={<UserOutlined />}
                                    style={{ background: '#eff6ff', color: '#2563eb', borderRadius: 12 }}
                                />
                            )}
                        </Col>

                        <Col xs={24} sm={18} md={19}>
                            <div className="info-strip" style={{ marginBottom: 10 }}>
                                <div className="info-box">
                                    <div className="k">الهوية</div>
                                    <div className="v" style={{ fontFamily: 'monospace' }}>{person.nationalId || '—'}</div>
                                </div>
                                <div className="info-box">
                                    <div className="k">الحالة</div>
                                    <div className="v">{person.isActive ? 'نشط' : 'غير نشط'}</div>
                                </div>
                            </div>

                            <Space size={[6, 6]} wrap>
                                <Pill text={PersonSecurityStatusLabel[securityStatus]} tone={securityTone[securityStatus]} icon={<SafetyOutlined />} />
                                <Pill text={DangerLevelLabel[dangerLevel]} tone={dangerTone[dangerLevel]} icon={<ExclamationCircleOutlined />} />
                                {person.hasActiveAlert && <Pill text="تعميم فعّال" tone={{ bg: '#fff1f2', border: '#fecaca', color: '#dc2626' }} icon={<AlertOutlined />} />}
                                {person.isArmedAndDangerous && <Pill text="مسلح وخطر" tone={{ bg: '#fff7ed', border: '#fdba74', color: '#c2410c' }} />}
                                {person.hasSuspectRecord && <Pill text="مشتبه به" tone={{ bg: '#fff1f2', border: '#fecaca', color: '#dc2626' }} />}
                            </Space>

                            <Progress
                                percent={Math.round(face.score * 100)}
                                strokeColor={scoreColor(face.score)}
                                size="small"
                                style={{ marginTop: 10, marginBottom: 0 }}
                            />
                        </Col>
                    </Row>

                    {(person.securityReason || person.lastSeenLocation || person.alertInstructions || person.caseNumber || person.issuedBy) && (
                        <div style={{ marginTop: 12, borderTop: '1px dashed var(--app-border)', paddingTop: 12 }}>
                            <div className="info-strip">
                                {person.securityReason && (
                                    <div className="info-box">
                                        <div className="k">سبب الإدراج الأمني</div>
                                        <div className="v"><SafetyOutlined style={{ marginLeft: 6, color: '#dc2626' }} />{person.securityReason}</div>
                                    </div>
                                )}

                                {person.caseNumber && (
                                    <div className="info-box">
                                        <div className="k">رقم القضية</div>
                                        <div className="v">{person.caseNumber}</div>
                                    </div>
                                )}

                                {person.lastSeenLocation && (
                                    <div className="info-box">
                                        <div className="k">مكان آخر ظهور</div>
                                        <div className="v"><EnvironmentOutlined style={{ marginLeft: 6, color: '#2563eb' }} />{person.lastSeenLocation}</div>
                                    </div>
                                )}

                                {person.issuedBy && (
                                    <div className="info-box">
                                        <div className="k">الجهة المصدرة</div>
                                        <div className="v">{person.issuedBy}</div>
                                    </div>
                                )}
                            </div>

                            {person.alertInstructions && (
                                <Alert
                                    type={risky ? 'error' : 'warning'}
                                    showIcon
                                    message="تعليمات أمنية"
                                    description={person.alertInstructions}
                                    style={{ marginTop: 10, borderRadius: 14 }}
                                />
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function SingleImageResultCard({ item, index }: { item: BatchImageItem; index: number }) {
    const riskyFaces = item.result?.faces.filter((f: any) => isRiskyPerson(f.person)).length ?? 0;

    return (
        <div className={`result-card${riskyFaces > 0 ? ' risky' : ''}`}>
            {riskyFaces > 0 && (
                <div className="result-alert-bar">
                    <Space size={8} wrap>
                        <AlertOutlined style={{ color: '#dc2626', animation: 'pulseWarn 1.8s infinite' }} />
                        <Text strong style={{ color: '#991b1b' }}>تم رصد {riskyFaces} حالة تتطلب انتباهًا أمنيًا</Text>
                    </Space>
                </div>
            )}

            <div className="result-head">
                <Space size={10} wrap>
                    <Tag color="blue" style={{ borderRadius: 999 }}>{`الصورة ${index + 1}`}</Tag>
                    <Text type="secondary" style={{ fontSize: 12 }}>{item.name}</Text>
                    {item.result && <Tag color={item.result.knownFaces > 0 ? 'success' : 'default'}>{item.result.knownFaces}/{item.result.totalFaces}</Tag>}
                    {item.isPending && <Tag color="processing">جارٍ التحليل</Tag>}
                    {item.error && <Tag color="error">فشل</Tag>}
                </Space>

                {riskyFaces > 0 && (
                    <Tag color="error" style={{ borderRadius: 999, fontWeight: 700 }}>
                        {riskyFaces} إنذار مهم
                    </Tag>
                )}
            </div>

            <div style={{ padding: 16 }}>
                <Row gutter={[16, 16]}>
                    <Col xs={24} md={8} lg={7}>
                        <div style={{ position: 'sticky', top: 20 }}>
                            <Image
                                src={item.previewUrl}
                                style={{
                                    width: '100%',
                                    maxHeight: 280,
                                    objectFit: 'cover',
                                    borderRadius: 16,
                                    border: '1px solid var(--app-border)',
                                    background: 'var(--app-surface-2)',
                                }}
                            />
                        </div>
                    </Col>

                    <Col xs={24} md={16} lg={17}>
                        {item.isPending && (
                            <div style={{ textAlign: 'center', padding: 38 }}>
                                <Spin size="large" />
                                <br />
                                <br />
                                <Text type="secondary">جاري تحليل هذه الصورة والتحقق من الحالات الأمنية...</Text>
                            </div>
                        )}

                        {!item.isPending && item.error && (
                            <Alert type="error" showIcon message="فشل التعرف" description={item.error} style={{ borderRadius: 14 }} />
                        )}

                        {!item.isPending && !item.error && !item.result && <Empty description="بانتظار المعالجة" />}

                        {item.result && (
                            <>
                                <div className="metric-grid" style={{ marginBottom: 16 }}>
                                    <div className="metric-card">
                                        <div className="metric-value" style={{ color: '#2563eb' }}>{item.result.totalFaces}</div>
                                        <div className="metric-label">وجه مكتشف</div>
                                    </div>
                                    <div className="metric-card">
                                        <div className="metric-value" style={{ color: item.result.knownFaces > 0 ? '#16a34a' : '#d97706' }}>{item.result.knownFaces}</div>
                                        <div className="metric-label">تم التعرف</div>
                                    </div>
                                    <div className="metric-card">
                                        <div className="metric-value" style={{ color: riskyFaces > 0 ? '#dc2626' : '#64748b' }}>{riskyFaces}</div>
                                        <div className="metric-label">إنذارات مهمة</div>
                                    </div>
                                    <div className="metric-card">
                                        <div className="metric-value" style={{ color: '#7c3aed' }}>{item.result.faces.length}</div>
                                        <div className="metric-label">إجمالي نتائج المعالجة</div>
                                    </div>
                                </div>

                                {item.result.faces.length === 0 && (
                                    <Alert type="warning" showIcon message="لم يتم كشف أي وجه في الصورة" style={{ borderRadius: 14, marginBottom: 12 }} />
                                )}

                                {item.result.faces.map((face, idx) => (
                                    <FaceCard key={`${item.id}-face-${idx}`} face={face} />
                                ))}
                            </>
                        )}
                    </Col>
                </Row>
            </div>
        </div>
    );
}

export default function RecognitionPage() {
    const [messageApi, contextHolder] = message.useMessage();
    const [items, setItems] = useState<BatchImageItem[]>([]);
    const [isBatchRunning, setIsBatchRunning] = useState(false);
    const [processedCount, setProcessedCount] = useState(0);
    const itemsRef = useRef<BatchImageItem[]>([]);

    const totalCount = items.length;
    const completedCount = useMemo(() => items.filter(x => x.result || x.error).length, [items]);
    const recognizedCount = useMemo(() => items.reduce((sum, x) => sum + (x.result?.knownFaces ?? 0), 0), [items]);
    const warningCount = useMemo(() => items.reduce((sum, x) => sum + (x.result?.faces.filter((f: any) => isRiskyPerson(f.person)).length ?? 0), 0), [items]);
    const progressPercent = totalCount > 0 ? Math.round((processedCount / totalCount) * 100) : 0;

    const latestRisk = useMemo(() => {
        const risky = items.flatMap(x => x.result?.faces ?? []).find((f: any) => isRiskyPerson(f.person));
        return risky?.person as any | undefined;
    }, [items]);

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
            const existingKeys = new Set(prev.map(x => `${x.file.name}__${x.file.size}__${x.file.lastModified}`));
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
        setItems(prev => prev.map(x => ({ ...x, result: null, error: null, isPending: false })));
        setProcessedCount(0);
    };

    const runBatchIdentify = async () => {
        if (items.length === 0) {
            messageApi.warning('اختر صورة واحدة أو أكثر أولًا');
            return;
        }

        setIsBatchRunning(true);
        setProcessedCount(0);
        setItems(prev => prev.map(x => ({ ...x, result: null, error: null, isPending: false })));

        for (const item of items) {
            setItems(prev => prev.map(x => (x.id === item.id ? { ...x, isPending: true, error: null, result: null } : x)));

            try {
                const data = await identifyFace(item.file);
                setItems(prev => prev.map(x => (x.id === item.id ? { ...x, result: data, error: null, isPending: false } : x)));
            } catch {
                setItems(prev => prev.map(x => (
                    x.id === item.id
                        ? { ...x, error: 'تعذر تحليل هذه الصورة. تأكد من وضوحها ثم حاول مجددًا.', isPending: false }
                        : x
                )));
            } finally {
                setProcessedCount(c => c + 1);
            }
        }

        setIsBatchRunning(false);
        messageApi.success('اكتملت معالجة الصور');
    };

    useEffect(() => {
        itemsRef.current = items;
    }, [items]);

    useEffect(() => {
        return () => {
            itemsRef.current.forEach(x => {
                if (x.previewUrl) URL.revokeObjectURL(x.previewUrl);
            });
        };
    }, []);

    return (
        <div className="rec-shell">
            <style>{LOCAL_COMPACT_CSS}</style>
            {contextHolder}

            <div className="rec-hero">
                <Space align="center" size={16} wrap>
                    <div className="rec-hero-badge">
                        <ScanOutlined style={{ fontSize: 30, color: '#fff' }} />
                    </div>
                    <div>
                        <Title level={2} style={{ margin: 0, color: '#fff', fontWeight: 900 }}>
                            التعرف الذكي من الصور
                        </Title>
                        <Text style={{ color: 'rgba(255,255,255,.88)', fontSize: 13 }}>
                            رفع دفعة صور، تحليل متسلسل، وإظهار الحالة الأمنية والتعليمات المهمة بشكل واضح واحترافي.
                        </Text>
                    </div>
                </Space>
            </div>

            {warningCount > 0 && latestRisk && (
                <Alert
                    type="error"
                    showIcon
                    style={{ marginBottom: 18, borderRadius: 18 }}
                    message="تنبيه أمني عالي الأهمية"
                    description={
                        <Space direction="vertical" size={4}>
                            <Text>
                                تم رصد حالة مهمة ضمن النتائج الحالية: <strong>{latestRisk.fullName ?? latestRisk.displayName ?? 'شخص معروف'}</strong>
                            </Text>
                            {latestRisk.alertInstructions && <Text>التعليمات: {latestRisk.alertInstructions}</Text>}
                        </Space>
                    }
                />
            )}

            <div className="rec-compact-stats">
                <div className="rec-compact-stat-wrap">
                    <CompactStat
                        label="الصور المضافة"
                        value={totalCount}
                        color="#2563eb"
                        bg="#eff6ff"
                        border="#bfdbfe"
                        icon={<FileImageOutlined />}
                    />
                </div>

                <div className="rec-compact-stat-wrap">
                    <CompactStat
                        label="الصور المعالجة"
                        value={completedCount}
                        color="#7c3aed"
                        bg="#faf5ff"
                        border="#ddd6fe"
                        icon={<CheckCircleOutlined />}
                    />
                </div>

                <div className="rec-compact-stat-wrap">
                    <CompactStat
                        label="وجوه معروفة"
                        value={recognizedCount}
                        color="#16a34a"
                        bg="#f0fdf4"
                        border="#bbf7d0"
                        icon={<UserOutlined />}
                    />
                </div>

                <div className="rec-compact-stat-wrap">
                    <CompactStat
                        label="إنذارات أمنية"
                        value={warningCount}
                        color="#dc2626"
                        bg="#fff5f5"
                        border="#fecaca"
                        icon={<AlertOutlined />}
                    />
                </div>
            </div>

            <Row gutter={[20, 20]}>
                <Col xs={24} xl={8}>
                    <div className="sticky-col">
                        <Card
                            className="rec-card"
                            title={<div className="section-title"><FolderOpenOutlined style={{ color: '#2563eb' }} /><span>إدارة الدفعة</span></div>}
                        >
                            {items.length === 0 ? (
                                <div className="queue-drop">
                                    <FileImageOutlined style={{ fontSize: 50, color: '#93c5fd', marginBottom: 10 }} />
                                    <div>
                                        <Text strong style={{ display: 'block' }}>اختر صورة أو مجموعة صور</Text>
                                        <Text type="secondary">النظام سيحلل الصور بالتسلسل ويعرض الإنذارات المهمة</Text>
                                    </div>
                                </div>
                            ) : (
                                <div className="queue-grid">
                                    {items.map(item => (
                                        <div className="queue-tile" key={item.id}>
                                            <Image
                                                src={item.previewUrl}
                                                preview={false}
                                                style={{ width: '100%', height: 96, objectFit: 'cover', display: 'block' }}
                                            />
                                            <Button
                                                size="small"
                                                danger
                                                icon={<DeleteOutlined />}
                                                onClick={() => handleRemoveItem(item.id)}
                                                disabled={isBatchRunning}
                                                style={{ position: 'absolute', top: 6, left: 6, borderRadius: 8 }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            <Upload<UploadFile>
                                accept="image/*"
                                multiple
                                showUploadList={false}
                                beforeUpload={(f) => handleUpload(f as unknown as File)}
                            >
                                <Button icon={<UploadOutlined />} block size="large" style={{ marginBottom: 12, borderRadius: 12 }}>
                                    {items.length > 0 ? 'إضافة صور أخرى' : 'اختيار صور'}
                                </Button>
                            </Upload>

                            <Button
                                type="primary"
                                icon={isBatchRunning ? <ReloadOutlined spin /> : <SearchOutlined />}
                                onClick={runBatchIdentify}
                                disabled={items.length === 0}
                                loading={isBatchRunning}
                                block
                                size="large"
                                style={{ borderRadius: 12, height: 46, fontWeight: 800 }}
                            >
                                {isBatchRunning ? 'جاري تحليل الصور...' : 'ابدأ التعرف والتحليل الأمني'}
                            </Button>

                            <Space direction="vertical" style={{ width: '100%', marginTop: 12 }}>
                                <Button icon={<ClearOutlined />} onClick={resetResultsOnly} disabled={items.length === 0 || isBatchRunning} block style={{ borderRadius: 12 }}>
                                    تصفير النتائج فقط
                                </Button>
                                <Button danger onClick={handleClearAll} disabled={items.length === 0 || isBatchRunning} block style={{ borderRadius: 12 }}>
                                    حذف كل الصور
                                </Button>
                            </Space>

                            <Divider />

                            <div style={{ marginBottom: 12 }}>
                                <Space align="center" size={8} style={{ marginBottom: 6 }}>
                                    <ThunderboltOutlined style={{ color: '#2563eb' }} />
                                    <Text strong>التقدم العام</Text>
                                </Space>
                                <Progress percent={progressPercent} strokeColor={warningCount > 0 ? '#dc2626' : '#2563eb'} />
                            </div>

                            <Alert
                                type={warningCount > 0 ? 'warning' : 'info'}
                                showIcon
                                style={{ borderRadius: 14 }}
                                message={warningCount > 0 ? 'تم اكتشاف حالات تحتاج انتباهًا' : 'وضع التشغيل طبيعي'}
                                description={warningCount > 0 ? 'راجع النتائج أدناه للتحقق من الحالات ذات الخطورة أو التعميم الفعّال.' : 'يتم إرسال الصور إلى السيرفر واحدة واحدة بالتسلسل لتقليل التضارب ورفع الدقة.'}
                            />
                        </Card>
                    </div>
                </Col>

                <Col xs={24} xl={16}>
                    <Card
                        className="rec-card"
                        title={<div className="section-title"><SearchOutlined style={{ color: '#7c3aed' }} /><span>نتائج التعرف والتحليل</span></div>}
                    >
                        {items.length === 0 ? (
                            <Empty
                                image={<UserOutlined style={{ fontSize: 68, color: '#d9d9d9' }} />}
                                description="اختر مجموعة صور ثم ابدأ التحليل"
                            />
                        ) : (
                            items.map((item, index) => <SingleImageResultCard key={item.id} item={item} index={index} />)
                        )}
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
