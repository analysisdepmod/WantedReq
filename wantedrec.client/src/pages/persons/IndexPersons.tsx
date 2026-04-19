import { Table, Input, Button, Tag, Space, Card, Typography, Popconfirm, message, Tooltip, Badge, Divider } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import type { ColumnsType } from 'antd/es/table';
import {
    UserAddOutlined, SearchOutlined, EyeOutlined,
    DeleteOutlined, CheckCircleOutlined, StopOutlined,
} from '@ant-design/icons';
import { getPersons, deletePerson } from '../../api/personsApi';
import type { PersonListItemDto } from '../../types/person.types';
import { Gender } from '../../types/person.types';

const { Title } = Typography;

export default function IndexPersons() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [messageApi, contextHolder] = message.useMessage();
    const [search, setSearch] = useState('');
    const [isActive, setIsActive] = useState<boolean | undefined>(undefined);

    const [isDeleted, setIsDeleted] = useState<boolean | undefined>(undefined);

    // ── Fetch ────────────────────────────────────────────────
    const { data: persons = [], isLoading } = useQuery({
        queryKey: ['persons', search, isActive, isDeleted],
        queryFn: () => getPersons({ search: search || undefined, isActive, isDeleted }),
    });

    const setAll = () => {
        setIsDeleted(undefined)
        setIsActive(undefined)
    }
 
    useEffect(() => { console.log(persons) }, [persons])


    // ── Delete ───────────────────────────────────────────────
    const { mutate: handleDelete } = useMutation({
        mutationFn: deletePerson,
        onSuccess: () => {
            messageApi.success('تم حذف الشخص بنجاح');
            queryClient.invalidateQueries({ queryKey: ['persons'] });
        },
        onError: () => messageApi.error('فشل الحذف'),
    });

    // ── Columns ──────────────────────────────────────────────
    const columns: ColumnsType<PersonListItemDto> = [
        {
            title: '#',
            dataIndex: 'personId',
            width: 70,
            align: 'center',
        },
        {
            title: 'الاسم الكامل',
            dataIndex: 'fullName',
            render: (name: string, record) => (
                <Space>
                    <span style={{ fontWeight: 500 }}>{name}</span>
                    {record.hasSuspectRecord && (
                        <Tag color="red" style={{ fontSize: 11 }}>مشتبه به</Tag>
                    )}
                </Space>
            ),
        },
        {
            title: 'الجنس',
            dataIndex: 'gender',
            width: 90,
            align: 'center',
            render: (g: Gender) => (
                <Tag color={g === Gender.Male ? 'blue' : 'pink'}>
                    {g === Gender.Male ? 'ذكر' : 'أنثى'}
                </Tag>
            ),
        },
        {
            title: 'الهوية',
            dataIndex: 'nationalId',
            width: 130,
            render: (v: string) => v || '—',
        },
        {
            title: 'الصور',
            dataIndex: 'faceImagesCount',
            width: 80,
            align: 'center',
            render: (count: number) => (
                <Badge count={count} showZero color={count > 0 ? '#1677ff' : '#ccc'} />
            ),
        },
        {
            title: 'الحالة',
            dataIndex: 'isActive',
            width: 90,
            align: 'center',
            render: (active: boolean) => (
                <Tag
                    icon={active ? <CheckCircleOutlined /> : <StopOutlined />}
                    color={active ? 'success' : 'default'}
                >
                    {active ? 'نشط' : 'غير نشط'}
                </Tag>
            ),
        },

        {
            title: 'الحذف',
            dataIndex: 'isDeleted',
            width: 90,
            align: 'center',
            render: (deleted: boolean) => (
                <Tag
                    icon={deleted ? <CheckCircleOutlined /> : <StopOutlined />}
                    color={deleted ? 'error' : 'success'}
                >
                    {deleted ? 'محذوف' : 'غير محذوف'}
                </Tag>
            ),
        },


        {
            title: 'الإجراءات',
            width: 120,
            align: 'center',
            render: (_, record) => (
                <Space>
                    <Tooltip title="عرض التفاصيل">
                        <Button
                            type="primary"
                            ghost
                            icon={<EyeOutlined />}
                            size="small"
                            onClick={() => navigate(`/persons/${record.personId}`)}
                        />
                    </Tooltip>
                    <Tooltip title="حذف">
                        <Popconfirm
                            title="هل أنت متأكد من الحذف؟"
                            okText="نعم"
                            cancelText="لا"
                            onConfirm={() => handleDelete(record.personId)}
                        >
                            <Button
                                danger
                                icon={<DeleteOutlined />}
                                size="small"
                            />
                        </Popconfirm>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    // ── Render ───────────────────────────────────────────────
    return (
        <div style={{ padding: 24, direction: 'rtl' }}>
            {contextHolder}

            <Space align="center" style={{ marginBottom: 24 }}>
                <Title level={3} style={{ margin: 0 }}>قائمة الأشخاص</Title>
            </Space>

            <Card style={{ marginBottom: 16 }}>
                <Space wrap>
                    {/* بحث */}
                    <Input
                        placeholder="بحث بالاسم أو الهوية..."
                        prefix={<SearchOutlined />}
                        style={{ width: 250 }}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        allowClear
                    />

         
                    {/* فلتر الحالة */}
                    <Space>
            
                        <Button
                            type={isActive === undefined ? 'primary' : 'default'}
                            onClick={() => setAll()}
                        >
                            الكل
                        </Button>
                        <Button
                            type={isActive === true ? 'primary' : 'default'}
                            onClick={() => setIsActive(prev => prev === true ? undefined : true)}
                        >
                            نشط
                        </Button>
                        <Button
                            type={isActive === false ? 'primary' : 'default'}
                            onClick={() => setIsActive(prev => prev === false ? undefined : false)}
                        >
                            غير نشط
                        </Button>
                        <Button
                            type={isDeleted === true ? 'primary' : 'default'}
                            onClick={() => setIsDeleted(prev => prev === true ? undefined : true)}
                        >
                            محذوف
                        </Button>
                        <Button
                            type={isDeleted === false ? 'primary' : 'default'}
                            onClick={() => setIsDeleted(prev => prev === false ? undefined : false)}
                        >
                            غير محذوف
                        </Button>
                    </Space>

                    <Divider type="vertical" style={{ height: 32 }} />
 



                    <Button
                        type="primary"
                        icon={<UserAddOutlined />}
                        onClick={() => navigate('/addperson')}
                        style={{ marginRight: 'auto' }}
                    >
                        إضافة شخص
                    </Button>
                </Space>
            </Card>

            <Table<PersonListItemDto>
                columns={columns}
                dataSource={persons}
                rowKey="personId"
                loading={isLoading}
                bordered
                size="middle"
                pagination={{
                    pageSize: 10,
                    showTotal: (total) => `المجموع: ${total} شخص`,
                    showSizeChanger: true,
                }}
                onRow={(record) => ({
                    onDoubleClick: () => navigate(`/persons/${record.personId}`),
                    style: { cursor: 'pointer' },
                })}
            />
        </div>
    );
}