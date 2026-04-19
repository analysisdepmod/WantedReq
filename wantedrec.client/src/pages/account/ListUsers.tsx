
import { Button, Card, Col, Row, Space, Table } from "antd";
import { AddUser,  User } from "../../Interfaces/GeneralInterface";
import { CalendarOutlined, EditFilled, PlusOutlined, } from "@ant-design/icons";
import { setModal } from "../../../app/reducers/dialogSlice";
import { ColumnsType } from "antd/es/table";
import Search from "antd/lib/input/Search";
import Details from "./Details";
import { DialogContent } from "@mui/material";
import { useUsers } from "../../hooks/useUsers";
import { mapUserToAddUser } from "../../Interfaces/functions";
import { CreateLevel } from "../../Interfaces/varaibles";
import { useAllRanks, useAutoComplete, useMangeMinstry } from "../../hooks/useApi";
import UserCreateDialogContent from "./UserCreateDialogContent";

const intialvalue: AddUser = {
    id: "",
    roleWithUserDto: [],
    cisco: 0n,
    email: "",
    hrTest: false,
    personName: "",
    personNo: 0n,
    personPosition: "",
    rankId: 0,
    ur_no: 0,
    unitUser: [],
    createLevel: 0,
    originalUintUser: 0,
}



const Users = () => {
 
    const { data: units} = useAutoComplete();
    const { data: ranks } = useAllRanks();
    const { data: mangeministry } = useMangeMinstry();
  
    const {
        dispatch,
        closedAccountFlag,
        onClose,
        users,
        loading,
        setSearchTerm,
        setFlag,
        usersCounters,
        createUser,
        updateUser,
        deleteUser,
        toggleAccountStatus,
        resetPassword

    } = useUsers();

   

    const handleCreateUser = (user: AddUser) => {
        createUser(user);
    };
    const handleUpdateUser = (user: AddUser) => {
        updateUser(user);
    };

    const addUsers = () => {
      
  
        dispatch(
            setModal(
                {
                    dialogIcon: <PlusOutlined />,
                    isOpen: true,
                    content: <UserCreateDialogContent
                        record={intialvalue}
                        onSubmit={handleCreateUser}
                        createLevel={CreateLevel}
                        units={units}
                        ranks={ranks}
                        mangeministry={mangeministry}
                        loading={loading}
                        onClose={onClose }
                    />,
                    width: 1000,
                    height: 900,
                    title: "Add User"
                })
        );
    };
     
    const updateUsers = (row: AddUser) => {
      
        dispatch(
            setModal(
                {
                    dialogIcon: <PlusOutlined />,
                        isOpen: true,
                        content: < UserCreateDialogContent
                        record = { row }
                        onSubmit = { handleUpdateUser }
                        createLevel = { CreateLevel }
                        units = { units }
                        ranks = { ranks }
                        mangeministry = { mangeministry }
                        loading = { loading }
                        onClose = { onClose }
                /> ,
                    width: 1000,
                    height: 900,
                    title: "Add User"
                })
        );
    };
    const DetailsUsers = (row: User) => {
        dispatch(setModal({
            dialogIcon: <CalendarOutlined />,
            isOpen: true,
            content: (
                <>
                    <DialogContent>
                        <Details
                            record={row}
                            onDelete={(id) => deleteUser(id)}
                            onToggleStatus={(id, isActive) => toggleAccountStatus({ id, isActive })}
                            onResetPassword={(id) => resetPassword(id)}
                            loading={loading}
                            onClose={onClose}
                        />
                    </DialogContent>

                </>
            ),
            width: 700,
            height: 800,
            title: "بيانات المستخدم"
        }));
    };

    const columns: ColumnsType<User> = [
        {

            title: 'id',
            dataIndex: 'id',
            hidden: true
        },
        {

            title: 'ت',
            render: (_, __, i: number) => ++i
        },
        
        {

            title: 'وحدة النظام',
            dataIndex: 'ur_no',
            hidden: true
        },
        {

            title: 'وحدة المستخدم',
            dataIndex: 'originalUintUser',
            hidden: true
        },
        {

            title: 'اخر وحدة للمستخدم قبل التعطيل',
            dataIndex: 'lastOriginalUintUser',
            hidden: true
        },
        {

            title: 'معلومات المستخدم',
            render: (_: number, record: User) => <>
                <p>الرقم الاحصائي : {record.personNo.toString()}</p>
                <p>الرتبة : {record.rankName}</p>
                <p>الاسم :{record.personName}</p>
            </>
        },
        {

            title: 'الاسم الكامل',
            dataIndex: 'personName',
            hidden: true
        },
        {

            title: 'الرقم الاحصائي',
            dataIndex: 'personNo',
            hidden: true
        },
        {

            title: 'الرتبة',
            dataIndex: 'rankName',
            hidden: true


        },
        {

            title: 'الوحدات',
            render: (_: number, record: User) => <>
                <p>وحدة النظام : {record.unitName}</p>
                <p>وحدة المستخدم : {record.originalUintUserName}</p>
                <p>اخر وحدة للمستخدم :{record.lastOriginalUintUserName}</p>
            </>
        },
        {

            title: 'وحدة النظام',
            dataIndex: 'unitName',
            hidden: true
        },
        {

            title: 'وحدة المستخدم',
            dataIndex: 'originalUintUserName',
            hidden: true
        },
        {

            title: 'اخر وحدة للمستخدم قبل التعطيل',
            dataIndex: 'lastOriginalUintUserName',
            hidden: true
        },

        {

            title: 'الحساب',
            dataIndex: 'email',

        },
        {

            title: 'مستوى الادامة',
            dataIndex: 'createLevel',
            hidden:true
        },
        {

            title: 'مستوى الادامة',
            render: (_: number, record: User) => CreateLevel.find(i => i.value === record.createLevel)?.label
        },
        {

            title: 'إضافة  الحساب',
            render: (_: number, record: User) => <>
                <p>{record.created_by}</p>
                <p>{record.created_date.toString().split('T')[0]}</p>
            </>
        },
        {
            dataIndex: 'created_by',
            hidden: true
        },
        {
            dataIndex: 'created_date',
            hidden: true
        },
        {

            title: 'تعديل الحساب',
            render: (_: number, record: User) => <>
                <p>{record.updated_by}</p>
                <p>{record.updated_date.toString().split('T')[0]}</p>
            </>
        },
        {
            dataIndex: 'updated_by',
            hidden: true
        },
        {
            dataIndex: 'updated_date',
            hidden: true
        },

        {

            title: 'حالة الحساب',
            render: (_: number, record: User) => {
                const res = closedAccountFlag.find(i => i.value === record.closedAccountFlag)
                return res ? <>
                    <p>عدد مرات الدخول : {record.loginTimes}</p>
                    <p>اخر تسجيل دخول :  {record.lastLogin.toString().split('T')[0]}</p>
                    <p>{res.label}</p>
                    <p>{record.closedAccountNotc}</p>
                    {record.closedAccountFlag !== 0 && record.closedAccountFlag !== 4 &&
                        <>
                            <p>اغلق من قبل : {record.closedBy}</p>
                            <p>تاريخ الاغلاق {record.closedDate.toString().split('T')[0]}</p>
                        </>
                    }

                </> : null;
            }

        },
        {

            dataIndex: 'loginTimes',
            hidden: true
        },
        {

            dataIndex: 'lastLogin',
            hidden: true
        },
        {

            dataIndex: 'closedAccountFlag',
            hidden: true
        },
        {

            dataIndex: 'closedAccountNotc',
            hidden: true
        },
        {

            dataIndex: 'closedDate',
            hidden: true
        },
        {

            dataIndex: 'closedBy',
            hidden: true
        },
        {

            title: 'مراقبة الموارد ',
            dataIndex: 'hrTest',
            hidden: true
        },
        {

            title: 'العمليات',
            key: 'User',
            render: (_: number, record: User) => (

                <Space size="small">
                    <Button onClick={() => updateUsers(mapUserToAddUser(record))} className="btn-border-edit m-1"><EditFilled className="edit-icon" /></Button>
                    <Button onClick={() => DetailsUsers(record)} className="detail-icon-btn"> <CalendarOutlined className="detail-icon" /> </Button>
                </Space>
            )
        },
    ];

    return (
        <div className="home-page">
            <Row className="sticky-top box-sh mt-2">
                <Space className="w-100" size='middle'
                    style={{ display: 'felx', justifyContent: 'space-between' }}  >
                    <h4 className="text-light"> بيانات المستخدمين</h4>
                    <Button className="btn-btn-add" onClick={addUsers}  >
                        <span> اضافة مستخدم</span>
                        <PlusOutlined />
                    </Button>

                </Space>
            </Row>
            <Row style={{ display: "flex", marginTop: "6px" }}>
                <Col span={10} style={{ marginBottom: "1em" }}>
                    <Search
                        placeholder="بحث..."
                        size="middle"
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </Col>
            </Row>
            <div style={{ padding: '2px' }}>
                <Row gutter={[6, 6]}>
                    {usersCounters?.map((card, index) => (
                        <Col xs={24} sm={12} md={8} lg={8} key={index}>
                            <Card style={{
                                height: '120px',
                                backgroundColor: 'rgba(255, 255, 255, 0.4)',
                                backdropFilter: 'blur(20px)',
                                WebkitBackdropFilter: 'blur(20px)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                                borderRadius: '10px',
                                cursor: 'pointer'
                            }} onClick={() => setFlag(card.id)}>
                                {card.isSummary ? (
                                    <>
                                        <h5 style={{ color: 'black', marginBottom: '6px' }}>{card.title}</h5>
                                        <Row gutter={16}>
                                            {card.data?.map((stat, idx) => (
                                                <Col span={12} key={idx}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                                        {stat.icon}
                                                        <div>
                                                            <div style={{ fontSize: '11px', color: 'black' }}>{stat.label}</div>
                                                            <div style={{ fontWeight: 'bold', fontSize: '18px', color: 'black' }}>{stat.value}</div>
                                                        </div>
                                                    </div>
                                                </Col>
                                            ))}
                                        </Row>
                                    </>
                                ) : (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h5 style={{ color: 'black' }}>{card.title}</h5>
                                            <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'black' }}>{card.count}</p>
                                        </div>
                                        <div>{card.icon}</div>
                                    </div>
                                )}
                            </Card>
                        </Col>
                    ))}
                </Row>
            </div>
            <Row className="mt-3" style={{ marginBottom: '200px', overflowX: 'auto' }}>
                <Col span={24}  >
                    <Table
                        dataSource={users}
                        size="small"
                        className="table table-sm "
                        columns={columns}
                        rowKey="id"
                        loading={loading}

                    />
                </Col>
            </Row>
        </div>
    );

}
export default Users;