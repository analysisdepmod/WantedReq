import { DialogActions, DialogContent } from "@mui/material";
import { useAttitude } from "../../hooks/useAttitude";
import { SpiAttitudeDtoview } from "../../Interfaces/GeneralInterface";
import CreateUpdate from "./createUpdate";
import { CancelButton, SelectButton } from "../../compontents/CreateModalStyle";
import Trutht from "./Trutht";
import DeleteSub from "./DeleteSub";
import { useState } from "react";

 
enum ModalType {
    Create = 1,
    Update,
    Truth,
    Delete
}

export const ModalContent = ({
    row,
    flag
}: {
    row: SpiAttitudeDtoview;
    flag: ModalType;
}) => {
    const {
        onClose,
        loading,
        createAttitude,
        actionTruthAttitude,
        formRef,
        deleteAttitude,
        handleUpdateUser
    } = useAttitude(localStorage.getItem("year") as unknown as number);

    const [open, setOpen] = useState(false);

   

    const onConfierm = (status: boolean) => {
        setOpen(status);
    }
    const getContent = () => {
        switch (flag) {
            case ModalType.Create:
            case ModalType.Update:
                return (
                    <CreateUpdate
                        ref={formRef}
                        record={row}
                        onSubmit={flag === ModalType.Create ? createAttitude : handleUpdateUser}
                    />
                );
            case ModalType.Truth:
                return (
                    <Trutht
                        ref={formRef}
                        Model={row}
                        onSubmit={actionTruthAttitude}
                    />
                );
            case ModalType.Delete:
                return (
                    <DeleteSub
                        record={row}
                        onDelete={(id) => deleteAttitude(id)}
                        onConfierm={onConfierm}
                        open={open}
                    />
                );
            default:
                return null;
        }
    };

    const getActionLabel = () => {
        switch (flag) {
            case ModalType.Create:
                return "حفظ";
            case ModalType.Update:
                return "تعديل";
            case ModalType.Truth:
                return row?.isTrue? "الغاء المصادقة":"مصادقة";
            case ModalType.Delete:
                return "حذف";
            default:
                return "";
        }
    };
    const buttonBgColor = (() => {
        switch (flag) {
            case 1:
                return "#093FB4"; // أزرق: حفظ
            case 2:
                return "#FF7601"; // برتقالي: تعديل
            case 3:
                return row?.isTrue ? "#8A2D3B" : "#F3C623"   // أصفر: تغيير المصادقة
            case 4:
                return "#E55050"; // أحمر: حذف
            default:
                return "#8A2D3B"; // لون افتراضي
        }
    })();

    return (
        <>
            <DialogContent>
                {getContent()}
            </DialogContent>
            <DialogActions style={{ position: "relative" }}>
                    <CancelButton onClick={onClose}>إلغاء</CancelButton>
               
                    <SelectButton
                        bg={buttonBgColor}
                        loading={loading}
                        disabled={loading}
                        onClick={() => flag === 4?onConfierm(true): formRef?.current?.submit()}
                        variant="contained"
                    >
                        {getActionLabel()}
                    </SelectButton>
                    
                   
               
                
            </DialogActions>
        </>
    );
};
