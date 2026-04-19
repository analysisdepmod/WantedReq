import { useCallback, useEffect, useState } from "react";
import { DeleteFilled, EditFilled, PlusOutlined, UsergroupDeleteOutlined } from "@ant-design/icons";
import Button from "antd/es/button/button";
import { Col, Row } from "react-bootstrap";
import { List, Space, Input } from "antd";
import Delete from "./Delete";
import { RankList, RuleList, SubMangeMinistrysDto } from "../../Interfaces/GeneralInterface";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../app/store";
import { setModal } from "../../../app/reducers/modalSlice";
import CreateUpdate from "./createUpdate";
import axios from "../../api";
import { SetError } from "../../../app/reducers/craudSlice";
import { useTranslation } from "react-i18next";
import {   DataIndexValue } from "../../Interfaces/functions";
import { RULES } from "../../Interfaces/roles";

const ListSubMangeMinistry = () => {
    const [sub, Setsub] = useState<SubMangeMinistrysDto[]>([]);
    const [filter, Setfilter] = useState<SubMangeMinistrysDto[]>([]);
    const [rank, setrank] = useState<RankList[]>([]);
    const [rule, setRule] = useState<RuleList[]>([]);
    const { t } = useTranslation();
    const { arlang, dir } = useSelector((state: RootState) => state.setting);
    const { postState } = useSelector((state: RootState) => state.modal);
    const dispatch = useDispatch<AppDispatch>();
    const { userRoles } = useSelector((state: RootState) => state.auth.loginResponse);
    const Tarmez: boolean = userRoles?.includes(RULES.Tarmez);
    useEffect(() => {
        axios.get("/SubMangeMinistries")
            .then(data => {
                Setsub(data.data);
                Setfilter(data.data);
            });
    }, [postState]);

    const GetRankList = useCallback(() => {
        axios.get('/OfficerInfoes/GetRankList')
            .then(res => {
                setrank(res.data);
                if (!arlang) {
                    setrank(res.data.map((i: RankList) => ({
                        label: i.labelEn,
                        value: i.value
                    })));
                }
            });
    },[]);

    const GetRuleList = useCallback(() => {
        axios.get('/OfficerInfoes/GetRuleList')
            .then(res => {
                setRule(res.data);
                if (!arlang) {
                    setRule(res.data.map((i: RuleList) => ({
                        label: i.labelEn,
                        value: i.value
                    })));
                }
            });
    },[arlang]);

    useEffect(() => {
        GetRankList();
        GetRuleList();
    }, [GetRankList, GetRuleList, arlang]);

    const addSubMangeMinistry = () => {
        dispatch(SetError());
        dispatch(setModal({
            isOpen: true, content: <CreateUpdate ranks={rank} rule={rule} record={{ id: 0 } as SubMangeMinistrysDto} />, Width: 600, title: "اضافة جديد"
        }));
    };

    const deleteSubMangeMinistry = (row: SubMangeMinistrysDto) => {
        dispatch(SetError());
        dispatch(setModal({
            modalIcon: <DeleteFilled style={{ color: 'red' }} />, 
            isOpen: true, content: <Delete {...row} />, Width: 600, title: " حذف"
        }));
    };

    const updateSubMangeMinistry = (row: SubMangeMinistrysDto) => {
        dispatch(SetError());
        dispatch(setModal({
            modalIcon: <EditFilled style={{ color: 'green' }} />, 
            isOpen: true, content: <CreateUpdate ranks={rank} rule={rule} record={row} />, Width: 600, title: " تعديل"
        }));
    };

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        const filteredItems: SubMangeMinistrysDto[] = sub.filter(item =>
            item.name.toLowerCase().includes(event.target.value.toLowerCase()) || 
            item.nameEn.toLowerCase().includes(event.target.value.toLowerCase())
        );
        Setfilter(filteredItems);
    };

    return (
        <Row dir={dir}>
            <Row className="sticky-top box-sh">
                <Space className="w-100" size='middle' style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h5><UsergroupDeleteOutlined /> {t('modpresentatives')}</h5>
                    <Button ghost={false} iconPosition={"end"} shape="default" size="small" type="primary" onClick={addSubMangeMinistry}>
                        <span>{t('add')}</span>
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
                        className="sub-mange-details"
                        dataSource={filter}
                        pagination={{ pageSize: 10}}  
                        renderItem={(item: SubMangeMinistrysDto) => (
                            <List.Item
                              
                                key={item.id}
                                className="sub-mange-item"
                                actions={[
                                    <Button onClick={() => updateSubMangeMinistry(item)} className="btn-border-edit">
                                        <EditFilled className="edit-icon" />
                                    </Button>,
                                    !Tarmez && (   <Button onClick={() => deleteSubMangeMinistry(item)} className="btn-border-delet">
                                        <DeleteFilled className="delete-icon" />
                                    </Button>
                                    )
                                ]}
                            >
                                <List.Item.Meta
                                      avatar={<div className="sort-circle">{item.sort}</div>}
                                    description={
                                        <div>
                                            <div style={{ display: "flex",  alignItems: "center" }}>    
                                            </div>
                                            <div style={{ display: "flex",   alignItems: "center" }}>
                                                <span className="label">{t("rankName")} : </span>
                                                <span className="officer-all">{DataIndexValue(arlang, "rankName", item)}</span>
                                            </div>
                                            <div style={{ display: "flex",   alignItems: "center" }}>
                                                <span className="label">{t("fullName")} : </span>
                                                <span className="officer-all">{item.active ? DataIndexValue(arlang, "name", item) : <mark>{DataIndexValue(arlang, "name", item)}</mark>}</span>
                                            </div>
                                            <div style={{ display: "flex",   alignItems: "center" }}>
                                                <span className="label">{t("position")} : </span>
                                                <span className="officer-all">{DataIndexValue(arlang, "position", item)}</span>
                                            </div>
                                            <div style={{ display: "flex",   alignItems: "center" }}>
                                                <span className="label">{t("Validity")} : </span>
                                                <span className="officer-all">{DataIndexValue(arlang, "ruleOfficerMinistryName", item)}</span>
                                            </div>
                                            <div style={{ display: "flex" , alignItems: "center" }}>
                                                <span className="label">{t("Actingperiod")} : </span>
                                                <span className="officer-all" >{t("from")}: {item.from.toString().split("T")[0]}   {t("to")}  {item.to.toString().split("T")[0]}</span>
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

export default ListSubMangeMinistry;
