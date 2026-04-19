import { BrowserRouter, Route, Routes } from 'react-router-dom'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Provider } from 'react-redux'
import store from '../app/store.ts'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import "./i18n"
import { StrictMode } from 'react'
import { createTheme, ThemeProvider } from "@mui/material/styles"
import CssBaseline from '@mui/material/CssBaseline'
import { registerSW } from 'virtual:pwa-register'

// ✅ أضف هذا فقط
import { ConfigProvider } from 'antd'
import arEG from 'antd/locale/ar_EG'
import 'antd/dist/reset.css'

const queryClient = new QueryClient()

const messengerTheme = createTheme({
    palette: {
        primary: { main: '#0084FF', contrastText: '#FFFBF5' },
        secondary: { main: '#44BEC7', contrastText: '#FFFBF5' },
        error: { main: '#FA3C4C' },
        warning: { main: '#FFC300' },
        info: { main: '#00C6FF' },
        background: { default: '#ffffff', paper: '#ffffff' },
    },
    typography: {
        fontFamily: "'Segoe UI', 'Helvetica Neue', 'Roboto', 'Arial', sans-serif",
        button: { textTransform: 'none' },
        fontWeightRegular: 400,
        fontWeightMedium: 500,
        fontWeightBold: 600,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: { borderRadius: 20, textTransform: 'none', fontWeight: 500 },
                containedPrimary: {
                    backgroundColor: '#0084FF',
                    '&:hover': { backgroundColor: '#0073e6' },
                },
            },
        },
        MuiFab: {
            styleOverrides: {
                root: {
                    backgroundColor: '#0084FF',
                    color: '#fff',
                    '&:hover': { backgroundColor: '#0073e6' },
                },
            },
        },
        MuiTab: { styleOverrides: { root: { fontWeight: 500 } } },
        MuiAppBar: { styleOverrides: { colorPrimary: { backgroundColor: '#0084FF' } } },
    },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
    <Provider store={store}>
        <StrictMode>
            <QueryClientProvider client={queryClient}>
                <ThemeProvider theme={messengerTheme}>
                    <CssBaseline />
                    {/* ✅ أضف ConfigProvider هنا فقط */}
                    <ConfigProvider
                        locale={arEG}
                        direction="rtl"
                        theme={{
                            token: {
                                colorPrimary: '#0084FF',
                                borderRadius: 8,
                                fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
                            },
                        }}
                    >
                        <BrowserRouter>
                            <Routes>
                                <Route path="/*" element={<App />} />
                            </Routes>
                        </BrowserRouter>
                    </ConfigProvider>
                </ThemeProvider>
            </QueryClientProvider>
        </StrictMode>
    </Provider>
)

registerSW({
    onNeedRefresh() {
        console.log('🔄 تحديث جديد متوفر للتطبيق')
    },
    onOfflineReady() {
        console.log('✅ التطبيق جاهز للعمل بدون اتصال')
    },
})