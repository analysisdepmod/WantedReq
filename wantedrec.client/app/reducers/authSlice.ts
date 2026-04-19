// authSlice.ts

import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from '../../src/api';
import { IAuth, ILoginResponse, LoginDto } from '../../src/Interfaces/GeneralInterface';
import { RootState } from '../store';

const initialState: IAuth = {
    loginResponse: {
        accessFailedCount: 0,
        token: "",
        expiration: new Date(),
        refresh_token: "",
        refresh_token_expiry: new Date(),
        message: "",
        loginStatus: false,
        passwordChange: false,
        userRoles: [],
        basicUserInfo: {
            userName: "",
            rankName: "",
            unitName: "",
            userid: "",
        }
    },
    loading: false,
    messegeError: ""
};

export const LoginAsync = createAsyncThunk<ILoginResponse, LoginDto>(
    'auth/LoginAsync',
    async (user) => {
        const response = await axios.post(`/Account/login`, user);
        return response.data;
    }
);

export const logout = createAsyncThunk<boolean, void>(
    'auth/logout',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.post(`/Account/logout`);
            return response.data;
        } catch (error) {
            console.error("Logout failed:", error);
            return rejectWithValue(false);
        }
    }
);

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        NotLogin: (state) => {
            state.loginResponse = {} as ILoginResponse;
            state.messegeError = "";
            state.loading = false;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(LoginAsync.pending, (state) => {
                state.loading = true;
            })
            .addCase(LoginAsync.rejected, (state) => {
                state.loading = false;
            })
            .addCase(LoginAsync.fulfilled, (state, action) => {
                state.loading = false;
                state.loginResponse = action.payload;
                localStorage.setItem('token', action.payload.token);
                localStorage.setItem('refresh_token', action.payload.refresh_token);
                axios.defaults.headers.common['Authorization'] = `Bearer ${action.payload.token}`;

                if (action.payload.refresh_token_expiry) {
                    const expiry = new Date(action.payload.refresh_token_expiry).toISOString();
                    localStorage.setItem('refresh_token_expiry', expiry);
                }
            })
            .addCase(logout.pending, (state) => {
                state.loading = true;
            })
            .addCase(logout.rejected, (state) => {
                state.loading = false;
                state.messegeError = "حدث خطأ";
                ['token', 'refresh_token', 'refresh_token_expiry'].forEach(item => localStorage.removeItem(item));
            })
            .addCase(logout.fulfilled, (state) => {
                state.loading = false;
                state.loginResponse = {} as ILoginResponse;
                state.messegeError = "تم تسجيل الخروج بنجاح";
                ['token', 'refresh_token', 'refresh_token_expiry'].forEach(item => localStorage.removeItem(item));
            });
    }
});

export const { NotLogin } = authSlice.actions;
export const authState = (state: RootState) => state.auth;
export default authSlice.reducer;