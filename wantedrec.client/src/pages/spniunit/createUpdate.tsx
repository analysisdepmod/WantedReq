 
 
import { useDispatch } from "react-redux";
 import { FormInstance, useForm } from "antd/es/form/Form";
import {   useEffect, useState } from "react";
 import { AppDispatch } from "../../../app/store";
import { SpiUnitDTO  } from "../../Interfaces/GeneralInterface";
import { onFinish } from "../../Interfaces/functions";
import SpniUnitfrom from "./SpniUnitfrom";
 
export interface IForm {
    form: FormInstance,
    onFinish: (values: SpiUnitDTO) => void,
    record: SpiUnitDTO,
    btnLoading: boolean,
}


function CreateUpdate(record: SpiUnitDTO) {
    const dispatch = useDispatch<AppDispatch>();
    const [form] = useForm<SpiUnitDTO>();
    const [btnLoading, setBtnLoading] = useState<boolean>(false);


    const handleSubmit = async (values: SpiUnitDTO) => {
        await onFinish<SpiUnitDTO>(
            dispatch,
            values,
            '/SpiUnits',
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
       
                <SpniUnitfrom onFinish={handleSubmit} form={form} record={record} btnLoading={btnLoading} />
           
        </>
    );


}

export default CreateUpdate;