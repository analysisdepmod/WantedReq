import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Badge, Tooltip, Button, Dropdown, Avatar, Typography } from 'antd';
import {
    MenuFoldOutlined, MenuUnfoldOutlined, LogoutOutlined,
    UserOutlined, VideoCameraOutlined, HomeOutlined,
    BulbOutlined, BulbFilled, BellOutlined,
    SearchOutlined, SettingOutlined, CheckCircleOutlined,
    UsergroupAddOutlined, GlobalOutlined, UserSwitchOutlined,
    ThunderboltOutlined,
} from '@ant-design/icons';
import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../app/store';
import { logout } from '../../app/reducers/authSlice';
import { setModal } from '../../app/reducers/modalSlice';
import { RULES } from '../Interfaces/roles';
import {
    getChatConnection, getNotificationConnection,
    getPresenceConnection, getRecognitionConnection,
    ensureStart,
} from '../signalr/signalrConnections';
import { useNotifications } from '../hooks/useNotifications';
import { useSignalRRecognition } from '../hooks/useSignalRRecognition';
import Settings from '../compontents/Settings';
import ChatWidget from '../compontents/chat/ChatWidget';
import { getCurrentUserId } from '../utils/auth';
import arEG from 'antd/locale/ar_EG';
import enUs from 'antd/locale/en_Us';
import { changeDiraction } from '../../app/reducers/settingSlice';
import { useTranslation } from 'react-i18next';
import { PlusOutlined } from '@ant-design/icons';

const { Sider, Content, Footer } = Layout;
const { Text } = Typography;

const HEADER_HEIGHT = 62;
const FOOTER_HEIGHT = 48;

const LIGHT = {
    bg: '#f4f6fb',
    sidebar: '#ffffff',
    header: '#ffffff',
    border: '#e4e9f2',
    text: '#0f172a',
    muted: '#64748b',
    accent: '#2563eb',
    hover: '#f1f5f9',
    active: '#eff6ff',
    footer: '#f8fafc',
};
const DARK = {
    bg: '#07090f',
    sidebar: '#0d1117',
    header: '#0d1117',
    border: '#1a2332',
    text: '#e2e8f0',
    muted: '#64748b',
    accent: '#3b82f6',
    hover: '#111827',
    active: '#1e3a5f',
    footer: '#0d1117',
};

const initial = { numberWord: 0 };

function NavItem({ to, icon, label, badge, isDark, collapsed, onClick }: {
    to?: string; icon: React.ReactNode; label: string;
    badge?: number; isDark: boolean; collapsed: boolean;
    onClick?: () => void;
}) {
    const location = useLocation();
    const T = isDark ? DARK : LIGHT;
    const isActive = to ? location.pathname === to || location.pathname.startsWith(to + '/') : false;

    const inner = (
        <div
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: collapsed ? '10px 0' : '10px 14px',
                borderRadius: 10,
                marginBottom: 2,
                cursor: 'pointer',
                justifyContent: collapsed ? 'center' : 'flex-start',
                background: isActive ? T.active : 'transparent',
                borderRight: isActive ? `3px solid ${T.accent}` : '3px solid transparent',
                color: isActive ? T.accent : T.text,
                transition: 'all .18s',
            }}
            onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = T.hover; }}
            onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
        >
            <span style={{ fontSize: 17, flexShrink: 0, color: isActive ? T.accent : T.muted }}>
                {icon}
            </span>

            {!collapsed && (
                <Text style={{
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 400,
                    color: 'inherit',
                    flex: 1,
                    whiteSpace: 'nowrap'
                }}>
                    {label}
                </Text>
            )}

            {!collapsed && !!badge && badge > 0 && <Badge count={badge} size="small" />}
        </div>
    );

    const node = to
        ? <Link to={to} style={{ textDecoration: 'none' }}>{inner}</Link>
        : inner;

    return collapsed ? <Tooltip title={label} placement="left">{node}</Tooltip> : node;
}

function SectionLabel({ label, isDark, collapsed }: { label: string; isDark: boolean; collapsed: boolean }) {
    if (collapsed) return <div style={{ height: 14 }} />;
    const T = isDark ? DARK : LIGHT;

    return (
        <div style={{
            fontSize: 10,
            fontWeight: 700,
            color: T.muted,
            letterSpacing: 1.5,
            padding: '14px 16px 5px',
            textTransform: 'uppercase',
        }}>
            {label}
        </div>
    );
}

export default function MainLayout() {
    const { i18n } = useTranslation();
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const location = useLocation();
    const currentUserId = getCurrentUserId() ?? '';
    const contentScrollRef = useRef<HTMLDivElement | null>(null);

    const { arlang, locale } = useSelector((s: RootState) => s.setting);
    const { userRoles, basicUserInfo } = useSelector((s: RootState) => s.auth.loginResponse);

    const [collapsed, setCollapsed] = useState(false);
    const [isDark, setIsDark] = useState(false);
    const T = isDark ? DARK : LIGHT;

    const isAdmin = userRoles?.includes(RULES.Admin);
    const isManager = userRoles?.includes(RULES.Manager);

    const { data: notifications = [] } = useNotifications();
    const { events: recEvents, isConnected: recConnected } = useSignalRRecognition();

    useEffect(() => {
        ensureStart(getChatConnection(), 'ChatHub');
        ensureStart(getNotificationConnection(), 'NotificationHub');
        ensureStart(getPresenceConnection(), 'PresenceHub');
        ensureStart(getRecognitionConnection(), 'RecognitionHub');
    }, []);

    useEffect(() => {
        i18n.changeLanguage(locale);
    }, [i18n, locale]);

    useEffect(() => {
        contentScrollRef.current?.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    }, [location.pathname]);

    const handleLogout = async () => {
        await dispatch(logout());
        navigate('/login');
    };

    const toggleLang = () => {
        if (arlang) {
            dispatch(changeDiraction({
                dir: 'ltr',
                locale: 'en',
                applocale: { enUs },
                arlang: false
            }));
        } else {
            dispatch(changeDiraction({
                dir: 'rtl',
                locale: 'ar',
                applocale: { arEG },
                arlang: true
            }));
        }
    };

    const openSettings = () => dispatch(setModal({
        dialogIcon: <PlusOutlined />,
        isOpen: true,
        content: <Settings row={initial} flag={1} />,
        width: 1100,
        height: 900,
        title: 'الإعدادات',
    }));

    const globalCSS = `
      html, body, #root {
        height: 100%;
        margin: 0;
        overflow: hidden;
      }

      * { transition: background-color .22s, color .22s, border-color .22s; }

      ::-webkit-scrollbar { width: 4px; height: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 4px; }

      .ant-layout {
        background: ${T.bg} !important;
      }
    `;

    return (
        <>
            <style>{globalCSS}</style>

            <Layout
                style={{
                    height: '100vh',
                    background: T.bg,
                    direction: arlang ? 'rtl' : 'ltr',
                    overflow: 'hidden',
                }}
            >
                {/* HEADER */}
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        zIndex: 1000,
                        height: HEADER_HEIGHT,
                        background: T.header,
                        borderBottom: `1px solid ${T.border}`,
                        boxShadow: '0 1px 8px rgba(0,0,0,.06)',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 20px',
                        justifyContent: 'space-between',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img
                            src="/logo.png"
                            height={44}
                            width={44}
                            style={{ borderRadius: 10, flexShrink: 0 }}
                            alt=""
                        />
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: T.text, lineHeight: 1.2 }}>
                                {basicUserInfo?.unitName ?? 'نظام التعرف على الأشخاص'}
                            </div>
                            <div style={{ fontSize: 11, color: T.muted }}>نظام التعرف الأمني الذكي</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    display: 'inline-block',
                                    background: recConnected ? '#22c55e' : '#ef4444',
                                }}
                            />
                            <Text style={{ fontSize: 11, color: T.muted }}>
                                {recConnected ? 'متصل' : 'منقطع'}
                            </Text>
                        </div>

                        {recEvents.length > 0 && (
                            <div
                                style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: '#16a34a',
                                    background: '#dcfce7',
                                    padding: '2px 10px',
                                    borderRadius: 20,
                                    border: '1px solid #bbf7d0',
                                    cursor: 'pointer',
                                }}
                                onClick={() => navigate('/recognition/results')}
                            >
                                {recEvents.length} تعرف جديد ←
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Tooltip title={isDark ? 'الوضع المضيء' : 'الوضع الداكن'}>
                            <Button
                                type="text"
                                shape="circle"
                                icon={
                                    isDark
                                        ? <BulbFilled style={{ color: '#f59e0b', fontSize: 18 }} />
                                        : <BulbOutlined style={{ color: T.muted, fontSize: 18 }} />
                                }
                                onClick={() => setIsDark(v => !v)}
                                style={{ background: T.hover, border: 'none' }}
                            />
                        </Tooltip>

                        <Tooltip title="تبديل اللغة">
                            <Button
                                type="text"
                                shape="circle"
                                icon={<GlobalOutlined style={{ color: T.muted, fontSize: 16 }} />}
                                onClick={toggleLang}
                                style={{ background: T.hover, border: 'none' }}
                            />
                        </Tooltip>

                        <Tooltip title="الإشعارات">
                            <Badge count={notifications.length} size="small" offset={[-4, 4]}>
                                <Button
                                    type="text"
                                    shape="circle"
                                    icon={<BellOutlined style={{ color: T.muted, fontSize: 16 }} />}
                                    style={{ background: T.hover, border: 'none' }}
                                />
                            </Badge>
                        </Tooltip>

                        <Dropdown
                            menu={{
                                items: [
                                    { key: 's', label: 'الإعدادات', icon: <SettingOutlined />, onClick: openSettings },
                                    { type: 'divider' },
                                    { key: 'l', label: 'تسجيل الخروج', icon: <LogoutOutlined />, danger: true, onClick: handleLogout },
                                ]
                            }}
                            trigger={['click']}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    cursor: 'pointer',
                                    padding: '4px 10px',
                                    borderRadius: 10,
                                    background: T.hover,
                                }}
                            >
                                <Avatar size={30} icon={<UserOutlined />} style={{ background: '#2563eb' }} />
                                <div style={{ lineHeight: 1.3 }}>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>
                                        {basicUserInfo?.rankName} / {basicUserInfo?.userName}
                                    </div>
                                    <div style={{ fontSize: 10, color: T.muted }}>المنصب</div>
                                </div>
                            </div>
                        </Dropdown>

                        <img src="/wanted.png" height={44} width={44} style={{ borderRadius: 10 }} alt="" />
                    </div>
                </div>

                {/* BODY */}
                <Layout
                    style={{
                        marginTop: HEADER_HEIGHT,
                        height: `calc(100vh - ${HEADER_HEIGHT}px)`,
                        background: T.bg,
                        overflow: 'hidden',
                    }}
                >
                    <Sider
                        width={240}
                        collapsedWidth={64}
                        collapsed={collapsed}
                        trigger={null}
                        collapsible
                        style={{
                            position: 'fixed',
                            top: HEADER_HEIGHT,
                            bottom: 0,
                            zIndex: 900,
                            background: T.sidebar,
                            overflow: 'hidden',
                            borderLeft: arlang ? 'none' : `1px solid ${T.border}`,
                            borderRight: arlang ? `1px solid ${T.border}` : 'none',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <div style={{ padding: '10px 8px', borderBottom: `1px solid ${T.border}` }}>
                            <Button
                                type="text"
                                block
                                icon={
                                    collapsed
                                        ? <MenuUnfoldOutlined style={{ color: T.muted }} />
                                        : <MenuFoldOutlined style={{ color: T.muted }} />
                                }
                                onClick={() => setCollapsed(v => !v)}
                                style={{ background: T.hover, border: 'none', borderRadius: 8 }}
                            />
                        </div>

                        <div style={{ flex: 1, padding: '8px', overflowY: 'auto', minHeight: 0 }}>
                            <SectionLabel label="الرئيسية" isDark={isDark} collapsed={collapsed} />
                            <NavItem to="/" icon={<HomeOutlined />} label="الصفحة الرئيسية" isDark={isDark} collapsed={collapsed} />

                            <SectionLabel label="إدارة بيانات الأشخاص" isDark={isDark} collapsed={collapsed} />
                            <NavItem to="/Indexpersons" icon={<UsergroupAddOutlined />} label="بيانات الأشخاص" isDark={isDark} collapsed={collapsed} />
                            

                            <SectionLabel label="التعرف" isDark={isDark} collapsed={collapsed} />
                            <NavItem to="/RecognitionPage" icon={<SearchOutlined />} label="التعرف من خلال صور" isDark={isDark} collapsed={collapsed} />
                            <NavItem
                                to="/recognition/results"
                                icon={<CheckCircleOutlined />}
                                label="سجل التعرف"
                                badge={recEvents.length}
                                isDark={isDark}
                                collapsed={collapsed}
                            />

                            <SectionLabel label="الكاميرات" isDark={isDark} collapsed={collapsed} />
                            <NavItem to="/cameras" icon={<VideoCameraOutlined />} label="إدارة الكاميرات" isDark={isDark} collapsed={collapsed} />
                            <NavItem
                                icon={<ThunderboltOutlined />}
                                label="المراقبة المباشرة"
                                isDark={isDark}
                                collapsed={collapsed}
                                onClick={() => {
                                    window.open('/cameras/live', '_blank', 'noopener');
                                    setTimeout(() => window.open('/cameras/results', '_blank', 'noopener'), 300);
                                }}
                            />
                            <NavItem to="/cameras/monitor" icon={<VideoCameraOutlined />} label="ضبط الجهاز مع الكامرات" isDark={isDark} collapsed={collapsed} />
                            {(isAdmin || isManager) && (
                                <>
                                    <SectionLabel label="المستخدمين والصلاحيات" isDark={isDark} collapsed={collapsed} />
                                    <NavItem to="/Users" icon={<UserSwitchOutlined />} label="إدارة المستخدمين" isDark={isDark} collapsed={collapsed} />
                                </>
                            )}

                            {isAdmin && (
                                <>
                                    <SectionLabel label="النظام" isDark={isDark} collapsed={collapsed} />
                                    <NavItem
                                        icon={<SettingOutlined />}
                                        label="إعدادات النظام"
                                        isDark={isDark}
                                        collapsed={collapsed}
                                        onClick={openSettings}
                                    />
                                </>
                            )}
                        </div>

                        <div
                            style={{
                                padding: '8px',
                                borderTop: `1px solid ${T.border}`,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 6,
                                flexShrink: 0,
                            }}
                        >
                            <ChatWidget currentUserId={currentUserId} />
                            <Button
                                danger
                                block
                                icon={<LogoutOutlined />}
                                onClick={handleLogout}
                                style={{ borderRadius: 10, height: 36 }}
                            >
                                {!collapsed && 'خروج'}
                            </Button>
                        </div>
                    </Sider>

                    <Content
                        style={{
                            marginRight: arlang ? (collapsed ? 64 : 240) : 0,
                            marginLeft: arlang ? 0 : (collapsed ? 64 : 240),
                            height: `calc(100vh - ${HEADER_HEIGHT}px)`,
                            background: T.bg,
                            transition: 'margin .22s',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            minWidth: 0,
                        }}
                    >
                        <div
                            ref={contentScrollRef}
                            style={{
                                flex: 1,
                                minHeight: 0,
                                overflowY: 'auto',
                                overflowX: 'hidden',
                                padding: 0,
                            }}
                        >
                            <Outlet />
                        </div>

                        <Footer
                            style={{
                                flexShrink: 0,
                                height: FOOTER_HEIGHT,
                                textAlign: 'center',
                                background: T.footer,
                                borderTop: `1px solid ${T.border}`,
                                color: T.muted,
                                fontSize: 12,
                                padding: '10px 24px',
                            }}
                        >
                            نظام التعرف الأمني الذكي © {new Date().getFullYear()}
                        </Footer>
                    </Content>
                </Layout>
            </Layout>
        </>
    );
}