
import { useDispatch } from 'react-redux';
import { Close } from "@mui/icons-material";

import {
  Dialog,
  Box,
  CircularProgress
} from "@mui/material";
 
import {  ClearIconButton, ClearIconButtonWrapper, HeaderDialogWrapper } from "./CreateModalStyle";
import { IDialogProps } from "../Interfaces/GeneralInterface";
import { AppDispatch } from "../../app/store";
import { onCloseDialog } from '../../app/reducers/dialogSlice';
 



const CreateModal = ({ isOpen, content,title,width,height,loading }: IDialogProps) => {
    const dispatch = useDispatch<AppDispatch>();

    const onClose = () => {
        dispatch(onCloseDialog());
    }

  return (
      <Dialog open={isOpen} onClose={onClose}  sx={{
      "& .MuiDialog-container": {
        "& .MuiPaper-root": {
          width: width,
          minWidth:400,
          maxWidth:1500,
          height: height,
          borderRadius: "8px",
          overflowX:'hidden'
        },
        "& .MuiDialogActions-root": {
          padding: "22px"
        },
      },
    }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
         <HeaderDialogWrapper>
                <ClearIconButtonWrapper onClick={onClose}>
                  <ClearIconButton sx={{ margin: "6px 6px" }}>
                    <Close /> 
                  </ClearIconButton>
                  </ClearIconButtonWrapper>
                  <Box sx={{ margin: "22px -40px 0 0",display:'block',textAlign:'center',width:'100%'}}>
                      {title}
                  </Box>
         </HeaderDialogWrapper>
          </div>
           
        
          {loading &&
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100px' }}>
                  <CircularProgress />
              </div>}
          
          {content}  
           
    </Dialog>
  );
};

export default CreateModal;

 