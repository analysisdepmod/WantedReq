import { useCallback, useEffect, useState } from "react";
import { CountryList, OfficerInfoDto, RankList, RuleList } from "../../Interfaces/GeneralInterface";
import { DeleteFilled, EditFilled, PlusOutlined, UsergroupDeleteOutlined } from "@ant-design/icons";
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

const ListofficerInfo = () => {
    const [officerInfo, SetofficerInfo] = useState<OfficerInfoDto[]>([]);
    const [filter, Setfilter] = useState<OfficerInfoDto[]>([]);
    const [rank, setrank] = useState<RankList[]>([]);
    const [country, setcountry] = useState<CountryList[]>([]);
    const [rule, SetRule] = useState<RuleList[]>([]);
    const { t } = useTranslation();
    const { arlang, dir } = useSelector((state: RootState) => state.setting);
    const { postState } = useSelector((state: RootState) => state.modal);
    const dispatch = useDispatch<AppDispatch>();
    const { userRoles } = useSelector((state: RootState) => state.auth.loginResponse);
    const Tarmez: boolean = userRoles?.includes(RULES.Tarmez);
    useEffect(() => {
        axios.get("/OfficerInfoes")
            .then(res => {
                SetofficerInfo(res.data);
                Setfilter(res.data);
            });
    }, [postState]);

  

    const GetRankList = useCallback( () => {
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
    },[arlang]);

    const GetCountryList = useCallback(() => {
        axios.get('/OfficerInfoes/GetCountryList')
            .then(res => {
                setcountry(res.data);
                if (!arlang) {
                    setcountry(res.data.map((i: CountryList) => ({
                        label: i.labelEn,
                        value: i.value
                    })));
                }
            });
    },[arlang]);

    const GetRuleList =useCallback( () => {
        axios.get('/OfficerInfoes/GetRuleList')
            .then(res => {
                SetRule(res.data);
                if (!arlang) {
                    SetRule(res.data.map((i: RuleList) => ({
                        label: i.labelEn,
                        value: i.value
                    })));
                }
            });
    }, [arlang]);

    useEffect(() => {
        GetRankList();
        GetCountryList();
        GetRuleList();
    }, [GetCountryList, GetRankList, GetRuleList, arlang]);

    const addOfficer = () => {
        dispatch(SetError());
        dispatch(setModal({
            isOpen: true, content: <CreateUpdate ranks={rank} country={country} rule={rule} record={{ id: 0 } as OfficerInfoDto} />, Width: 600, title: "اضافة جديد"
        }));
    };

    const deleteOfficer = (row: OfficerInfoDto) => {
        dispatch(SetError());
        dispatch(setModal({
            modalIcon: <DeleteFilled style={{ color: 'red' }} />,
            isOpen: true, content: <Delete {...row} />, Width: 600, title: " حذف"
        }));
    };

    const updateOfficer = (row: OfficerInfoDto) => {
        dispatch(SetError());
        dispatch(setModal({
            modalIcon: <EditFilled style={{ color: 'green' }} />,
            isOpen: true, content: <CreateUpdate rule={rule} ranks={rank} country={country} record={row} />, Width: 600, title: " تعديل"
        }));
    };

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        const filteredItems: OfficerInfoDto[] = officerInfo.filter(item =>
            item.name.toLowerCase().includes(event.target.value.toLowerCase()) ||
            item.nameEn.toLowerCase().includes(event.target.value.toLowerCase())
        );
        Setfilter(filteredItems);
    };

    return (
        <Row dir={dir}>
            <Row className="sticky-top box-sh">
                <Space className="w-100" size='middle' style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h5><UsergroupDeleteOutlined /> {t('nmpresentatives')}</h5>
                    <Button ghost={false} iconPosition={"end"} shape="default" size="small" type="primary" onClick={addOfficer}>
                        <span>{t('add')}</span>
                        <PlusOutlined />
                    </Button>
                </Space>
            </Row>
            <Row style={{ marginTop: "1em"}}>
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
                        pagination={{ pageSize: 10 }}
                        renderItem={(item: OfficerInfoDto) => (
                            <List.Item
                             
                                key={item.id}
                                className="officer-info-item m-2 p-2"
                                actions={[
                                    <Button onClick={() => updateOfficer(item)} className="btn-border-edit">
                                        <EditFilled className="edit-icon" />
                                    </Button>,
                                    !Tarmez && (
                                        <Button onClick={() => deleteOfficer(item)} className="btn-border-delet">
                                            <DeleteFilled className="delete-icon" />
                                        </Button>
                                    )
                                ]}
                                
                            >
                                <List.Item.Meta
                                    avatar={<div className="sort-circle">{item.sort}</div>}
                                    description={
                                        <div className="m-2">
                                        
                                            <div className="officer-detail">
                                                <span className="label">{t("rankName")} : </span>
                                                <span className="officer-all" > {DataIndexValue(arlang, "rankName", item)}</span>
                                            </div>
                                            <div className="officer-detail">
                                                <span className="label">{t("fullName")} : </span>
                                                <span className="officer-all"> {item.active ? DataIndexValue(arlang, "name", item) : <mark>{DataIndexValue(arlang, "name", item)}</mark>}</span> 
                                                 
                                            </div>
                                            <div className="officer-detail">
                                                <span className="label">{t("position")} : </span>
                                                <span className="officer-all">{DataIndexValue(arlang, "position", item)}</span>
                                            </div>
                                            <div className="officer-detail">
                                                <span className="label">{t("CountryName")} : </span>
                                                <span className="officer-all">{DataIndexValue(arlang, "countryName", item)}</span>
                                            </div>
                                            <div className="officer-detail">
                                                <span className="label">{t("Validity")} : </span>
                                                <span className="officer-all">{DataIndexValue(arlang, "ruleOfficerMinistryName", item)}</span>
                                            </div>
                                            <div className="officer-detail">
                                                <span className="label">{t("Actingperiod")} : </span>
                                                <span className="officer-all">{t("from")}  {item.from.toLocaleString().split('T')[0]}   {t("to")}  {item.to.toLocaleString().split('T')[0]}</span>
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

export default ListofficerInfo;
