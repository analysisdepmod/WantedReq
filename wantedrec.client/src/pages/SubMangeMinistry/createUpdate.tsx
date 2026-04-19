 
 
import { useDispatch } from "react-redux";
 
import { FormInstance, useForm } from "antd/es/form/Form";
import {  useEffect, useState } from "react";
 
import { AppDispatch } from "../../../app/store";
 
 
 
import { SubMangeMinistrysDto, SubMangeMinistryDtoSp } from "../../Interfaces/GeneralInterface";
import { onFinish } from "../../Interfaces/functions";
import SubManageMinistryfrom from "./SubManageMinistryfrom";

 

export interface IForm {
    form: FormInstance,
    onFinish: (values: SubMangeMinistrysDto) => void,
    record: SubMangeMinistryDtoSp,
    btnLoading: boolean,
}


function CreateUpdate(record: SubMangeMinistryDtoSp) {
    const dispatch = useDispatch<AppDispatch>();
    const [form] = useForm<SubMangeMinistrysDto>();
    const [btnLoading, setBtnLoading] = useState<boolean>(false);


   

    const handleSubmit = async (values: SubMangeMinistrysDto) => {
        await onFinish<SubMangeMinistrysDto>(
            dispatch,
            values,
            '/SubMangeMinistries',
            setBtnLoading
        );
    };


    useEffect(() => {
        const isEditMode = record && Object.keys(record).length > 0;

        if (isEditMode) {
            // تعديل: تعبئة الفورم بالقيم الموجودة
            form.setFieldsValue(record.record);
        } else {
            // إضافة: إعادة ضبط الفورم
            form.resetFields();
        }
    }, [form, record]);
   
   

    return (
        <>
            
                <SubManageMinistryfrom onFinish={handleSubmit} form={form} record={record} btnLoading={btnLoading} />
        
        </>
    );


}

export default CreateUpdate;