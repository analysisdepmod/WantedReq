import { useEffect, useState } from "react";
import { DeleteFilled, PlusOutlined, PictureOutlined } from "@ant-design/icons";
import Button from "antd/es/button/button";
import { Col, Row } from "react-bootstrap";
import { List, Space } from "antd";
import Delete from "./Delete";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../app/store";
import { setModal } from "../../../app/reducers/modalSlice";
import axios from "../../api";
import { SetError } from "../../../app/reducers/craudSlice";
import { Images } from "../../Interfaces/GeneralInterface";
 
import { useTranslation } from "react-i18next";
import FormFile from "./fromFile";
 
const ListImage = () => {
    const [image, Setimage] = useState<Images[]>([]);
    const { t } = useTranslation();
    const { postState } = useSelector((state: RootState) => state.modal);
    const { arlang } = useSelector((state: RootState) => state.setting);
    const dispatch = useDispatch<AppDispatch>();

    useEffect(() => {
        axios.get("/Images")
            .then(data => Setimage(data.data));
    }, [postState]);

    const addimage = () => {
        dispatch(SetError());
        dispatch(setModal({
            isOpen: true, content: <FormFile />, Width: 500, title: "اضافة جديد"
        }));
    };

    const deleteimage = (row: Images) => {
        dispatch(SetError());
        dispatch(setModal({
            modalIcon: <DeleteFilled style={{ color: 'red' }} />, isOpen: true, content: <Delete {...row} />, Width: 500, title: " حذف"
        }));
    };

    return (
        <Row>
            <Row className="sticky-top box-sh">
                <Space className="w-100" size='middle' style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h5> <PictureOutlined /> {t('maintainthephotogallery')}</h5>
                    <Button ghost={false} iconPosition={"end"} shape="default" size="small" type="primary" onClick={addimage}>
                        <span>{t('add')}</span>
                        <PlusOutlined />
                    </Button>
                </Space>
            </Row>
            <Row className="mt-3" style={{ marginBottom: '200px', overflowX: 'auto' }}>
                <Col span={24}>
                    <List
                        className="image-details"
                        dataSource={image}
                        renderItem={(item: Images) => (
                            <List.Item
                                key={item.id}
                                className="image-item"
                                actions={[
                                    <Button onClick={() => deleteimage(item)} className="btn-border-delet">
                                        <DeleteFilled className="delete-icon" />
                                    </Button>
                                ]}
                            >
                                <List.Item.Meta
                                    avatar={<div className="sort-circle">{item.sort}</div>}
                                    description={
                                        <>
                                      
                                            <p><strong className="label">{`${t("imageName")}:`}</strong> { item.name  }</p>
                                            <p><strong className="label">{`${t("howAddedImage")}:`}</strong> {item.userName}</p>
                                            <p><strong className="label">{`${t("imageDate")}:`}</strong> {item.createdDate.toString().split('T')[0]}</p>
                                            <p><strong className="label">{`${t("description")}:`}</strong> {arlang ? item.description : item.descriptionEn}</p>
                                            <p><strong className="label">{`${t("color")}:`}</strong> <input type="color" defaultValue={item.color} disabled className="color-input" /></p>
                                        </>
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

export default ListImage;
