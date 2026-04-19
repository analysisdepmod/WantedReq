 
import { Alert, Checkbox, Col, Form, Input, InputNumber, Row } from "antd";

import { IForm } from "./createUpdate";
import CustomButton from "../../compontents/customButton";
import { useSelector } from "react-redux";
import { RootState } from "../../../app/store";
 
import TextArea from "antd/es/input/TextArea";
import { useEffect, useState } from "react";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { CheckboxChangeEvent } from "antd/es/checkbox";
import {   Translate,  TranslateToAR } from "../../Interfaces/functions";
import { useTranslation } from "react-i18next";

  
function NewsForm({ form, onFinish, record, btnLoading }:IForm  ) {
    const { message } = useSelector((state: RootState) => state.craud)
    const [can, setcan] = useState<boolean>(false);

    const { t } = useTranslation();
    const canChange = (e: CheckboxChangeEvent) => {
        setcan(e.target.checked)

    }
    useEffect(() => {
        if (record.id == 0) {
            form.resetFields()
            
            setcan(false);
        }
        else {

            form.setFieldsValue(record)
            setcan(record.can)
      

        }
    }, [form, record])
    return (
        <>

            <Form form={form} initialValues={record} name="trigger" onFinish={onFinish} autoComplete="off" layout="vertical">

                <Row className="m-1">

                    {message.length > 0 ?
                    <Col span={24}>
                       
                            {record.id > 0 ? <Alert type="info" message={message} /> : <Alert type="success" message={message} />}
                        
                        </Col>:null
                    }

                </Row>
                <Row>
                    <Col span={24}>
                        <Form.Item
                            hidden
                            hasFeedback
                            label="ت"
                            name="id"

                        >
                            <InputNumber />
                        </Form.Item>



                    </Col>
                    <Col span={24}>
                        <Form.Item
                            hidden
                            hasFeedback
                            name="applicationUserId"
                            
                        >
                            <Input />
                        </Form.Item>



                    </Col>
                    <Col span={24}>
                        <Row className="d-flex justify-content-between">
                            <Col span={11}>

                                <Form.Item
                                    hasFeedback
                                    label="التفاصيل"
                                    name="details"
                                    validateTrigger="onBlur"
                                    style={{ direction: 'rtl' }}
                                >
                                    <TextArea style={{ resize: "none" }} rows={15} cols={15} onChange={e => Translate(e , form)} placeholder="تفاصيل التبليغ"> </TextArea>
                                </Form.Item>
                            </Col>
                            <Col span={11}>

                                <Form.Item
                                    hasFeedback
                                    label="Details"
                                    name="detailsEn"
                                    validateTrigger="onBlur"
                                    style={{ direction: 'ltr' }}
                                >
                                    <TextArea style={{ resize: "none" }} rows={15} cols={15} onChange={e => TranslateToAR(e, form)} placeholder="Details"> </TextArea>
                                </Form.Item>
                            </Col>
                        </Row>

                    </Col>
                   

                    <Col span={24}>

                        <Form.Item
                            hasFeedback
                            label={t("ShowNews")}
                            name="can"
                            valuePropName="checked"
                            validateTrigger="onBlur"
                            
                        >
                            <Checkbox onChange={canChange} >
                                {can ? <p> <CheckOutlined style={{ fontSize: '22px', color: 'green' }} /> نعم </p> : <p>  <CloseOutlined style={{ fontSize: '22px', color: 'red' }} /> كلا </p>}
                            </Checkbox>
                        </Form.Item>
                    </Col>
              
                    <Col span={24}>

                        <Form.Item
                            hasFeedback
                            name="canAll"
                            valuePropName="checked"
                            validateTrigger="onBlur"
                           hidden
                        >
                            <Input type="checkbox" />
                        </Form.Item>
                    </Col>

                    <Col span={24} className="text-center">
                        <CustomButton flag={1} btnLoading={btnLoading } / >

                    </Col>

                </Row>
            </Form>
        </>
    )


}

export default NewsForm;