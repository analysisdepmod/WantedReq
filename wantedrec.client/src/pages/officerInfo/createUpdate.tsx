
import { useDispatch } from "react-redux";

import { FormInstance, useForm } from "antd/es/form/Form";
import {  useEffect, useState } from "react";
import { OfficerInfoDto, OfficerInfoDtoSp } from "../../Interfaces/GeneralInterface";
import { AppDispatch } from "../../../app/store";
//import { createUpdateAsync } from "../../../app/reducers/craudSlice";
//import { setModal } from "../../../app/reducers/modalSlice";
//import { message } from "antd";
import { onFinish } from "../../Interfaces/functions";
import OfficerInfoform from "./officerInfofrom";
 
export interface IForm {
    form: FormInstance,
    onFinish: (values: OfficerInfoDto) => void,
    record: OfficerInfoDtoSp,
    btnLoading: boolean,
}


function CreateUpdate(record: OfficerInfoDtoSp) {
    const dispatch = useDispatch<AppDispatch>();
    const [form] = useForm();
    const [btnLoading, setBtnLoading] = useState<boolean>(false);

  

    const handleSubmit = async (values: OfficerInfoDto) => {
        await onFinish<OfficerInfoDto>(
            dispatch,
            values,
            '/OfficerInfoes',
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
             
                <OfficerInfoform onFinish={handleSubmit} form={form} record={record} btnLoading={btnLoading } /> 
            
        </>
    );


}

export default CreateUpdate;