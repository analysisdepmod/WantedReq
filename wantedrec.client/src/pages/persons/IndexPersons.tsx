import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Table,
    Input,
    Button,
    Tag,
    Space,
    Typography,
    Popconfirm,
    message,
    Tooltip,
    Badge,
    Select,
    Row,
    Col,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
    TeamOutlined,
    UserAddOutlined,
    SearchOutlined,
    EyeOutlined,
    DeleteOutlined,
    CheckCircleOutlined,
    StopOutlined,
    ReloadOutlined,
    FilterOutlined,
    UserOutlined,
    CameraOutlined,
    WarningOutlined,
    AlertOutlined,
    SafetyOutlined,
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

const LOCAL_COMPACT_CSS = `
.persons-compact-stats {
  display: flex;
  gap: 12px;
  flex-wrap: nowrap;
  overflow-x: auto;
  padding-bottom: 4px;
  margin-bottom: 18px;
  scrollbar-width: thin;
}

.persons-compact-stats::-webkit-scrollbar {
  height: 8px;
}

.persons-compact-stats::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 999px;
}

.persons-compact-stat-wrap {
  flex: 0 0 165px;
  min-width: 165px;
  max-width: 165px;
}

.persons-compact-stat-card {
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

.persons-compact-stat-card .v {
  font-size: 18px;
  line-height: 1;
  font-weight: 900;
}

.persons-compact-stat-card .l {
  font-size: 11px;
  color: var(--app-muted);
  margin-top: 6px;
}

.persons-compact-stat-card .i {
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
  .persons-compact-stat-wrap {
    flex-basis: 150px;
    min-width: 150px;
    max-width: 150px;
  }
}
`;


const securityOptions = Object.entries(PersonSecurityStatusLabel).map(([value, label]) => ({
    value: Number(value) as PersonSecurityStatus,
    label,
}));

const dangerOptions = Object.entries(DangerLevelLabel).map(([value, label]) => ({
    value: Number(value) as DangerLevel,
    label,
}));

function StatCard({
    label,
    value,
    color,
    bg,
    border,
    icon,
}: {
    label: string;
    value: number;
    color: string;
    bg: string;
    border: string;
    icon: React.ReactNode;
}) {
    return (
        <div className="persons-compact-stat-card">
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
        onSuccess: () => {
            msgApi.success('تم الحذف');
            invalidate();
        },
        onError: () => msgApi.error('فشل الحذف'),
    });

    const activateMut = useMutation({
        mutationFn: setActive,
        onSuccess: () => {
            msgApi.success('تم التفعيل');
            invalidate();
        },
    });

    const deactivateMut = useMutation({
        mutationFn: setDisActive,
        onSuccess: () => {
            msgApi.success('تم التعطيل');
            invalidate();
        },
    });

    const active = filteredPersons.filter((p: PersonListItemDto) => p.isActive).length;
    const suspects = filteredPersons.filter(
        (p: PersonListItemDto) =>
            p.securityStatus === PersonSecurityStatus.Suspect ||
            p.securityStatus === PersonSecurityStatus.WantedAndSuspect ||
            p.hasSuspectRecord,
    ).length;
    const wanted = filteredPersons.filter(
        (p: PersonListItemDto) =>
            p.securityStatus === PersonSecurityStatus.Wanted ||
            p.securityStatus === PersonSecurityStatus.WantedAndSuspect,
    ).length;
    const alerts = filteredPersons.filter((p: PersonListItemDto) => p.hasActiveAlert).length;
    const critical = filteredPersons.filter((p: PersonListItemDto) => p.dangerLevel === DangerLevel.Critical).length;

    const clearAllFilters = () => {
        setSearch('');
        setIsActive(undefined);
        setIsDeleted(undefined);
        setSecurityStatus(undefined);
        setDangerLevel(undefined);
        setHasActiveAlert(undefined);
    };

    const columns: ColumnsType<PersonListItemDto> = [
        {
            title: '#',
            dataIndex: 'personId',
            width: 80,
            align: 'center',
            render: (v) => (
                <Text className="mono" style={{ fontSize: 12, color: '#94a3b8' }}>
                    {v}
                </Text>
            ),
        },
        {
            title: 'الشخص',
            key: 'person',
            width: 360,
            render: (_, r) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                        className="person-avatar"
                        style={{
                            background: r.hasActiveAlert ? '#fff1f2' : '#eff6ff',
                            border: `1px solid ${r.hasActiveAlert ? '#fecdd3' : '#bfdbfe'}`,
                        }}
                    >
                        {r.hasActiveAlert ? '🚨' : <UserOutlined style={{ color: '#2563eb', fontSize: 16 }} />}
                    </div>

                    <div style={{ minWidth: 0 }}>
                        <Text strong style={{ fontSize: 13, display: 'block' }}>
                            {r.fullName}
                        </Text>

                        {r.displayName && (
                            <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 2 }}>
                                {r.displayName}
                            </Text>
                        )}

                        <div style={{ marginTop: 6 }}>
                            <Text className="mono" style={{ fontSize: 11 }}>
                                {r.nationalId || '—'}
                            </Text>
                        </div>

                        <div className="person-badge-strip">
                            {r.securityStatus !== undefined && (
                                <Tag color={PersonSecurityStatusColor[r.securityStatus]} className="small-chip">
                                    {PersonSecurityStatusLabel[r.securityStatus]}
                                </Tag>
                            )}

                            {r.hasActiveAlert && (
                                <Tag color="error" className="small-chip">
                                    تعميم فعال
                                </Tag>
                            )}

                            {r.isArmedAndDangerous && (
                                <Tag color="volcano" className="small-chip">
                                    مسلح وخطر
                                </Tag>
                            )}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: 'الجنس',
            dataIndex: 'gender',
            width: 110,
            align: 'center',
            render: (g: Gender) => (
                <Tag color={g === Gender.Male ? 'blue' : 'pink'} className="small-chip">
                    {GenderLabel[g]}
                </Tag>
            ),
        },
        {
            title: 'الصور',
            dataIndex: 'faceImagesCount',
            width: 95,
            align: 'center',
            render: (n) => (
                <Badge count={n} showZero color={n > 0 ? '#2563eb' : '#d1d5db'} style={{ fontSize: 11 }} />
            ),
        },
        {
            title: 'التعرفات',
            dataIndex: 'recognitionCount',
            width: 105,
            align: 'center',
            render: (n) => (
                <Badge count={n} showZero overflowCount={999} color={n > 0 ? '#16a34a' : '#d1d5db'} style={{ fontSize: 11 }} />
            ),
        },
        {
            title: 'الحالة',
            dataIndex: 'isActive',
            width: 120,
            align: 'center',
            render: (v: boolean, r) => (
                <Tag
                    icon={v ? <CheckCircleOutlined /> : <StopOutlined />}
                    color={v ? 'success' : 'default'}
                    style={{ cursor: 'pointer', fontSize: 11, borderRadius: 999 }}
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
            title: 'الإجراءات',
            width: 150,
            align: 'center',
            fixed: 'left',
            render: (_, r) => (
                <Space size={6} className="table-actions" onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="التفاصيل">
                        <Button
                            size="small"
                            type="primary"
                            icon={<EyeOutlined />}
                            onClick={() => navigate(`/persons/${r.personId}`)}
                        />
                    </Tooltip>

                    <Tooltip title="سجل التعرف">
                        <Button
                            size="small"
                            icon={<CameraOutlined />}
                            onClick={() => navigate(`/recognition/person/${r.personId}`)}
                        />
                    </Tooltip>

                    <Popconfirm
                        title="تأكيد الحذف؟"
                        okText="نعم"
                        cancelText="لا"
                        onConfirm={() => deleteMut.mutate(r.personId)}
                    >
                        <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <>

            {ctx}
            <style>{LOCAL_COMPACT_CSS}</style>

            <div className="persons-shell">
                <div className="persons-hero">
                    <div className="persons-hero-inner">
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                            <div className="hero-badge">
                                <TeamOutlined style={{ fontSize: 28, color: '#fff' }} />
                            </div>

                            <div>
                                <Title level={2} style={{ margin: 0, color: '#fff', fontWeight: 900 }}>
                                    قائمة الأشخاص
                                </Title>
                                <Text style={{ color: 'rgba(255,255,255,.86)', fontSize: 13 }}>
                                    إدارة الأشخاص مع الحالة الأمنية والخطورة والتنبيهات وسجل التعرف
                                </Text>
                            </div>
                        </div>

                        <div className="hero-actions">
                            <Button
                                className="hero-btn"
                                icon={<ReloadOutlined spin={isFetching} />}
                                onClick={() => refetch()}
                            >
                                تحديث
                            </Button>

                            <Button
                                className="hero-btn"
                                type="primary"
                                icon={<UserAddOutlined />}
                                onClick={() => navigate('/addperson')}
                            >
                                إضافة شخص
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="persons-compact-stats">
                    <div className="persons-compact-stat-wrap">
                        <StatCard
                            label="إجمالي الأشخاص"
                            value={filteredPersons.length}
                            color="#2563eb"
                            bg="#eff6ff"
                            border="#bfdbfe"
                            icon={<TeamOutlined />}
                        />
                    </div>

                    <div className="persons-compact-stat-wrap">
                        <StatCard
                            label="نشطون"
                            value={active}
                            color="#16a34a"
                            bg="#f0fdf4"
                            border="#bbf7d0"
                            icon={<CheckCircleOutlined />}
                        />
                    </div>

                    <div className="persons-compact-stat-wrap">
                        <StatCard
                            label="مطلوبون"
                            value={wanted}
                            color="#dc2626"
                            bg="#fff5f5"
                            border="#fecaca"
                            icon={<SafetyOutlined />}
                        />
                    </div>

                    <div className="persons-compact-stat-wrap">
                        <StatCard
                            label="تعاميم فعالة"
                            value={alerts}
                            color="#d97706"
                            bg="#fff7ed"
                            border="#fed7aa"
                            icon={<AlertOutlined />}
                        />
                    </div>

                    <div className="persons-compact-stat-wrap">
                        <StatCard
                            label="خطورة حرجة"
                            value={critical}
                            color="#991b1b"
                            bg="#fef2f2"
                            border="#fecaca"
                            icon={<WarningOutlined />}
                        />
                    </div>

                    <div className="persons-compact-stat-wrap">
                        <StatCard
                            label="مشتبه بهم"
                            value={suspects}
                            color="#7c3aed"
                            bg="#faf5ff"
                            border="#ddd6fe"
                            icon={<UserOutlined />}
                        />
                    </div>
                </div>

                <div className="surface-card">
                    <div className="surface-card-head">
                        <Space size={10}>
                            <Title level={4} style={{ margin: 0 }}>
                                سجل الأشخاص
                            </Title>
                            <UserOutlined style={{ color: '#2563eb' }} />
                        </Space>

                        <Text type="secondary" className="table-summary">
                            {filteredPersons.length} شخص
                        </Text>
                    </div>

                    <div className="surface-card-body">
                        <div
                            style={{
                                background: 'var(--app-surface-2)',
                                border: '1px solid var(--app-border)',
                                borderRadius: 18,
                                padding: 14,
                                marginBottom: 16,
                            }}
                        >
                            <div className="filters-row">
                                <div className="filter-item search">
                                    <Input
                                        prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                                        placeholder="بحث بالاسم أو الهوية..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        allowClear
                                    />
                                </div>

                                <div className="filter-item">
                                    <Select
                                        placeholder="الحالة"
                                        allowClear
                                        value={isActive}
                                        onChange={(v) => setIsActive(v as boolean | undefined)}
                                        popupMatchSelectWidth
                                        getPopupContainer={(trigger) => trigger.parentElement!}
                                        options={[
                                            { value: true, label: '✅ نشط' },
                                            { value: false, label: '⛔ غير نشط' },
                                        ]}
                                    />
                                </div>

                                <div className="filter-item">
                                    <Select
                                        placeholder="الحذف"
                                        allowClear
                                        value={isDeleted}
                                        onChange={(v) => setIsDeleted(v as boolean | undefined)}
                                        popupMatchSelectWidth
                                        getPopupContainer={(trigger) => trigger.parentElement!}
                                        options={[
                                            { value: false, label: '👤 غير محذوف' },
                                            { value: true, label: '🗑️ محذوف' },
                                        ]}
                                    />
                                </div>

                                <div className="filter-item">
                                    <Select
                                        placeholder="الحالة الأمنية"
                                        allowClear
                                        value={securityStatus}
                                        onChange={(v) => setSecurityStatus(v as PersonSecurityStatus | undefined)}
                                        popupMatchSelectWidth
                                        getPopupContainer={(trigger) => trigger.parentElement!}
                                        options={securityOptions}
                                    />
                                </div>

                                <div className="filter-item">
                                    <Select
                                        placeholder="الخطورة"
                                        allowClear
                                        value={dangerLevel}
                                        onChange={(v) => setDangerLevel(v as DangerLevel | undefined)}
                                        popupMatchSelectWidth
                                        getPopupContainer={(trigger) => trigger.parentElement!}
                                        options={dangerOptions}
                                    />
                                </div>

                                <div className="filter-item">
                                    <Select
                                        placeholder="التعميم"
                                        allowClear
                                        value={hasActiveAlert}
                                        onChange={(v) => setHasActiveAlert(v as boolean | undefined)}
                                        popupMatchSelectWidth
                                        getPopupContainer={(trigger) => trigger.parentElement!}
                                        options={[
                                            { value: true, label: '🚨 فعّال' },
                                            { value: false, label: '— بلا تعميم' },
                                        ]}
                                    />
                                </div>

                                <div className="filter-item" style={{ flex: '0 0 150px', minWidth: 150 }}>
                                    <Button onClick={clearAllFilters}>
                                        مسح الفلاتر
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="person-table">
                            <Table<PersonListItemDto>
                                columns={columns}
                                dataSource={filteredPersons}
                                rowKey="personId"
                                loading={isLoading}
                                size="middle"
                                rowClassName={(r) =>
                                    `person-row${r.dangerLevel === DangerLevel.Critical
                                        ? ' critical'
                                        : r.hasActiveAlert
                                            ? ' alert'
                                            : ''
                                    }`
                                }
                                onRow={(r) => ({
                                    onClick: () => navigate(`/persons/${r.personId}`),
                                    style: { cursor: 'pointer' },
                                })}
                                pagination={{
                                    pageSize: 15,
                                    showSizeChanger: true,
                                    pageSizeOptions: ['10', '15', '30', '50'],
                                    showTotal: (total) => <Text type="secondary">المجموع: {total}</Text>,
                                }}
                                scroll={{ x: 1080 }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
