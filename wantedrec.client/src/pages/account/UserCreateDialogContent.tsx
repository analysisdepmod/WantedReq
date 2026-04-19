import { forwardRef, useRef } from "react";
import { DialogContent, DialogActions } from "@mui/material";
import { CancelButton, SelectButton } from "../../compontents/CreateModalStyle";
import CreateUpdate from "./createUpdate";
import { AddUser, ManageMinistryListtoltap, SelectList } from "../../Interfaces/GeneralInterface";
import { useAutoCompleteorgunits } from "../../hooks/useApi";


interface Props {
    record: AddUser;
    onSubmit: (values: AddUser) => void;
    onClose: () => void;
    loading: boolean;
    createLevel: SelectList[];
    units: SelectList[];
    ranks: SelectList[];
    mangeministry: ManageMinistryListtoltap[];
}

const UserCreateDialogContent = forwardRef<{ submit: () => void }, Props>(
    ({ record, onSubmit, onClose, loading, createLevel, units, ranks, mangeministry }) => {
        const formRef = useRef<{ submit: () => void }>(null);
        const { orgUnits } = useAutoCompleteorgunits();
        return (
            <>
                <DialogContent>
                    <CreateUpdate
                        ref={formRef}
                        record={record}
                        onSubmit={onSubmit}
                        createLevel={createLevel}
                        units={units}
                        ranks={ranks}
                       
                        orgunits={orgUnits }
                        mangeministry={mangeministry}
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

export default UserCreateDialogContent;
