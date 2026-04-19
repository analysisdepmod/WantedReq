import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import settingReducer from '../app/reducers/settingSlice';
import modalReducer from '../app/reducers/modalSlice';
import authReducer from '../app/reducers/authSlice';
import craudReducer from '../app/reducers/craudSlice';
import { combineReducers } from 'redux'
import dialogReducer from '../app/reducers/dialogSlice';
const persistConfig = {
    key: 'root',
    storage,
    whitelist: ['setting', 'auth']
   
};


const rootReducer = combineReducers({
    setting: settingReducer,
    dialog: dialogReducer,
    modal: modalReducer,
    auth: authReducer,
    craud: craudReducer
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }),
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;

