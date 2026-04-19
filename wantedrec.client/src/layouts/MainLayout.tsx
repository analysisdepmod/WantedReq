import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Content, Footer, Header } from 'antd/es/layout/layout';
import { logout } from '../../app/reducers/authSlice'
import {
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    UsergroupDeleteOutlined,
    CalendarOutlined,
    GlobalOutlined,
    InsertRowRightOutlined,
    GoldOutlined,
    LogoutOutlined,
    PictureOutlined,
    UserSwitchOutlined,
    UsergroupAddOutlined,
    AimOutlined,
    PaperClipOutlined,
    FilePdfOutlined,
    PlusOutlined,
    SettingOutlined,
 
}
    from '@ant-design/icons';
import {  Button,  Layout, Menu, MenuProps } from 'antd';
import {  useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState} from '../../app/store';
import UserPdf from '../pages/SpniPdf/userPdf';
import { setModal } from '../../app/reducers/modalSlice';
import { RULES } from '../Interfaces/roles';
import {  changeDiraction } from '../../app/reducers/settingSlice';
import { useTranslation } from 'react-i18next';
import arEG from 'antd/locale/ar_EG';
import enUs from 'antd/locale/en_Us';
import {ensureStart } from '../signalr/signalrConnections';
import { getCurrentUserId } from '../utils/auth';
import ChatWidget from '../compontents/chat/ChatWidget';
const notificationAudio = new Audio("/sounds/message.wav");
import { getChatConnection } from "../signalr/signalrConnections";
const chatConnection = getChatConnection();
import { getNotificationConnection } from "../signalr/signalrConnections";
const notificationConnection = getNotificationConnection();
import { getPresenceConnection } from "../signalr/signalrConnections";

import { setting    } from '../Interfaces/GeneralInterface';
import Settings from '../compontents/Settings';
const presenceConnection = getPresenceConnection();
/*import Loading from '../compontents/loading';*/



type MenuItem = Required<MenuProps>['items'][number];

function getItem(
    label: React.ReactNode,
    key: React.Key,
    icon?: React.ReactNode,
    children?: MenuItem[],
    type?: 'group',
): MenuItem {
    return {
        key,
        icon,
        children,
        label,
        type,
    } as MenuItem;

}

const initial: setting = {

numberWord:0
}
 

function MainLayout() {
 
    const { t } = useTranslation();
    const currentUserId = getCurrentUserId() ?? "";

    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);
    const { arlang } = useSelector((state: RootState) => state.setting);
    const { userRoles, basicUserInfo } = useSelector((state: RootState) => state.auth.loginResponse);
    const Admin: boolean = userRoles?.includes(RULES.Admin);
    const Manager: boolean = userRoles?.includes(RULES.Manager);
    const RagManager: boolean = userRoles?.includes(RULES.RajManager);
    const Gools: boolean = userRoles?.includes(RULES.Gools);
    //const Reports: boolean = userRoles?.includes(RULES.Reports);
    const Reader: boolean = userRoles?.includes(RULES.Reader);
    const News: boolean = userRoles?.includes(RULES.News);
    const Tarmez: boolean = userRoles?.includes(RULES.Tarmez);

    const userPdfView = () => {
        dispatch(setModal({
            isOpen: true, content: <UserPdf />, Width: 500,
         
        }))
    }
    
    useEffect(() => {
        const enableAudio = () => {
            try {
                notificationAudio.play().then(() => {
                    notificationAudio.pause(); // نوقفه فورًا
                    notificationAudio.currentTime = 0;
                });
            } catch (e) {
                console.warn("لم يتم تفعيل الصوت:", e);
            }

            window.removeEventListener("click", enableAudio);
        };

        window.addEventListener("click", enableAudio);
    }, []);

 
    useEffect(() => {
        ensureStart(chatConnection, "ChatHub");
        ensureStart(notificationConnection, "NotificationHub");
        ensureStart(presenceConnection, "PresenceHub");
    }, []);


    const openSetting = () => {

        dispatch(
            setModal(
                {
                    dialogIcon: <PlusOutlined />,
                    isOpen: true,
                    content: <Settings row={initial} flag={1} />,
                    width: 1100,
                    height: 900,
                    title: "Setting"
                })
        );
    };


    const items: MenuItem[] = [
       
        getItem(<div className="d-flex flex-column justify-content-center align-items-start  mb-2">
     

            <span className="logo-info  " > {basicUserInfo?.rankName}
                <span className="Slash"> / </span>
                {basicUserInfo?.userName} </span>
           
        </div>


            , '100', null),


        (!Manager || Admin) ? getItem((<Link to="/"  >
            <h1 className='d'>{t('home')} </h1>
        </Link>), '1', <GlobalOutlined style={{ color: '#C7253E' }} />) : null,
         


 

        Manager ? getItem(<h1 className='d'>{t('usersmangment')}</h1>, "12", <  UserSwitchOutlined style={{ color: '#C7253E'  }} />, [

            getItem((<Link to="/Users" className='d'  >
                <UsergroupAddOutlined style={{ color: '#C7253E'}} />&nbsp;
                {t('usersdata')}
            </Link>), '4'),

        ]):null,

        getItem((<Link to="/IndexPersons" className='d'  >
            <UsergroupAddOutlined style={{ color: '#C3263E' }} />&nbsp;
            {t('personpage')}
        </Link>), '800'),

        getItem((<Link to="/RecognitionPage" className='d'  >
            <UsergroupAddOutlined style={{ color: '#C3263E' }} />&nbsp;
            {t('recognizepage')}
        </Link>), '801'),


        (RagManager || Admin || News || Tarmez) ? getItem(<h1 className='d'>{t('systemMangment')}  </h1>, "", <InsertRowRightOutlined style={{ color: '#C7253E' }} />,
            [

 

  

 
 
         

                (RagManager || Admin || Tarmez) ? getItem((<Link to="/ListImage" className='d'>
                    {t('maintainthephotogallery')}
                </Link>), '5', < PictureOutlined style={{ color: '#C7253E' }} />):null,

                (RagManager || Admin || Tarmez) ? getItem((<Link to="/ListISpniPdf" className='d'>
                    {t('sustainingcontexts')}
                </Link>), '6', <FilePdfOutlined style={{ color: '#C7253E' }} />) : null,
                 

                (RagManager || Admin || Tarmez)? getItem(
                    <Link
                        to="/ListNews"
                        className='d'
                        onClick={(e) => {
                            e.preventDefault(); // يمنع الانتقال إلى الرابط
                            openSetting(); // تنفيذ الدالة المطلوبة
                        }}
                    >
                        الاعدادت {/*{t('maintainnotifications')}*/}
                    </Link>,
                    '15',
                    < SettingOutlined style={{ color: '#C7253E' }} />
                ) : null            

               

            ]
        ):null,
        //(RagManager || Admin||Gools||Reports) ? getItem((<Link to="/Reportes" className='d'>
        //    {t('reports')}
        //</Link>), '16', < SnippetsOutlined style={{ color: '#C7253E' }} />) : null, 
        !Manager?getItem((<a className="d " style={{ borderRadius: "1px",   backgroundColor: 'transparent', color: "black"   }} onClick={userPdfView} >
            {t('contexts') }</a>
              
        ), '17', <FilePdfOutlined style={{ color: '#C7253E' }} />)  :null


    ];
    const { Sider } = Layout;


   

    const logou = async () => {
        const x = await dispatch(logout())
        if (x) {
            // ['token', 'refresh_token', 'refresh_token_expiry'].forEach(item => localStorage.removeItem(item));
            navigate('/')
        }

    }
   
    const handleToggle = () => {
        if (arlang) {
            dispatch(changeDiraction({ dir: "ltr", locale: "en", applocale: { enUs }, arlang: false }));
        } else {
            dispatch(changeDiraction({ dir: "rtl", locale: "ar", applocale: { arEG }, arlang: true }));
        }
    }
       
   
    
    return (
        <>
        
           
            <Layout style={{ minHeight: '100vh' }}>
              
            <Layout>
                <Header className="header1" >
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            justifyContent: "space-between",
                            width: "100%"
                            }}>
                            
                        <img src={'/Raj1.png'} width="60" height="60"
                            style={{ marginTop: "0px" }} />
                        <div style={{ textAlign: "center"}} >
                                <h5 className="s">{basicUserInfo?.unitName}</h5>
                                <h4 className='s'>{t('systemName')} </h4>
                        </div>
                        <img src={'/wanted.png'} width="60" height="60" style={{ marginTop: "0px" }} />
                    </div>
                </Header>
            </Layout>
            <Layout>
                    <Sider className='sider-1' width={arlang? 250:300} trigger={null} collapsible collapsed={collapsed}
                style={{
                    overflow: 'hidden',
                    background: "white",
                    marginTop: '74px',
                    maxHeight: '100vh',
                    borderRadius: '15px',
                    
                }}>


                <Menu
                    defaultSelectedKeys={['1']}
                    defaultOpenKeys={['sub1']}
                    mode="inline"

                    items={items}

                        />
                 
                       

 
                        <div style={arlang ? { display: 'grid', position: 'fixed', right: 20, bottom: 10 } : { display: 'grid', position: 'fixed', bottom: 10 }}>
                            <ChatWidget currentUserId={currentUserId} /> 
                            <Button
                                shape="circle"
                                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                                onClick={() => setCollapsed(!collapsed)}
                                style={{ backgroundColor: " #427D9D", color: 'white', bottom: 10 }}
                            />
                            <Button
                                shape="circle"
                                onClick={handleToggle}
                                style={{ marginBottom: 10, color: 'white', backgroundColor: " #427D9D"    }}
                            >
                                {arlang ? 'EN' : 'AR'}
                            </Button>
                            <Button
                                shape="circle"
                                icon={<LogoutOutlined />}
                                onClick={logou}
                                style={{ backgroundColor:" #427D9D" ,color: 'white' }}
                            />
                    
                     
                        </div>
                        
                      



            </Sider>
                  
              <Layout  style={{ minHeight: 280, marginTop: '74px',marginBottom:'100px' }}>
              <Content
        
                        style={{
                            padding: '0 24px',
                            overflowY: 'auto',
                            height:'95vh'
                        }}
                    >
                            <div style={{minHeight:'90vh'} }> <Outlet /></div>
                            <Layout style={{ zIndex: 200 }}>
                                <Footer className="footer mt-3" style={{zIndex:100} }>
                                    {t('copyWrite') }
                                </Footer>

                            </Layout > 
                        </Content>
                      
            </Layout>
            </Layout>
             
            </Layout > 
        </>
    );


}

export default MainLayout;