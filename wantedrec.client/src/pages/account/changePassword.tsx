
 
import {   Button,  Card,Form, Input, Row } from "antd";
import {   resetPass } from '../../Interfaces/GeneralInterface';
import { useForm } from "antd/es/form/Form";
import {  useSelector } from 'react-redux';
import {   RootState } from '../../../app/store';
import {  useNavigate } from 'react-router-dom';
import axios from "../../api";
import { useState } from "react";
import { LockOutlined } from "@ant-design/icons";

const ChangePassword = () => {

    const navigate = useNavigate();
    const [form] = useForm<resetPass>();
    const [error, setError] = useState<boolean>(false);

    
    const {loginResponse } = useSelector((state: RootState) => state.auth)
    
  
   
 
    const onfinish = (values: resetPass  ) => {
        values.token = loginResponse.token;
            axios.post(`/Account/PasswordNew`, values)
                .then(res => {
                 
                    if (res.data.length ===0)
                    {
                        navigate('/login');
                        setError(false);
                    }
                    else
                        setError(true);
                })
        
    };

    
     
    return (


        <>
           
                    
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                fontFamily: 'Amiri-Bold',
                position: 'relative'
            }}>
                {/* Left Side - Login */}
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Card
                        style={{
                            width: 520,
                            padding: '30px 20px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                            borderRadius: '15px',
                            animation: 'fadeIn 1s',
                        }}
                        className="bg-card"
                    >

                        <h2 style={{ textAlign: 'center', color: '#fff', marginBottom: 10 }}>
                            عليك اعادة تعيين كلمة المرور الافتراضية للاستمرار
                        </h2>
                       
                      
                        {error &&<Row className="w-100 d-flex justify-content-center">
                            <div style={{  width:'100%',fontWeight:900}}>
                                
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
                            layout="vertical"
                            onFinish={onfinish}
                        >
                          
                            <Form.Item<resetPass>
                                label="user"
                                name="token"
                                hidden
                            >

                                <Input />
                            </Form.Item>
                            <Form.Item
                                name="newPassword"
                                label="كلمة المرور الجديدة"
                                rules={[{ required: true, message: 'الرجاء إدخال كلمة المرور' }]}
                            >
                                <Input.Password size="large" prefix={<LockOutlined />} />
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
                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    block
                                    style={{ backgroundColor: '#123458', borderColor: '#123458' }}
                                    size="large"
                                >
                                    تغيير كلمة المرور الأفتراضية
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card>
                </div>

                {/* Right Side - Branding */}
                <div style={{
                    flex: 1,
                    color: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'start',
                    alignItems: 'center',
                    marginTop: 70,
                    marginLeft: 100
                }}>
                 
                    <h1 style={{ fontSize: 32, textAlign: 'center', marginBottom: 10,textTransform:'uppercase' }}>Armed Forces Readiness System</h1>
                    <h2 style={{ fontSize: 24, textAlign: 'center', marginBottom: 10 }}>نظام جاهزية القوات المسلحة</h2>
                  
                </div>

                
            </div>
             
        </>
    )
};
export default ChangePassword;