import { useEffect, useState } from "react";
import { TargetsMangeMinistryDto } from "../../Interfaces/GeneralInterface";
import { EditFilled , GoldOutlined } from "@ant-design/icons";
import Button from "antd/es/button/button";
import { Col, Row } from "react-bootstrap";
import { List, Space, Input } from "antd";
import axios from "../../api";
import { AppDispatch, RootState } from "../../../app/store";
import { useDispatch, useSelector } from "react-redux";
import { setModal } from "../../../app/reducers/modalSlice";
import CreateUpdate from "./createUpdate";
import { SetError } from "../../../app/reducers/craudSlice";
import { useTranslation } from "react-i18next";
 

const ListTargetsMangeMinistry = () => {
    const [TargetsMangeMinistry, SetTargetsMangeMinistry] = useState<TargetsMangeMinistryDto[]>([]);
    const [filter, Setfilter] = useState<TargetsMangeMinistryDto[]>([]);
    const { t } = useTranslation();
    const { arlang, dir } = useSelector((state: RootState) => state.setting);
    const { postState } = useSelector((state: RootState) => state.modal);
    const dispatch = useDispatch<AppDispatch>();
    
    useEffect(() => {
        axios.get("/TargetsMangeMinistry/GetTargetsManage")
            .then(data => {
                SetTargetsMangeMinistry(data.data);
                Setfilter(data.data);
            });
    }, [postState]);

    const updateSpniUnit = (row: TargetsMangeMinistryDto) => {
        dispatch(SetError());
        dispatch(setModal({
          /*  modalIcon: <EditFilled style={{ color: 'green' }} />,*/
            isOpen: true,
            content: <CreateUpdate {...row} />,
            Width: 500,
            //title: arlang ? "تعديل" : "Edit"
        }));
    };
    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        const searchTerm = event.target.value.toLowerCase();

        const filteredItems: TargetsMangeMinistryDto[] = TargetsMangeMinistry.filter(item =>
            (item.mangeMinistryName?.toLowerCase().includes(searchTerm) ?? false) ||
            (item.mangeMinistryNameEn?.toLowerCase().includes(searchTerm) ?? false) ||
            (item.targetsMangeMinistryList?.some(t =>
                (t.label?.toLowerCase().includes(searchTerm) ?? false) ||
                (t.labelEn?.toLowerCase().includes(searchTerm) ?? false)
            ) ?? false)
        );

        Setfilter(filteredItems);
    };


    

    return (
        <Row dir={dir}>
            <Row className="sticky-top box-sh">
                <Space className="w-100" size='middle' style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h5> <GoldOutlined /> {t('assignunitobjectives')}</h5>
                </Space>
            </Row>
            <Row style={{ marginTop: "1em"  }}>
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
                        className="target-details"
                        dataSource={filter}
                        pagination={{ pageSize: 10 }}
                        renderItem={(item: TargetsMangeMinistryDto) => (
                            <List.Item
                                key={item.id}
                                className="target-item"
                                actions={[
                                    <Button onClick={() => updateSpniUnit({ ...item, targetsList: item.targetsMangeMinistryList.map(i => i.value) })} className="btn-border-edit">
                                        <EditFilled className="edit-icon" />
                                    </Button>
                                ]}
                            >

                                <List.Item.Meta
                                
                                    description={
                                        <Row className="w-50">
                                            <Col >
                                                {/* <strong className="label">{t("modpresentative")}   </strong>*/}
                                                <span className="mange-style"> {arlang ? item.mangeMinistryName : item.mangeMinistryNameEn}</span>
                                              
                                            </Col>
                                            <Col>
                                               {/* <strong className="label">{t("unitGoals")} </strong>*/}
                                              
                                            </Col>
                                            <Row>
                                                <Col>
                                                   
                                                </Col>
                                                <Col>
                                                    
                                                        {item.targetsMangeMinistryList.map((subItem) => (
                                                            <span key={subItem.value} className="goal-item p-2 targetmange">
                                                                {subItem.sort} .  {arlang ? subItem.label : subItem.labelEn} 

                                                            </span>
                                                        ))}
                                                    
                                                </Col>
                                            </Row>
                                        
                                        </Row>
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

export default ListTargetsMangeMinistry;
