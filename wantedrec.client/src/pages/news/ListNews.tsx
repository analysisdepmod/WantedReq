import { useEffect, useState } from "react";
import { NewsDto } from "../../Interfaces/GeneralInterface";
import { CheckOutlined, CloseOutlined, DeleteFilled, EditFilled, PlusOutlined, BellOutlined } from "@ant-design/icons";
import Button from "antd/es/button/button";
import { Col, Row } from "react-bootstrap";
import { List, Space } from "antd";
import axios from "../../api";
import Delete from "./Delete";
import { AppDispatch, RootState } from "../../../app/store";
import { useDispatch, useSelector } from "react-redux";
import { setModal } from "../../../app/reducers/modalSlice";
import CreateUpdate from "./createUpdate";
import { SetError } from "../../../app/reducers/craudSlice";
import { useTranslation } from "react-i18next";

const intialvalue: NewsDto = {
    id: 0,
    can: false,
    canAll: false,
    details: "",
    detailsEn: "",
    applicationUserId: 'aa',
    id1: 0,
};

const ListNews = () => {
    const [newss, SetNewss] = useState<NewsDto[]>([]);
    const { postState } = useSelector((state: RootState) => state.modal);
    const { arlang, dir } = useSelector((state: RootState) => state.setting);
    const { t } = useTranslation();
    const dispatch = useDispatch<AppDispatch>();

    useEffect(() => {
        axios.get("/News").then(res => SetNewss(res.data));
    }, [postState]);

    const addNews = () => {
        dispatch(SetError());
        dispatch(setModal({
            isOpen: true,
            content: <CreateUpdate {...intialvalue} />,
            Width: 500,
            title: arlang ? "اضافة جديد" : "Add New"
        }));
    };

    const deleteNews = (row: NewsDto) => {
        dispatch(SetError());
        dispatch(setModal({
            modalIcon: <DeleteFilled style={{ color: 'red' }} />,
            isOpen: true,
            content: <Delete {...row} />,
            Width: 800,
            title: arlang ? "حذف" : "Delete"
        }));
    };

    const updateNews = (row: NewsDto) => {
        dispatch(SetError());
        dispatch(setModal({
            modalIcon: <EditFilled style={{ color: 'green' }} />,
            isOpen: true,
            content: <CreateUpdate {...row} />,
            Width: 800,
            title: arlang ? "تعديل" : "Edit"
        }));
    };

    return (
        <Row dir={dir}>
            <Row className="sticky-top box-sh">
                <Space className="w-100" size='middle' style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h5><BellOutlined /> {t('maintainnotifications')}</h5>
                    <Button ghost={false} iconPosition={"end"} shape="default" size="small" type="primary" onClick={addNews}>
                        <span>{t("add")}</span>
                        <PlusOutlined />
                    </Button>
                </Space>
            </Row>
            <Row className="mt-3" style={{ marginBottom: '200px', overflowX: 'auto' }}>
                <Col span={24}>
                    <List
                        dataSource={newss}
                        className="news-details"
                        renderItem={(item: NewsDto) => (
                            <List.Item
                                key={item.id}
                                className="news-item"
                                actions={[
                                    <Button onClick={() => updateNews(item)} className="btn-border-edit">
                                        <EditFilled className="edit-icon" />
                                    </Button>,
                                    <Button onClick={() => deleteNews(item)} className="btn-border-delet">
                                        <DeleteFilled className="delete-icon" />
                                    </Button>
                                ]}
                            >
                                <List.Item.Meta
                                
                                    avatar={<BellOutlined style={{ fontSize: '20px', color: '#1890ff' }} />}
                                    title={arlang ? item.details : item.detailsEn}
                                    description={item.can
                                        ? <CheckOutlined style={{ fontSize: '22px', color: 'green' }} />
                                        : <CloseOutlined style={{ fontSize: '22px', color: 'red' }} />
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

export default ListNews;
