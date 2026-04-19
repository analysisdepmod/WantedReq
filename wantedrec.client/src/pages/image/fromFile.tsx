


// FileUpload.tsx
import React, { useState } from 'react';
import { Button, Col, Form, Input, InputNumber, Row, message } from 'antd';


import { useForm } from 'antd/es/form/Form';
import { ImagesDto } from '../../Interfaces/GeneralInterface';
import axios from '../../api';
import { CloseModal } from '../../../app/reducers/modalSlice';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../../app/store';
import { validateArabicName } from '../validate';
import { Translate, TranslateToAR } from '../../Interfaces/functions';
import { useTranslation } from 'react-i18next';







const FormFile: React.FC = () => {

    const [fileSelected, setFileSelected] = useState<File | null>();
    const dispatch = useDispatch<AppDispatch>()

    const { t } = useTranslation();



    const [form] = useForm<ImagesDto>();
    const saveFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFileSelected(e.target.files?.[0] || null);
    };



    const importFile = async (value: ImagesDto) => {
        if (!fileSelected) return;
        console.log(value);
        const formData = new FormData();

        formData.append('file', fileSelected);
        formData.append('color', value.color);
        formData.append('description', value.description);
        formData.append('descriptionEn', value.descriptionEn);
        formData.append('name', value.name);
        formData.append('nameEn', value.nameEn);
        formData.append('imageFileName', value.name);
        formData.append('id', value.id.toString());
        formData.append('sort', value.sort.toString());
   
      
         

        try {
            await axios.post(`/Images`, formData)
                .then(res => {

                    if (res.status === 200) {
                        message.success(`تمت الاضافة بنجاح`);
                        dispatch(CloseModal(false));
                    }
                })


        } catch (error) {

            console.error('Error uploading file:', error);
            message.error('Error uploading file. Please try again.');
        }
    };

     






    return (
        <>

            <Form form={form} name="trigger" onFinish={importFile} encType="multipart/form-data" autoComplete="off" layout="vertical">


                <Row>
                    <Col span={24}>
                        <Form.Item
                            hidden
                            hasFeedback
                            label="ت"
                            name="id"
                            initialValue={0 }
                        >
                            <InputNumber />
                        </Form.Item>

                        <Form.Item
                            hasFeedback
                            label="اسم الصورة"
                            name="name"
                            validateTrigger="onBlur"
                            style={{ direction: 'rtl' }}
                            rules={[

                                { validator: validateArabicName }
                            ]}
                        >
                            <Input placeholder="اسم الصورة " onChange={e => Translate(e, form)} />
                        </Form.Item>

                    </Col>
                    <Col span={24}>
                        <Form.Item
                            hasFeedback
                            label="Image Name"
                            name="nameEn"
                            validateTrigger="onBlur"
                            style={{ direction: 'ltr' }}
                            rules={[

                                { validator: validateArabicName }
                            ]}
                        >
                            <Input placeholder="Image Name " onChange={e => TranslateToAR(e, form)} />
                        </Form.Item>

                    </Col>

                    <Col span={24} className="w-100">

                        <Form.Item
                            hasFeedback
                            label={t("order")}
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
                            <InputNumber placeholder={t("order")} />
                        </Form.Item>
                    </Col>


                    <Col span={24}>

                        <Form.Item
                            hasFeedback
                            label="الوصف"
                            name="description"
                            validateTrigger="onBlur"
                            style={{ direction: 'rtl' }}
                            rules={[

                                { validator: validateArabicName }
                            ]}
                        >

                            <Input placeholder="الوصف" onChange={e => Translate(e, form)} />
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

                            <Input placeholder="Description" onChange={e => TranslateToAR(e, form)} />
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item
                            hasFeedback
                            label="مسار الصورة"
                            name="image"

                            validateTrigger="onBlur"
                        >

                            <Input type="file" onChange={saveFileSelected} />
                        </Form.Item>
                    </Col>
                    <Col span={24}>

                        <Form.Item
                            hasFeedback
                            label="مسار "
                            name="imageFileName"
                            hidden
                            validateTrigger="onBlur"
                        >

                            <Input />
                        </Form.Item>
                    </Col>

                    <Col span={24}>

                        <Form.Item
                            hasFeedback
                            label={t("color")}
                            name="color"
                            hidden
                            validateTrigger="onBlur"
                        >

                            <Input type="color" />
                        </Form.Item>
                    </Col>
                    <Col>
                        <Button className="btn btn-md btn-success w-100 text-light" style={{ display: "flex", alignItems: 'center' }} htmlType="submit">
                            {t("save")}
                        </Button>
                    </Col>
                </Row>
            </Form>
        </>
    );


}

export default FormFile;