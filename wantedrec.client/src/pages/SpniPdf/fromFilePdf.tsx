 
 
 
// FileUpload.tsx
import React, { useState } from 'react';
import {   Button, Col, Form, Input, InputNumber, Row, message } from 'antd';
 
 
import { useForm } from 'antd/es/form/Form';
import { SpniPdfDto } from '../../Interfaces/GeneralInterface';
import axios from '../../api';
import { validateArabicName } from '../validate';
import { CloseModal } from '../../../app/reducers/modalSlice';
import { AppDispatch } from '../../../app/store';
import { useDispatch } from 'react-redux';
import { Translate, TranslateToAR } from '../../Interfaces/functions';
import { useTranslation } from 'react-i18next';
 
 


 

const FromFilePdf: React.FC = () => {
        
        const [fileSelected, setFileSelected] = useState<File | null>();
        const dispatch = useDispatch<AppDispatch>()

    const { t } = useTranslation();


    const [form] = useForm<SpniPdfDto>();
    const saveFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFileSelected(e.target.files?.[0]||null);
    };

 

    const importFile = async (value: SpniPdfDto) => {
        if (!fileSelected) return;
     
        const formData= new FormData();

        formData.append('file', fileSelected);
        formData.append('color', value.color);
        formData.append('description', value.description);
        formData.append('descriptionEn', value.descriptionEn);
        formData.append('name', value.name);
        formData.append('nameEn', value.nameEn);
        formData.append('id', value.id.toString());
        formData.append('sort', value.sort.toString());
    
     
        try {
            await axios.post(`/SpniPdfs`, formData)
                .then(res => {

                    if (res.status === 200) {
                        message.success(`تمت الاضافة بنجاح`);
                       dispatch( CloseModal(false));
                    }
                })
           
         


         
        } catch (error) {
            console.error('Error uploading file:', error);
            message.error('Error uploading file. Please try again.');
        }
    };
       
         
        


 
    

    return (
        <>
             
            <Form form={form} name="trigger" onFinish={importFile}  encType="multipart/form-data" autoComplete="off" layout="vertical">

               
                <Row>
                    <Col span={24} className="w-100">

                    <Form.Item
                        hasFeedback
                        label={t("order")}
                        name="sort"
                        validateTrigger="onBlur"

                    >
                            <InputNumber placeholder= {t("order")} />
                    </Form.Item>
                </Col>
                    <Col span={24}>
                        <Form.Item
                            hidden
                            hasFeedback
                            label="ت"
                            name="id"
                            initialValue={0}
                        >
                            <Input   />
                        </Form.Item>

                        <Form.Item
                            hasFeedback
                            label="اسم الملف"
                            name="name"
                            validateTrigger="onBlur"
                            style={{ direction: 'rtl' }}
                            rules={[
                                
                                { validator: validateArabicName }
                            ]}
                        >
                            <Input placeholder="اسم الملف " onChange={ e=>Translate(e,form)} />
                        </Form.Item >

                    </Col>


                    <Col span={24} className="w-100">
                        <Form.Item
                            hasFeedback
                            label="File Name"
                            name="nameEn"
                            validateTrigger="onBlur"
                            style={{ direction: 'ltr' }}
                            rules={[

                                { validator: validateArabicName }
                            ]}
                        >
                            <Input placeholder="File Name " onChange={e => TranslateToAR(e, form)} />
                        </Form.Item >

                    </Col>
                  


                    <Col span={24}>

                        <Form.Item
                            hasFeedback
                            label="وصف الملف"
                            name="description"
                            validateTrigger="onBlur"
                            style={{ direction: 'rtl' }}
                            rules={[

                                { validator: validateArabicName }
                            ]}
                        >

                            <Input onChange={e => Translate(e, form)} />
                        </Form.Item>
                    </Col>
                    <Col span={24}>

                        <Form.Item
                            hasFeedback
                            label="Description"
                            name="descriptionEn"
                            validateTrigger="onBlur"
                            style={{ direction: 'ltr' }}
                            rules={[

                                { validator: validateArabicName }
                            ]}
                        >

                            <Input onChange={e => TranslateToAR(e, form)} />
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item
                            hasFeedback
                            label="مسار الملف"
                            name="pdf"

                            validateTrigger="onBlur"
                        >

                            <Input type="file" onChange={saveFileSelected}  />
                        </Form.Item>
                    </Col>
                    <Col span={24}>

                        <Form.Item
                            hasFeedback
                            label="مسار"
                            name="pdfFileName"
                            hidden
                            validateTrigger="onBlur"
                        >

                            <Input   />
                        </Form.Item>
                    </Col>

                    <Col span={24}>

                        <Form.Item
                            hasFeedback
                            label={t("color")}
                            name="color"

                            validateTrigger="onBlur"
                        >

                            <Input type="color"   />
                        </Form.Item>
                    </Col>
                    <Col>
                        <Button className="btn btn-md btn-success w-100 text-light" style={{ display: "flex", alignItems: 'center' }} htmlType="submit">
                            {t("add")}
                    </Button>
</Col>
                </Row>
            </Form>
        </>
    );

 
}

export default FromFilePdf;