import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
    Alert,
    Button,
    Card,
    Col,
    Divider,
    Empty,
    Input,
    Progress,
    Row,
    Segmented,
    Select,
    Space,
    Switch,
    Table,
    Tag,
    Tooltip,
    Typography,
    message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
    CloudUploadOutlined,
    FolderOpenOutlined,
    PictureOutlined,
    UsergroupAddOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ReloadOutlined,
    ThunderboltOutlined,
    InfoCircleOutlined,
    SettingOutlined,
    StopOutlined,
    DeleteOutlined,
    FileTextOutlined,
    ClearOutlined,
} from '@ant-design/icons';
import { createPerson } from '../../api/personsApi';
import {
    Gender,
    ImageSource,
    PersonSecurityStatus,
    DangerLevel,
    PersonSecurityStatusLabel,
    DangerLevelLabel,
} from '../../types/person.types';
import type { PersonUpsertDto } from '../../types/person.types';
import { fileToBase64 } from '../../Interfaces/functions';

const { Title, Text } = Typography;

// ── الأنواع المحلية ────────────────────────────────────────────────
type GroupingMode = 'auto' | 'filename' | 'folder';
type ExtractMode = 'leading' | 'stripSuffix' | 'whole' | 'regex';
type TargetField = 'NationalId' | 'ExternalCode' | 'FullName';
type RowStatus = 'pending' | 'uploading' | 'success' | 'failed';

interface PersonGroup {
    key: string;
    files: File[];
    sampleNames: string[];
}

interface RowState {
    status: RowStatus;
    error?: string;
    personId?: number;
}

const IMAGE_EXT = ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif', 'jfif'];

const securityOptions = Object.entries(PersonSecurityStatusLabel).map(([value, label]) => ({
    value: Number(value),
    label,
}));
const dangerOptions = Object.entries(DangerLevelLabel).map(([value, label]) => ({
    value: Number(value),
    label,
}));

// ── أدوات استخراج الرقم الإحصائي ───────────────────────────────────
function fileExt(name: string): string {
    const i = name.lastIndexOf('.');
    return i >= 0 ? name.slice(i + 1).toLowerCase() : '';
}
function isImage(name: string): boolean {
    return IMAGE_EXT.includes(fileExt(name));
}
function baseName(name: string): string {
    const i = name.lastIndexOf('.');
    return i >= 0 ? name.slice(0, i) : name;
}
function parentFolder(relPath: string): string {
    const parts = relPath.split('/').filter(Boolean);
    if (parts.length >= 3) return parts[parts.length - 2];
    return parts.length >= 2 ? parts[0] : '';
}

function extractStat(
    source: string,
    mode: ExtractMode,
    separators: string,
    regex: string,
): string {
    const s = source.trim();
    if (!s) return '';
    if (mode === 'leading') {
        const m = s.match(/(\d+)/);
        return m ? m[1] : '';
    }
    if (mode === 'stripSuffix') {
        const seps = separators || '_-(). ';
        let cut = s.length;
        for (const ch of seps) {
            const idx = s.indexOf(ch);
            if (idx > 0 && idx < cut) cut = idx;
        }
        return s.slice(0, cut).trim();
    }
    if (mode === 'regex') {
        if (!regex) return s;
        try {
            const re = new RegExp(regex);
            const m = s.match(re);
            if (!m) return '';
            return (m[1] ?? m[0]).trim();
        } catch {
            return '';
        }
    }
    return s;
}

function detectMode(files: File[]): 'filename' | 'folder' {
    if (files.length === 0) return 'filename';
    const parentCounts = new Map<string, number>();
    let nested = 0;
    for (const f of files) {
        const rel = f.webkitRelativePath || f.name;
        const depth = rel.split('/').filter(Boolean).length;
        if (depth >= 3) nested++;
        const p = parentFolder(rel);
        parentCounts.set(p, (parentCounts.get(p) ?? 0) + 1);
    }
    const nestedRatio = nested / files.length;
    const avg = files.length / Math.max(parentCounts.size, 1);
    if (nestedRatio > 0.6 && avg > 1.2) return 'folder';
    return 'filename';
}

// ── معاينة مصغّرة (تحرّر object URL تلقائياً) ──────────────────────
function Thumb({ file }: { file: File }) {
    const [url, setUrl] = useState<string>('');
    useEffect(() => {
        const u = URL.createObjectURL(file);
        setUrl(u);
        return () => URL.revokeObjectURL(u);
    }, [file]);
    if (!url) return <div className="bulk-thumb bulk-thumb-empty" />;
    return <img className="bulk-thumb" src={url} alt="معاينة" />;
}

function SummaryStat(props: {
    label: string;
    value: string | number;
    color: string;
    bg: string;
    border: string;
    icon: React.ReactNode;
}) {
    const { label, value, color, bg, border, icon } = props;
    return (
        <div className="add-compact-summary-stat">
            <div>
                <div className="v" style={{ color }}>{value}</div>
                <div className="l">{label}</div>
            </div>
            <div className="i" style={{ background: bg, borderColor: border, color }}>{icon}</div>
        </div>
    );
}

export default function BulkUploadPersonsPage() {
    const queryClient = useQueryClient();
    const [messageApi, contextHolder] = message.useMessage();

    const inputRef = useRef<HTMLInputElement>(null);
    const cancelRef = useRef(false);

    const [rawFiles, setRawFiles] = useState<File[]>([]);
    const [rootName, setRootName] = useState<string>('');

    const [groupingMode, setGroupingMode] = useState<GroupingMode>('auto');
    const [extractMode, setExtractMode] = useState<ExtractMode>('whole');
    const [separators, setSeparators] = useState<string>('_-(). ');
    const [regex, setRegex] = useState<string>('(\\d+)');

    const [targetField, setTargetField] = useState<TargetField>('NationalId');
    const [fullNameTemplate, setFullNameTemplate] = useState<string>('{stat}');
    const [defGender, setDefGender] = useState<Gender>(Gender.Male);
    const [defSecurity, setDefSecurity] = useState<PersonSecurityStatus>(PersonSecurityStatus.Normal);
    const [defDanger, setDefDanger] = useState<DangerLevel>(DangerLevel.None);
    const [defActive, setDefActive] = useState<boolean>(true);

    const [concurrency, setConcurrency] = useState<number>(2);
    const [uploading, setUploading] = useState(false);
    const [done, setDone] = useState(0);
    const [rowStates, setRowStates] = useState<Record<string, RowState>>({});
    const [excluded, setExcluded] = useState<Set<string>>(new Set());

    useEffect(() => {
        const el = inputRef.current;
        if (el) {
            el.setAttribute('webkitdirectory', '');
            el.setAttribute('directory', '');
            el.setAttribute('mozdirectory', '');
        }
    }, []);

    const onFolderSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const list = e.target.files ? Array.from(e.target.files) : [];
        const images = list.filter((f) => isImage(f.name));
        if (images.length === 0) {
            messageApi.warning('لم يتم العثور على أي صور داخل المجلد المحدد');
            return;
        }
        const first = images[0].webkitRelativePath || images[0].name;
        setRootName(first.split('/')[0] || 'المجلد');
        setRawFiles(images);
        setRowStates({});
        setExcluded(new Set());
        setDone(0);
        if (groupingMode === 'auto') {
            const detected = detectMode(images);
            messageApi.info(
                'تم تحميل ' + images.length + ' صورة — الوضع المكتشف: ' +
                (detected === 'folder' ? 'مجلد لكل شخص' : 'اسم الملف'),
            );
        } else {
            messageApi.success('تم تحميل ' + images.length + ' صورة');
        }
        e.target.value = '';
    };

    const clearAll = () => {
        setRawFiles([]);
        setRootName('');
        setRowStates({});
        setExcluded(new Set());
        setDone(0);
    };

    const effectiveMode: 'filename' | 'folder' = useMemo(() => {
        if (groupingMode === 'auto') return detectMode(rawFiles);
        return groupingMode;
    }, [groupingMode, rawFiles]);

    const { groups, unparsed } = useMemo(() => {
        const map = new Map<string, File[]>();
        const bad: File[] = [];
        for (const f of rawFiles) {
            const rel = f.webkitRelativePath || f.name;
            const src = effectiveMode === 'folder' ? parentFolder(rel) : baseName(f.name);
            const key = extractStat(src, extractMode, separators, regex);
            if (!key) {
                bad.push(f);
                continue;
            }
            const arr = map.get(key) ?? [];
            arr.push(f);
            map.set(key, arr);
        }
        const result: PersonGroup[] = [];
        for (const [key, files] of map.entries()) {
            files.sort((a, b) => a.name.localeCompare(b.name));
            result.push({
                key,
                files,
                sampleNames: files.slice(0, 3).map((f) => f.name),
            });
        }
        result.sort((a, b) => a.key.localeCompare(b.key, undefined, { numeric: true }));
        return { groups: result, unparsed: bad };
    }, [rawFiles, effectiveMode, extractMode, separators, regex]);

    const activeGroups = useMemo(
        () => groups.filter((g) => !excluded.has(g.key)),
        [groups, excluded],
    );

    const totalImages = useMemo(
        () => activeGroups.reduce((s, g) => s + g.files.length, 0),
        [activeGroups],
    );

    const successCount = useMemo(
        () => Object.values(rowStates).filter((s) => s.status === 'success').length,
        [rowStates],
    );
    const failedCount = useMemo(
        () => Object.values(rowStates).filter((s) => s.status === 'failed').length,
        [rowStates],
    );

    const setRow = useCallback((key: string, state: RowState) => {
        setRowStates((prev) => ({ ...prev, [key]: state }));
    }, []);

    const buildDto = useCallback(
        async (g: PersonGroup): Promise<PersonUpsertDto> => {
            const faceImages = [];
            for (let i = 0; i < g.files.length; i++) {
                const b64 = await fileToBase64(g.files[i]);
                faceImages.push({
                    faceImageId: 0,
                    imageFile: b64,
                    imageSource: ImageSource.Import,
                    capturedAt: new Date().toISOString(),
                    isActive: true,
                    isPrimary: i === 0,
                });
            }
            const nameFromTemplate = fullNameTemplate.replace('{stat}', g.key).trim() || g.key;
            return {
                personId: null,
                fullName: targetField === 'FullName' ? g.key : nameFromTemplate,
                displayName: null,
                gender: defGender,
                birthDate: null,
                nationalId: targetField === 'NationalId' ? g.key : '',
                externalCode: targetField === 'ExternalCode' ? g.key : null,
                phoneNumber: null,
                address: null,
                notes: 'أُضيف عبر الرفع الجماعي — الرقم الإحصائي: ' + g.key,
                isActive: defActive,
                securityStatus: defSecurity,
                dangerLevel: defDanger,
                hasActiveAlert: false,
                isArmedAndDangerous: false,
                securityReason: null,
                caseNumber: null,
                issuedBy: null,
                arrestWarrantNumber: null,
                alertIssuedAt: null,
                alertExpiresAt: null,
                lastSeenAt: null,
                lastSeenLocation: null,
                distinguishingMarks: null,
                aliases: null,
                vehicleInfo: null,
                securityNotes: null,
                alertInstructions: null,
                faceImages,
            };
        },
        [targetField, fullNameTemplate, defGender, defActive, defSecurity, defDanger],
    );

    const runUpload = useCallback(
        async (queue: PersonGroup[]) => {
            if (queue.length === 0) {
                messageApi.warning('لا توجد مجموعات للرفع');
                return;
            }
            setUploading(true);
            cancelRef.current = false;
            setDone(0);
            queue.forEach((g) => setRow(g.key, { status: 'pending' }));

            let index = 0;
            const worker = async () => {
                for (;;) {
                    if (cancelRef.current) return;
                    const myIndex = index++;
                    if (myIndex >= queue.length) return;
                    const g = queue[myIndex];
                    setRow(g.key, { status: 'uploading' });
                    try {
                        const dto = await buildDto(g);
                        const res = await createPerson(dto);
                        setRow(g.key, { status: 'success', personId: res?.personId });
                    } catch (err: unknown) {
                        const e = err as { response?: { data?: { message?: string } }; message?: string };
                        setRow(g.key, {
                            status: 'failed',
                            error: e?.response?.data?.message ?? e?.message ?? 'خطأ غير معروف',
                        });
                    } finally {
                        setDone((d) => d + 1);
                    }
                }
            };
            const n = Math.max(1, Math.min(concurrency, queue.length));
            await Promise.all(Array.from({ length: n }, () => worker()));
            setUploading(false);
            queryClient.invalidateQueries({ queryKey: ['persons'] });
            if (!cancelRef.current) messageApi.success('انتهى الرفع');
        },
        [concurrency, buildDto, setRow, messageApi, queryClient],
    );

    const startUpload = () => runUpload(activeGroups);
    const retryFailed = () =>
        runUpload(activeGroups.filter((g) => rowStates[g.key]?.status === 'failed'));
    const stopUpload = () => {
        cancelRef.current = true;
        setUploading(false);
        messageApi.info('تم إيقاف الرفع — المجموعات المتبقية لم تُرسل');
    };

    const removeGroup = (key: string) =>
        setExcluded((prev) => new Set(prev).add(key));

    const progressPercent = activeGroups.length
        ? Math.round((done / activeGroups.length) * 100)
        : 0;

    const columns: ColumnsType<PersonGroup> = [
        {
            title: '',
            dataIndex: 'preview',
            width: 64,
            render: (_: unknown, g: PersonGroup) => <Thumb file={g.files[0]} />,
        },
        {
            title: 'الرقم الإحصائي',
            dataIndex: 'key',
            render: (key: string) => <Text strong style={{ fontSize: 15 }}>{key}</Text>,
            sorter: (a: PersonGroup, b: PersonGroup) => a.key.localeCompare(b.key, undefined, { numeric: true }),
        },
        {
            title: 'عدد الصور',
            dataIndex: 'count',
            width: 100,
            align: 'center',
            render: (_: unknown, g: PersonGroup) => <Tag color="blue">{g.files.length}</Tag>,
            sorter: (a: PersonGroup, b: PersonGroup) => a.files.length - b.files.length,
        },
        {
            title: 'أمثلة الأسماء',
            dataIndex: 'sampleNames',
            render: (_: unknown, g: PersonGroup) => (
                <Text type="secondary" style={{ fontSize: 12 }}>
                    {g.sampleNames.join('، ')}{g.files.length > 3 ? ' …' : ''}
                </Text>
            ),
        },
        {
            title: 'الحالة',
            dataIndex: 'status',
            width: 150,
            render: (_: unknown, g: PersonGroup) => {
                const st = rowStates[g.key]?.status;
                if (st === 'success') return <Tag color="success" icon={<CheckCircleOutlined />}>تم</Tag>;
                if (st === 'failed') {
                    return (
                        <Tooltip title={rowStates[g.key]?.error}>
                            <Tag color="error" icon={<CloseCircleOutlined />}>فشل</Tag>
                        </Tooltip>
                    );
                }
                if (st === 'uploading') return <Tag color="processing">جارٍ الرفع…</Tag>;
                if (st === 'pending') return <Tag>بالانتظار</Tag>;
                return <Tag color="default">جاهز</Tag>;
            },
        },
        {
            title: '',
            dataIndex: 'actions',
            width: 50,
            render: (_: unknown, g: PersonGroup) => (
                <Tooltip title="استبعاد من الرفع">
                    <Button
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        disabled={uploading}
                        onClick={() => removeGroup(g.key)}
                    />
                </Tooltip>
            ),
        },
    ];

    return (
        <div className="add-shell">
            {contextHolder}

            <input
                ref={inputRef}
                type="file"
                multiple
                style={{ display: 'none' }}
                onChange={onFolderSelected}
            />

            <div className="add-hero">
                <div className="add-hero-inner">
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                        <div className="hero-badge">
                            <CloudUploadOutlined style={{ fontSize: 28, color: '#fff' }} />
                        </div>
                        <div>
                            <Title level={2} style={{ margin: 0, color: '#fff', fontWeight: 900 }}>
                                الرفع الجماعي للأشخاص
                            </Title>
                            <Text style={{ color: 'rgba(255,255,255,.86)', fontSize: 13 }}>
                                اختر مجلدًا يحوي صور الأشخاص — يُجمّع النظام الصور حسب الرقم الإحصائي ويرفعها بنفس آلية الإضافة اليدوية.
                            </Text>
                            {rootName ? (
                                <div style={{ marginTop: 6 }}>
                                    <Text style={{ color: 'rgba(255,255,255,.95)', fontSize: 12, fontWeight: 700 }}>
                                        المجلد: {rootName}
                                    </Text>
                                </div>
                            ) : null}
                        </div>
                    </div>
                    <div className="hero-actions">
                        <Button
                            className="hero-btn"
                            icon={<FolderOpenOutlined />}
                            onClick={() => inputRef.current?.click()}
                            disabled={uploading}
                        >
                            اختيار مجلد
                        </Button>
                        <Button
                            className="hero-btn"
                            type="primary"
                            icon={<ThunderboltOutlined />}
                            onClick={startUpload}
                            loading={uploading}
                            disabled={activeGroups.length === 0}
                        >
                            بدء الرفع
                        </Button>
                    </div>
                </div>
            </div>

            <div className="add-compact-stats">
                <div className="add-compact-stat-wrap">
                    <SummaryStat label="إجمالي الصور" value={rawFiles.length} color="#2563eb" bg="#eff6ff" border="#bfdbfe" icon={<PictureOutlined />} />
                </div>
                <div className="add-compact-stat-wrap">
                    <SummaryStat label="عدد الأشخاص" value={activeGroups.length} color="#7c3aed" bg="#faf5ff" border="#ddd6fe" icon={<UsergroupAddOutlined />} />
                </div>
                <div className="add-compact-stat-wrap">
                    <SummaryStat label="تم بنجاح" value={successCount} color="#16a34a" bg="#f0fdf4" border="#bbf7d0" icon={<CheckCircleOutlined />} />
                </div>
                <div className="add-compact-stat-wrap">
                    <SummaryStat label="فشل" value={failedCount} color="#dc2626" bg="#fff5f5" border="#fecaca" icon={<CloseCircleOutlined />} />
                </div>
                <div className="add-compact-stat-wrap">
                    <SummaryStat label="صور غير مُعرّفة" value={unparsed.length} color="#d97706" bg="#fff7ed" border="#fed7aa" icon={<FileTextOutlined />} />
                </div>
            </div>

            <Row gutter={[18, 18]} align="stretch">
                <Col xs={24} xl={9}>
                    <Card
                        className="surface-card"
                        title={<div className="section-title"><SettingOutlined style={{ color: '#1677ff' }} /><span>محددات التجميع</span></div>}
                    >
                        <div className="field-group">
                            <div className="field-group-title"><FolderOpenOutlined style={{ color: '#1677ff' }} />أسلوب التنظيم</div>
                            <Segmented
                                block
                                value={groupingMode}
                                onChange={(v) => setGroupingMode(v as GroupingMode)}
                                options={[
                                    { label: 'تلقائي', value: 'auto' },
                                    { label: 'اسم الملف', value: 'filename' },
                                    { label: 'مجلد لكل شخص', value: 'folder' },
                                ]}
                            />
                            {groupingMode === 'auto' && rawFiles.length > 0 ? (
                                <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
                                    الوضع المكتشف: {effectiveMode === 'folder' ? 'مجلد لكل شخص' : 'اسم الملف'}
                                </Text>
                            ) : null}
                        </div>

                        <div className="field-group">
                            <div className="field-group-title"><FileTextOutlined style={{ color: '#7c3aed' }} />طريقة استخراج الرقم</div>
                            <Select
                                style={{ width: '100%' }}
                                size="large"
                                value={extractMode}
                                onChange={setExtractMode}
                                options={[
                                    { value: 'whole', label: 'الاسم كامل (الاسم/المجلد = الرقم تمامًا)' },
                                    { value: 'leading', label: 'أول تسلسل أرقام في الاسم' },
                                    { value: 'stripSuffix', label: 'قبل أول فاصل (إزالة اللاحقة/الشارحة)' },
                                    { value: 'regex', label: 'تعبير نمطي مخصص (Regex)' },
                                ]}
                            />
                            {extractMode === 'stripSuffix' ? (
                                <div style={{ marginTop: 10 }}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>الفواصل التي تُقطع عندها:</Text>
                                    <Input value={separators} onChange={(e) => setSeparators(e.target.value)} placeholder="_-(). " />
                                </div>
                            ) : null}
                            {extractMode === 'regex' ? (
                                <div style={{ marginTop: 10 }}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>التعبير النمطي (المجموعة 1 = الرقم):</Text>
                                    <Input value={regex} onChange={(e) => setRegex(e.target.value)} placeholder="رقم" />
                                </div>
                            ) : null}
                        </div>

                        <Divider style={{ margin: '4px 0 16px' }} />

                        <div className="field-group">
                            <div className="field-group-title"><InfoCircleOutlined style={{ color: '#16a34a' }} />القيم الافتراضية للأعمدة</div>

                            <Text type="secondary" style={{ fontSize: 12 }}>عمود حفظ الرقم الإحصائي</Text>
                            <Select
                                style={{ width: '100%', marginBottom: 12 }}
                                size="large"
                                value={targetField}
                                onChange={setTargetField}
                                options={[
                                    { value: 'NationalId', label: 'الهوية الوطنية (NationalId)' },
                                    { value: 'ExternalCode', label: 'الرمز الخارجي (ExternalCode)' },
                                    { value: 'FullName', label: 'الاسم الكامل (FullName)' },
                                ]}
                            />

                            <Text type="secondary" style={{ fontSize: 12 }}>نمط الاسم الافتراضي</Text>
                            <Input
                                style={{ marginBottom: 12 }}
                                value={fullNameTemplate}
                                onChange={(e) => setFullNameTemplate(e.target.value)}
                                placeholder="{stat}"
                                disabled={targetField === 'FullName'}
                            />

                            <Row gutter={12}>
                                <Col span={12}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>الجنس</Text>
                                    <Select
                                        style={{ width: '100%' }}
                                        value={defGender}
                                        onChange={setDefGender}
                                        options={[
                                            { value: Gender.Male, label: 'ذكر' },
                                            { value: Gender.Female, label: 'أنثى' },
                                        ]}
                                    />
                                </Col>
                                <Col span={12}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>الحالة</Text>
                                    <div style={{ marginTop: 4 }}>
                                        <Switch checked={defActive} onChange={setDefActive} checkedChildren="نشط" unCheckedChildren="غير نشط" />
                                    </div>
                                </Col>
                            </Row>

                            <Row gutter={12} style={{ marginTop: 12 }}>
                                <Col span={12}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>الحالة الأمنية</Text>
                                    <Select style={{ width: '100%' }} value={defSecurity} onChange={setDefSecurity} options={securityOptions} />
                                </Col>
                                <Col span={12}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>درجة الخطورة</Text>
                                    <Select style={{ width: '100%' }} value={defDanger} onChange={setDefDanger} options={dangerOptions} />
                                </Col>
                            </Row>
                        </div>

                        <Divider style={{ margin: '4px 0 16px' }} />

                        <div className="field-group">
                            <div className="field-group-title"><ThunderboltOutlined style={{ color: '#dc2626' }} />التحكم بالرفع</div>
                            <Text type="secondary" style={{ fontSize: 12 }}>عدد العمليات المتزامنة (كل عملية = شخص)</Text>
                            <Select
                                style={{ width: '100%' }}
                                size="large"
                                value={concurrency}
                                onChange={setConcurrency}
                                disabled={uploading}
                                options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: String(n) }))}
                            />
                            <Alert
                                style={{ marginTop: 12 }}
                                type="info"
                                showIcon
                                message="ملاحظة"
                                description="كل عملية تستدعي خدمة المعالجة (البايثون). زيادة التزامن أسرع لكنه أثقل على الخادم."
                            />
                        </div>
                    </Card>
                </Col>

                <Col xs={24} xl={15}>
                    <Card
                        className="surface-card"
                        title={
                            <div className="section-title">
                                <UsergroupAddOutlined style={{ color: '#16a34a' }} />
                                <span>معاينة المجموعات</span>
                                {activeGroups.length > 0 ? <span className="section-badge">{activeGroups.length}</span> : null}
                            </div>
                        }
                        extra={
                            rawFiles.length > 0 ? (
                                <Button size="small" icon={<ClearOutlined />} onClick={clearAll} disabled={uploading}>تفريغ</Button>
                            ) : null
                        }
                    >
                        {rawFiles.length === 0 ? (
                            <div className="upload-drop" style={{ padding: 40, textAlign: 'center' }}>
                                <FolderOpenOutlined style={{ fontSize: 48, color: '#93c5fd', marginBottom: 12 }} />
                                <div>
                                    <Text strong style={{ display: 'block', color: 'var(--app-text)' }}>لم يتم اختيار أي مجلد بعد</Text>
                                    <Text className="muted-note">اضغط «اختيار مجلد» لتحميل صور الأشخاص (يدعم المجلدات الفرعية)</Text>
                                </div>
                                <Button type="primary" size="large" icon={<FolderOpenOutlined />} style={{ marginTop: 16 }} onClick={() => inputRef.current?.click()}>
                                    اختيار مجلد
                                </Button>
                            </div>
                        ) : (
                            <div>
                                {uploading || done > 0 ? (
                                    <div style={{ marginBottom: 16 }}>
                                        <Progress
                                            percent={progressPercent}
                                            status={uploading ? 'active' : failedCount > 0 ? 'exception' : 'success'}
                                        />
                                        <Space size={16} style={{ marginTop: 4 }}>
                                            <Text type="secondary" style={{ fontSize: 12 }}>المنجز: {done}/{activeGroups.length}</Text>
                                            <Text type="success" style={{ fontSize: 12 }}>نجح: {successCount}</Text>
                                            <Text type="danger" style={{ fontSize: 12 }}>فشل: {failedCount}</Text>
                                        </Space>
                                    </div>
                                ) : null}

                                <Space wrap style={{ marginBottom: 12 }}>
                                    {!uploading ? (
                                        <Button type="primary" icon={<CloudUploadOutlined />} onClick={startUpload} disabled={activeGroups.length === 0}>
                                            بدء رفع {activeGroups.length} شخص ({totalImages} صورة)
                                        </Button>
                                    ) : (
                                        <Button danger icon={<StopOutlined />} onClick={stopUpload}>إيقاف</Button>
                                    )}
                                    {!uploading && failedCount > 0 ? (
                                        <Button icon={<ReloadOutlined />} onClick={retryFailed}>إعادة محاولة الفاشلة ({failedCount})</Button>
                                    ) : null}
                                </Space>

                                {unparsed.length > 0 ? (
                                    <Alert
                                        style={{ marginBottom: 12 }}
                                        type="warning"
                                        showIcon
                                        message={unparsed.length + ' صورة لم يُستخرج منها رقم إحصائي'}
                                        description="غيّر طريقة الاستخراج أو أسلوب التنظيم. هذه الصور لن تُرفع."
                                    />
                                ) : null}

                                {activeGroups.length === 0 ? (
                                    <Empty description="لا توجد مجموعات صالحة" />
                                ) : (
                                    <Table
                                        rowKey="key"
                                        size="small"
                                        columns={columns}
                                        dataSource={activeGroups}
                                        pagination={{ pageSize: 15, showSizeChanger: true, pageSizeOptions: ['15', '30', '50'] }}
                                    />
                                )}
                            </div>
                        )}
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
