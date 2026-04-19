import { useState, useEffect } from 'react';
import { JasperReportParams, loginAndDownloadReport } from '../Interfaces/reportFunctions';
import {
    FilePdfOutlined,
    FileExcelOutlined,
    FileWordOutlined,
} from '@ant-design/icons';
import './ReportIcons.css';
import { message, Spin } from 'antd';
 
const ReportDownloadButtons = (reportArgs: JasperReportParams) => {
     
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
 
    // Common function to handle report download for all formats
    const handleDownload = (extension: string) => {
        const updatedArgs = { ...reportArgs, extension };
        loginAndDownloadReport(updatedArgs, setLoading, setError);
    };
    useEffect(() => {
        if (loading) {
            const timer = setTimeout(() => {
                message.warning("Report is taking longer than expected...");
            }, 60000);
            return () => clearTimeout(timer);
        }
    }, [loading]);

    return (
            
        <div className="report-btn-div" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', justifyContent: 'center' }}>
      
            <Spin spinning={loading}>
            <FilePdfOutlined
                style={{
                    fontSize: '40px',
                    color: '#d32029',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.5 : 1,
                }}
                onClick={() => !loading && handleDownload('pdf')}
                title="Download PDF"
            />

           
            <FileExcelOutlined
                style={{
                    fontSize: '40px',
                    color: '#389e0d',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.5 : 1,
                }}
                onClick={() => !loading && handleDownload('xlsx')}
                title="Download Excel"
            />

            
            <FileWordOutlined
                style={{
                    fontSize: '40px',
                    color: '#1d39c4',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.5 : 1,
                }}
                onClick={() => !loading && handleDownload('docx')}
                title="Download Word"
            />
 
            {error && (
                <p style={{ color: 'red' }}>
                    { 'An unexpected error occurred'}
                </p>
            )}
         </Spin>
        </div>
    );
};

export default ReportDownloadButtons;

 