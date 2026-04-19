import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import {   AddUser, ManageMinistryListtoltap, SelectList ,} from "../../Interfaces/GeneralInterface";
import { Col, Form,Input, InputNumber, Row, Select, Skeleton, Switch } from "antd";
import useForm from "antd/es/form/hooks/useForm";
import {useUserRoles } from "../../hooks/useApi";
import { validateArabicName } from "../validate";
import { usePersonSearch } from "../../hooks/usePersonSearch";
import { Tooltip } from "antd/lib";
import { setLoading } from "../../../app/reducers/modalSlice";

 
 

export interface CreateUpdateProps {
    record: AddUser;
    onSubmit?: (values: AddUser) => void;
    createLevel: SelectList[];
    units: SelectList[];
    ranks: SelectList[];
    orgunits: SelectList[];
    mangeministry: ManageMinistryListtoltap[];
}

const CreateUpdate = forwardRef(({ record, onSubmit, createLevel, units, orgunits, ranks, mangeministry }: CreateUpdateProps, ref) => {

    const [form] = useForm();
    const { data: roles } = useUserRoles(record.id);
  
    const [searchNo, setSearchNo] = useState<number | null>(null);
    const [levels, setLevels] = useState<SelectList[]>(createLevel)

    const { data: person } = usePersonSearch(searchNo);
 
    useEffect(() => {

        if (roles) {
            const updated = {
                ...record,
                roleWithUserDto: roles,
            };
            form.setFieldsValue(updated);
        }

    }, [record, roles]);

    useEffect(() => {
        setLevels(createLevel)
    }, [createLevel]);

    useImperativeHandle(ref, () => ({
        submit: () => {
            form.submit();
        },
    }));

    const handleFinish = (values: AddUser) => {
        onSubmit?.(values);
    };


    const handlePersonNoChange = (value: number | null) => {

        
        if (value && value !== 0) {
            setSearchNo(value);
        }
    }
    const handlePersonNoBlur = async (e:any) => {
        setLoading(true);
        try {
            const value = e.target.value;
            // افترض أن هذه الدالة تقوم بالتحقق من الرقم أو أي عملية
            await handlePersonNoChange(value);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
       
        if (person) {
            form.setFieldsValue({
                ...record,
                roleWithUserDto: roles,
                personNo:searchNo,
                personName: person.name,
                personPosition: person.position,
                rankId: person.rankId,
                originalUintUser: person.orginalUserUnit,
            });
          
        }
        
    }, [person, form]);



    //const ministryOptions = mangeministry.map((ministry) => ({
    //    label: (
    //        <Tooltip


    //            title={
    //                <div style={{ height:'100%',overflowY:'auto',padding:'10px',display:'flex',flexDirection:'column'  }}>
    //                    {ministry.targetsLists.map((target) => (
    //                        <h5 key={target.value}>{target.label}</h5>
    //                    ))}
    //                </div>
    //            }
    //       getPopupContainer={(trigger) => trigger.parentElement?.parentElement ?? document.body}
    //        >
    //            {ministry.label}
    //        </Tooltip>
    //    ),
    //    value: ministry.value,
    //}));
    const ministryOptions = mangeministry.map((ministry) => ({
        label: (
            <Tooltip
                title={
                    <div
                        style={{
                            maxHeight: "200px",
                            overflowY: "auto",
                            padding: "10px 14px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                            backgroundColor: "#fff",
                        }}
                    >
                        {ministry.targetsLists.length > 0 ? (
                            ministry.targetsLists.map((target) => (
                                <div
                                    key={target.value}
                                    style={{
                                        fontSize: "13px",
                                        color: "#333",
                                        borderBottom: "1px solid #f0f0f0",
                                        paddingBottom: "4px",
                                    }}
                                >
                                    {target.value } {target.label}
                                </div>
                            ))
                        ) : (
                            <span style={{ color: "#999", fontSize: "13px" }}>لا توجد أهداف</span>
                        )}
                    </div>
                }
                placement="right"
                 
                getPopupContainer={(trigger) => trigger.parentElement?.parentElement ?? document.body}
            >
                <span style={{ cursor: "pointer", color: "#1a237e", fontWeight: 500 }}>
                    {ministry.label}
                </span>
            </Tooltip>
        ),
        value: ministry.value,
    }));

    return (
        <Form key={record?.id || 'new'}  form={form} onFinish={handleFinish} autoComplete="off" layout="vertical">
            <Row gutter={16} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Col span={12}>
                    <h5 className="w-100 text-center">بيانات المستخدم</h5>

                    <Form.Item
                        hidden
                        hasFeedback
                        label="ت"
                        name="id"

                    >
                        <Input />
                    </Form.Item>
                    <Col span={24}>
                        <Form.Item
                            hasFeedback
                            label="وحدة النظام"
                            name="ur_no"
                            validateTrigger="onBlur"

                        >
                            <Select
                                getPopupContainer={(triggerNode) => triggerNode.parentNode}
                                showSearch
                                /* disabled={record.id.length > 0} */
                                options={units}
                                placeholder="بحث"
                                optionFilterProp="label"
                                filterOption={(input, option) =>
                                    (option?.label?.toString().toLowerCase() || '').includes(input.toLowerCase())
                                }
                            />
                        </Form.Item>
                    </Col>

                    <Col span={24}>
                        <Form.Item
                            hasFeedback
                            label="وحدة المستخدم "
                            name="originalUintUser"
                            validateTrigger="onBlur"

                        >
                            <Select
                                getPopupContainer={(triggerNode) => triggerNode.parentNode}
                                showSearch
                                /*disabled={record.id.length>0} */
                                options={orgunits}
                                placeholder="بحث"
                                optionFilterProp="label"
                                filterOption={(input, option) =>
                                    (option?.label?.toString().toLowerCase() || '').includes(input.toLowerCase())
                                }
                            />



                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item
                            hasFeedback
                            label="عمق الوحدات"
                            name="createLevel"
                            validateTrigger="onBlur"
                            
                        >
                            <Select
                                getPopupContainer={(triggerNode) => triggerNode.parentNode}
                                options={levels}
                                
                            />
                        </Form.Item>
                    </Col>
                    <Form.Item
                        hasFeedback
                        label="الرقم الاحصائي"

                        name="personNo"

                        validateTrigger="onBlur"
                        rules={[
                            {
                                required: true,
                                message: 'الرقم الاحصائي مطلوب!',
                            },
                            {
                                pattern: new RegExp(/^\d{8,10}$/),
                                message: 'يجب ان يحتوي الرقم الاحصائي  على ارقام فقط!',
                            },
                        ]}
                    >
                        <InputNumber className="w-100" placeholder="الرقم الاحصائي مطلوب" onBlur={handlePersonNoBlur} />
                    </Form.Item>


                    <Form.Item
                        hasFeedback
                        label="الرتبة"
                        name="rankId"
                        validateTrigger="onBlur">
                        <Select
                            getPopupContainer={(triggerNode) => triggerNode.parentNode}
                            options={ranks}  ></Select>
                    </Form.Item>

                    <Form.Item
                        hasFeedback
                        label="الاسم الكامل"
                        name="personName"

                        validateTrigger="onBlur"
                        rules={[

                            { validator: validateArabicName }
                        ]} >
                        <Input placeholder="الاسم الكامل" />
                    </Form.Item>


                    <Form.Item
                        hasFeedback
                        label="المنصب"
                        name="personPosition"
                        validateTrigger="onBlur"
                    >

                        <Input placeholder="المنصب مطلوب" />
                    </Form.Item>
                    <Form.Item
                        hasFeedback
                        label="رقم الهاتف"
                        name="cisco"
                        validateTrigger="onBlur"
                        rules={[
                            {
                                required: true,
                                message: 'رقم الهاتف مطلوب!',
                            },
                            {

                                pattern: new RegExp(/^\d{5,10}$/),
                                message: 'يجب ان يحتوي رقم الهاتف  على ارقام فقط!',
                            },
                        ]}>

                        <InputNumber className="w-100" placeholder="*********07" />
                    </Form.Item>
                    <Form.Item
                        hasFeedback
                        label="الحساب"
                        name="email"
                        validateTrigger="onBlur"
                        rules={[
                            {
                                required: true,
                                message: 'الحساب مطلوب!',
                            },
                            {
                                pattern: /^[A-Za-z0-9._%+-]+$/,
                                message: 'صيغة الحساب غير صحيحة!',
                            },
                        ]}
                    >
                        <Input
                            addonBefore="mod.com@"
                            placeholder="ادخل اسم الحساب فقط"
                        />
                    </Form.Item>

                    <Col span={12} >

                        <Form.Item
                            hasFeedback
                            label="مراقبة الموارد"
                            name="hrTest"
                            validateTrigger="onBlur"
                            valuePropName="checked"

                        >
                            <Switch checkedChildren="فعال" unCheckedChildren="غير فعال" />
                        </Form.Item>

                    </Col>

                    <Col span={24}>
                        <Form.Item
                          
                            hasFeedback
                            label="ممثلي الوزارة"
                            name="unitUser"
                            validateTrigger="onBlur"
                            tooltip="هنا يتم اختيار الوحدات والممثلين ممن تم تخصيص الاهداف لهم"
                        >
                            <Select
                                getPopupContainer={(triggerNode) => triggerNode.parentNode}
                                mode="multiple" style={{ width: '100%' }} options={ministryOptions} />
                        </Form.Item>


                    </Col>

                </Col>
                <Col span={10} style={{ minHeight: '100%', overflowY: 'auto', position: 'sticky', top: 0, zIndex: '2' }}
                    className="role-col">
                    <h6 className="w-100 text-center title pt-3" >صلاحيات المستخدم</h6>
                    {!roles ? (
                        <Skeleton active paragraph={{ rows: 6 }} />
                    ) : (
                        <Form.List name="roleWithUserDto">
                            {(fields) => (
                                <>
                                    {fields.map((field) => {
                                        const roleData = form.getFieldsValue().roleWithUserDto?.[field.name];
                                        if (!roleData) return <Skeleton active key={field.name} />;

                                        return (
                                            <div key={field.name} className="p-2">
                                                <Form.Item hidden name={[field.name, 'roleName']} noStyle>
                                                    <Input />
                                                </Form.Item>
                                                <Form.Item hidden name={[field.name, 'roleNameAR']} noStyle>
                                                    <Input />
                                                </Form.Item>

                                                <Form.Item
                                                    validateTrigger="onBlur"
                                                    hasFeedback
                                                    name={[field.name, 'isSelected']}
                                                    valuePropName="checked"
                                                >
                                                    <Switch
                                                        className="w-100"
                                                        checkedChildren={roleData.roleNameAR}
                                                        unCheckedChildren={roleData.roleNameAR}
                                                    />
                                                </Form.Item>
                                            </div>
                                        );
                                    })}
                                </>
                            )}
                        </Form.List>
                    )}


                </Col>

            </Row>
        </Form>

    );


});

export default CreateUpdate;