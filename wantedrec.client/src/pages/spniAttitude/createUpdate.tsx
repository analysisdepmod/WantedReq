import { Alert, Col, Form, Input, Row, Select, Switch } from "antd";
import {  useSelector } from "react-redux";
import { RootState } from "../../../app/store";
import {  SpiAttitudeDtoview, SubSpniAttudeDto, TargetList } from "../../Interfaces/GeneralInterface";
import axios from "../../api";
import { forwardRef,useCallback, useEffect, useImperativeHandle, useState } from "react";
import TextArea from "antd/es/input/TextArea";
import { EditOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { Translate, TranslateToAR } from "../../Interfaces/functions";
import { RULES } from "../../Interfaces/roles";
import { useGetDetalsub, useGetYearList, useIdSpAttuide, useManageMinistryList, useOfficerList } from "../../hooks/useApi";
import { useForm } from "antd/es/form/Form";
import { Button } from "antd/lib";



export interface CreateUpdateProps {
    record: SpiAttitudeDtoview;
    onSubmit?: (values: SpiAttitudeDtoview) => void;
    

}


const CreateUpdate = forwardRef(({ record, onSubmit }: CreateUpdateProps, ref)=> {
    
    const [form] = useForm();
    useImperativeHandle(ref, () => ({
        submit: () => {
            form.submit();
        },
    }));
 
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

    const { userRoles } = useSelector((state: RootState) => state.auth.loginResponse);
    const charector = useSelector((state: RootState) => state.setting.charector);



    const Admin: boolean = userRoles?.includes(RULES.Admin);
    const RagManager: boolean = userRoles?.includes(RULES.RajManager);
    
    


    const { message } = useSelector((state: RootState) => state.craud)

    const [year, setyear] = useState<number>(0);
    const [mId, setMId] = useState<number>(0);
    const [Tscorr, setTscorr] = useState<number>(0);
    const [Tmind, setTmind] = useState<number>(0);
    const [flag, setflag] = useState<boolean>(false);
    const [subTscorr, setsubTscorr] = useState<number>(0);
    const [Tid, setTid] = useState<number>(0);
    const [targets, setTargets] = useState<TargetList[]>([]);
    const [tg, SetTypeTaget] = useState<boolean>(record.targetType);
    const [TargetSub, setTargetSub] = useState<TargetList[]>([]);
    const { t } = useTranslation();
    const { arlang } = useSelector((state: RootState) => state.setting);
    const { data: officers } = useOfficerList(arlang);
    const { data: mangeministry } = useManageMinistryList(flag, arlang);
    const { data: spattudeId  } = useIdSpAttuide(Tid, year, Tmind);
    const { data: years  } = useGetYearList(flag, Tmind);
   // const { data: sunspniattude } = useGetDetalsub(Tid, mId, year) || {};
    const {
       
        refetch,
        isFetching,
    } = useGetDetalsub(Tid, mId, year) ?? {};

    const handleFetch = async () => {
        const result = await refetch?.();
        if (result?.data) {
            const data: SubSpniAttudeDto = result.data;
            form.setFieldsValue({
                follow: data.follow,
                followEn: data.followEn,
                actionTaken: data.actionTaken,
                actionTakenEn: data.actionTakenEn,
                suggistion: data.suggistion,
                suggistionEn: data.suggistionEn,
                resolution: data.resolution,
                resolutionEn: data.resolutionEn,
            });
        }
    };
   // const { data: targets } = useTargetAddList(flag, Tmind);

    const ChangeTypeTarget = (e: boolean) => {
        SetTypeTaget(e);
        setyear(0);
        setMId(0);
        setTid(0);
    }
    const ChangeTarget = (e: boolean) => {

        setflag(e)
    }

    

    useEffect(() => {

        if (flag) {
            form.setFieldValue("spiAttitudeId", spattudeId)
        }
    }, [form, flag, spattudeId]);

    const GetSubTarget = useCallback((year: number, mid: number, tid: number, typeTagret: boolean, edit: boolean) => {

        axios.get(`SpiAttitudes/GetSubTarget?year=${year}&mid=${mid}&tid=${tid}&typeTagret=${typeTagret}&edit${edit}`)
            .then(res => {

                arlang ? setTargetSub(res.data)
                    : setTargetSub(res.data.map((i: TargetList) => {
                        return {
                            label: i.labelEn,
                            value: i.value
                        } as TargetList
                    }))

            }).catch(error => {
                if (error.response) {
                    // الطلب تم إرساله والخادم أرسل رسالة مع رمز خطأ
                    console.error('Error data:', error.response.data);
                    console.error('Error status:', error.response.status);
                    console.error('Error headers:', error.response.headers);
                } else if (error.request) {
                    // الطلب تم إرساله ولم يتم استلام الرد
                    console.error('Error request:', error.request);
                } else {
                    // حدث خطأ أثناء إعداد الطلب
                    console.error('Error message:', error.message);
                }
                console.error('Error config:', error.config);
            });
    }, [arlang]);
    const YearChange = (e: number) => {
        setyear(e)

    }
    const ChangeManageMinistry = (e: number) => {
        setMId(e)
        setTmind(e)
        form.resetFields(["targetId"])
    }

    const handleFinish = (values: SpiAttitudeDtoview) => {
        onSubmit?.(values);
    };

    const GetTargetList = useCallback((Nyear: number, MinistaryId: number, edit: boolean) => {
        axios.get(`SpiAttitudes/GetTargetList?MinistaryId=${MinistaryId}&Nyear=${Nyear}&edit=${edit}&typeTagret=${tg}&flag=${flag}`)
            .then(res => {
                arlang ? setTargets(res.data)
                    : setTargets(res.data.map((i: TargetList) => {
                        return {
                            label: i.labelEn,
                            value: i.value
                        } as TargetList
                    }))

            }).catch(error => {
                if (error.response) {
                    // الطلب تم إرساله والخادم أرسل رسالة مع رمز خطأ
                    console.error('Error data:', error.response.data);
                    console.error('Error status:', error.response.status);
                    console.error('Error headers:', error.response.headers);
                } else if (error.request) {
                    // الطلب تم إرساله ولم يتم استلام الرد
                    console.error('Error request:', error.request);
                } else {
                    // حدث خطأ أثناء إعداد الطلب
                    console.error('Error message:', error.message);
                }
                console.error('Error config:', error.config);
            });


    }, [tg, flag, arlang])


    const GetSubTargetFromUpdate = (TargetId: number) => {
        axios.get(`SpiAttitudes/GetSubTargetFromUpdate?TargetId=${TargetId}`)
            .then(res => setTargetSub(res.data))
    }

    const ChangeMaintarget = (e: number) => {

        setTid(e);
        axios.get(`SpiAttitudes/GetTargetScorr?id=${e}`)
            .then(res => setTscorr(res.data))


    }

    const ChangeSubTarget = (e: number) => {

        axios.get(`SpiAttitudes/GetTargetScorr?id=${e}`)
            .then(res => setsubTscorr(res.data))



    }


    useEffect(() => {
        if (record.id === 0)
            form.resetFields();
        else {

            SetTypeTaget(record.targetType)
        }

    }, [form, record.id, record.targetType, tg])

    useEffect(() => {
        if (!flag) {
            form.resetFields();
        }

    }, [flag, form])

    useEffect(() => {
        if (record.id === 0) {
            GetTargetList(year, mId, false);
            GetSubTarget(year, mId, Tid, tg, false);

        }
        else {
            GetTargetList(year, mId, true);
            GetSubTarget(year, mId, Tid, tg, true);
        }

    }, [year, mId, Tid, GetTargetList, tg, record.id, GetSubTarget])

    useEffect(() => {

        if (record.id !== 0) {
            GetSubTargetFromUpdate(record.targetId);
            form.setFieldValue("officerInfoId", record.officerInfoId)
        }
    }, [record, record.targetId])


    useEffect(() => {

        if (record.id == 0) {

            form.setFieldValue("targetType", record.targetType)
            form.setFieldValue("id", 0)
            form.setFieldValue("year", record.year)

            setyear(record.year)
        }
        else {
            form.setFieldsValue(record)
            GetTargetList(record.year, record.manageMinistryId, true)

        }
    }, [GetTargetList, form, record])




  

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
                <Row className="m-1">
                    {record.id === 0 ?
                        <Col span={24} style={{ display: "flex" }}>
                            <Form.Item
                                hasFeedback
                                validateTrigger="onBlur"
                                valuePropName="checked"
                                name="targetType"

                            >
                                <Switch
                                    checkedChildren={`${t("main-goal")}`}
                                    unCheckedChildren={`${t("sub-goal")}`}
                                    onChange={ChangeTypeTarget}
                                    disabled={true} />
                            </Form.Item>

                            <Switch
                                className="m-2"
                                checkedChildren={`${t("Cpagoal")}`}
                                unCheckedChildren={`${t("Newgoal")}`}
                                onChange={ChangeTarget} />

                            <Button type="primary" loading={isFetching} onClick={handleFetch}>
                                جلب البيانات
                            </Button>


                        </Col> : null}

                    



                </Row>
                <Row className="d-flex justify-content-between">
                    <Col span={9}>
                        <Row>
                            <Col span={24}>
                                <Form.Item
                                    hidden
                                    hasFeedback
                                    label={`${t("order")}`}
                                    name="id"

                                >
                                    <Input />
                                </Form.Item>
                                <Form.Item
                                    hidden
                                    hasFeedback
                                    label={`${t("order")}`}
                                    name="spiAttitudeId"

                                >
                                    <Input />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item
                                    hasFeedback
                                    label={`${t("modpresentative")}`}
                                    name="manageMinistryId"
                                    validateTrigger="onBlur"

                                >
                                    <Select
                                        getPopupContainer={(triggerNode) => triggerNode.parentNode}
                                        options={mangeministry}
                                        onChange={ChangeManageMinistry}
                                        disabled={record?.id > 0}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item
                                    hasFeedback
                                    label={`${t("year")}`}
                                    name="year"
                                    validateTrigger="onBlur"

                                >
                                    <Select
                                        getPopupContainer={(triggerNode) => triggerNode.parentNode}
                                        options={years} onChange={YearChange} menuItemSelectedIcon={<EditOutlined />} />

                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item
                                    hasFeedback
                                    label={`${t("main-goal")}`}
                                    name={tg ? "targetId" : "targetId1"}
                                    validateTrigger="onBlur"
                                    help={<p hidden>  {`${t("targetscore")}`} {Tscorr}</p>}
                                >
                                    <Select
                                        getPopupContainer={(triggerNode) => triggerNode.parentNode}
                                        options={targets}
                                        onChange={ChangeMaintarget}
                                        disabled={record?.id > 0}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={24} hidden={tg}>
                                <Form.Item
                                    hasFeedback
                                    label={`${t("sub-goal")}`}
                                    name={tg ? "targetId1" : "targetId"}
                                    validateTrigger="onBlur"
                                    help={<p hidden> {`${t("targetscore")}`} {subTscorr}</p>}
                                >
                                    <Select
                                        getPopupContainer={(triggerNode) => triggerNode.parentNode}
                                        options={TargetSub}
                                        onChange={ChangeSubTarget}
                                        disabled={record?.id > 0}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item
                                    hasFeedback
                                    label={`${t("nmpresentative")}`}
                                    name="officerInfoId"
                                    validateTrigger="onBlur"

                                >
                                    <Select
                                        getPopupContainer={(triggerNode) => triggerNode.parentNode}
                                        options={officers} />
                                </Form.Item>

                            </Col>
                            <Col span={24}>
                                <Form.Item
                                    hasFeedback
                                    label={`${t("rateComplete")}`}
                                    name="rateComplete"
                                    validateTrigger="onBlur"
                                    hidden={true}
                                >
                                    <Input type="number" maxLength={2} min={0} />
                                </Form.Item>

                            </Col>
                            <Col span={24} className="mt-5 " hidden={true}>
                                <Form.Item
                                    name="isComplete"
                                    valuePropName="checked"
                                >
                                    <Switch checkedChildren={`${t("compelete")}`} unCheckedChildren={`${t("uncompelete")}`} />
                                </Form.Item>

                            </Col>
                        </Row>
                    </Col>
                    <Col span={14}>
                        <Row className="d-flex justify-content-between">
                            <Col span={12}>
                                <Form.Item
                                    hasFeedback
                                    label="المتابعة"
                                    name="follow"
                                    validateTrigger="onBlur"
                                    style={{ direction: 'rtl' }}
                                    rules={[
                                        {
                                            validator: (_, value) => {
                                                const words = value.trim().split(/\s+/);
                                                const wordCount = words.length;
                                                if (wordCount > charector) {
                                                    return Promise.reject(`الحد الأقصى للكلمات هو ${charector}`);
                                                } else {
                                                    return Promise.resolve();
                                                }
                                            },
                                        },
                                    ]}
                                >

                                    <TextArea
                                        style={{ resize: 'none' }}
                                        rows={5}
                                        onChange={e => Translate(e, form)}
                                        onPaste={(e) => e.preventDefault()}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={11}>
                                <Form.Item
                                    hasFeedback
                                    label="Follow-Up"
                                    name="followEn"
                                    validateTrigger="onBlur"
                                    style={{ direction: 'ltr' }}
                                    rules={[
                                        {
                                            validator: (_, value) => {
                                                const words = value.trim().split(/\s+/);
                                                const wordCount = words.length;
                                                if (wordCount > charector) {
                                                    return Promise.reject(`الحد الأقصى للكلمات هو ${charector}`);
                                                } else {
                                                    return Promise.resolve();
                                                }
                                            },
                                        },
                                    ]}

                                >
                                    <TextArea style={{ resize: 'none' }} rows={5} onChange={e => TranslateToAR(e, form)} onPaste={(e) => e.preventDefault()} />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row className="d-flex justify-content-between">
                            <Col span={12}>

                                <Form.Item
                                    hasFeedback
                                    label="الاجراءات المتخذة"
                                    name="actionTaken"
                                    validateTrigger="onBlur"
                                    style={{ direction: 'rtl' }}
                                    rules={[
                                        {
                                            validator: (_, value) => {
                                                const words = value.trim().split(/\s+/);
                                                const wordCount = words.length;
                                                if (wordCount > charector) {
                                                    return Promise.reject(`الحد الأقصى للكلمات هو ${charector}`);
                                                } else {
                                                    return Promise.resolve();
                                                }
                                            },
                                        },
                                    ]}

                                >
                                    <TextArea style={{ resize: 'none' }} rows={5} onChange={e => Translate(e, form)} onPaste={(e) => e.preventDefault()} />
                                </Form.Item>


                            </Col>
                            <Col span={11}>

                                <Form.Item
                                    hasFeedback
                                    label="Actions taken"
                                    name="actionTakenEn"
                                    validateTrigger="onBlur"
                                    style={{ direction: 'ltr' }}
                                    rules={[
                                        {
                                            validator: (_, value) => {
                                                const words = value.trim().split(/\s+/);
                                                const wordCount = words.length;
                                                if (wordCount > charector) {
                                                    return Promise.reject(`الحد الأقصى للكلمات هو ${charector}`);
                                                } else {
                                                    return Promise.resolve();
                                                }
                                            },
                                        },
                                    ]}

                                >
                                    <TextArea style={{ resize: 'none' }} rows={5} onChange={e => TranslateToAR(e, form)} onPaste={(e) => e.preventDefault()} />
                                </Form.Item>


                            </Col>
                        </Row>
                        <Row className="d-flex justify-content-between">
                            <Col span={12}>

                                <Form.Item
                                    hasFeedback
                                    label=" المقترحات"
                                    name="suggistion"
                                    validateTrigger="onBlur"
                                    style={{ direction: 'rtl' }}
                                    rules={[
                                        {
                                            validator: (_, value) => {
                                                const words = value.trim().split(/\s+/);
                                                const wordCount = words.length;
                                                if (wordCount > charector) {
                                                    return Promise.reject(`الحد الأقصى للكلمات هو ${charector}`);
                                                } else {
                                                    return Promise.resolve();
                                                }
                                            },
                                        },
                                    ]}

                                >
                                    <TextArea style={{ resize: 'none' }} rows={5} onChange={e => Translate(e, form)} onPaste={(e) => e.preventDefault()} />
                                </Form.Item>


                            </Col>
                            <Col span={11}>

                                <Form.Item
                                    hasFeedback
                                    label="Suggistions"
                                    name="suggistionEn"
                                    validateTrigger="onBlur"
                                    style={{ direction: 'ltr' }}
                                    rules={[
                                        {
                                            validator: (_, value) => {
                                                const words = value.trim().split(/\s+/);
                                                const wordCount = words.length;
                                                if (wordCount > charector) {
                                                    return Promise.reject(`الحد الأقصى للكلمات هو ${charector}`);
                                                } else {
                                                    return Promise.resolve();
                                                }
                                            },
                                        },
                                    ]}
                                >
                                    <TextArea style={{ resize: 'none' }} rows={5} onChange={e => TranslateToAR(e, form)} onPaste={(e) => e.preventDefault()} />
                                </Form.Item>


                            </Col>
                        </Row>
                        {(RagManager || Admin) && <Row className="d-flex justify-content-between">
                            <Col span={12}>

                                <Form.Item
                                    hasFeedback
                                    label="القرار"
                                    name="resolution"
                                    validateTrigger="onBlur"
                                    style={{ direction: 'rtl' }}
                                    rules={[
                                        {
                                            validator: (_, value) => {
                                                const words = value.trim().split(/\s+/);
                                                const wordCount = words.length;
                                                if (wordCount > charector) {
                                                    return Promise.reject(`الحد الأقصى للكلمات هو ${charector}`);
                                                } else {
                                                    return Promise.resolve();
                                                }
                                            },
                                        },
                                    ]}

                                >
                                    <TextArea style={{ resize: 'none' }} rows={5} onChange={e => Translate(e, form)} onPaste={(e) => e.preventDefault()} />
                                </Form.Item>


                            </Col>
                            <Col span={11}>

                                <Form.Item
                                    hasFeedback
                                    label="Decision"
                                    name="resolutionEn"
                                    validateTrigger="onBlur"
                                    style={{ direction: 'ltr' }}
                                    rules={[
                                        {
                                            validator: (_, value) => {
                                                const words = value.trim().split(/\s+/);
                                                const wordCount = words.length;
                                                if (wordCount > charector) {
                                                    return Promise.reject(`الحد الأقصى للكلمات هو ${charector}`);
                                                } else {
                                                    return Promise.resolve();
                                                }
                                            },
                                        },
                                    ]}

                                >
                                    <TextArea style={{ resize: 'none' }} rows={5} onChange={e => TranslateToAR(e, form)} onPaste={(e) => e.preventDefault()} />
                                </Form.Item>


                            </Col>
                        </Row>
                        }
                    </Col>

                </Row>

               

            </Form> 
        </>
    );


})

export default CreateUpdate;

 