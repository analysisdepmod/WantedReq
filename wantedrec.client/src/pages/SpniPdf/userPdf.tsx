
import axios from "../../api";
import { useEffect, useState } from "react";
import { Col, Row } from "react-bootstrap";
import { SpniPdf } from "../../Interfaces/GeneralInterface";
import { useTranslation } from "react-i18next";
import { DataIndexValue } from "../../Interfaces/functions";
import { useSelector } from "react-redux";
import { RootState } from "../../../app/store";
 

 
 
 
 
 
 

const UserPdf = () => {
    const [Pdf, SetPdf] = useState<SpniPdf[]>();
    const { arlang } = useSelector((state: RootState) => state.setting);

    const { t } = useTranslation();
    

    useEffect(() => {
        axios.get("/home/GetSpniPdfs").then(res => { SetPdf(res.data) })
       
    }, [ ])
    return (
        <>
           
          
            <Row className=" box-sh d" style={{ display: 'flex', justifyContent: 'center' }}  >
                <h6>{t('contexts')}</h6>
           </Row>


            <hr /> 


        <Row className="mt-1 d-flex flex-column" style={{ overflowX: 'auto'}}>
           
            {Pdf?.map(i => 
              
                <Col span={24} key={i.id} className="">
                    <a className="btn btn-sm btn-success m-1 w-100" target="_blank" style={{ background: i.color }} href={i.pdfFileName}>{DataIndexValue(arlang, "name", i)}</a>
                 </Col>
            )}
                </Row>
        </>
     




    )
};
export default UserPdf;


