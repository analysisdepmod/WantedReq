 
 
import { useDispatch } from "react-redux";
 
import { FormInstance, useForm } from "antd/es/form/Form";
import {   useEffect, useState } from "react";
 
import { AppDispatch } from "../../../app/store";

import {   TargetsMangeMinistryDto  } from "../../Interfaces/GeneralInterface";
import { onFinish } from "../../Interfaces/functions";
import TargetsMangeMinistryfrom from "./TargetsMangeMinistryfrom";
 

export interface IForm {
    form: FormInstance,
    onFinish: (values: TargetsMangeMinistryDto) => void,
    record: TargetsMangeMinistryDto,
    btnLoading: boolean,
}


function CreateUpdate(record: TargetsMangeMinistryDto) {
    const dispatch = useDispatch<AppDispatch>();
    const [form] = useForm<TargetsMangeMinistryDto>();
    const [btnLoading, setBtnLoading] = useState<boolean>(false);

   

    const handleSubmit = async (values: TargetsMangeMinistryDto) => {
        await onFinish<TargetsMangeMinistryDto>(
            dispatch,
            values,
            '/TargetsMangeMinistry',
            setBtnLoading
        );
    };


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
   
 
    return (
        <>
          
                <TargetsMangeMinistryfrom onFinish={handleSubmit} form={form} record={record} btnLoading={btnLoading} />
        
        </>
    );


}

export default CreateUpdate;