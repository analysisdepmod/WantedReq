import { Alert, Col, Input, Space } from "antd"
import {  useSelector } from "react-redux";
import {  RootState } from "../../../app/store";
import { User } from "../../Interfaces/GeneralInterface";
import { forwardRef, useImperativeHandle, useState } from "react";
import { useForm } from "antd/es/form/Form";
import { ConfirmButton } from "../../compontents/ModalsStyles";
import { Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { CancelButton } from "../../compontents/CreateModalStyle";


export interface DetailsProps {
    record: User;
    onDelete?: (id: string) => void;

}
const Delete = forwardRef(({ record, onDelete }: DetailsProps, ref)   => {
    const [form] = useForm();
    const [open, setOpen] = useState(false);
    useImperativeHandle(ref, () => ({
        submit: () => {
            form.submit();
        },
    }));
    const { message } = useSelector((state: RootState) => state.craud)
    const handleDelete = () => {
        setOpen(false);
        onDelete?.(record.id)
    }
    const handleClose = () => {
        setOpen(false);
    }
    return (
        <>
            <h6>
                {message && <Alert type="error" message={message}/> }
                <Space size="middle">
                    <span> الاسم:</span>
                    <span>{record.personName}</span>
                </Space>
            </h6>

            <form>
                 

                <div style={{ textAlign: "center", marginTop: "10px" }}>
                    <ConfirmButton onClick={() => setOpen(true)}
                        style={{ backgroundColor: "#E52020" }}
                    >
                        {"حذف"}
                    </ConfirmButton>
                </div>
               
                    <Input hidden id="id" value={record.id} />
                    <Col span={24} className="text-center mt-3">

                        <Dialog
                            open={open}
                            onClose={handleClose}
                            aria-labelledby="delete-dialog-title"
                            aria-describedby="delete-dialog-description"
                        >
                            <DialogTitle id="delete-dialog-title">حذف</DialogTitle>
                            <DialogContent sx={{ color: 'red' }}>
                                هل أنت متأكد من عملية الحذف؟
                            </DialogContent>
                            <DialogActions>
                                <ConfirmButton onClick={handleDelete}
                                    style={{ backgroundColor: "#E52020" }}
                                >
                                    {"حذف"}
                                </ConfirmButton>
                                <CancelButton onClick={handleClose}>رجوع</CancelButton>
                            </DialogActions>
                        </Dialog>

                    </Col>



               
            </form>
        </>
    )
});
export default Delete