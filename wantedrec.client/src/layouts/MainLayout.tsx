import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Badge, Tooltip, Button, Dropdown, Avatar, Typography } from 'antd';
import {
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    LogoutOutlined,
    UserOutlined,
    VideoCameraOutlined,
    HomeOutlined,
    BulbOutlined,
    BulbFilled,
    BellOutlined,
    SearchOutlined,
    SettingOutlined,
    CheckCircleOutlined,
    UsergroupAddOutlined,
    GlobalOutlined,
    UserSwitchOutlined,
    ThunderboltOutlined,
    PlusOutlined,
    ControlOutlined,
} from '@ant-design/icons';
import { useState, useEffect, useRef, type ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../app/store';
import { logout } from '../../app/reducers/authSlice';
import { setModal } from '../../app/reducers/modalSlice';
import { RULES } from '../Interfaces/roles';
import {
    getChatConnection,
    getNotificationConnection,
    getPresenceConnection,
    getRecognitionConnection,
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

const { Sider, Content, Footer } = Layout;
const { Text } = Typography;

const HEADER_HEIGHT = 70;
const FOOTER_HEIGHT = 48;
const THEME_STORAGE_KEY = 'app-theme-mode';

const initial = { numberWord: 0 };

const applyThemeMode = (isDark: boolean) => {
    const theme = isDark ? 'dark' : 'light';

    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);

    document.documentElement.setAttribute('data-bs-theme', theme);
    document.body.setAttribute('data-bs-theme', theme);

    document.documentElement.classList.toggle('dark', isDark);
    document.body.classList.toggle('dark', isDark);

    localStorage.setItem(THEME_STORAGE_KEY, theme);
};

const readInitialTheme = (): boolean => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark') return true;
    if (saved === 'light') return false;

    return (
        document.documentElement.getAttribute('data-theme') === 'dark' ||
        document.body.getAttribute('data-theme') === 'dark' ||
        document.documentElement.getAttribute('data-bs-theme') === 'dark' ||
        document.body.getAttribute('data-bs-theme') === 'dark' ||
        document.documentElement.classList.contains('dark') ||
        document.body.classList.contains('dark')
    );
};

function SectionLabel({
    label,
    collapsed,
}: {
    label: string;
    collapsed: boolean;
}) {
    if (collapsed) return <div style={{ height: 10 }} />;

    return (
        <div
            style={{
                fontSize: 10,
                fontWeight: 800,
                color: 'var(--app-muted)',
                letterSpacing: 1.2,
                padding: '14px 14px 6px',
                textTransform: 'uppercase',
            }}
        >
            {label}
        </div>
    );
}

function NavItem({
    to,
    icon,
    label,
    badge,
    collapsed,
    onClick,
}: {
    to?: string;
    icon: ReactNode;
    label: string;
    badge?: number;
    collapsed: boolean;
    onClick?: () => void;
}) {
    const location = useLocation();
    const isActive = to ? location.pathname === to || location.pathname.startsWith(to + '/') : false;

    const content = (
        <div
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: collapsed ? '12px 0' : '12px 14px',
                borderRadius: 14,
                marginBottom: 6,
                cursor: 'pointer',
                justifyContent: collapsed ? 'center' : 'flex-start',
                background: isActive ? 'var(--app-soft-blue)' : 'transparent',
                border: `1px solid ${isActive ? 'color-mix(in srgb, var(--app-accent) 18%, transparent)' : 'transparent'}`,
                color: isActive ? 'var(--app-accent)' : 'var(--app-text)',
                transition: 'all .18s ease',
                position: 'relative',
                overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
                if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'var(--app-hover)';
            }}
            onMouseLeave={(e) => {
                if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent';
            }}
        >
            {isActive && (
                <div
                    style={{
                        position: 'absolute',
                        insetInlineStart: 0,
                        top: 8,
                        bottom: 8,
                        width: 3,
                        borderRadius: 999,
                        background: 'var(--app-accent)',
                    }}
                />
            )}

            <span
                style={{
                    width: collapsed ? 34 : 30,
                    height: collapsed ? 34 : 30,
                    borderRadius: 10,
                    background: isActive ? 'color-mix(in srgb, var(--app-accent) 10%, transparent)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: isActive ? 'var(--app-accent)' : 'var(--app-muted)',
                    fontSize: 16,
                }}
            >
                {icon}
            </span>

            {!collapsed && (
                <Text
                    style={{
                        fontSize: 13,
                        fontWeight: isActive ? 700 : 500,
                        color: 'inherit',
                        flex: 1,
                        whiteSpace: 'nowrap',
                    }}
                >
                    {label}
                </Text>
            )}

            {!collapsed && !!badge && badge > 0 && (
                <Badge
                    count={badge}
                    size="small"
                    style={{
                        boxShadow: '0 8px 18px rgba(239,68,68,.18)',
                    }}
                />
            )}
        </div>
    );

    const node = to ? (
        <Link to={to} style={{ textDecoration: 'none' }}>
            {content}
        </Link>
    ) : (
        content
    );

    return collapsed ? (
        <Tooltip title={label} placement="left">
            {node}
        </Tooltip>
    ) : (
        node
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
    const [isDark, setIsDark] = useState<boolean>(() => readInitialTheme());

    const isAdmin = userRoles?.includes(RULES.Admin);
    const isManager = userRoles?.includes(RULES.Manager);

    const { data: notifications = [] } = useNotifications();
    const { events: recEvents, isConnected: recConnected } = useSignalRRecognition();

    const direction = arlang ? 'rtl' : 'ltr';
    const sidebarInlineStart = arlang ? 'right' : 'left';
    const contentMarginRight = arlang ? (collapsed ? 74 : 254) : 0;
    const contentMarginLeft = arlang ? 0 : (collapsed ? 74 : 254);

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
        applyThemeMode(isDark);
    }, [isDark]);

    useEffect(() => {
        document.documentElement.setAttribute('dir', direction);
        document.body.setAttribute('dir', direction);
        document.documentElement.lang = arlang ? 'ar' : 'en';
        document.body.style.direction = direction;
    }, [direction, arlang]);

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
            dispatch(
                changeDiraction({
                    dir: 'ltr',
                    locale: 'en',
                    applocale: { enUs },
                    arlang: false,
                }),
            );
        } else {
            dispatch(
                changeDiraction({
                    dir: 'rtl',
                    locale: 'ar',
                    applocale: { arEG },
                    arlang: true,
                }),
            );
        }
    };

    const openSettings = () =>
        dispatch(
            setModal({
                dialogIcon: <PlusOutlined />,
                isOpen: true,
                content: <Settings row={initial} flag={1} />,
                width: 1100,
                height: 900,
                title: 'الإعدادات',
            }),
        );

    const globalCSS = `
      html, body, #root {
        height: 100%;
        margin: 0;
        overflow: hidden;
        background: var(--app-page-bg);
      }

      * {
        transition: background-color .22s, color .22s, border-color .22s, box-shadow .22s;
        box-sizing: border-box;
      }

      ::-webkit-scrollbar { width: 6px; height: 6px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: var(--app-border); border-radius: 999px; }

      .ant-layout {
        background: var(--app-page-bg) !important;
      }

      .mainlayout-sider .ant-layout-sider-children {
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 0;
      }

      .mainlayout-sidebar-scroll {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        overflow-x: hidden;
      }
    `;

    return (
        <>
            <style>{globalCSS}</style>

            <Layout
                style={{
                    height: '100vh',
                    background: 'var(--app-page-bg)',
                    direction,
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        zIndex: 1000,
                        height: HEADER_HEIGHT,
                        background: 'var(--app-header-bg)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        borderBottom: '1px solid var(--app-border)',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 16px',
                        justifyContent: 'space-between',
                        boxShadow: '0 6px 24px rgba(15,23,42,.06)',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                        <img
                            src="/logo.png"
                            height={46}
                            width={46}
                            style={{ borderRadius: 14, flexShrink: 0, objectFit: 'cover' }}
                            alt=""
                        />

                        <div style={{ minWidth: 0 }}>
                            <div
                                style={{
                                    fontSize: 14,
                                    fontWeight: 900,
                                    color: 'var(--app-text)',
                                    lineHeight: 1.2,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}
                            >
                                {basicUserInfo?.unitName ?? 'نظام التعرف على الأشخاص'}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--app-muted)', marginTop: 3 }}>
                                نظام التعرف الأمني الذكي
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '6px 10px',
                                borderRadius: 999,
                                background: 'var(--app-surface)',
                                border: '1px solid var(--app-border)',
                            }}
                        >
                            <span
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    display: 'inline-block',
                                    background: recConnected ? '#22c55e' : '#ef4444',
                                    boxShadow: recConnected
                                        ? '0 0 0 4px rgba(34,197,94,.12)'
                                        : '0 0 0 4px rgba(239,68,68,.12)',
                                }}
                            />
                            <Text style={{ fontSize: 11, color: 'var(--app-muted)' }}>
                                {recConnected ? 'متصل' : 'منقطع'}
                            </Text>
                        </div>

                        {recEvents.length > 0 && (
                            <div
                                style={{
                                    fontSize: 11,
                                    fontWeight: 800,
                                    color: '#15803d',
                                    background: 'var(--app-soft-green)',
                                    padding: '6px 12px',
                                    borderRadius: 999,
                                    border: '1px solid #bbf7d0',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
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
                                    isDark ? (
                                        <BulbFilled style={{ color: '#f59e0b', fontSize: 18 }} />
                                    ) : (
                                        <BulbOutlined style={{ color: 'var(--app-muted)', fontSize: 18 }} />
                                    )
                                }
                                onClick={() => setIsDark((v) => !v)}
                                style={{ background: 'var(--app-hover)', border: 'none' }}
                            />
                        </Tooltip>

                        <Tooltip title="تبديل اللغة">
                            <Button
                                type="text"
                                shape="circle"
                                icon={<GlobalOutlined style={{ color: 'var(--app-muted)', fontSize: 16 }} />}
                                onClick={toggleLang}
                                style={{ background: 'var(--app-hover)', border: 'none' }}
                            />
                        </Tooltip>

                        <Tooltip title="الإشعارات">
                            <Badge count={notifications.length} size="small" offset={[-4, 4]}>
                                <Button
                                    type="text"
                                    shape="circle"
                                    icon={<BellOutlined style={{ color: 'var(--app-muted)', fontSize: 16 }} />}
                                    style={{ background: 'var(--app-hover)', border: 'none' }}
                                />
                            </Badge>
                        </Tooltip>

                        <Dropdown
                            menu={{
                                items: [
                                    {
                                        key: 's',
                                        label: 'الإعدادات',
                                        icon: <SettingOutlined />,
                                        onClick: openSettings,
                                    },
                                    { type: 'divider' },
                                    {
                                        key: 'l',
                                        label: 'تسجيل الخروج',
                                        icon: <LogoutOutlined />,
                                        danger: true,
                                        onClick: handleLogout,
                                    },
                                ],
                            }}
                            trigger={['click']}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    cursor: 'pointer',
                                    padding: '5px 10px',
                                    borderRadius: 14,
                                    background: 'var(--app-hover)',
                                    border: '1px solid var(--app-border)',
                                }}
                            >
                                <Avatar
                                    size={32}
                                    icon={<UserOutlined />}
                                    style={{
                                        background: 'var(--app-accent)',
                                        flexShrink: 0,
                                    }}
                                />

                                <div style={{ lineHeight: 1.25 }}>
                                    <div
                                        style={{
                                            fontSize: 12,
                                            fontWeight: 700,
                                            color: 'var(--app-text)',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {basicUserInfo?.rankName} / {basicUserInfo?.userName}
                                    </div>
                                    <div style={{ fontSize: 10, color: 'var(--app-muted)' }}>المنصب</div>
                                </div>
                            </div>
                        </Dropdown>

                        <img
                            src="/wanted.png"
                            height={42}
                            width={42}
                            style={{ borderRadius: 12, objectFit: 'cover' }}
                            alt=""
                        />
                    </div>
                </div>

                <Layout
                    style={{
                        marginTop: HEADER_HEIGHT,
                        height: `calc(100vh - ${HEADER_HEIGHT}px)`,
                        background: 'var(--app-page-bg)',
                        overflow: 'hidden',
                    }}
                >
                    <Sider
                        className="mainlayout-sider"
                        width={254}
                        collapsedWidth={74}
                        collapsed={collapsed}
                        trigger={null}
                        collapsible
                        style={{
                            position: 'fixed',
                            top: HEADER_HEIGHT,
                            bottom: 0,
                            [sidebarInlineStart]: 0,
                            zIndex: 900,
                            background: 'var(--app-sidebar-bg)',
                            overflow: 'hidden',
                            borderLeft: arlang ? 'none' : '1px solid var(--app-border)',
                            borderRight: arlang ? '1px solid var(--app-border)' : 'none',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: arlang
                                ? '8px 0 28px rgba(15,23,42,.04)'
                                : '-8px 0 28px rgba(15,23,42,.04)',
                        }}
                    >
                        <div
                            style={{
                                padding: '12px 10px 8px',
                                borderBottom: '1px solid var(--app-border)',
                            }}
                        >
                            <Button
                                type="text"
                                block
                                icon={
                                    collapsed ? (
                                        <MenuUnfoldOutlined style={{ color: 'var(--app-muted)' }} />
                                    ) : (
                                        <MenuFoldOutlined style={{ color: 'var(--app-muted)' }} />
                                    )
                                }
                                onClick={() => setCollapsed((v) => !v)}
                                style={{
                                    background: 'var(--app-hover)',
                                    border: '1px solid var(--app-border)',
                                    borderRadius: 12,
                                    height: 40,
                                }}
                            />
                        </div>

                        <div
                            className="mainlayout-sidebar-scroll"
                            style={{
                                flex: 1,
                                padding: '8px 8px 10px',
                                overflowY: 'auto',
                                minHeight: 0,
                            }}
                        >
                            <SectionLabel label="الرئيسية" collapsed={collapsed} />
                            <NavItem
                                to="/"
                                icon={<HomeOutlined />}
                                label="الصفحة الرئيسية"
                                collapsed={collapsed}
                            />

                            <SectionLabel label="إدارة بيانات الأشخاص" collapsed={collapsed} />
                            <NavItem
                                to="/Indexpersons"
                                icon={<UsergroupAddOutlined />}
                                label="بيانات الأشخاص"
                                collapsed={collapsed}
                            />

                            <SectionLabel label="التعرف" collapsed={collapsed} />
                            <NavItem
                                to="/RecognitionPage"
                                icon={<SearchOutlined />}
                                label="التعرف من خلال صور"
                                collapsed={collapsed}
                            />
                            <NavItem
                                to="/recognition/results"
                                icon={<CheckCircleOutlined />}
                                label="سجل التعرف"
                                badge={recEvents.length}
                                collapsed={collapsed}
                            />

                            <SectionLabel label="الكاميرات" collapsed={collapsed} />
                            <NavItem
                                to="/cameras"
                                icon={<VideoCameraOutlined />}
                                label="إدارة الكاميرات"
                                collapsed={collapsed}
                            />
                            <NavItem
                                icon={<ThunderboltOutlined />}
                                label="المراقبة المباشرة"
                                collapsed={collapsed}
                                onClick={() => {
                                    window.open('/cameras/live', '_blank', 'noopener');
                                    setTimeout(() => window.open('/cameras/results', '_blank', 'noopener'), 300);
                                }}
                            />
                            <NavItem
                                to="/cameras/monitor"
                                icon={<ControlOutlined />}
                                label="ضبط الجهاز مع الكامرات"
                                collapsed={collapsed}
                            />

                            {(isAdmin || isManager) && (
                                <>
                                    <SectionLabel label="المستخدمين والصلاحيات" collapsed={collapsed} />
                                    <NavItem
                                        to="/Users"
                                        icon={<UserSwitchOutlined />}
                                        label="إدارة المستخدمين"
                                        collapsed={collapsed}
                                    />
                                </>
                            )}

                            {isAdmin && (
                                <>
                                    <SectionLabel label="النظام" collapsed={collapsed} />
                                    <NavItem
                                        icon={<SettingOutlined />}
                                        label="إعدادات النظام"
                                        collapsed={collapsed}
                                        onClick={openSettings}
                                    />
                                </>
                            )}
                        </div>

                        <div
                            style={{
                                padding: '10px 8px',
                                borderTop: '1px solid var(--app-border)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 8,
                                flexShrink: 0,
                                background: 'var(--app-surface-2)',
                            }}
                        >
                            <ChatWidget currentUserId={currentUserId} />

                            <Button
                                danger
                                block
                                icon={<LogoutOutlined />}
                                onClick={handleLogout}
                                style={{ borderRadius: 12, height: 40, fontWeight: 700 }}
                            >
                                {!collapsed && 'خروج'}
                            </Button>
                        </div>
                    </Sider>

                    <Content
                        style={{
                            marginRight: contentMarginRight,
                            marginLeft: contentMarginLeft,
                            height: `calc(100vh - ${HEADER_HEIGHT}px)`,
                            background: 'var(--app-page-bg)',
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
                                background: 'var(--app-footer-bg)',
                                borderTop: '1px solid var(--app-border)',
                                color: 'var(--app-footer-text)',
                                fontSize: 12,
                                padding: '12px 24px',
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
