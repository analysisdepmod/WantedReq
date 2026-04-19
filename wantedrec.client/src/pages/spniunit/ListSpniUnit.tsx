import { useEffect, useState } from "react";
import { SpiUnitDTO } from "../../Interfaces/GeneralInterface";
import { CheckOutlined, CloseOutlined, DeleteFilled, EditFilled, PlusOutlined, GoldOutlined } from "@ant-design/icons";
import Button from "antd/es/button/button";
import { Col, Row } from "react-bootstrap";
import { List, Space, Input } from "antd";
import axios from "../../api";
import Delete from "./Delete";
import { AppDispatch, RootState } from "../../../app/store";
import { useDispatch, useSelector } from "react-redux";
import { setModal } from "../../../app/reducers/modalSlice";
import CreateUpdate from "./createUpdate";
import { SetError } from "../../../app/reducers/craudSlice";
import { useTranslation } from "react-i18next";
import { DataIndexValue } from "../../Interfaces/functions";
import { RULES } from "../../Interfaces/roles";

const intialvalue: SpiUnitDTO = {
    id: 0,
    bgColor: "",
    canAdd: false,
    ur_no: 0,
    color: "",
    active: false,
    name: "",
    nameEn: "",
    sort: 0,
    id1: 0,
}

const ListSpniUnit = () => {
    const [SpniUnit, SetSpniUnit] = useState<SpiUnitDTO[]>([]);
    const [filter, Setfilter] = useState<SpiUnitDTO[]>([]);
    const { t } = useTranslation();
    const { arlang, dir } = useSelector((state: RootState) => state.setting);
    const { postState } = useSelector((state: RootState) => state.modal);
    const dispatch = useDispatch<AppDispatch>();
    const { userRoles } = useSelector((state: RootState) => state.auth.loginResponse);
    const Tarmez: boolean = userRoles?.includes(RULES.Tarmez);
    useEffect(() => {
        axios.get("/SpiUnits")
            .then(data => {
                SetSpniUnit(data.data);
                Setfilter(data.data);
            });
    }, [postState]);

    const addSpniUnit = () => {
        dispatch(SetError())
        dispatch(setModal({
            isOpen: true, content: <CreateUpdate {...intialvalue} />, Width: 600, title: "اضافة جديد"
        }))
    };

    const deleteSpniUnit = (row: SpiUnitDTO) => {
        dispatch(SetError())
        dispatch(setModal({
            modalIcon: <DeleteFilled style={{ color: 'red' }} />,
            isOpen: true, content: <Delete {...row} />, Width: 600, title: " حذف"
        }))
    };

    const updateSpniUnit = (row: SpiUnitDTO) => {
        dispatch(SetError())
        dispatch(setModal({
            modalIcon: <EditFilled style={{ color: 'green' }} />,
            isOpen: true, content: <CreateUpdate {...row} />, Width: 600, title: " تعديل"
        }))
    };

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        const filteredItems: SpiUnitDTO[] = SpniUnit.filter(item =>
            item.name?.toLowerCase().includes(event.target.value.toLowerCase()) ||
            item.nameEn?.toLowerCase().includes(event.target.value.toLowerCase())
        );
        Setfilter(filteredItems);
    };

    return (
        <Row dir={dir}>
            <Row className="sticky-top box-sh">
                <Space className="w-100" size='middle' style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h5><GoldOutlined /> {t('commonunitsinthesystem')}</h5>
                    <Button ghost={false} iconPosition={"end"} shape="default" size="small" type="primary" onClick={addSpniUnit}>
                        <span>{t("add")}</span>
                        <PlusOutlined />
                    </Button>
                </Space>
            </Row>
            <Row style={{ marginTop: "1em" }}>
                <Col span={24}>
                    <Input
                        placeholder={t("Search")}
                        size="middle"
                        onChange={handleSearch}
                        className="w-100"
                    />
                </Col>
            </Row>
            <Row className="mt-3" style={{ marginBottom: '200px', overflowX: 'auto' }}>
                <Col span={24}>
                    <List
                        className="unit-details"
                        dataSource={filter}
                        pagination={{ pageSize: 10 }}  
                        renderItem={(item: SpiUnitDTO) => (
                            <List.Item
                                key={item.id}
                                className="wantedrec-unit-item"
                                actions={[
                                    <Button onClick={() => updateSpniUnit(item)} className="btn-border-edit">
                                        <EditFilled className="edit-icon" />
                                    </Button>,
                                    !Tarmez && (  <Button onClick={() => deleteSpniUnit(item)} className="btn-border-delet">
                                        <DeleteFilled className="delete-icon" />
                                    </Button>
                                    )
                                ]}
                            >
                                <List.Item.Meta
                                    avatar={<div className="sort-circle">{item.sort}</div>}
                                    description={
                                        <div style={{ display: "flex", flexDirection: "column" }}>
                                            <div style={{ display: "flex", alignItems: "center" }}>
                                                <span className="label">{t("unitName")} : </span>
                                                <span className="officer-all">{item.active ? DataIndexValue(arlang, "name", item) : <mark>{item.name}</mark>}</span>
                                            </div>
                                            <div style={{ display: "flex"  }}>
                                                <span className="label">{t("canAdd")} : </span>
                                                <span className="officer-all">{item.canAdd ? <CheckOutlined style={{ fontSize: '22px', color: 'green' }} /> : <CloseOutlined style={{ fontSize: '22px', color: 'red' }} />}</span>
                                            </div>
                                            <div style={{ display: "flex"  }}>
                                                <span className="label">{t("active")} : </span>
                                                <span className="officer-all">{item.active ? <CheckOutlined style={{ fontSize: '22px', color: 'green' }} /> : <CloseOutlined style={{ fontSize: '22px', color: 'red' }} />}</span>
                                            </div>
                                        </div>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                </Col>
            </Row>
        </Row>
    );
};

export default ListSpniUnit;
