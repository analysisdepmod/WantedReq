import { Alert, Col, Input, Popconfirm, Space } from "antd"
import { TargetDto } from "../../Interfaces/GeneralInterface";
import {useSelector } from "react-redux";
import { RootState } from "../../../app/store";
import CustomButton from "../../compontents/customButton";
import { forwardRef, useImperativeHandle } from "react";
import { useForm } from "antd/es/form/Form";
export interface DetailsProps {
    record: TargetDto;
    onDelete?: (id: number) => void;
    isDeleting?: boolean;
    onClose?: () => void;
}



const Delete = forwardRef(({ record, onDelete, isDeleting }: DetailsProps, ref) => {
    const { message } = useSelector((state: RootState) => state.craud)
    const [form] = useForm();

    useImperativeHandle(ref, () => ({
        submit: () => {
            form.submit();
        },
    }));

    return (
        <>
            <h6>
                {message && <Alert type="error" message={message} />}
                <Space size="middle">
                    <span> الاسم:</span>
                    <span>{record.name}</span>
                </Space>
            </h6>

            <form>
                <Input hidden id="id" value={record.id} />
                <Popconfirm
                    title="حذف"
                    description="هل انت متأكد من حذف هذا السجل؟"
                    onConfirm={() => onDelete?.(record.id)}
                    okText="نعم"
                    cancelText="كلا"
                >

                    <Col span={24} className="text-center mt-3">
                        <CustomButton flag={3} btnLoading={isDeleting??true} />
                    </Col>

                </Popconfirm>


            </form>
        </>
    )
});
export default Delete

 
