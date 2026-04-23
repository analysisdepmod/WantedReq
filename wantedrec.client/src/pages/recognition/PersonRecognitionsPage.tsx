
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Row, Col, Typography, Space, Spin, Tag, Button,
    Image, Progress, DatePicker, Table, Avatar,
    Tooltip, Timeline, Alert, Card, Descriptions,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
    ArrowRightOutlined, EyeOutlined, VideoCameraOutlined,
    UserOutlined, CheckCircleOutlined, WarningOutlined,
    ClockCircleOutlined, EnvironmentOutlined, BarChartOutlined,
    AimOutlined, RadarChartOutlined, SafetyOutlined, PhoneOutlined,
    HomeOutlined, FileTextOutlined, AlertOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { usePersonRecognitions } from '../../hooks/useRecognitions';
import { getPersonById } from '../../api/personsApi';
import type { RecognitionDto } from '../../types/camera.types';
import { RecognitionStatusLabel, RecognitionStatusColor } from '../../types/camera.types';
import {
    DangerLevel,
    DangerLevelColor,
    DangerLevelLabel,
    Gender,
    GenderLabel,
    PersonSecurityStatus,
    PersonSecurityStatusColor,
    PersonSecurityStatusLabel,
} from '../../types/person.types';
import { BASIC_URL } from '../../api';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const scoreColor = (s?: number) => !s ? '#94a3b8' : s >= 0.8 ? '#16a34a' : s >= 0.6 ? '#d97706' : '#dc2626';
const buildUrl = (p: string) => `${BASIC_URL.replace(/\/api\/?$/, '')}/${p.replace(/^\/+/, '')}`;

type RecognitionRow = RecognitionDto & {
    securityStatus?: PersonSecurityStatus;
    dangerLevel?: DangerLevel;
    hasActiveAlert?: boolean;
    isArmedAndDangerous?: boolean;
    lastSeenAt?: string;
    lastSeenLocation?: string;
    securityReason?: string;
    alertInstructions?: string;
};

function MovementMap({ records }: { records: RecognitionRow[] }) {
    if (records.length < 2) {
        return <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--app-surface-2)', borderRadius: 12, border: '1px dashed #e4e9f2' }}><Space direction="vertical" style={{ textAlign: 'center' }}><RadarChartOutlined style={{ fontSize: 32, color: '#cbd5e1' }} /><Text type="secondary" style={{ fontSize: 12 }}>يحتاج أكثر من تعرف لرسم المسار</Text></Space></div>;
    }
    const cameras = records.filter((r, i, a) => a.findIndex(x => x.cameraId === r.cameraId) === i).map((r, i) => ({ id: r.cameraId, name: r.cameraName ?? `CAM-${r.cameraId}`, x: 60 + (i % 4) * 160, y: 60 + Math.floor(i / 4) * 100 }));
    const H = 60 + Math.ceil(cameras.length / 4) * 100 + 40;
    const path = [...records].sort((a, b) => new Date(a.recognitionDateTime).getTime() - new Date(b.recognitionDateTime).getTime()).map(r => cameras.find(c => c.id === r.cameraId)).filter(Boolean) as typeof cameras;
    const d = path.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    return (
        <div style={{ background: 'linear-gradient(135deg,var(--app-surface-2),var(--app-soft-blue))', borderRadius: 14, border: '1px solid var(--app-border)', overflow: 'hidden', position: 'relative' }}>
            <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--app-border)', display: 'flex', alignItems: 'center', gap: 8 }}><AimOutlined style={{ color: '#2563eb' }} /><Text strong style={{ fontSize: 13 }}>مسار الحركة</Text></div>
            <svg width="100%" height={H} viewBox={`0 0 ${Math.max(640, cameras.length * 160)} ${H}`} style={{ display: 'block' }}>
                <path d={d} fill="none" stroke="#2563eb" strokeWidth={2.5} opacity={0.7} />
                {cameras.map(cam => <g key={cam.id}><circle cx={cam.x} cy={cam.y} r={18} fill="#fff" stroke="#2563eb" strokeWidth={2.5} /><text x={cam.x} y={cam.y + 5} textAnchor="middle" fontSize={13}>📷</text><text x={cam.x} y={cam.y + 34} textAnchor="middle" fontSize={10} fill="#475569" fontWeight="600">{cam.name.length > 10 ? cam.name.slice(0, 10) + '…' : cam.name}</text></g>)}
            </svg>
        </div>
    );
}

function MovementTimeline({ records }: { records: RecognitionRow[] }) {
    const sorted = [...records].sort((a, b) => new Date(a.recognitionDateTime).getTime() - new Date(b.recognitionDateTime).getTime());
    return (
        <Timeline mode="right" style={{ direction: 'rtl' }}>
            {sorted.map(rec => (
                <Timeline.Item key={rec.recognitionId} color={scoreColor(rec.recognitionScore)}>
                    <div style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)', borderRadius: 10, padding: '8px 12px', marginBottom: 4 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><Text strong style={{ fontSize: 12 }}>{rec.cameraName ?? '—'}</Text><Text style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{dayjs(rec.recognitionDateTime).format('HH:mm:ss')}</Text></div>
                        {rec.recognitionScore !== undefined && <Text style={{ fontSize: 11, color: scoreColor(rec.recognitionScore), fontWeight: 600 }}>{Math.round(rec.recognitionScore * 100)}% تطابق</Text>}
                        {rec.locationDescription && <div style={{ fontSize: 11, color: 'var(--app-muted)', marginTop: 2 }}><EnvironmentOutlined style={{ marginLeft: 3 }} />{rec.locationDescription}</div>}
                    </div>
                </Timeline.Item>
            ))}
        </Timeline>
    );
}

export default function PersonRecognitionsPage() {
    const { personId } = useParams<{ personId: string }>();
    const pid = Number(personId);
    const navigate = useNavigate();
    const [dateRange, setDateRange] = useState<[string, string] | undefined>();
    const { recognitions, isLoading, isFetching, refetch, stats } = usePersonRecognitions(pid);
    const { data: person } = useQuery({ queryKey: ['person', pid], queryFn: () => getPersonById(pid), enabled: !!pid });
    const rows = recognitions as RecognitionRow[];
    const filtered = dateRange ? rows.filter(r => { const d = dayjs(r.recognitionDateTime); return d.isAfter(dateRange[0]) && d.isBefore(dayjs(dateRange[1]).add(1, 'day')); }) : rows;

    const columns: ColumnsType<RecognitionRow> = [
        { title: 'لقطة', key: 'snap', width: 70, render: (_, r) => r.snapshotPath ? <Image src={buildUrl(r.snapshotPath)} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8 }} /> : <div style={{ width: 48, height: 48, borderRadius: 8, background: 'var(--app-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><UserOutlined style={{ color: '#94a3b8' }} /></div> },
        { title: 'الكاميرا', key: 'cam', render: (_, r) => <Space size={4}><VideoCameraOutlined style={{ color: '#94a3b8', fontSize: 12 }} /><Text style={{ fontSize: 13 }}>{r.cameraName ?? '—'}</Text></Space> },
        { title: 'الدقة', key: 'score', width: 120, render: (_, r) => <div><Text style={{ color: scoreColor(r.recognitionScore), fontWeight: 700, fontSize: 13 }}>{r.recognitionScore ? `${Math.round(r.recognitionScore * 100)}%` : '—'}</Text>{r.recognitionScore && <Progress percent={Math.round(r.recognitionScore * 100)} strokeColor={scoreColor(r.recognitionScore)} size="small" showInfo={false} style={{ margin: '2px 0 0' }} />}</div> },
        { title: 'الحالة', key: 'status', width: 130, render: (_, r) => <Tag color={RecognitionStatusColor[r.recognitionStatus]}>{RecognitionStatusLabel[r.recognitionStatus]}</Tag> },
        { title: 'الموقع', key: 'location', width: 180, render: (_, r) => <div><Text style={{ fontSize: 12, display: 'block' }}>{r.locationDescription || '—'}</Text><Text type="secondary" style={{ fontSize: 10 }}>{r.lastSeenLocation || '—'}</Text></div> },
        { title: 'الوقت', key: 'time', width: 120, render: (_, r) => <div><Text style={{ fontSize: 13, fontFamily: 'monospace' }}>{dayjs(r.recognitionDateTime).format('HH:mm:ss')}</Text><Text type="secondary" style={{ fontSize: 11, display: 'block' }}>{dayjs(r.recognitionDateTime).format('YYYY/MM/DD')}</Text></div> },
    ];

    if (isLoading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><Spin size="large" /></div>;
    const p: any = person;
    const primaryImg = p?.faceImages?.find((f: any) => f.isPrimary)?.faceProcessedImage ?? p?.faceImages?.[0]?.faceProcessedImage;

    return (
        <div style={{ padding: '20px 24px', direction: 'rtl', background: 'var(--app-page-bg)', minHeight: '100vh' }}>
            {(p?.hasActiveAlert || p?.isArmedAndDangerous || p?.dangerLevel === DangerLevel.Critical) && (
                <Alert type="error" showIcon style={{ marginBottom: 16 }} message="تنبيه أمني مهم" description={p?.alertInstructions || p?.securityReason || 'هذا الشخص يحمل حالة أمنية مهمة وتتطلب مراجعة فورية.'} />
            )}

            <div style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)', borderRadius: 18, padding: '16px 22px', marginBottom: 18, boxShadow: '0 2px 8px rgba(15,23,42,.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <Space size={14} align="start">
                        <Tooltip title="رجوع"><Button icon={<ArrowRightOutlined />} onClick={() => navigate(-1)} style={{ borderRadius: 9, marginTop: 4 }} /></Tooltip>
                        <Avatar size={56} src={primaryImg ? `data:image/jpeg;base64,${primaryImg}` : undefined} icon={<UserOutlined />} style={{ background: 'var(--app-soft-blue)', color: '#2563eb', border: `3px solid ${(p?.hasActiveAlert || p?.isArmedAndDangerous) ? '#fca5a5' : '#bfdbfe'}`, flexShrink: 0 }} />
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <Title level={4} style={{ margin: 0 }}>{p?.fullName ?? `شخص #${pid}`}</Title>
                                <Tag color={p?.isActive ? 'success' : 'error'}>{p?.isActive ? 'نشط' : 'غير نشط'}</Tag>
                                {p?.gender !== undefined && <Tag color={p.gender === Gender.Male ? 'blue' : 'pink'}>{GenderLabel[p.gender as Gender]}</Tag>}
                                {p?.securityStatus !== undefined && <Tag color={PersonSecurityStatusColor[p.securityStatus as PersonSecurityStatus]}>{PersonSecurityStatusLabel[p.securityStatus as PersonSecurityStatus]}</Tag>}
                                {p?.dangerLevel !== undefined && <Tag color={DangerLevelColor[p.dangerLevel as DangerLevel]}>{DangerLevelLabel[p.dangerLevel as DangerLevel]}</Tag>}
                                {p?.hasActiveAlert && <Tag color="error" icon={<AlertOutlined />}>تعميم فعال</Tag>}
                                {p?.isArmedAndDangerous && <Tag color="volcano">مسلح وخطر</Tag>}
                            </div>
                            <Space size={16} style={{ marginTop: 4, flexWrap: 'wrap' }}>
                                <Text type="secondary" style={{ fontSize: 12 }}>الهوية: {p?.nationalId || '—'}</Text>
                                <Text type="secondary" style={{ fontSize: 12 }}><PhoneOutlined style={{ marginLeft: 4 }} />{p?.phoneNumber || '—'}</Text>
                                {stats.lastSeen && <Text type="secondary" style={{ fontSize: 12 }}><ClockCircleOutlined style={{ marginLeft: 3 }} />آخر رصد: {dayjs(stats.lastSeen).format('YYYY/MM/DD HH:mm')}</Text>}
                                {p?.lastSeenLocation && <Text type="secondary" style={{ fontSize: 12 }}><EnvironmentOutlined style={{ marginLeft: 4 }} />{p.lastSeenLocation}</Text>}
                            </Space>
                        </div>
                    </Space>
                    <Space><Button type="primary" ghost icon={<EyeOutlined />} onClick={() => navigate(`/persons/${pid}`)} style={{ borderRadius: 9 }}>الملف الكامل</Button></Space>
                </div>
            </div>

            <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                {[
                    { label: 'إجمالي التعرفات', value: rows.length, color: '#2563eb', bg: '#eff6ff', icon: <BarChartOutlined /> },
                    { label: 'مؤكدة', value: stats.confirmed, color: '#16a34a', bg: '#f0fdf4', icon: <CheckCircleOutlined /> },
                    { label: 'كاميرات مختلفة', value: stats.cameras.length, color: '#7c3aed', bg: '#faf5ff', icon: <VideoCameraOutlined /> },
                    { label: 'متوسط الدقة', value: `${Math.round(stats.avgScore * 100)}%`, color: '#d97706', bg: '#fefce8', icon: <AimOutlined /> },
                ].map(s => <Col key={s.label} xs={12} sm={6}><Card size="small" style={{ background: s.bg, borderColor: 'var(--app-border)' }}><div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><div style={{ color: s.color }}>{s.icon}</div><div><div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div><div style={{ fontSize: 11, color: 'var(--app-muted)' }}>{s.label}</div></div></div></Card></Col>)}
            </Row>

            <Row gutter={[16, 16]}>
                <Col xs={24} lg={8}>
                    <Card size="small" title="الملخص الأمني" style={{ marginBottom: 14 }}>
                        <Descriptions column={1} size="small" bordered>
                            <Descriptions.Item label="الحالة الأمنية">{p?.securityStatus !== undefined ? <Tag color={PersonSecurityStatusColor[p.securityStatus as PersonSecurityStatus]}>{PersonSecurityStatusLabel[p.securityStatus as PersonSecurityStatus]}</Tag> : '—'}</Descriptions.Item>
                            <Descriptions.Item label="درجة الخطورة">{p?.dangerLevel !== undefined ? <Tag color={DangerLevelColor[p.dangerLevel as DangerLevel]}>{DangerLevelLabel[p.dangerLevel as DangerLevel]}</Tag> : '—'}</Descriptions.Item>
                            <Descriptions.Item label="السبب">{p?.securityReason || '—'}</Descriptions.Item>
                            <Descriptions.Item label="رقم القضية">{p?.caseNumber || '—'}</Descriptions.Item>
                            <Descriptions.Item label="الجهة المصدرة">{p?.issuedBy || '—'}</Descriptions.Item>
                            <Descriptions.Item label="أمر القبض">{p?.arrestWarrantNumber || '—'}</Descriptions.Item>
                            <Descriptions.Item label="الأسماء المستعارة">{p?.aliases || '—'}</Descriptions.Item>
                            <Descriptions.Item label="المركبة">{p?.vehicleInfo || '—'}</Descriptions.Item>
                            <Descriptions.Item label="آخر ظهور">{p?.lastSeenAt ? dayjs(p.lastSeenAt).format('YYYY/MM/DD HH:mm') : '—'}</Descriptions.Item>
                            <Descriptions.Item label="الموقع الأخير">{p?.lastSeenLocation || '—'}</Descriptions.Item>
                        </Descriptions>
                        {p?.alertInstructions && <Alert style={{ marginTop: 12 }} type="warning" showIcon message="تعليمات عند المشاهدة" description={p.alertInstructions} />}
                    </Card>
                    <Card size="small" title="فلترة بالتاريخ" style={{ marginBottom: 14 }}>
                        <RangePicker style={{ width: '100%', borderRadius: 9 }} onChange={(_, ds) => { const [f, t] = ds; setDateRange(f && t ? [f, t] : undefined); }} placeholder={['من', 'إلى']} />
                        {dateRange && <Button size="small" onClick={() => setDateRange(undefined)} style={{ marginTop: 8, borderRadius: 7, width: '100%' }}>مسح الفلتر — {filtered.length} نتيجة</Button>}
                    </Card>
                    <Card size="small" title="خريطة مسار الحركة" style={{ marginBottom: 14 }}><MovementMap records={filtered} /></Card>
                    <Card size="small" title="الجدول الزمني للرصد" style={{ maxHeight: 420, overflowY: 'auto' }}><MovementTimeline records={filtered} /></Card>
                </Col>
                <Col xs={24} lg={16}>
                    <Card size="small" title={`سجل التعرف المفصل (${filtered.length})`} extra={<Button size="small" icon={<CheckCircleOutlined />} onClick={() => refetch()} loading={isFetching} style={{ borderRadius: 7 }}>تحديث</Button>}>
                        <Table<RecognitionRow> columns={columns} dataSource={filtered} rowKey="recognitionId" loading={isLoading} pagination={{ pageSize: 15, showSizeChanger: false, showTotal: total => <Text type="secondary">{total} سجل</Text> }} style={{ direction: 'rtl' }} scroll={{ x: 760 }} locale={{ emptyText: 'لا توجد سجلات في هذه الفترة' }} />
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
