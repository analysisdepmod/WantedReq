
import { Alert, Checkbox, Col, Form, Input, DatePicker, Row, Select } from "antd";

import { IForm } from "./createUpdate";
import CustomButton from "../../compontents/customButton";
import { useSelector } from "react-redux";
import { RootState } from "../../../app/store";
import { validateArabicName, validateArabicPosition, validateEnPostion } from "../validate";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { CheckboxChangeEvent } from "antd/es/checkbox";
import { OfficerInfoDto } from "../../Interfaces/GeneralInterface";
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useTranslation } from "react-i18next";
import { Translate, TranslateToAR } from "../../Interfaces/functions";


function OfficerInfoform({ form, onFinish, record, btnLoading }: IForm) {
    const { message } = useSelector((state: RootState) => state.craud)
    const [ch, setCh] = useState<boolean>(false);
    const { RangePicker } = DatePicker;
    const { t } = useTranslation();
    const { dir, arlang } = useSelector((state: RootState) => state.setting);
    const ChChange = (e: CheckboxChangeEvent) => {
        setCh(e.target.checked)

    }
    useEffect(() => {
        if ((record.record.id == 0)) {
            form.setFieldsValue({} as OfficerInfoDto)

            setCh(false);
        }
        else {

            form.setFieldsValue(record)
            setCh(record.record.active)

        }
    }, [form, record])



    const onRangeChange = (dates: null | (Dayjs | null)[], dateStrings: string[]) => {
        if (dates) {

            form.setFieldValue("from", dateStrings[0])
            form.setFieldValue("to", dateStrings[1])
        } else {
            console.log('Clear');
        }
    };





    return (
        <>

            <Form form={form} initialValues={record} name="trigger" onFinish={onFinish} autoComplete="off" layout="vertical">

                <Row className="m-1">

                    {message.length > 0 ?
                        <Col span={24}>

                            {record.record.id > 0 ? <Alert type="info" message={message} /> : <Alert type="success" message={message} />}

                        </Col> : null
                    }

                </Row>
                <Row>
                    <Col span={24}>
                        <Form.Item
                            hidden
                            hasFeedback
                            label={t("id")}
                            name="id"
                        >
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col span={24} className="d-flex justify-content-between">

                        <Form.Item
                            hasFeedback
                            label="الاسم الكامل"
                            name="name"
                            validateTrigger="onBlur"
                            
                            rules={[

                                { validator: validateArabicName }
                            ]}
                            className="w-50"
                            style={arlang ? { marginLeft: '20px' } : { marginRight: '20px', direction: 'rtl' }}
                        >
                            <Input placeholder="الاسم الكامل" onChange={e => Translate(e, form)} />
                        </Form.Item>
                        <Form.Item
                            hasFeedback
                            label="Full Name"
                            name="nameEn"
                            validateTrigger="onBlur"
                            style={{ direction: 'ltr' }}
                            className="w-50"
                        >
                            <Input placeholder="Full Name" onChange={e => TranslateToAR(e, form)} />
                        </Form.Item>
                    </Col>
                    <Col span={24} className="d-flex">

                        <Form.Item
                            hasFeedback
                            label="المنصب"
                            name="position"
                            validateTrigger="onBlur"
                            rules={[

                                { validator: validateArabicPosition }
                            ]}
                            className="w-50"
                            style={arlang ? { marginLeft: '20px' } : { marginRight: '20px', direction: 'rtl' }}
                        >
                            <Input placeholder="المنصب" onChange={e => Translate(e, form)} />
                        </Form.Item>
                        <Form.Item
                            hasFeedback
                            label="Position"
                            name="positionEn"
                            validateTrigger="onBlur"
                            style={{ direction: 'ltr' }}
                            rules={[

                                { validator: validateEnPostion }
                            ]}
                            className="w-50"
                        >
                            <Input placeholder="Position" onChange={e => TranslateToAR(e, form)} />
                        </Form.Item>

                    </Col>
                    <Col span={24}>
                        <Form.Item
                            hasFeedback
                            label={t("rankName")}
                            name="rankId"
                            validateTrigger="onBlur"
                        >
                            <Select options={record.ranks} placeholder={t("rankName")} />
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item
                            hasFeedback
                            label={t("order")}
                            name="sort"
                        >
                            <Input placeholder={t("order")} />
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item
                            hasFeedback
                            label={t("CountryName")}
                            name="countryId"
                            validateTrigger="onBlur"
                        >
                            <Select options={record.country} />
                        </Form.Item>

                    </Col>
                    <Col span={24}>
                        <Form.Item
                            hasFeedback
                            label={t("Validity")}
                            name="ruleOfficerMinistryId"
                            validateTrigger="onBlur"
                        >
                            <Select options={record.rule} />
                        </Form.Item>

                    </Col>

                    <Col span={24} className="mb-2">
                        <label>{t("Actingperiod")}</label>
                        <div dir={dir} className="d-flex justify-content-between w-100">
                            <RangePicker className="w-100" defaultValue={[dayjs(record.record.from), dayjs(record.record.to)]} placeholder={[t('StartDate'), t('EndDate')]} onChange={onRangeChange}
                            />
                        </div>



                        <Form.Item
                            label={t("from")}
                            validateTrigger="onBlur"
                            name="from"
                            hidden
                        >
                            <Input type="date" />
                        </Form.Item>

                        <Form.Item
                            label={t("to")}
                            name="to"
                            validateTrigger="onBlur"
                            hidden
                        >
                            <Input type="date" />
                        </Form.Item>
                    </Col>
                    <Col span={24}>

                        <Form.Item
                            hasFeedback
                            label={t("status")}
                            name="active"
                            valuePropName="checked"
                            validateTrigger="onBlur"
                        >
                            <Checkbox onChange={ChChange}>
                                {ch ? <p> <CheckOutlined style={{ fontSize: '22px', color: 'green' }} /> {t('active')} </p> : <p>  <CloseOutlined style={{ fontSize: '22px', color: 'red' }} /> {t('unactive')} </p>}
                            </Checkbox>

                        </Form.Item>
                    </Col>

                    <Col span={24} className="text-center">
                        <CustomButton flag={record.record.id === 0 ? 1 : 2} btnLoading={btnLoading} />

                    </Col>

                </Row>
            </Form>
        </>
    )


}

export default OfficerInfoform;