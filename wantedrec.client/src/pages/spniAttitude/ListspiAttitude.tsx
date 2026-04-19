/* eslint-disable @typescript-eslint/no-unused-vars */
import {useEffect, useState } from "react";
import {SpiAttitudeDtoview} from "../../Interfaces/GeneralInterface";
import {CheckOutlined, CloseOutlined   , PlusOutlined } from "@ant-design/icons";
import { Col, Row } from "react-bootstrap";
import { Select, Space, Form, Tooltip, Drawer, Radio, RadioChangeEvent, Button, Spin, DatePicker, Checkbox     } from "antd";
import { RootState } from "../../../app/store";
import {  useSelector } from "react-redux";
import { RULES } from "../../Interfaces/roles";
import EditSub from "../../compontents/EditSub";
import Search from "antd/es/transfer/search";
import ReportDownloadButtons from "../../compontents/ReportDownloadButtons";
import { JasperReportParams } from "../../Interfaces/reportFunctions";
import { useAllPerTargets, useAllPerUnits, useGetYearListattude } from "../../hooks/useApi";
import type { RangePickerProps } from 'antd/es/date-picker';
import { CTAN } from "../../Interfaces/functions";
import { useAttitude,} from "../../hooks/useAttitude";
import { setModal } from "../../../app/reducers/dialogSlice";
import { ModalContent } from "./ModalContent";
 
 
const initial: SpiAttitudeDtoview={
        id1: 0,
        id: 0,
        idSub: 0,
        spiAttitudeId: 0,
        targetId: 0,
        targetName: '',
        targetNameEn: '',
        targetSort: 0,
        targetScorr: 0,
        officerInfoId: 0,
        officerName: '',
        officerNameEn: '',
        manageMinistryId: 0,
        manageMinistryName: '',
        manageMinistryNameEn: '',
        actionTaken: '',
        actionTakenEn: '',
        follow: '',
        followEn: '',
        resolution: '',
        resolutionEn: '',
        suggistion: '',
        suggistionEn: '',
        year: new Date().getFullYear(),
        targetType: true,
        isTrue: false,
        endDateToComplete: new Date(),
        startDateToComplete: new Date(),
        endNotComplete: false,
        isComplete: false,
        rateComplete: 0,
        canEdit: false,
        hasHastery: false,
        isDeletedSpi: false,
    isDeletedSub: false,
    fullDate:new Date()

    
}

 
const ListspiAttitude = () => {
    const [year, setyear] = useState<number>(localStorage.getItem("year") as unknown as number);

    const {
        dispatch,
        t,
        loading,
        setSearchTerm,
        AttitudeData,
      
    } = useAttitude(year);

    const { arlang, dir } = useSelector((state: RootState) => state.setting);
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState(1);
    const { userRoles, basicUserInfo } = useSelector((state: RootState) => state.auth.loginResponse);
    const { dataPerUnits, isLoadingPerUnits } = useAllPerUnits(year, arlang);
    const { dataPerTargets, isLoadingPerTargets } = useAllPerTargets(year, arlang);
    const [selectedPerUnits, setSelectedPerUnits] = useState<number[]>([] as number[]);
    const [selectedPerTargets, setSelectedPerTargets] = useState<number[]>([] as number[]);
    const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
    const [fromDate, setFromDate] = useState<Date|null>(null);
    const [toDate, settoDate] = useState<Date | null>(null);
    const { data: years } = useGetYearListattude(false);
    const [ isloading, setIsloading ] = useState<boolean>(true);

    const Admin: boolean = userRoles?.includes(RULES.Admin);
    const Gools: boolean = userRoles?.includes(RULES.Gools);
    const Reader: boolean = userRoles?.includes(RULES.Reader);
    const Musadaqa: boolean = userRoles?.includes(RULES.Musadaqa);
    const Reports: boolean = userRoles?.includes(RULES.Reports);

    const chOptions = [
        { label: t('goals-from_to'), value: 2 },
        { label: t('goals-per-units'), value: 8 },
        { label: t('goals=per-targets'), value: 9 },
    ];

 

    //const handleCreateattude = (spi: SpiAttitudeDtoview) => {
    //    createAttitude(spi);
    //};
    //const handleUpdateUser = (spi: SpiAttitudeDtoview) => {
    //    updateattude(spi);
    //};


    useEffect(() => { setIsloading(loading) }, [loading])

    const addattude = () => {
      
        dispatch(
            setModal(
                {
                    dialogIcon: <PlusOutlined />,
                    isOpen: true,
                    content: <ModalContent row={initial} flag={1} />,
                    width: 1100,
                    height: 900,
                    title: "Add Attitude"
                })
        );
    };

    
     
    const TruthAttitude = (row: SpiAttitudeDtoview) => {
    
        dispatch(
            setModal({
                dialogIcon: <PlusOutlined />,
                isOpen: true,
                content: <ModalContent row={row} flag={3} />,
                width: 1000,
                height: 900,
                title: "تحديث حالة المصادقة",
            })
        );
    }
    
  
    const handleChangePerUnits = (values:number[]) => {
        setSelectedPerUnits(values);
        
    };

    const handleChangePerTargets = (values: number[]) => {
        setSelectedPerTargets(values);

    };
    const showDrawer = () => {
        setOpen(true);
    };

    const handleCheckboxChange = (checkedValues: number[]) => {
        setSelectedOptions(checkedValues);
        setSelectedPerTargets([]);
        setSelectedPerUnits([]);
        setFromDate(null);
        settoDate(null);
        setValue(1);
             
    };

    const handleDateChange: RangePickerProps['onChange'] = (dates, dateStrings) => {
      
        if (dates) {
            setFromDate(new Date(dateStrings[0]) );
            settoDate(new Date(dateStrings[1]));
           
        }
    };
    const onCloses = () => {
        setOpen(false);
    };

    const onChange = (e: RadioChangeEvent) => {
 
        setValue(e.target.value);
    };

    const YearChange = (e: number) => {

            setyear(e);
            localStorage.setItem("year", e.toString())
    }

    function getReportJasperName(): string {
        if (value === 1) return `wantedrec/Gools${arlang ? "" : "En"}`;
        if (value === 5) return `wantedrec/SpiNotActionTakenRe${arlang ? "" : "En"}`;
        if (value === 6) return `wantedrec/SpiResolution${arlang ? "" : "En"}`;
        return "";
    }

    function getReportDOWName(): string {
        if (value === 1) return `Gools${arlang ? "" : "En"}`;
        if (value === 5) return `SpiNotActionTakenRe${arlang ? "" : "En"}`;
        if (value === 6) return `SpiResolution${arlang ? "" : "En"}`;
        return "";
    }

    const reportArgs: JasperReportParams = {
        extension: '',
        jasperReportName: getReportJasperName(),
        reportDownloadName: getReportDOWName(),
        params: {
            Nyear: year,
            UserId: basicUserInfo.userid,


            Units: selectedPerUnits.length > 0
                ? selectedPerUnits.join(',')
                : '',

            Targets: selectedPerTargets.length > 0
                ? selectedPerTargets.join(',')
                : '',
            From: fromDate, // "2025-01-01"
            To: toDate,
            en: !arlang
        }
    }       
    const renderactions = (record: SpiAttitudeDtoview) => {
        
      

                return <Space size="small" dir={dir}>

                    <Tooltip placement="top" title={t('edit')} color={'green'}>




                    </Tooltip>
                    <Tooltip placement="top" title={!record.isTrue ?t("truth")  : t("untruth")} color={!record.isTrue ? 'cyan' : 'volcano'}>


                        {
                            Musadaqa ? !record.isTrue ?
                                 <Button onClick={() => TruthAttitude(record)} className="btn-border-edit"><CloseOutlined className="edit-icon text-danger" /></Button>
                                : <Button onClick={() => TruthAttitude(record)} className="btn-border-edit"><CheckOutlined className="edit-icon text-success" /></Button>

                                : null
                        }


                    </Tooltip>
                    <Tooltip placement="top" title={t('delete')} color={'red'}>
                       
                    </Tooltip>
                    <EditSub {...record} />
                </Space>
            
        }
 
    const placement = arlang ? 'left' : 'right';

    

        return (
            <>
                <Row className="sticky-top box-sh" style={{ zIndex: 3 }}>
                    <Col>
                        <Row>
                            <Col span={14} className="p-0 m-0">
                                <Form  className="p-0 m-2">
                                    <Form.Item initialValue={year} name="year" validateTrigger="onBlur" className="p-0 mb-2">
                                        <Select options={years} onChange={YearChange} placeholder={t('year')} />
                                    </Form.Item>
                                </Form>
                            </Col>
                            <Col span={14} className="p-0 m-2" >
                                <Search placeholder="بحث..."
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                     />
                            </Col>
                            <Col span={10} style={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
                                {(!Reader && (Gools || Admin)) && (
                                    <Button
                                        type="primary"
                                        size="small"
                                        style={{ marginLeft: 10 }}
                                        onClick={addattude}
                                        icon={<PlusOutlined />}
                                    >
                                        {t('add')}
                                    </Button>
                                )}
                                {(Reports || Admin) && (
                                    <Button
                                        size="small"
                                        type="primary"
                                        onClick={showDrawer}
                                        style={{
                                            marginLeft: 10,
                                            backgroundColor: "green",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            width: "5vw",
                                        }}
                                    >
                                        {t('Reports')}
                                    </Button>
                                )}
                            </Col>
                        </Row>
                   
                    </Col>
                  
 
                    </Row>
                <Drawer loading={isloading} placement={placement} size={"default"} title={t('Reports')} onClose={onCloses} open={open}>
                    <Row style={{ display: "flex", flexDirection: "column" }}>
                        <Col span={24} className="border-bottom p-5 pt-0">
                            <Radio.Group onChange={onChange} value={value} style={{ display: "flex", flexDirection: "column" }}  >
                                        <Radio value={1}>{t('allcommongoals')}</Radio>
                                         <Radio value={5}>{t('Goals_without_action')}</Radio>
                                        <Radio value={6}>{t('Raj_decision')}</Radio>
                                        
                                        
                            </Radio.Group>
                            <Checkbox.Group
                                options={chOptions}
                                value={selectedOptions}
                                onChange={handleCheckboxChange}
                                style={{ display: 'flex', flexDirection: 'column',marginTop:'20px' }}
                            />
                            {selectedOptions.includes(2) && (


                                <DatePicker.RangePicker
                                    size="small" className="mt-3"
                                    style={{ height: '35px', fontSize: '16px' }}
                                    onChange={handleDateChange}
                                     
                                />

                            )}
                            {selectedOptions.includes(8) && (
                                <div style={{ marginBottom: 20 }}>
                                    <Select
                                        className="mt-3"
                                        mode="multiple"
                                        placeholder="اختر ممثلي وزارة الدفاع"
                                        style={{ width: '100%' }}
                                        options={dataPerUnits}
                                        loading={isLoadingPerUnits}
                                        onChange={handleChangePerUnits }
                                    >
                                     
                                    </Select>
                                </div>
                            )}

                            {selectedOptions.includes(9) && (
                                <div style={{ marginBottom: 20 }}>
                                    <Select
                                        className="mt-3"
                                        mode="multiple"
                                        placeholder="اختر الاهداف"
                                        style={{ width: '100%' }}
                                        options={dataPerTargets}
                                        loading={isLoadingPerTargets}
                                        onChange={handleChangePerTargets}
                                    >

                                    </Select>
                                </div>
                            )}

                            
                        </Col>
                       
                        <Col span={24} style={{ marginTop: "20px"  }}>
                          
                            <ReportDownloadButtons {...reportArgs} />
                            
                        </Col>
                       
                </Row>
                 </Drawer>
                <Row className="">
                    <Spin spinning={isloading}>
                    <div className="table-wrapper p-0 m-0 mt-2">
                        
                            <table className="table table-responsive custom-table">
                                <thead>
                                <tr>
                                    <th>{t("order")}</th>
                                    <th>{t("targetName")}</th>
                                    <th>{t("modpresentatives")}</th>
                                    <th>{t("nmpresentatives")}</th>
                                    <th>{t("actionTaken")}</th>
                                    <th>{t("follow")}</th>
                                    <th> {t("suggistions")}</th>
                                    <th>{t("resolution")}</th>
                                    <th style={{ minWidth: '90px' }}>تاريخ الادامة</th>
                                    <th >{t("actions")}</th>
                                    </tr>
                                </thead>
                            
                            <tbody>
                                    {AttitudeData?.map((part) =>
                                    part.spiAttitudeDtos.map((cell, index) => (
                                        <tr key={`row-${part.targetId}-${index}`}>
                                            
                                            {index === 0 && (
                                                <>
                                                    <td rowSpan={part.spiAttitudeDtos.length} className="td-title text-center">
                                                        {arlang?CTAN(part.sort):part.sort}
                                                    </td>
                                                    <td rowSpan={part.spiAttitudeDtos.length} className="multiline-text justify-text">
                                                        {arlang ? part.targetName : part.targetNameEn}
                                                    </td>
                                                </>
                                            )}
                                            <td className="multiline-text">{arlang ? CTAN(cell.manageMinistryName) : cell.manageMinistryNameEn} </td>
                                            <td className="multiline-text">{arlang ? CTAN(cell.officerName) : cell.officerNameEn}</td>
                                            <td className="multiline-text">{arlang ? CTAN(cell.actionTaken) : cell.actionTakenEn}</td>
                                            <td className="multiline-text justify-text">{arlang ? CTAN(cell.follow) : cell.followEn}</td>
                                            <td className="multiline-text justify-text">{arlang ? CTAN(cell.suggistion) : cell.suggistionEn}</td>
                                            <td className="multiline-text justify-text">{arlang ? CTAN(cell.resolution) : cell.resolutionEn}</td>
                                            <td className="multiline-text justify-text">{cell.fullDate.toString().split("T")[0]}</td>
                                            <td >{renderactions(cell)}</td>
                                          
                                            
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        </div>
                    </Spin>
                </Row>
                
            </>)
};
export default ListspiAttitude;

