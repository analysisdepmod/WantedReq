import 'bootstrap/dist/css/bootstrap.min.css';
import { Route, Routes } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { CloseModal } from '../app/reducers/modalSlice';
import { Layout, Modal } from 'antd';
import Loading from './compontents/loading';
import { AppDispatch, RootState } from '../app/store';
import './App.css'
import { RULES } from './Interfaces/roles';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import NewTab from './compontents/NewTab';
import Home from './Home';
import Pdfer from './compontents/Pdfer';
import ListNews from './pages/news/ListNews';
import ListTargetsMangeMinistry from './pages/TargetsMangeMinistry/ListTargetsMangeMinistry';
import PrivateRoute from './layouts/PrivateRoute';
import ListImage from './pages/image/ListImage';
import ListISpniPdf from './pages/SpniPdf/ListISpniPdf';
import AnonymousLayout from './layouts/AnonymousLayout';
import ChangePassowrd from './pages/account/changePassowrd';
import MainLayout from './layouts/MainLayout';
import Accessdenied from './Accessdenied';
import Login from './pages/account/Login';
import ListSubMangeMinistry from './pages/SubMangeMinistry/ListSubMangeMinistry';
import ListofficerInfo from './pages/officerInfo/ListofficerInfo';
import ListTarget from './pages/target/ListTarget';
import ListSpniUnit from './pages/spniunit/ListSpniUnit';
import Users from './pages/account/ListUsers';
import ListspiAttitude from './pages/spniAttitude/ListspiAttitude';
import Notfound from './Notfound';
import CreateModal from './compontents/CreateModal';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import IndexPersons from './pages/persons/IndexPersons';
import EditPerson from './pages/persons/EditPerson';
import AddPersonPage from './pages/persons/AddPersonPage';
import PersonDetailPage from './pages/persons/Persondetailpage';
import RecognitionPage from './pages/recognition/RecognitionPage';
import CamerasPage from './pages/cameras/CamerasPage';
import RecognitionResultsPage from './pages/recognition/RecognitionResultsPage';
import PersonRecognitionsPage from './pages/recognition/PersonRecognitionsPage';

// ── Camera pages ─────────────────────────────────────────
// monitor يجب أن يُستورد قبل CameraDetailPage
import CamerasMonitorPage from './pages/cameras/CamerasMonitorPage';
import CameraDetailPage from './pages/cameras/CameraDetailPage';
import CamerasManagePage from './pages/cameras/CamerasManagePage';
import LiveCamerasPage from './pages/cameras/LiveCamerasPage';
import LiveResultsPage from './pages/cameras/LiveResultsPage';

function App() {
    const { modalIcon, content, isOpen, Width, title, loading } = useSelector((state: RootState) => state.modal);
    const { dir, locale } = useSelector((state: RootState) => state.setting);
    const dispatch = useDispatch<AppDispatch>();
    const dialogProps = useSelector((state: RootState) => state.dialog);
    const { i18n } = useTranslation();

    useEffect(() => {
        i18n.changeLanguage(locale);
    }, [i18n, locale]);

    return (
        <Layout dir={dir}>
            <ToastContainer position="bottom-left" autoClose={4000} />

            <Modal
                key={Math.random()}
                className="my-custom-class"
                title={<div style={{ fontSize: '14px' }}>{title}{modalIcon}</div>}
                centered
                open={isOpen}
                onCancel={() => dispatch(CloseModal(false))}
                footer=""
                width={Width}
            >
                <div className="content-m" dir={dir}>
                    {content}
                    {loading && <Loading />}
                </div>
            </Modal>

            <CreateModal {...dialogProps} />

            <Routes>
                {/* ════════════════════════════════════════
                    Main Layout — requires login
                ════════════════════════════════════════ */}
                <Route path='/' element={<MainLayout />}>

                    {/* Persons */}
                    <Route path='Indexpersons' element={<IndexPersons />} />
                    <Route path='persons/:id' element={<PersonDetailPage />} />
                    <Route path='addperson' element={<AddPersonPage />} />
                    <Route path='editperson/:id' element={<EditPerson />} />

                 
                     <Route path='cameras'         element={<CamerasManagePage />} />
                     <Route path='cameras/monitor' element={<CamerasMonitorPage />} />
                     <Route path='cameras/live'    element={<LiveCamerasPage />} />
                     <Route path='cameras/results' element={<LiveResultsPage />} />
                     <Route path='cameras/:id'     element={<CameraDetailPage />} />

                  
                     <Route path='RecognitionPage'              element={<RecognitionPage />} />
                     <Route path='recognition/results'          element={<RecognitionResultsPage />} />
                     <Route path='recognition/person/:personId' element={<PersonRecognitionsPage />} />

                    {/* Private — Admin / General */}
                    <Route path='/' element={<PrivateRoute allowedRules={[
                        RULES.Admin, RULES.Reader, RULES.Reports,
                        RULES.RajManager, RULES.Manager, RULES.AllUnits,
                        RULES.News, RULES.Gools, RULES.Musadaqa,
                    ]} />}>
                        <Route path='/' element={<Home />} />
                        <Route path='NewTab/:targetId/:manageMinistryId' element={<NewTab />} />
                    </Route>

                    {/* Private — Goals */}
                    <Route path='/' element={<PrivateRoute allowedRules={[RULES.Admin, RULES.Reader, RULES.Gools]} />}>
                        <Route path='ListspiAttitude' element={<ListspiAttitude />} />
                    </Route>

                    {/* Private — Users */}
                    <Route path='/' element={<PrivateRoute allowedRules={[RULES.Admin, RULES.Manager, RULES.Reports]} />}>
                        <Route path='Users' element={<Users />} />
                    </Route>

                    {/* Private — News */}
                    <Route path='/' element={<PrivateRoute allowedRules={[RULES.News, RULES.Admin]} />}>
                        <Route path='ListNews' element={<ListNews />} />
                    </Route>

                    {/* Private — Admin tools */}
                    <Route path='/' element={<PrivateRoute allowedRules={[RULES.Admin, RULES.RajManager, RULES.Tarmez]} />}>
                        <Route path='ListSpniUnit' element={<ListSpniUnit />} />
                        <Route path='ListImage' element={<ListImage />} />
                        <Route path='ListISpniPdf' element={<ListISpniPdf />} />
                        <Route path='ListTarget' element={<ListTarget />} />
                        <Route path='ListofficerInfo' element={<ListofficerInfo />} />
                        <Route path='ListSubMangeMinistry' element={<ListSubMangeMinistry />} />
                        <Route path='ListTargetsMangeMinistry' element={<ListTargetsMangeMinistry />} />
                        <Route path='NewTab/:targetId/:manageMinistryId' element={<NewTab />} />
                    </Route>

                </Route>

                {/* ════════════════════════════════════════
                    Anonymous Layout — no login required
                ════════════════════════════════════════ */}
                <Route path='/' element={<AnonymousLayout />}>
                    <Route path='Pdfer' element={<Pdfer />} />
                    <Route path='login' element={<Login />} />
                    <Route path='change' element={<ChangePassowrd />} />
                    <Route path='accessdenied' element={<Accessdenied />} />
                    <Route path='notfound' element={<Notfound />} />
                </Route>

            </Routes>
        </Layout>
    );
}

export default App;