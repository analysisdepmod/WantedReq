import { Alert , AutoComplete, Checkbox, Col, Form, Input, Row } from "antd";
import { IForm } from "./createUpdate";
import {  useSelector } from "react-redux";
import {  RootState } from "../../../app/store";
import { useEffect, useState } from "react";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { CheckboxChangeEvent } from "antd/es/checkbox";
import CustomButton from "../../compontents/customButton";
import { SpiUnitAutoComplete, SpiUnitDTO } from "../../Interfaces/GeneralInterface";
import axios from "../../api";
import { useTranslation } from "react-i18next";
import { TranslateWordToEn } from "../../Interfaces/functions";
 

  
function SpniUnitfrom({ form, onFinish, record,   btnLoading   }:IForm  ) {
    const { message } = useSelector((state: RootState) => state.craud)
    const [ch, setCh] = useState<boolean>(false);

    const [cAdd, setcAdd] = useState<boolean>(false);
    const [getval, setgetval] = useState<number>();
    const [Unit, setUnit] = useState<SpiUnitAutoComplete[]>([]);

    const { postState } = useSelector((state: RootState) => state.modal);
    const { t } = useTranslation();
    // { arlang, dir } = useSelector((state: RootState) => state.setting);


    const ChangeUnitSelect = (id: number, text: string) => {
        setgetval(id);
        TranslateWordToEn(text)
            .then((res) =>{
                form.setFieldValue("nameEn", res)
            })
       
     

    }

    const GetSpiAutoComplete = () => {
        axios.get('SpiUnits/GetSpiAutoComplete').then(res => setUnit(res.data))
    }

    const ChChange = (e: CheckboxChangeEvent) => {
        setCh(e.target.checked) 
    }
    const cAddChange = (e: CheckboxChangeEvent) => {
        setcAdd(e.target.checked) 
    }
  
    
    useEffect(() => {
       GetSpiAutoComplete();
    }, [postState]);
 

    useEffect(() => {
        if  (record.id==0) {
            form.setFieldsValue({ ur_no: getval } as SpiUnitDTO)
            setCh(false);
            setcAdd(false);
            }
        else {
            setCh(record.active)
            setcAdd(record.canAdd)
            form.setFieldsValue(record)
          
             }
    }, [form, record, getval])


 

 
    return (
        <>

            <Form form={form} initialValues={record} name="trigger" onFinish={onFinish}  layout="vertical">
                <Row className="m-1">

                    {message.length > 0 ?
                        <Col span={24}>

                            {record.id > 0 ? <Alert type="info" message={message} /> : <Alert type="success" message={message} />}

                        </Col> : null
                    }
                </Row>
                <Row className="m-1">
                    <Col span={24}>
                        <Alert type="info" message={t("messegeinfo")} />
                    </Col>
                </Row>
                <Row>
                    <Col span={24}>
                        <Form.Item
                            hidden
                            hasFeedback
                            label="ت"
                            name="id"

                        >
                            <Input />
                        </Form.Item>
                
                        <Form.Item
                            hasFeedback
                            label="رقم الوحدة"
                            name="ur_no"
                            hidden
                            validateTrigger="onBlur"
                            
                        >
                            <Input placeholder="رقم الوحدة" />
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        {record.ur_no > 0 ?
                            <Row className="d-flex justify-content-between">
                                <Col span={11}>
                                    <Form.Item
                                        hasFeedback
                                        label="اسم الوحدة "
                                        name="name"
                                        validateTrigger="onBlur"
                                        style={{ direction: 'rtl' }}
                                    >
                                        <Input readOnly />
                                    </Form.Item>
                                </Col>
                                <Col span={11}>
                                    <Form.Item
                                        hasFeedback
                                        label="Unit Name"
                                        name="nameEn"
                                        validateTrigger="onBlur"
                                        style={{ direction: 'ltr' }}
                                    >
                                        <Input readOnly />
                                    </Form.Item>
                                </Col>
                            </Row>

                            : null}
                    </Col>

                    {record.ur_no > 0 ? null :
                        <>
                        <Col span={24} className="d-flex flex-column">
                       
                                    <label className="pb-2 ">{t("unitName")} </label>
                                <AutoComplete
                                        className="w-100"
                                        allowClear={true}
                                        onSelect={(e, option) => ChangeUnitSelect(option.key, e)}
                                        style={{ width: 400 }}
                                        options={Unit}
                                        placeholder={t("SearchUnit")}
                                        filterOption={(inputValue, option) =>
                                            option!.value.toString().indexOf(inputValue) !== -1
                                        }
                                    />

                                </Col>
                                <Col span={24}>
                                    <Form.Item
                                        hasFeedback
                                        label="Unit Name"
                                        name="nameEn"
                                    validateTrigger="onBlur"
                                    style={{ direction: 'ltr' }}
                                    >
                                        <Input readOnly />
                                    </Form.Item>
                                </Col>
                           
                        </>
                      
                    }
                    <Col span={24}>

                        <Form.Item
                            hasFeedback
                            label={ t("order")}
                            name="sort"
                            validateTrigger="onBlur"
                            rules={[
                                {
                                    required: true,
                                    message: 'الاسبقية مطلوبة!',
                                },
                                {

                                    pattern: new RegExp(/^\d{1,10}$/),
                                    message: 'يجب ان يحتوي الاسبقية على ارقام فقط!',
                                },
                            ]}
                        >
                            <Input placeholder={t("order")} />
                        </Form.Item>
                    </Col>
                    <Col span={24}>

                        <Form.Item
                            hasFeedback
                            label={t("textColor")}
                            name="color"
                            validateTrigger="onBlur"
                        >
                            <Input type="Color" />

                        </Form.Item>
                    </Col>
                    <Col span={24}>

                        <Form.Item
                            hasFeedback
                            label={t("bgColor")}
                            name="bgColor"

                            validateTrigger="onBlur"
                        >
                            <Input   type="color" />
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
                                {ch ? <p> <CheckOutlined style={{ fontSize: '22px', color: 'green' }} /> {t('active')} </p> : <p>  <CloseOutlined style={{ fontSize: '22px', color: 'red' }} />  { t('unactive')} </p>}
                            </Checkbox>

                        </Form.Item>
                    </Col>
                    <Col span={24}>

                        <Form.Item
                            hasFeedback
                            label={t("canAdd")}
                            name="canAdd"
                            valuePropName="checked"
                            validateTrigger="onBlur"
                        >
                            <Checkbox onChange={cAddChange} >
                                {cAdd ? <p> <CheckOutlined style={{ fontSize: '22px', color: 'green' }} /> {t('active')} </p> : <p>  <CloseOutlined style={{ fontSize: '22px', color: 'red' }} /> { t('unactive')} </p>}
                            </Checkbox>

                        </Form.Item>
                    </Col>
                    <Col span={24} className="text-center">
                        <CustomButton flag={record.id === 0 ? 1 : 2} btnLoading={btnLoading} />
                    </Col>

                </Row>
            </Form>
            </>
    )


}

export default SpniUnitfrom;