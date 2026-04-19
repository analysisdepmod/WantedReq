import { useState, useMemo } from "react";
import { Card, Collapse, Row, Col, Spin } from "antd";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import ReportDownloadButtons from "./ReportDownloadButtons";
import { JasperReportParams } from "../Interfaces/reportFunctions";
import { RootState } from "../../app/store";
import { RULES } from "../Interfaces/roles";
import { usesubAttuide } from "../hooks/useApi";
import { t } from "i18next";

function NewTab() {
    const { userRoles, basicUserInfo } = useSelector((state: RootState) => state.auth.loginResponse);
    const { arlang } = useSelector((state: RootState) => state.setting);
    const { targetId, manageMinistryId } = useParams();
    const Reports: boolean = userRoles?.includes(RULES.Reports);
    const Admin: boolean = userRoles?.includes(RULES.Admin);

    const { data: subAttuide, isLoading: loadingsubAttuide } = usesubAttuide(targetId, manageMinistryId);

    const [activeKey, setActiveKey] = useState<string | string[]>('1');

    const onChange = (key: string | string[]) => {
        setActiveKey(key);
    };

    const items = useMemo(() => {
        return subAttuide?.subSpAttuideYears
            ?.filter(i => Array.isArray(i.subSpniAttudeDtos) && i.subSpniAttudeDtos.length > 0)
            .map((i, index) => {
                const currentKey = String(index + 1);
                const isActive = Array.isArray(activeKey) ? activeKey.includes(currentKey) : activeKey === currentKey;

                return {
                    key: currentKey,
                    label: `(${i.year})`,
                    children: isActive ? (
                        <div>
                            {i.subSpniAttudeDtos.map((y, idx) => (
                                <Card
                                    key={idx}
                                    title={
                                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                                            <div>
                                                <span className="title">{t("nmpresentative")}</span>
                                                <span className="title">
                                                    {arlang ? y.officerName : y.officerNameEn}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="title">{t("Entry-date")}</span>
                                                <span className="title">
                                                    {y.fullDate?.split("T")[0]}
                                                </span>
                                            </div>
                                        </div>
                                    }
                                    className="d-flex flex-column justify-content-center mb-2"
                                    hoverable
                                >
                                    <div className="div-card">
                                        <span className="title">{t("actionTaken")}</span>
                                        <span className="title">{arlang ? y.actionTaken : y.actionTakenEn}</span>
                                    </div>
                                    <div className="div-card">
                                        <span className="title">{t("follow")}</span>
                                        <span className="title">{arlang ? y.follow : y.followEn}</span>
                                    </div>
                                    <div className="div-card">
                                        <span className="title">{t("suggistions")}</span>
                                        <span className="title">{arlang ? y.suggistion : y.suggistionEn}</span>
                                    </div>
                                    <div className="div-card">
                                        <span className="title">{t("resolution")}</span>
                                        <span className="title">{arlang ? y.resolution : y.resolutionEn}</span>
                                    </div>
                                   
                                   
                                </Card>
                            ))}
                        </div>
                    ) : null, // Lazy rendering
                };
            });
    }, [subAttuide, arlang, activeKey, t]);

    const reportArgs: JasperReportParams = {
        extension: '',
        jasperReportName: `wantedrec/SpAttudeHistery${arlang ? "" : "En"}`,
        reportDownloadName: "SpAttudeHistery",
        params: {
            UserId: basicUserInfo.userid,
            MangeMinsteryId: manageMinistryId,
            TargetId: targetId
        }
    };

    return (
        <>
            <Row className="sticky-top box-sh w-100" style={{ zIndex: 3, marginBottom: "20px", display: "flex", justifyContent: "space-between" }}>
                <Col span={12}>
                    <p style={{ marginLeft: "20px" }}>
                        {arlang ? subAttuide?.targetName : subAttuide?.targetNameEn}
                    </p>
                    <p>
                        {arlang ? subAttuide?.manageMinistryName : subAttuide?.manageMinistryNameEn}
                    </p>
                </Col>
                {(Reports || Admin) && <ReportDownloadButtons {...reportArgs} />}
            </Row>

            {loadingsubAttuide ? (
                <Spin size="large" className="d-flex justify-content-center mt-5" />
            ) : (
                <Collapse items={items} defaultActiveKey={['1']} onChange={onChange} />
            )}
        </>
    );
}

export default NewTab;
