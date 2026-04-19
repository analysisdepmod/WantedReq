import { createSlice } from '@reduxjs/toolkit'
import { IDialogProps } from '../../src/Interfaces/GeneralInterface'
 
 
const initialState: IDialogProps = {

    isOpen: false,
    postState: true, 
    width: 1000,
    height: 1000,
    title: "hello",
    content: 'Empty',
    dialogIcon:'Empty',
    loading: false
   
    
}  

export const dialogSlice=createSlice({
    name:'Dialog',
    initialState,
    reducers: {
        setModal: (state, action) => {
            const {
                isOpen,
                postState,
                width,
                height,
                title,
                content,
                dialogIcon,
                loading } = action.payload;

            state.isOpen = isOpen;
            state.postState = postState;
            state.width = width;
            state.height = height;
            state.title = title;
            state.content = content;
            state.dialogIcon = dialogIcon;
            state.loading = loading;



        },
        onCloseDialog: (state) => {
            state.loading = false;
            state.isOpen = false;
        }
       
    }
    
})
 
export const { setModal, onCloseDialog } = dialogSlice.actions
export default dialogSlice.reducer


 