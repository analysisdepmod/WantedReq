import { useEffect, useState } from "react";
import { DeleteFilled, PlusOutlined, FilePdfOutlined } from "@ant-design/icons";
import Button from "antd/es/button/button";
import { Col, Row } from "react-bootstrap";
import { List, Space } from "antd";
import Delete from "./Delete";
import { SpniPdf } from "../../Interfaces/GeneralInterface";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../app/store";
import { setModal } from "../../../app/reducers/modalSlice";
import axios from "../../api";
import { SetError } from "../../../app/reducers/craudSlice";
import FromFilePdf from "./fromFilePdf";
import { useTranslation } from "react-i18next";
import { RULES } from "../../Interfaces/roles";

const ListISpniPdf = () => {
    const [Pdf, SetPdf] = useState<SpniPdf[]>([]);
    const { postState } = useSelector((state: RootState) => state.modal);
    const dispatch = useDispatch<AppDispatch>();
    const { arlang } = useSelector((state: RootState) => state.setting);
    const { t } = useTranslation();
    const { userRoles } = useSelector((state: RootState) => state.auth.loginResponse);
    const Tarmez: boolean = userRoles?.includes(RULES.Tarmez);
    useEffect(() => {
        axios.get("/SpniPdfs")
            .then(data => SetPdf(data.data));
    }, [postState]);

    const addPdf = () => {
        dispatch(SetError());
        dispatch(setModal({
            isOpen: true, content: <FromFilePdf />, Width: 500, title: arlang ? "اضافة جديد" : "Add New"
        }));
    };

    const deletepdf = (row: SpniPdf) => {
        dispatch(SetError());
        dispatch(setModal({
            modalIcon: <DeleteFilled style={{ color: 'red' }} />, isOpen: true, content: <Delete {...row} />, Width: 500, title: arlang ? "حذف" : "Delete"
        }));
    };

    return (
        <Row>
            <Row className="sticky-top box-sh">
                <Space className="w-100" size='middle' style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h5> <FilePdfOutlined /> {t('sustainingcontexts')}</h5>
                    <Button ghost={false} iconPosition={"end"} shape="default" size="small" type="primary" onClick={addPdf}>
                        <span>{t("add")}</span>
                        <PlusOutlined />
                    </Button>
                </Space>
            </Row>
            <Row className="mt-3" style={{ marginBottom: '200px', overflowX: 'auto' }}>
                <Col span={24}>
                    <List
                       className="pdf-details" 
                        dataSource={Pdf}
                        renderItem={(item: SpniPdf) => (
                            <List.Item
                                key={item.id}
                                className="pdf-item"
                                actions={[
                                    !Tarmez && (   <Button onClick={() => deletepdf(item)} className="btn-border-delet">
                                        <DeleteFilled className="delete-icon" />
                                    </Button>
                                    )
                                ]}
                            >
                                <List.Item.Meta
                                    avatar={<div className="sort-circle">{item.sort}</div>}
                                    description={
                                        <>
                                            <p><strong className="label">{t("FileName")}: </strong>{arlang ? item.name : item.nameEn}</p>
                                            <p><strong className="label">{t("description")}: </strong>{arlang ? item.description : item.descriptionEn}</p>
                                            <p><strong className="label">{t("color")}: </strong><input type="color" defaultValue={item.color} disabled className="color-input" /></p>
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

export default ListISpniPdf;
