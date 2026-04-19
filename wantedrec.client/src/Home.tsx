import { Carousel, Col, Row, } from 'antd';
import Marquee from 'react-fast-marquee';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../app/store';
import { DataIndexValue } from './Interfaces/functions';
import { useTranslation } from 'react-i18next';
import { AimOutlined, CalendarOutlined, FilePdfOutlined, GoldOutlined, TeamOutlined, CameraOutlined, ScanOutlined , PaperClipOutlined, PictureOutlined, UsergroupDeleteOutlined } from '@ant-design/icons';
import { setModal } from '../app/reducers/modalSlice';
import UserPdf from './pages/SpniPdf/userPdf';
import { RULES } from './Interfaces/roles';
import { useImage, useNews } from './hooks/useApi';
import { Box } from '@mui/material';

const Home = () => {
    const { arlang } = useSelector((state: RootState) => state.setting);
    const { t } = useTranslation();
    const dispatch = useDispatch<AppDispatch>();
    const { userRoles } = useSelector((state: RootState) => state.auth.loginResponse);
    const Gools: boolean = userRoles?.includes(RULES.Gools);
    const RagManager: boolean = userRoles?.includes(RULES.RajManager);
    const Admin: boolean = userRoles?.includes(RULES.Admin);
    const News: boolean = userRoles?.includes(RULES.News);
    const Reader: boolean = userRoles?.includes(RULES.Reader);
    //const Reports: boolean = userRoles?.includes(RULES.Reports);

    const { data: newss } = useNews();
    const { data: Images } = useImage();
    const userPdfView = () => {
        dispatch(setModal({
            isOpen: true, content: <UserPdf />, Width: 500,
        }))
    }

    return (
        <>

            <Carousel autoplay className="c-img-container" >
                {Images?.map(i => <img src={`${i.imageFileName}`} className="c-img" key={i.id} />)}

                {/*<img src="/1.jpg" alt="logo" />  */}
                {/*<img src="/2.jpg" alt="logo" />  */}
                {/*<img src="/3.jpg" alt="logo" />  */}

            </Carousel>
            <Row className="sticky-top box-sh mt-2 " >
                <Marquee speed={70} gradient={false} pauseOnHover={true} style={!arlang ? { direction: 'rtl', width: '150%' } : { direction: 'ltr', width: '150%' }} direction={arlang ? "right" : "left"}>
                    {newss?.map(i => i.can ?
                        <p key={i.id} className="mt-3">
                            <span className="news-span news-title"> {DataIndexValue(arlang, "applicationUserId", i)} </span>
                            <span className="news-span news-content"> {DataIndexValue(arlang, "details", i)}           </span>
                            <span className="news-span news-logo">  <img src="/Raj1.png" alt="logo" /> </span>
                        </p>
                        : null)
                    }
                </Marquee>
            </Row >

            <Box>
                <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 32 }} className="m-3 cards-home" >


 
      





 
                        <Col className="col-sm-12 col-md-6 col-lg-4  ">

                        <Link to="/Indexpersons"  >
                            <div className="text-decoration-none card-block-main" >
                                <div className="card   text-dark   order-card">
                                    <div className="card-block">
                                        <div style={{ marginTop: "0px", display: "Flex", justifyContent: "center", }}>
                                            <TeamOutlined style={{ color: '#C7253E' }} />
                                        </div>
                                        <h5 className="text-center">  {t('personpage')} </h5>

                                    </div>
                                </div>
                            </div>


                        </Link>


                    </Col>
                    <Col className="col-sm-12 col-md-6 col-lg-4  ">

                        <Link to="/RecognitionPage"  >
                            <div className="text-decoration-none card-block-main" >
                                <div className="card   text-dark   order-card">
                                    <div className="card-block">
                                        <div style={{ marginTop: "0px", display: "Flex", justifyContent: "center", }}>
                                            <ScanOutlined style={{ color: '#C7253E' }} />
                                        </div>
                                        <h5 className="text-center">  {t('recognizepage')} </h5>

                                    </div>
                                </div>
                            </div>


                        </Link>


                    </Col>



                </Row>

            </Box>
        </>

    )
};
export default Home;