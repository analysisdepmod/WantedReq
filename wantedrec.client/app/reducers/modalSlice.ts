import { createSlice } from '@reduxjs/toolkit'
import { ModalState } from '../../src/Interfaces/GeneralInterface'
 
//import type { PayloadAction } from '@reduxjs/toolkit'
 








// Define the initial state using that type
 
const initialState: ModalState = {

    isOpen: false,
    postState: true, 
    Width: 1000,
    title: "hello",
    content:'Empty',
    modalIcon:'Empty',
    loading: false,
    

}  

export const modalSlice=createSlice({
    name:'Modal',
    initialState,
    reducers: {
        
        CloseModal: (State, action) => {
            State.isOpen = action.payload
            State.postState = action.payload
            State.loading = false
        },

        setModal: (State, action) => { 
            const { modalIcon, isOpen, Width, title, content  } = action.payload;
            

                    State.modalIcon = modalIcon,
                        State.isOpen = isOpen,
                        State.postState = isOpen,
                    State.Width = Width
                    State.title = title
                    State.content = content
        },
        
          setLoading: (State, action) => {
            State.loading = action.payload

        },
 

       
       
    }
    
})
 
export const { CloseModal, setModal, setLoading } = modalSlice.actions
export default modalSlice.reducer


 