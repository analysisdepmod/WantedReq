import { Alert ,  Col, Form, Input, Row, Select,  } from "antd";
import { IForm } from "./createUpdate";
import {  useSelector } from "react-redux";
import {  RootState } from "../../../app/store";

import CustomButton from "../../compontents/customButton";
import { useEffect, useState } from "react";
import { TargetsListDto } from "../../Interfaces/GeneralInterface";
import axios from "../../api";
import { useTranslation } from "react-i18next";

 

  
function TargetsMangeMinistryfrom({ form, onFinish, record, btnLoading }:IForm  ) {
    const { message } = useSelector((state: RootState) => state.craud)
    const [targetsListOpt, setTargetsList] = useState<TargetsListDto[]>([]);
 
    const { t } = useTranslation();
    const { arlang } = useSelector((state: RootState) => state.setting);
    useEffect(() => {
 
        axios.get(`TargetsMangeMinistry/GetTargetsMangeMinistryList?id=${record.id}`)
            .then(res => {
               
                setTargetsList(res.data)
                if (!arlang) {
                   setTargetsList( res.data.map((i: TargetsListDto) => {
                        return {
                            label: i.labelEn,
                            value:i.value
                        } as TargetsListDto
                   }))
                }
            })

    
 
    }, [arlang, record.id])
 

 
    return (
        <>

            <Form form={form} initialValues={record} name="trigger" onFinish={onFinish}        layout="vertical">
                <Row className="m-1">

                    {message.length > 0 ?
                        <Col span={24}>

                            {record.id > 0 ? <Alert type="info" message={t('messageGoals')} /> : <Alert type="success" message={t('messageGoals')} />}

                        </Col> : null
                    }
                </Row>
                <Row className="m-1" >
                    {/*<Col span={24}>*/}
                    {/*    <Alert type="info" message={t('messageGoals')} />*/}
                    {/*</Col>*/}
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
                            hidden
                            hasFeedback
                            name="mangeMinistryName"

                        >
                            <Input />
                        </Form.Item>
                
                        <Form.Item
                            hasFeedback
                            label="رقم الوحدة"
                            name="mangeMinistryId"
                            hidden
                            validateTrigger="onBlur"
                            
                        >
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <h4 className="mange-style">{arlang ? record.mangeMinistryName : record.mangeMinistryNameEn}</h4>
                        
                    </Col>

                    <Col span={24} className="mt-3">
                        <Form.Item
                            hasFeedback
                            label={t('Goals')}
                            name="targetsList"
                            validateTrigger="onBlur"

                        >
                            <Select mode="multiple" style={{ width: '100%' }} options={targetsListOpt} />
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

export default TargetsMangeMinistryfrom;