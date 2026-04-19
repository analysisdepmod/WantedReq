import { Col, Input, Row  } from "antd"
import { SpiAttitudeDtoview } from "../../Interfaces/GeneralInterface";
import { Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { forwardRef, useImperativeHandle } from "react";
import { useForm } from "antd/es/form/Form";
import { ConfirmButton } from "../../compontents/ModalsStyles";
import { CancelButton } from "../../compontents/CreateModalStyle";

 

export interface DetailsProps {
    record: SpiAttitudeDtoview;
    onDelete?: (id: number) => void;
    onConfierm: (flag: boolean) => void;
    open: boolean;
}


const DeleteSub = forwardRef(({ record, onDelete, open, onConfierm  }: DetailsProps, ref) => {
     
    const [form] = useForm();

    useImperativeHandle(ref, () => ({
        submit: () => {
            form.submit();
        },
    }));

    const handleDelete = () => {
        onConfierm(false);
        onDelete?.(record.idSub)
    }
    const handleClose = () => {
        onConfierm(false);
    }
    return (
        <>
             
                <Row gutter={[0, 16]}>
                    <Col span={24}>
                        <p className="field-label">الهدف:</p>
                        <p className="field-value">{record.targetName}</p>
                    </Col>
                    <Col span={24}>
                        <p className="field-label">ممثل الوزارة:</p>
                        <p className="field-value">{record.manageMinistryName}</p>
                    </Col>
                    <Col span={24}>
                        <p className="field-label">ممثل بعثة الناتو:</p>
                        <p className="field-value">{record.officerName}</p>
                    </Col>
                    <Col span={24}>
                        <p className="field-label">تاريخ الإدامة:</p>
                        <p className="field-value">{record.fullDate.toString().split("T")[0]}</p>
                    </Col>
                    <Col span={24}>
                        <p className="field-label">المتابعة:</p>
                        <p className="field-value">{record.follow}</p>
                    </Col>
                    <Col span={24}>
                        <p className="field-label">الإجراء المتخذ:</p>
                        <p className="field-value">{record.actionTaken}</p>
                    </Col>
                    <Col span={24}>
                        <p className="field-label">الاقتراحات:</p>
                        <p className="field-value">{record.suggistion}</p>
                    </Col>
                    <Col span={24}>
                        <p className="field-label">القرار:</p>
                        <p className="field-value">{record.resolution}</p>
                    </Col>
                </Row>
          


           
            <form>
                <Input hidden id="idSub" value={record.idSub} />
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
export default DeleteSub