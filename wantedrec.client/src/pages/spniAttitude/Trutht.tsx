import { Alert,Col, Form, Input, Row } from "antd";
import { forwardRef, useEffect, useImperativeHandle } from "react";
import { SpiAttitudeDtoview } from "../../Interfaces/GeneralInterface";
import { useForm } from "antd/es/form/Form";

export interface CreateUpdateProps {
    Model: SpiAttitudeDtoview;
    onSubmit?: (values: SpiAttitudeDtoview) => void;
}

const Trutht = forwardRef(({ Model, onSubmit }: CreateUpdateProps, ref) => {
    const [form] = useForm();
 

    useImperativeHandle(ref, () => ({
        submit: () => {
            form.submit();
        },
    }));

    useEffect(() => {
        form.setFieldsValue(Model);
    }, [form, Model]);

   

    const handleFinish = (values: SpiAttitudeDtoview) => {
         
       
        onSubmit?.(values);
    };

    return (
        <Form
            key={Model?.id || "new"}
            form={form}
            onFinish={handleFinish}
            autoComplete="off"
            layout="vertical"
        >
            <Row className="m-1">
                <Col span={24}>
                    {!Model.isTrue ? (
                        <Alert type="warning" message="يرجى التأكد انه سيتم مصادقة هذا القلم ولا يمكن تعديله بدون الغاء المصادقة" />
                    ) : (
                        <Alert type="error" message="سيتم الغاء مصادقة هذا القلم" />
                    )}
                </Col>
            </Row>

            <Row gutter={[12, 8]}>
                <Col span={24}>
                    <Form.Item hidden name="idSub">
                        <Input/>
                    </Form.Item>
                </Col>

                <Col span={24}>
                    <Form.Item className="highlight-year" label="السنة" name="year">
                        <p>{Model.year}</p>
                    </Form.Item>
                </Col>

                <Col span={24}>
                    <Form.Item className="highlight-year" label="الهدف" name="targetId">
                        <p>{Model.targetName}</p>
                    </Form.Item>
                </Col>

                <Col span={24}>
                    <Form.Item className="highlight-year" label="مسؤول البعثة" name="officerInfoId" hidden>
                        <p>{Model.officerInfoId}</p>
                    </Form.Item>
                    <Form.Item className="highlight-year" label="مسؤول البعثة" name="officerName">
                        <p>{Model.officerName}</p>
                    </Form.Item>
                </Col>

                <Col span={24}>
                    <Form.Item className="highlight-year" label="مسؤولية الوزارة" name="manageMinistryId" hidden>
                        <p>{Model.manageMinistryId}</p>
                    </Form.Item>
                    <Form.Item className="highlight-year" label="مسؤولية الوزارة" name="manageMinistryName">
                        <p>{Model.manageMinistryName}</p>
                    </Form.Item>
                </Col>

                <Col span={24}>
                    <Form.Item className="highlight-year" label="المتابعة" name="follow">
                        <p>{Model.follow}</p>
                    </Form.Item>
                </Col>

                <Col span={24}>
                    <Form.Item className="highlight-year" label="الإجراء المتخذ" name="actionTaken">
                        <p>{Model.actionTaken}</p>
                    </Form.Item>
                </Col>

                <Col span={24}>
                    <Form.Item className="highlight-year" label="المقترحات" name="suggistion">
                        <p>{Model.suggistion}</p>
                    </Form.Item>
                </Col>

                <Col span={24}>
                    <Form.Item className="highlight-year" label="القرار" name="resolution">
                        <p>{Model.resolution}</p>
                    </Form.Item>
                </Col>
  
            </Row>
        </Form>
    );
});

export default Trutht;
