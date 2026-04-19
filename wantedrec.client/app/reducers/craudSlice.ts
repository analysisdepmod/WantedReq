import {   createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { AddUser, Images, NewsDto, OfficerInfoDto, SpiAttitudeDto, SpiAttitudeDtoview, SpiUnitDTO, SpniPdf, SubMangeMinistrysDto, TargetDto, TargetsMangeMinistryDto, User } from '../../src/Interfaces/GeneralInterface';
import axios from '../../src/api';
import { RootState } from '../store';
/*import { toast } from 'react-toastify';*/
 

interface data {
    url: string
    formdata: OfficerInfoDto | SpiAttitudeDtoview | SpiAttitudeDto | TargetDto | SpiUnitDTO | SubMangeMinistrysDto | AddUser | User | TargetDto | Images | SpniPdf | NewsDto | TargetsMangeMinistryDto
    
}
 
interface Iintialvalue {
    message: string;
    loading: boolean;
     
    
}
  
/////////////officer creatupdate

const intialvalue: Iintialvalue = {
    message: '',
    loading: false, 
}


const message1: string = "لم يتم الحفظ";
const message2: string = "لم يتم التعديل";
const message3: string = "لم يتم الحذف";
 
 

 
let flag: number =0;


const ISUPDATE = (record: data): boolean => {
    return record.formdata.id === 0 || record.formdata.id.toString().length === 0 ? false : true;
}
function isFile(obj: any): obj is File {
    return obj instanceof File;
}
function isFormData(obj: any): obj is Record<string, data> {
    return obj && typeof obj === 'object';
}
const GETCONTENTTYPE = (record: data): string => {
    let hasFileProp = false;

    if (isFormData(record.formdata)) {

        for (const key in record.formdata) {
            if (Object.prototype.hasOwnProperty.call(record.formdata, key)) {
                const value = record.formdata[key];
                if (isFile(value)) {
                    hasFileProp = true;
                    break;
                }
            }
        }
    }


    return hasFileProp ? 'multipart/form-data' : 'application/json';
};
export const DeleteAsync = createAsyncThunk<boolean, data>('craud/DeleteAsync',
    async (value, thunkAPI) => {

        const { rejectWithValue } = thunkAPI;
        const response = (
            await axios.delete(`${value.url}/${value.formdata.id}`)
                .then(res => res.data)

                .catch((e) => {
                    return rejectWithValue(e);
                }))

        return response


    });


export const createUpdateAsync = createAsyncThunk<boolean, data>('craud/createUpdateAsync',
    async (value, thunkAPI) => {
        const { rejectWithValue } = thunkAPI;
        const isUpdate = ISUPDATE(value)
        console.log(isUpdate);
        console.log(value);
        try {
            return await axios(
                {
                    method: isUpdate ? 'put' : 'post',
                    url: `${value.url}/${isUpdate ? `${value.formdata.id}` : ''}`,
                    data: value.formdata,
                    headers:
                    {
                        'Content-Type': GETCONTENTTYPE(value),
                    },
                })
                .then(res => { console.log(res); res })
                .catch(e => e)
        }
        catch (e) {
            return rejectWithValue(e);
        }



    });


 

 
////////////////////////rank creatupdate 

  

export const craudSlice=createSlice({
    name: 'craud',
    initialState: intialvalue ,
    reducers: {
        SetError: (state) => {
            state.message = "";
        }
    },


    extraReducers: (builder) => {
        builder


            ////////login //////////////////////
            .addCase(createUpdateAsync.pending, (state) => {
                state.loading = true
                
            })

            .addCase(createUpdateAsync.rejected, (state) => {
                state.loading = false;
            
                state.message = flag == 0 ? message1 : message2 ;
            })

            .addCase(createUpdateAsync.fulfilled, (state) => {
              
                state.loading = false
            })
            .addCase(DeleteAsync.pending, (state) => {
                state.loading = true

            })

            .addCase(DeleteAsync.rejected, (state) => {
                state.loading = false;

                state.message = message3;
            })

            .addCase(DeleteAsync.fulfilled, (state) => {

                state.loading = false
            })
    }
})
 
 
export const { SetError } = craudSlice.actions
export const craudState = (state: RootState) => state.craud;
export default craudSlice.reducer


 