import { useState } from 'react';
import { Form, Input, Button, Typography } from 'antd';
import { useForm } from 'antd/es/form/Form';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../app/store';
import { LoginAsync, NotLogin } from '../../../app/reducers/authSlice';
import { useNavigate } from 'react-router-dom';
import { ILoginResponse, LoginDto } from '../../Interfaces/GeneralInterface';
import {
    recreateChatConnection,
    recreateNotificationConnection,
    recreatePresenceConnection,
    getChatConnection,
    getNotificationConnection,
    getPresenceConnection,
    ensureStart,
} from '../../signalr/signalrConnections';

const { Text } = Typography;

// ── Scan Line SVG Icon ────────────────────────────────────
const FaceIcon = () => (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
        <rect x="2" y="2" width="28" height="4" rx="2" fill="#00d4ff" opacity="0.9" />
        <rect x="2" y="2" width="4" height="28" rx="2" fill="#00d4ff" opacity="0.9" />
        <rect x="90" y="2" width="28" height="4" rx="2" fill="#00d4ff" opacity="0.9" />
        <rect x="116" y="2" width="4" height="28" rx="2" fill="#00d4ff" opacity="0.9" />
        <rect x="2" y="116" width="28" height="4" rx="2" fill="#00d4ff" opacity="0.9" />
        <rect x="2" y="90" width="4" height="28" rx="2" fill="#00d4ff" opacity="0.9" />
        <rect x="90" y="116" width="28" height="4" rx="2" fill="#00d4ff" opacity="0.9" />
        <rect x="116" y="90" width="4" height="28" rx="2" fill="#00d4ff" opacity="0.9" />
        {/* Face outline */}
        <ellipse cx="60" cy="55" rx="28" ry="32" stroke="#00d4ff" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.6" />
        {/* Eyes */}
        <ellipse cx="48" cy="48" rx="5" ry="6" stroke="#00d4ff" strokeWidth="1.5" fill="none" />
        <ellipse cx="72" cy="48" rx="5" ry="6" stroke="#00d4ff" strokeWidth="1.5" fill="none" />
        <circle cx="48" cy="48" r="2" fill="#00d4ff" />
        <circle cx="72" cy="48" r="2" fill="#00d4ff" />
        {/* Nose */}
        <path d="M60 52 L56 62 Q60 65 64 62 L60 52" stroke="#00d4ff" strokeWidth="1.2" fill="none" opacity="0.7" />
        {/* Mouth */}
        <path d="M50 70 Q60 76 70 70" stroke="#00d4ff" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        {/* Scan line */}
        <line x1="10" y1="60" x2="110" y2="60" stroke="#00d4ff" strokeWidth="1" opacity="0.4" strokeDasharray="3 3" />
        {/* Dots */}
        <circle cx="48" cy="35" r="2" fill="#00d4ff" opacity="0.5" />
        <circle cx="72" cy="35" r="2" fill="#00d4ff" opacity="0.5" />
        <circle cx="60" cy="88" r="2" fill="#00d4ff" opacity="0.5" />
    </svg>
);

export default function Login() {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const [form] = useForm<LoginDto>();
    const { loading } = useSelector((state: RootState) => state.auth);
    const [errorMsg, setErrorMsg] = useState('');
    const [scanActive, setScanActive] = useState(false);

    const onFinish = async (values: LoginDto) => {
        setScanActive(true);
        setErrorMsg('');
        try {
            const resultAction = await dispatch(LoginAsync(values));
            if (LoginAsync.fulfilled.match(resultAction)) {
                const loginData = resultAction.payload;
                if (loginData.loginStatus) {
                    await getChatConnection().stop();
                    await getNotificationConnection().stop();
                    await getPresenceConnection().stop();
                    recreateChatConnection();
                    recreateNotificationConnection();
                    recreatePresenceConnection();
                    await ensureStart(getChatConnection(), 'ChatHub');
                    await ensureStart(getNotificationConnection(), 'NotificationHub');
                    await ensureStart(getPresenceConnection(), 'PresenceHub');
                    navigate('/');
                } else {
                    setErrorMsg(loginData.message || 'بيانات الدخول غير صحيحة');
                    dispatch(NotLogin());
                }
            } else {
                setErrorMsg('فشل تسجيل الدخول');
                dispatch(NotLogin());
            }
        } catch {
            setErrorMsg('حدث خطأ، حاول مجدداً');
            dispatch(NotLogin());
        } finally {
            setScanActive(false);
        }
    };

    return (
        <div dir="rtl" style={{
            minHeight: '100vh',
            background: '#020b18',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Cairo', 'Segoe UI', sans-serif",
            overflow: 'hidden',
            position: 'relative',
        }}>
            {/* ── خلفية شبكية ── */}
            <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `
                    linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px',
                pointerEvents: 'none',
            }} />

            {/* ── دائرة ضوئية ── */}
            <div style={{
                position: 'absolute',
                top: '-200px', left: '-200px',
                width: '600px', height: '600px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(0,84,255,0.12) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute',
                bottom: '-150px', right: '-150px',
                width: '500px', height: '500px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />

            {/* ── البطاقة الرئيسية ── */}
            <div style={{
                display: 'flex',
                width: '900px',
                maxWidth: '95vw',
                minHeight: '520px',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid rgba(0,212,255,0.15)',
                boxShadow: '0 0 60px rgba(0,212,255,0.08), 0 40px 80px rgba(0,0,0,0.6)',
                position: 'relative',
                zIndex: 1,
            }}>

                {/* ── الجانب الأيمن: معلومات النظام ── */}
                <div style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #010d1a 0%, #001428 50%, #000e20 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '48px 40px',
                    position: 'relative',
                    borderLeft: '1px solid rgba(0,212,255,0.12)',
                }}>
                    {/* خطوط زخرفية */}
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0,
                        height: '2px',
                        background: 'linear-gradient(90deg, transparent, #00d4ff, transparent)',
                        opacity: 0.6,
                    }} />

                    {/* الأيقونة */}
                    <div style={{
                        marginBottom: '32px',
                        animation: scanActive ? 'pulse 1s infinite' : 'none',
                        filter: scanActive ? 'drop-shadow(0 0 20px #00d4ff)' : 'drop-shadow(0 0 10px rgba(0,212,255,0.4))',
                        transition: 'filter 0.3s ease',
                    }}>
                        <FaceIcon />
                    </div>

                    {/* اسم النظام */}
                    <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                        <div style={{
                            fontSize: '11px',
                            letterSpacing: '4px',
                            color: '#00d4ff',
                            opacity: 0.7,
                            marginBottom: '8px',
                            fontWeight: 600,
                        }}>
                            FACE RECOGNITION SYSTEM
                        </div>
                        <div style={{
                            fontSize: '22px',
                            fontWeight: 700,
                            color: '#ffffff',
                            lineHeight: 1.4,
                        }}>
                            نظام التعرف
                        </div>
                        <div style={{
                            fontSize: '22px',
                            fontWeight: 700,
                            background: 'linear-gradient(90deg, #00d4ff, #0085ff)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            lineHeight: 1.4,
                        }}>
                            على الوجوه
                        </div>
                    </div>

                    {/* فاصل */}
                    <div style={{
                        width: '60px', height: '1px',
                        background: 'linear-gradient(90deg, transparent, #00d4ff, transparent)',
                        margin: '16px 0',
                    }} />

                    {/* مميزات */}
                    {['كشف الوجوه بدقة عالية', 'تحليل فوري بالذكاء الاصطناعي', 'قاعدة بيانات آمنة'].map((text, i) => (
                        <div key={i} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            marginBottom: '10px',
                            color: 'rgba(255,255,255,0.6)',
                            fontSize: '13px',
                        }}>
                            <div style={{
                                width: '6px', height: '6px',
                                borderRadius: '50%',
                                background: '#00d4ff',
                                flexShrink: 0,
                                boxShadow: '0 0 6px #00d4ff',
                            }} />
                            {text}
                        </div>
                    ))}

                    {/* Version */}
                    <div style={{
                        position: 'absolute', bottom: '20px',
                        fontSize: '11px',
                        color: 'rgba(0,212,255,0.3)',
                        letterSpacing: '2px',
                    }}>
                        v2.0.0 — ArcFace Engine
                    </div>
                </div>

                {/* ── الجانب الأيسر: نموذج الدخول ── */}
                <div style={{
                    width: '380px',
                    background: '#030f1e',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: '48px 40px',
                    position: 'relative',
                }}>
                    {/* شريط علوي */}
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0,
                        height: '2px',
                        background: 'linear-gradient(90deg, #00d4ff, #0054ff, transparent)',
                        opacity: 0.8,
                    }} />

                    <div style={{ marginBottom: '36px' }}>
                        <div style={{
                            fontSize: '13px',
                            color: '#00d4ff',
                            letterSpacing: '2px',
                            marginBottom: '8px',
                            opacity: 0.8,
                        }}>
                            مرحباً بك
                        </div>
                        <div style={{
                            fontSize: '26px',
                            fontWeight: 700,
                            color: '#ffffff',
                        }}>
                            تسجيل الدخول
                        </div>
                    </div>

                    <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">

                        {/* البريد الإلكتروني */}
                        <Form.Item
                            name="email"
                            label={<span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>البريد الإلكتروني</span>}
                            rules={[
                                { required: true, message: 'البريد الإلكتروني مطلوب' },
                                { pattern: /^[A-Za-z0-9._%+-]+@mod\.com$/, message: 'يجب أن يحتوي على mod.com@' },
                            ]}
                        >
                            <Input
                                placeholder="example@mod.com"
                                style={{
                                    background: 'rgba(0,212,255,0.04)',
                                    border: '1px solid rgba(0,212,255,0.2)',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    height: '44px',
                                    fontSize: '14px',
                                    direction: 'ltr',
                                    textAlign: 'right',
                                }}
                            />
                        </Form.Item>

                        {/* كلمة المرور */}
                        <Form.Item
                            name="password"
                            label={<span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>كلمة المرور</span>}
                            rules={[{ required: true, message: 'كلمة المرور مطلوبة' }]}
                        >
                            <Input.Password
                                placeholder="••••••••"
                                style={{
                                    background: 'rgba(0,212,255,0.04)',
                                    border: '1px solid rgba(0,212,255,0.2)',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    height: '44px',
                                    fontSize: '14px',
                                }}
                            />
                        </Form.Item>

                        {/* رسالة الخطأ */}
                        {errorMsg && (
                            <div style={{
                                background: 'rgba(255,59,59,0.1)',
                                border: '1px solid rgba(255,59,59,0.3)',
                                borderRadius: '8px',
                                padding: '10px 14px',
                                marginBottom: '16px',
                                color: '#ff6b6b',
                                fontSize: '13px',
                                textAlign: 'center',
                            }}>
                                {errorMsg}
                            </div>
                        )}

                        {/* زر الدخول */}
                        <Form.Item style={{ marginTop: '8px' }}>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                block
                                style={{
                                    height: '46px',
                                    background: 'linear-gradient(135deg, #0054ff, #00d4ff)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '15px',
                                    fontWeight: 600,
                                    color: '#fff',
                                    letterSpacing: '1px',
                                    boxShadow: '0 4px 20px rgba(0,212,255,0.25)',
                                    cursor: 'pointer',
                                }}
                            >
                                {loading ? 'جاري التحقق...' : 'دخول'}
                            </Button>
                        </Form.Item>
                    </Form>

                    {/* Footer */}
                    <div style={{
                        position: 'absolute', bottom: '20px', left: 0, right: 0,
                        textAlign: 'center',
                    }}>
                        <Text style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', letterSpacing: '1px' }}>
                            WantedRec © 2026
                        </Text>
                    </div>
                </div>
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.6; }
                }
                .ant-input, .ant-input-password {
                    color: #fff !important;
                }
                .ant-input::placeholder {
                    color: rgba(255,255,255,0.25) !important;
                }
                .ant-input-password input {
                    background: transparent !important;
                    color: #fff !important;
                }
                .ant-input-password .anticon {
                    color: rgba(255,255,255,0.4) !important;
                }
                .ant-input:hover, .ant-input:focus,
                .ant-input-affix-wrapper:hover,
                .ant-input-affix-wrapper-focused {
                    border-color: #00d4ff !important;
                    box-shadow: 0 0 0 2px rgba(0,212,255,0.1) !important;
                }
                .ant-form-item-explain-error {
                    color: #ff6b6b !important;
                    font-size: 12px !important;
                }
            `}</style>
        </div>
    );
}