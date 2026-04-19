import { createSlice } from '@reduxjs/toolkit'
import { Locale } from 'antd/es/locale';
 
 


 
interface SettingState {
    darkTheme: boolean,
    modalAddUsers:boolean,
    modalAddCat: boolean,
    locale: string,
    applocale:Locale,
    dir: string,
    arlang: boolean,
    charector:number,
   
 
}

// Define the initial state using that type
 
const initialState: SettingState ={
   darkTheme:true,
   modalAddUsers:false,
    modalAddCat: false,
    locale: "ar",
    applocale: {} as Locale,
    dir: "rtl",
    arlang: true,
    charector:20,
    
    
}  

export const settingSlice=createSlice({
    name:'setting',
    initialState,
    reducers:{
        toggleTheme:(state)=>{
            state.darkTheme = !state.darkTheme;
        },
        toggleModal: (state, action) => {
            state.modalAddUsers = action.payload;
        },
        toggleCatModal: (state, action) => {
            state.modalAddCat = action.payload;
        },
     
        changeDiraction: (state, action) => {

            state.dir = action.payload.dir;
            state.locale = action.payload.locale;
            state.applocale = action.payload.applocale;
            state.arlang = action.payload.arlang;
         
        },
        changecharector: (state, action) => {
            state.charector = action.payload;
        },


       
    }
    
})
 
export const { toggleTheme, toggleModal, toggleCatModal, changeDiraction, changecharector } = settingSlice.actions
export default settingSlice.reducer


 