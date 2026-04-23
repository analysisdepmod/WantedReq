import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Table, Input, Button, Tag, Space, Typography,
    Popconfirm, message, Tooltip, Badge, Select, Row, Col,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
    TeamOutlined, UserAddOutlined, SearchOutlined, EyeOutlined, DeleteOutlined,
    CheckCircleOutlined, StopOutlined, ReloadOutlined,
    FilterOutlined, UserOutlined, CameraOutlined, SafetyOutlined,
    WarningOutlined, AimOutlined,
} from '@ant-design/icons';
import { getPersons, deletePerson, setActive, setDisActive } from '../../api/personsApi';
import type { PersonListItemDto } from '../../types/person.types';
import {
    Gender,
    GenderLabel,
    PersonSecurityStatus,
    DangerLevel,
    PersonSecurityStatusLabel,
    PersonSecurityStatusColor,
    DangerLevelLabel,
    DangerLevelColor,
} from '../../types/person.types';

const { Title, Text } = Typography;

const CSS = `
  @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
  .person-row:hover td { background:#f0f7ff !important; cursor:pointer; }
  .person-row.alert td { background:#fff8eb !important; }
  .person-row.critical td { background:#fff5f5 !important; }
`;
const securityOptions = Object.entries(PersonSecurityStatusLabel).map(([value, label]) => ({
    value: Number(value) as PersonSecurityStatus,
    label,
}));

const dangerOptions = Object.entries(DangerLevelLabel).map(([value, label]) => ({
    value: Number(value) as DangerLevel,
    label,
}));
function StatCard({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
    return (
        <div style={{
            background: bg, border: '1px solid #e4e9f2', borderRadius: 12,
            padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10,
            animation: 'fadeIn .3s ease both', flex: 1,
        }}>
            <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>{label}</div>
        </div>
    );
}

export default function IndexPersons() {
    const navigate = useNavigate();
    const qc = useQueryClient();
    const [msgApi, ctx] = message.useMessage();

    const [search, setSearch] = useState('');
    const [isActive, setIsActive] = useState<boolean | undefined>(undefined);
    const [isDeleted, setIsDeleted] = useState<boolean | undefined>(undefined);
    const [securityStatus, setSecurityStatus] = useState<PersonSecurityStatus | undefined>(undefined);
    const [dangerLevel, setDangerLevel] = useState<DangerLevel | undefined>(undefined);
    const [hasActiveAlert, setHasActiveAlert] = useState<boolean | undefined>(undefined);

    const { data: persons = [], isLoading, refetch, isFetching } = useQuery({
        queryKey: ['persons', search, isActive, isDeleted],
        queryFn: () => getPersons({ search: search || undefined, isActive, isDeleted }),
    });

    const filteredPersons = useMemo(() => {
        return persons.filter((p: PersonListItemDto) => {
            if (securityStatus !== undefined && p.securityStatus !== securityStatus) return false;
            if (dangerLevel !== undefined && p.dangerLevel !== dangerLevel) return false;
            if (hasActiveAlert !== undefined && p.hasActiveAlert !== hasActiveAlert) return false;
            return true;
        });
    }, [persons, securityStatus, dangerLevel, hasActiveAlert]);

    const invalidate = () => qc.invalidateQueries({ queryKey: ['persons'] });

    const deleteMut = useMutation({
        mutationFn: deletePerson,
        onSuccess: () => { msgApi.success('تم الحذف'); invalidate(); },
        onError: () => msgApi.error('فشل الحذف'),
    });

    const activateMut = useMutation({
        mutationFn: setActive,
        onSuccess: () => { msgApi.success('تم التفعيل'); invalidate(); },
    });

    const deactivateMut = useMutation({
        mutationFn: setDisActive,
        onSuccess: () => { msgApi.success('تم التعطيل'); invalidate(); },
    });

    const active = filteredPersons.filter((p: PersonListItemDto) => p.isActive).length;
    const suspects = filteredPersons.filter((p: PersonListItemDto) => p.securityStatus === PersonSecurityStatus.Suspect || p.securityStatus === PersonSecurityStatus.WantedAndSuspect || p.hasSuspectRecord).length;
    const wanted = filteredPersons.filter((p: PersonListItemDto) => p.securityStatus === PersonSecurityStatus.Wanted || p.securityStatus === PersonSecurityStatus.WantedAndSuspect).length;
    const alerts = filteredPersons.filter((p: PersonListItemDto) => p.hasActiveAlert).length;
    const critical = filteredPersons.filter((p: PersonListItemDto) => p.dangerLevel === DangerLevel.Critical).length;

    const columns: ColumnsType<PersonListItemDto> = [
        {
            title: '#', dataIndex: 'personId', width: 60, align: 'center',
            render: (v) => <Text style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'monospace' }}>{v}</Text>,
        },
        {
            title: 'الشخص', key: 'person',
            render: (_, r) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                        background: r.hasActiveAlert ? '#fff1f2' : '#eff6ff',
                        border: `1px solid ${r.hasActiveAlert ? '#fecdd3' : '#bfdbfe'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                    }}>
                        {r.hasActiveAlert ? '🚨' : <UserOutlined style={{ color: '#2563eb', fontSize: 14 }} />}
                    </div>
                    <div>
                        <Text strong style={{ fontSize: 13, display: 'block' }}>{r.fullName}</Text>
                        <Space size={4} wrap>
                            {r.displayName && <Text type="secondary" style={{ fontSize: 11 }}>{r.displayName}</Text>}
                            {r.hasActiveAlert && <Tag color="red" style={{ fontSize: 10, margin: 0 }}>تعميم فعال</Tag>}
                            {r.isArmedAndDangerous && <Tag color="volcano" style={{ fontSize: 10, margin: 0 }}>مسلح وخطر</Tag>}
                        </Space>
                    </div>
                </div>
            ),
        },
        {
            title: 'الجنس', dataIndex: 'gender', width: 90, align: 'center',
            render: (g: Gender) => <Tag color={g === Gender.Male ? 'blue' : 'pink'} style={{ fontSize: 11 }}>{GenderLabel[g]}</Tag>,
        },
        {
            title: 'الهوية', dataIndex: 'nationalId', width: 140,
            render: (v) => <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>{v || '—'}</Text>,
        },
        {
            title: 'الحالة الأمنية', dataIndex: 'securityStatus', width: 140, align: 'center',
            render: (v: PersonSecurityStatus) => <Tag color={PersonSecurityStatusColor[v]}>{PersonSecurityStatusLabel[v]}</Tag>,
        },
        {
            title: 'الخطورة', dataIndex: 'dangerLevel', width: 110, align: 'center',
            render: (v: DangerLevel) => <Tag color={DangerLevelColor[v]}>{DangerLevelLabel[v]}</Tag>,
        },
        {
            title: 'آخر ظهور', key: 'lastSeen', width: 160,
            render: (_, r) => (
                <div>
                    <Text style={{ fontSize: 12, display: 'block' }}>{r.lastSeenAt ? new Date(r.lastSeenAt).toLocaleDateString('ar-IQ') : '—'}</Text>
                    <Text type="secondary" style={{ fontSize: 10 }}>{r.lastSeenLocation || '—'}</Text>
                </div>
            ),
        },
        {
            title: 'الصور', dataIndex: 'faceImagesCount', width: 80, align: 'center',
            render: (n) => <Badge count={n} showZero color={n > 0 ? '#2563eb' : '#d1d5db'} style={{ fontSize: 11 }} />,
        },
        {
            title: 'التعرفات', dataIndex: 'recognitionCount', width: 90, align: 'center',
            render: (n) => <Badge count={n} showZero overflowCount={999} color={n > 0 ? '#16a34a' : '#d1d5db'} style={{ fontSize: 11 }} />,
        },
        {
            title: 'الحالة', dataIndex: 'isActive', width: 100, align: 'center',
            render: (v: boolean, r) => (
                <Tag
                    icon={v ? <CheckCircleOutlined /> : <StopOutlined />}
                    color={v ? 'success' : 'default'}
                    style={{ cursor: 'pointer', fontSize: 11 }}
                    onClick={(e) => {
                        e.stopPropagation();
                        v ? deactivateMut.mutate(r.personId) : activateMut.mutate(r.personId);
                    }}
                >
                    {v ? 'نشط' : 'غير نشط'}
                </Tag>
            ),
        },
        {
            title: 'الإجراءات', width: 110, align: 'center',
            render: (_, r) => (
                <Space size={4} onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="التفاصيل"><Button size="small" type="primary" icon={<EyeOutlined />} onClick={() => navigate(`/persons/${r.personId}`)} style={{ borderRadius: 7 }} /></Tooltip>
                    <Tooltip title="سجل التعرف"><Button size="small" icon={<CameraOutlined />} onClick={() => navigate(`/recognition/person/${r.personId}`)} style={{ borderRadius: 7 }} /></Tooltip>
                    <Popconfirm title="تأكيد الحذف؟" okText="نعم" cancelText="لا" onConfirm={() => deleteMut.mutate(r.personId)}>
                        <Button size="small" danger icon={<DeleteOutlined />} style={{ borderRadius: 7 }} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <>
            <style>{CSS}</style>
            {ctx}

            <div style={{ padding: '20px 24px', direction: 'rtl', background: '#f4f6fb', minHeight: '100vh' }}>
                <div style={{
                    background: '#fff', border: '1px solid #e4e9f2', borderRadius: 16,
                    padding: '16px 22px', marginBottom: 18, boxShadow: '0 2px 8px rgba(15,23,42,.06)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14,
                }}>
                    <Space size={12} align="center">
                        <div style={{ width: 44, height: 44, borderRadius: 11, background: 'linear-gradient(135deg,#2563eb,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(37,99,235,.3)' }}>
                            <TeamOutlined style={{ fontSize: 22, color: '#fff' }} />
                        </div>
                        <div>
                            <Title level={4} style={{ margin: 0 }}>قائمة الأشخاص</Title>
                            <Text type="secondary" style={{ fontSize: 12 }}>إدارة الأشخاص مع الحالة الأمنية والخطورة والتنبيهات</Text>
                        </div>
                    </Space>
                    <Space>
                        <Tooltip title="تحديث"><Button icon={<ReloadOutlined spin={isFetching} />} onClick={() => refetch()} style={{ borderRadius: 9 }} /></Tooltip>
                        <Button type="primary" icon={<UserAddOutlined />} onClick={() => navigate('/addperson')} style={{ borderRadius: 9, height: 36, background: '#2563eb', borderColor: '#2563eb' }}>إضافة شخص</Button>
                    </Space>
                </div>

                <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                    {[
                        { label: 'إجمالي الأشخاص', value: filteredPersons.length, color: '#2563eb', bg: '#eff6ff' },
                        { label: 'نشطون', value: active, color: '#16a34a', bg: '#f0fdf4' },
                        { label: 'مطلوبون', value: wanted, color: '#dc2626', bg: '#fff5f5' },
                        { label: 'تعاميم فعالة', value: alerts, color: '#d97706', bg: '#fff7ed' },
                        { label: 'خطورة حرجة', value: critical, color: '#991b1b', bg: '#fef2f2' },
                        { label: 'مشتبه بهم', value: suspects, color: '#7c3aed', bg: '#faf5ff' },
                    ].map((s) => (
                        <Col key={s.label} xs={12} sm={8} md={6} lg={4} xl={4}><StatCard {...s} /></Col>
                    ))}
                </Row>

                <div style={{
                    background: '#fff', border: '1px solid #e4e9f2', borderRadius: 12,
                    padding: '12px 18px', marginBottom: 14, display: 'flex', gap: 10,
                    alignItems: 'center', flexWrap: 'wrap',
                }}>
                    <FilterOutlined style={{ color: '#64748b' }} />
                    <Input prefix={<SearchOutlined style={{ color: '#94a3b8' }} />} placeholder="بحث بالاسم أو الهوية..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 220, borderRadius: 9 }} allowClear />
                    <Select placeholder="الحالة" allowClear style={{ width: 130 }} value={isActive} onChange={(v) => setIsActive(v)} options={[{ value: true, label: '✅ نشط' }, { value: false, label: '⛔ غير نشط' }]} />
                    <Select placeholder="الحذف" allowClear style={{ width: 140 }} value={isDeleted} onChange={(v) => setIsDeleted(v)} options={[{ value: false, label: '👤 غير محذوف' }, { value: true, label: '🗑️ محذوف' }]} />
                    <Select placeholder="الحالة الأمنية" allowClear style={{ width: 170 }} value={securityStatus} onChange={(v) => setSecurityStatus(v)} options={securityOptions} />
                    <Select placeholder="الخطورة" allowClear style={{ width: 130 }} value={dangerLevel} onChange={(v) => setDangerLevel(v)} options={dangerOptions} />
                    <Select placeholder="التعميم" allowClear style={{ width: 130 }} value={hasActiveAlert} onChange={(v) => setHasActiveAlert(v)} options={[{ value: true, label: '🚨 فعّال' }, { value: false, label: '— بلا تعميم' }]} />
                    {(isActive !== undefined || isDeleted !== undefined || search || securityStatus !== undefined || dangerLevel !== undefined || hasActiveAlert !== undefined) && (
                        <Button size="small" onClick={() => { setSearch(''); setIsActive(undefined); setIsDeleted(undefined); setSecurityStatus(undefined); setDangerLevel(undefined); setHasActiveAlert(undefined); }} style={{ borderRadius: 7 }}>مسح الفلاتر</Button>
                    )}
                    <Text type="secondary" style={{ fontSize: 12, marginRight: 'auto' }}>{filteredPersons.length} شخص</Text>
                </div>

                <div style={{ background: '#fff', border: '1px solid #e4e9f2', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(15,23,42,.06)' }}>
                    <Table<PersonListItemDto>
                        columns={columns}
                        dataSource={filteredPersons}
                        rowKey="personId"
                        loading={isLoading}
                        size="middle"
                        rowClassName={(r) => `person-row${r.dangerLevel === DangerLevel.Critical ? ' critical' : r.hasActiveAlert ? ' alert' : ''}`}
                        onRow={(r) => ({ onClick: () => navigate(`/persons/${r.personId}`) })}
                        pagination={{
                            pageSize: 15,
                            showSizeChanger: true,
                            pageSizeOptions: ['10', '15', '30', '50'],
                            showTotal: (total) => <Text type="secondary">المجموع: {total}</Text>,
                        }}
                        scroll={{ x: 1200 }}
                    />
                </div>
            </div>
        </>
    );
}
