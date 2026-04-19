import { Button, Col, Form, Input, Row, Typography } from "antd";
import { resetPass } from '../../Interfaces/GeneralInterface';
import { useForm } from "antd/es/form/Form";
import { useSelector } from 'react-redux';
import { RootState } from '../../../app/store';
import { useNavigate } from 'react-router-dom';
import Loading from '../../compontents/loading';
import axios from "../../api";
import { useState } from "react";
import { LockOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const ChangePassword = () => {
    const navigate = useNavigate();
    const [form] = useForm<resetPass>();
    const { loading, loginResponse } = useSelector((state: RootState) => state.auth);
    const [error, setError] = useState<boolean>(false);

    const onFinish = (values: resetPass) => {
        values.token = loginResponse.token;
        axios.post(`/Account/PasswordNew`, values)
            .then(res => {
                if (res.data.length === 0) {
                    navigate('/login');
                    setError(false);
                }
                else
                    setError(true);
            });
    };

    return (
        <div dir="rtl" style={{ background: '#f5f7fa', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            {loading && <Loading />}
            {!loginResponse.loginStatus ? <h1>{loginResponse.message}</h1> : null}
            <Row style={{   maxWidth: '1000px', background: '#fff', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
                <Col span={12} style={{ padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
                    <Text style={{ fontSize: '20px', color: '#004e92', fontFamily: 'Amiri-Bold', marginBottom: '20px', display: 'block' }}>يجب عليك إعادة تعيين كلمة المرور الافتراضية للاستمرار</Text>
                    {error && <Row className="w-100 d-flex justify-content-center">
                        <div style={{ width: '100%', fontWeight: 900 }}>

                            <h4 className="text-danger bold">كلمة المرور غير قوية</h4>
                            <ul className="w-100" >
                                <li className="text-danger bold">يجب أن تحتوي على حروف كبيرة وحروف صغيرة</li>
                                <li className="text-danger bold">يجب أن تحتوي على أرقام</li>
                                <li className="text-danger bold">يجب أن تحتوي على رموز </li>
                                <li className="text-danger bold">لا يمكن استخدام كلمة (Password) أو اي جزء منها </li>
                            </ul>

                        </div>
                    </Row>
                    }
                    <Form
                        form={form}
                        name="trigger"
                        layout="vertical"
                        style={{ width: '100%', maxWidth: '350px' }}
                        onFinish={onFinish}
                        autoComplete="off"
                    >
                        <Form.Item<resetPass>
                            label="كلمة المرور الجديدة"
                            name="newPassword"
                            rules={[{ required: true, message: 'كلمة المرور الجديدة مطلوبة!' }]}
                        >
                            <Input.Password />
                        </Form.Item>
                        <Form.Item
                            name="confirmPassword"
                            label="تأكيد كلمة المرور"
                            dependencies={['newPassword']}
                            rules={[
                                { required: true, message: 'الرجاء تأكيد كلمة المرور' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('newPassword') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('كلمتا المرور غير متطابقتين'));
                                    },
                                }),
                            ]}
                        >
                            <Input.Password size="large" prefix={<LockOutlined />} />
                        </Form.Item>
                        <Form.Item<resetPass>
                            name="token"
                            hidden
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item wrapperCol={{ span: 24 }} style={{ textAlign: 'center' }}>
                            <Button type="primary" htmlType="submit" style={{ backgroundColor: 'lightskyblue', color: 'white', fontFamily: 'Amiri-Bold' }}>
                                إعادة تعيين كلمة المرور
                            </Button>
                        </Form.Item>
                    </Form>
                </Col>
                <Col span={12} style={{ padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#004e92' }}>
                    <Title level={1} style={{ color: 'white', fontFamily: 'Amiri-Bold', marginBottom: '20px' }}>S.P.N.I</Title>
                    <Title level={3} style={{ color: 'white', fontFamily: 'Amiri-Bold', textAlign: 'center' }}>نظام متابعة الأهداف الاستراتيجية</Title>
                    <div className='image' style={{ marginTop: '30px', width: '100%', textAlign: 'center' }}>
                        <img src={'/global-network.png'} alt="Global Network" style={{ maxWidth: '80%', height: 'auto' }} />
                    </div>
                </Col>
            </Row>
        </div>
    );
};

export default ChangePassword;
