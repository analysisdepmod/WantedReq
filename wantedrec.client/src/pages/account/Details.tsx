import { Col, Form, Input, InputNumber, Row, Popconfirm, Button } from "antd";
import { User } from "../../Interfaces/GeneralInterface";
import { forwardRef, useImperativeHandle } from "react";
import { useForm } from "antd/es/form/Form";
import { DialogActions } from "@mui/material";
import { CancelButton } from "../../compontents/CreateModalStyle";

export interface DetailsProps {
    record: User;
    onDelete?: (id: string) => void;
    onResetPassword?: (id: string) => void;
    onToggleStatus?: (id: string, isActive: boolean) => void;
    loading?: boolean;
    onClose?: () => void;
}

const Details = forwardRef(({ record, onDelete, onToggleStatus, onResetPassword, loading, onClose }: DetailsProps, ref) => {
    const [form] = useForm();
   
    useImperativeHandle(ref, () => ({
        submit: () => {
            form.submit();
        },
    }));

    //const handleDelete = () => {
    //    setOpen(false);
    //    onDelete?.(record.id)
    //}
    //const handleClose = () => {
    //    setOpen(false);
    //}

    return (
        <>
            <Form
                key={record?.id || "details"}
                form={form}
                initialValues={record}
                autoComplete="off"
                layout="vertical"
            >
                <Row gutter={16}>
                    <Col span={24}>
                        <Form.Item label="ID" name="id" hidden>
                            <Input disabled />
                        </Form.Item>
                        <Form.Item label="وحدة النظام" name="unitName">
                            <Input disabled />
                        </Form.Item>
                        <Form.Item label="وحدة المستخدم" name="originalUintUserName">
                            <Input disabled />
                        </Form.Item>
                        <Form.Item label="الرقم الشخصي" name="personNo">
                            <InputNumber className="w-100" disabled />
                        </Form.Item>
                        <Form.Item label="الرتبة /الدرجة الوظيفية" name="rankName">
                            <Input disabled />
                        </Form.Item>
                        <Form.Item label="الاسم الكامل" name="personName">
                            <Input disabled />
                        </Form.Item>
                     
                        <Form.Item label="المنصب" name="personPosition">
                            <Input disabled />
                        </Form.Item>
                        <Form.Item label="رقم الهاتف" name="cisco">
                            <Input disabled />
                        </Form.Item>
                        <Form.Item label="الايميل" name="email">
                            <Input  disabled />
                        </Form.Item>
                    </Col>
                </Row>


            </Form>
            <DialogActions style={{ position: "relative", width: '100%', display: 'flex', justifyContent: 'space-between' }}>


                <Popconfirm
                    rootClassName="high-zindex-popover"
                    title="تأكيد الحذف"
                    description="هل أنت متأكد أنك تريد حذف هذا الحساب؟"
                    onConfirm={() => onDelete?.(record.id)}
                    okText="نعم"
                    cancelText="لا"
                    zIndex={1401}
                >
                    <Button
                        loading={loading}
                        disabled={loading}
                        style={{ backgroundColor: 'red', minWidth: 'fit-content' }}
                    >
                        حذف الحساب
                    </Button>
                </Popconfirm>
              
         

                <Button
                    loading={loading}
                    disabled={loading}
                    onClick={() => onResetPassword?.(record.id)}
                    style={{ backgroundColor: 'orange', minWidth: 'fit-content' }}
                >
                    إعادة تعيين كلمة المرور
                </Button>

                <Button
                    loading={loading}
                    disabled={loading}
                    onClick={() => onToggleStatus?.(record.id, record.closedAccountFlag === 0)}
                    style={{ backgroundColor: record.closedAccountFlag == 0 ? '#BB3E00' :'#169976', minWidth: 'fit-content' }}
                >
                    {record.closedAccountFlag === 0 ? "تعطيل الحساب" : "تفعيل الحساب"}
                </Button>
                <CancelButton onClick={onClose} style={{ backgroundColor:'#FFF085'} }>إغلاق</CancelButton>
            </DialogActions>
        </>

    );
});

export default Details;
