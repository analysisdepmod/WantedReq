import { forwardRef, useRef } from "react";
import { DialogContent, DialogActions } from "@mui/material";
import { CancelButton, SelectButton } from "../../compontents/CreateModalStyle";
import CreateUpdate from "./createUpdate";
import { TargetDto } from "../../Interfaces/GeneralInterface";
interface Props {
    record: TargetDto;
    onSubmit: (values: TargetDto) => void;
    onClose: () => void;
    loading: boolean;
}

const TargetDialogContent = forwardRef<{ submit: () => void }, Props>(
    ({ record, onSubmit, onClose, loading }) => {
        const formRef = useRef<{ submit: () => void }>(null);
        return (
            <>
                <DialogContent>
                    <CreateUpdate 
                        ref={formRef}
                        record={record}
                        onSubmit={onSubmit}
                    />
                </DialogContent>
                <DialogActions style={{ position: "relative" }}>
                    <CancelButton onClick={onClose}>إلغاء</CancelButton>
                    <SelectButton
                        loading={loading}
                        disabled={loading}
                        onClick={() => formRef && typeof formRef !== "function" && formRef.current?.submit()}
                    >
                        حفظ
                    </SelectButton>
                </DialogActions>
            </>
        );
    }
);

export default TargetDialogContent;
