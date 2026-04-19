
import { AimOutlined, CalendarOutlined, CheckOutlined, CloseOutlined, DeleteFilled, EditFilled, PlusOutlined } from "@ant-design/icons";
import Button from "antd/es/button/button";
import { Col, Row } from "react-bootstrap";
import { List, Space, Input, Collapse } from "antd";
import Delete from "./Delete";
import { TargetDto } from "../../Interfaces/GeneralInterface";
import {  useSelector } from "react-redux";
import {  RootState } from "../../../app/store";
import { DataIndexValue } from "../../Interfaces/functions";
import { useTarget } from "../../hooks/useTarget";
import { DialogContent } from "@mui/material";
import { setModal } from "../../../app/reducers/dialogSlice";
import TargetDialogContent from "./TargetDialogContent";
import { RULES } from "../../Interfaces/roles";



const intialvalue: TargetDto = {
    id: 0,
    pid: 0,
    active: false,
    moshtrak: false,
    name: "",
    nameEn: "",
    sort: 0,
    year: 0,
    mainTarget: true,
    perentTargetId: 0,
    targetScorr: 0,
    subTargets: [],
}

const ListTarget = () => {

    const {
        dispatch,
        t,
        loding,
        setSearchTerm,
        onClose,
        TargetsData,
        createTarget,
        updateTarget,
        deleteTarget,
        isDeletingUser

    } = useTarget();
    const { userRoles } = useSelector((state: RootState) => state.auth.loginResponse);
    const Tarmez: boolean = userRoles?.includes(RULES.Tarmez);

    const { arlang, dir } = useSelector((state: RootState) => state.setting);
   
    const handleCreateTarget = (target: TargetDto) => {
        createTarget(target);
    };
    const handleUpdateTarget = (target: TargetDto) => {
        updateTarget(target);
    };

 

    const addTarget = () => {
        dispatch(
            setModal(
                {
                    dialogIcon: <PlusOutlined />,
                    isOpen: true,
                    content: <TargetDialogContent
                        record={intialvalue}
                        onSubmit={handleCreateTarget}
                        loading={loding} onClose={onClose }  />
 ,
                    width: 1000,
                    height: 900,
                    title: "Add Target"
                })
        );
    };

    const updateTargets = (row: TargetDto) => {

        dispatch(
            setModal(
                {
                    dialogIcon: <PlusOutlined />,
                    isOpen: true,
                    content:<TargetDialogContent
                        record={row}
                        onSubmit={handleUpdateTarget}
                        loading={loding} onClose={onClose }  />
 ,
                    width: 1200,
                    height: 900,
                    title: "Update Target"
                })
        );
    };
    const DeleteTargets = (row: TargetDto) => {
        dispatch(setModal({
            dialogIcon: <CalendarOutlined />,
            isOpen: true,
            content: (
                <>
                    <DialogContent>
                        <Delete
                            record={row}
                            onDelete={(id) => deleteTarget(id)}
                            isDeleting={isDeletingUser}
                            onClose={onClose}
                        />
                    </DialogContent>

                </>
            ),
            width: 300,
            height: 200,
            title: "بيانات  الهدف"
        }));
    };

   

   

    //const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    //    const filteredItems: TargetDto[] = TargetsData.filter(item =>
    //        item.name.toLowerCase().includes(event.target.value.toLowerCase()) ||
    //        item.nameEn.toLowerCase().includes(event.target.value.toLowerCase())
    //    );
      
    //};

    return (
        <Row dir={dir}>
            <Row className="sticky-top box-sh">
                <Space className="w-100" size='middle' style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h5><AimOutlined/>{t('targets')}</h5>
                    <Button ghost={false} iconPosition={"end"} shape="default" size="small" type="primary" onClick={addTarget}>
                        <span>{t('add')}</span>
                        <PlusOutlined />
                    </Button>
                </Space>
            </Row>
            <Row style={{ marginTop: "1em"  }}>
                 
                <Col span={24}>
                <Input
                    placeholder={t("Search")}
                    size="middle"
                        onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-100"
                    />
                </Col>
            </Row>
            <Row className="mt-3" style={{ marginBottom: '200px', overflowX: 'auto' }}>
                <Col span={24}>
                    <List
                        className="target-details" 
                        dataSource={TargetsData}
                        pagination={{ pageSize: 10 }}
                        renderItem={(item: TargetDto) => (
                            <List.Item
                                key={item.id}
                                className="target-item"
                                actions={[
                                    <Button onClick={() => updateTargets(item)} className="btn-border-edit">
                                        <EditFilled className="edit-icon" />
                                    </Button>,
                                    !Tarmez && ( <Button onClick={() => DeleteTargets(item)} className="btn-border-delet">
                                        <DeleteFilled className="delete-icon" />
                                    </Button>
                                    )
                                ]}
                            >
                                <Collapse
                                    className="w-50"
                                    items={[
                                        {
                                            key: item.id.toString(),
                                            label: (
                                                <div className="target-title">
                                                    {item.sort} - {DataIndexValue(arlang, "name", item)}
                                                </div>
                                            ),
                                            children: (
                                                <div className="target-details">
                                                    <div className="target-detail">
                                                        <span className="label">{t("year")}: </span>
                                                        <span>{item.year}</span>
                                                    </div>
                                                    <div className="target-detail">
                                                        <span className="label">{t("moshtrak")}: </span>
                                                        <span>{item.moshtrak ? <CheckOutlined style={{ color: 'green' }} /> : <CloseOutlined style={{ color: 'red' }} />}</span>
                                                    </div>
                                                    <div className="target-detail">
                                                        <span className="label">{t("active")}: </span>
                                                        <span>{item.active ? <CheckOutlined style={{ color: 'green' }} /> : <CloseOutlined style={{ color: 'red' }} />}</span>
                                                    </div>
                                                    {item.subTargets.length > 0 && (
                                                        <div className="sub-targets">
                                                            <List
                                                                dataSource={item.subTargets}
                                                                renderItem={(subItem: TargetDto) => (
                                                                    <List.Item key={subItem.id}>
                                                                        <List.Item.Meta
                                                                            title={
                                                                                <div className="sub-target-title">
                                                                                    {subItem.sort} - {DataIndexValue(arlang, "name", subItem)}
                                                                                </div>
                                                                            }
                                                                            description={
                                                                                <div className="sub-target-details">
                                                                                    <div className="target-detail">
                                                                                        <span className="label">{t("year")}: </span>
                                                                                        <span>{subItem.year}</span>
                                                                                    </div>
                                                                                    <div className="target-detail">
                                                                                        <span className="label">{t("moshtrak")}: </span>
                                                                                        <span>{subItem.moshtrak ? <CheckOutlined style={{ color: 'green' }} /> : <CloseOutlined style={{ color: 'red' }} />}</span>
                                                                                    </div>
                                                                                    <div className="target-detail">
                                                                                        <span className="label">{t("active")}: </span>
                                                                                        <span>{subItem.active ? <CheckOutlined style={{ color: 'green' }} /> : <CloseOutlined style={{ color: 'red' }} />}</span>
                                                                                    </div>
                                                                                </div>
                                                                            }
                                                                        />
                                                                    </List.Item>
                                                                )}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            ),
                                        },
                                    ]}
                                />

                            </List.Item>
                        )}
                    />
                </Col>
            </Row>
        </Row>
    );
};

export default ListTarget;
