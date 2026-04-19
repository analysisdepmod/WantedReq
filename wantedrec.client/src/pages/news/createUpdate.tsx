 
 
import { useDispatch } from "react-redux";
import { FormInstance, useForm } from "antd/es/form/Form";
import {  useEffect, useState } from "react";
 import { NewsDto } from "../../Interfaces/GeneralInterface";
import { AppDispatch } from "../../../app/store";
import { message } from "antd";
import { createUpdateAsync } from "../../../app/reducers/craudSlice";
import { setModal } from "../../../app/reducers/modalSlice";
import NewsForm from "./NewsForm";
 
export interface IForm {
    form: FormInstance,
    onFinish: (values: NewsDto) => void,
    record: NewsDto,
    btnLoading: boolean,
}


function CreateUpdate(record: NewsDto) {
    const dispatch = useDispatch<AppDispatch>();
    const [Form1] = useForm<NewsDto>();
    const [btnLoading, setBtnLoading] = useState<boolean>(false);


    const onFinish = async (value: NewsDto) => {
        setBtnLoading(true);
        try {
            const resultAction = await dispatch(
                createUpdateAsync({ url: '/News', formdata: value })
            );

            if (createUpdateAsync.fulfilled.match(resultAction)) {
                message.success('تم الحفظ');
                dispatch(setModal(true));
            } else {
                message.error('حدث خطأ');
                console.error('Error:', resultAction);
            }
        } catch (error) {
            message.error('حدث خطأ غير متوقع');
            console.error('Unexpected error:', error);
        } finally {
            setBtnLoading(false);
        }
    };

  

        useEffect(() => {
            if (Object.keys(record).length === 0)
                Form1.resetFields();

            else
                Form1.setFieldsValue(record);


        }, [Form1, record]);
   
   

    return (
        <>
            
                < NewsForm onFinish={onFinish} form={Form1} record={record} btnLoading={btnLoading} />
             
        </>
    );


}

export default CreateUpdate;