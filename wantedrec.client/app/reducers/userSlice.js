import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
const initialState={
    loading:false,
    userCount:0,
    users:[],
    error:''
}

export const getUsers=createAsyncThunk("users/getAllUsers",async()=>{
    const url="https://jsonplaceholder.typicode.com/users";
       const res=  await fetch(url)
       const data=await res.json()
       return data;    
})




const userSlice=createSlice({
    name:'applicationUser',
    initialState,
    reducers:{},
    extraReducers:{
       [getUsers.pending]:(state)=>{
            state.loading=true   
       },
       [getUsers.fulfilled]:(state,action)=>{
           state.loading=false;
           state.users=action.payload
           state.userCount=action.payload.length
      },
      [getUsers.rejected]:(state)=>{
       state.loading=false;
       state.error='Error'   
  },
    }
})

//export const{}=userSlice.actions
export default userSlice.reducer