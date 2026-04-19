import { useSelector } from "react-redux"; 
import { useForm } from "antd/es/form/Form";
import { useEffect, useState, useImperativeHandle, forwardRef, ChangeEvent } from "react";
import { TargetDto, TargetScorrDto } from "../../Interfaces/GeneralInterface";
import { RootState } from "../../../app/store";
import {  Translate, TranslateToAR } from "../../Interfaces/functions";
import { Alert, Checkbox, CheckboxChangeEvent, Col, Form, Input, Row, Select, Switch } from "antd";
import { CheckOutlined, CloseOutlined } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { validateTargetScorr } from "../validate";
import { useTargetMain, useYears } from "../../hooks/useApi";
import axios from "../../api";
 
export interface CreateUpdateProps {
    record: TargetDto;
    onSubmit?: (values: TargetDto) => void;
}


const CreateUpdate = forwardRef(({ record, onSubmit }: CreateUpdateProps, ref) => {
   
    const { message } = useSelector((state: RootState) => state.craud)
    const [ch, setCh] = useState<boolean>(false);
    const [typeTagret, SetTypeTaget] = useState<boolean>(true);
    const [form] = useForm();
    const [Moshtrak, setMoshtrak] = useState<boolean>(false);
    const [TargetScorr, setTargetScorr] = useState<TargetScorrDto>({} as TargetScorrDto);
    const { data: years } = useYears();
    const { data: TargetMain } = useTargetMain();
    const { t } = useTranslation();

    useImperativeHandle(ref, () => ({
        submit: () => {
            form.submit();
        },
    }));

    const handleFinish = (values: TargetDto) => {
        onSubmit?.(values);
    };

    useEffect(() => {
        if (record.id == 0) {
            form.resetFields()
            setMoshtrak(false);
            setCh(false);
            SetTypeTaget(record.mainTarget);
        }
        else {

            form.setFieldsValue(record)
            setCh(record.active)
            setMoshtrak(record.moshtrak)
            SetTypeTaget(record.mainTarget);

        }
    }, [form, record])


    const ChChange = (e: CheckboxChangeEvent) => {
        setCh(e.target.checked)

    }

    const MoshtrakChange = (e: CheckboxChangeEvent) => {
        setMoshtrak(e.target.checked)

    }
    const ChangeTypeTarget = (e: boolean) => {
        SetTypeTaget(e);
    }

    useEffect(() => {
        const isEditMode = record && Object.keys(record).length > 0;

        if (isEditMode) {
            // تعديل: تعبئة الفورم بالقيم الموجودة
            form.setFieldsValue(record);
        } else {
            // إضافة: إعادة ضبط الفورم
            form.resetFields();
        }
    }, [form, record]);
    const ComputeScorr = (e: ChangeEvent<HTMLInputElement>) => {

        const pId = form.getFieldValue("perentTargetId");
        const year = form.getFieldValue("year");
        const mainTarget = form.getFieldValue("mainTarget");
        if (!mainTarget) {
            axios.get(`Targets/GetTargetscorr?year=${year}&perentTargetId=${pId}&scorr=${e.target.value} `)
                .then(res => {
                    console.log(res.data)
                    setTargetScorr(res.data)
                })
        }

    }

    const maxValue =
        typeof TargetScorr.mainTargetScorr === 'number' &&
            typeof TargetScorr.sumSubTargetScorr === 'number'
            ? TargetScorr.mainTargetScorr - TargetScorr.sumSubTargetScorr
            : undefined;
    return (
        <>


            <Form key={record?.id || 'new'} form={form} onFinish={handleFinish} autoComplete="off" layout="vertical">

                <Row className="m-1">

                    {message.length > 0 ?
                        <Col span={24}>

                            {record.id > 0 ? <Alert type="info" message={message} /> : <Alert type="success" message={message} />}

                        </Col> : null
                    }
                </Row>
                <Row>
                    <Col span={24}>
                        <Form.Item
                            hasFeedback
                            label={t("targettype")}
                            name="mainTarget"
                            validateTrigger="onBlur"
                            valuePropName="checked"
                        >
                            <Switch checkedChildren={t("main-goal")} unCheckedChildren={t("sub-goal")} onChange={ChangeTypeTarget} />
                        </Form.Item>



                    </Col>

                    <Col span={24} hidden={typeTagret}>
                        <Form.Item
                            hasFeedback
                            label={t("main-goal")}
                            name="perentTargetId"
                            validateTrigger="onBlur"

                        >
                            <Select options={TargetMain} />
                        </Form.Item>


                    </Col>
                    <Col span={24} hidden={!typeTagret}>
                        <Form.Item
                            hasFeedback
                            label={t("year")}
                            name="year"
                            validateTrigger="onBlur"
                        >
                            <Select options={years} getPopupContainer={(triggerNode) => triggerNode.parentNode} />
                        </Form.Item>


                    </Col>
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
                            label="اسم الهدف"
                            name="name"

                            validateTrigger="onBlur"
                            style={{ direction: 'rtl' }}
                            rules={[

                                { validator: validateTargetScorr }
                            ]}
                        >
                            <Input placeholder="اسم الهدف" onChange={e => Translate(e, form)} />
                        </Form.Item>
                        <Form.Item
                            hasFeedback
                            label="Target Name"
                            name="nameEn"

                            validateTrigger="onBlur"
                            style={{ direction: 'ltr' }}
                            rules={[

                                { validator: validateTargetScorr }
                            ]}
                        >
                            <Input placeholder="TargetName" onChange={e => TranslateToAR(e, form)} />
                        </Form.Item>
                        {!typeTagret ? <p>  {t("residual")} : <span className="text-danger">{(TargetScorr.mainTargetScorr - TargetScorr.sumSubTargetScorr).toString() === "NaN" ? "" : TargetScorr.mainTargetScorr - TargetScorr.sumSubTargetScorr}</span></p> : null}

                        <Form.Item
                            hasFeedback
                            label={t("targetScorr")}
                            name="targetScorr"
                            validateTrigger="onBlur"
                            hidden={true}

                        >
                            <Input type="number" min={0} max={maxValue} placeholder="الوزن" onChange={e => ComputeScorr(e)} />
                        </Form.Item>

                    </Col>


                    <Col span={24}>

                        <Form.Item
                            hasFeedback
                            label={t("sort")}
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
                            <Input placeholder="ألاسبقية" />
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
                                {ch ? <p> <CheckOutlined style={{ fontSize: '22px', color: 'green' }} /> {t("active")} </p> : <p>  <CloseOutlined style={{ fontSize: '22px', color: 'red' }} />{t("unactive")} </p>}
                            </Checkbox>

                        </Form.Item>
                    </Col>
                    <Col span={24}>

                        <Form.Item
                            hasFeedback
                            label={t("moshtrak")}
                            name="moshtrak"
                            valuePropName="checked"
                            validateTrigger="onBlur"
                        >
                            <Checkbox onChange={MoshtrakChange} >
                                {Moshtrak ? <p> <CheckOutlined style={{ fontSize: '22px', color: 'green' }} /> {t("moshtrak")} </p> : <p>  <CloseOutlined style={{ fontSize: '22px', color: 'red' }} />{t("unmoshtrak")} </p>}
                            </Checkbox>

                        </Form.Item>
                    </Col>
                     

                </Row>
            </Form>
        </>
    );


});

export default CreateUpdate;