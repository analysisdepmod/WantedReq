import axiosName from 'axios';
import { JASPER_PASS, JASPER_USER, REPORTS_URL } from '../api';

// Jasper report parameters interface
export interface JasperReportParams {
    reportDownloadName: string;   // File name for download (e.g., "SalesReport")
    jasperReportName: string;     // Report name in Jasper (e.g., "reports/SalesReport")
    extension: string|'pdf';            // File format: pdf, xlsx, etc.
    params?: Record<string, any>; // Optional report parameters (e.g., { Lid: cityVal })
}

 
// Login function to JasperReports server
//const loginToJasper = () => {
//    return axiosName.post(
//        `${REPORTS_LOGIN_URL}`,
//        new URLSearchParams({
//            j_username: JASPER_USER,
//            j_password: JASPER_PASS
//        }),
//        {
//            headers: {
//                'Content-Type': 'application/x-www-form-urlencoded',
               
//            },
//            withCredentials: true
//        }
//    );
//}; 

// Call JasperReport function with dynamic params (always opens in new tab)
const callJasperReport = async ({
    reportDownloadName,
    jasperReportName,
    extension,
    params = {},
}: JasperReportParams) => {
    const reportUrl = `${REPORTS_URL}${jasperReportName}.${extension}`;
    try {
        // Determine MIME type based on extension
        const mimeTypes: Record<string, string> = {
            pdf: 'application/pdf',
            xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        };

        const mimeType = mimeTypes[extension] || 'application/octet-stream';

        const headers = {
            Accept: mimeType,
            Authorization: `Basic ${btoa(`${JASPER_USER}:${JASPER_PASS}`)}`
        };

        const response = await axiosName.get(reportUrl, {
            params,
            responseType: 'blob',
            headers,
            withCredentials: true,
            timeout: 120000
        });

        const blob = new Blob([response.data], { type: mimeType });
        const blobUrl = window.URL.createObjectURL(blob);

        // Open in new tab for PDF; trigger download for others
        if (extension === 'pdf') {
            window.open(blobUrl, '_blank');
        } else {
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `${reportDownloadName}.${extension}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        // Let the browser manage the blob URL or delay revocation if needed
        // setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);

    } catch (error) {
        window.open(reportUrl, '_blank')
        console.error('Error generating report:', error);
        throw error;
    }
};


// Login and download report function (opens the report in a new tab)
export const loginAndDownloadReport = async (
    reportArgs: JasperReportParams,
    onLoading?: (loading: boolean) => void,
    onError?: (error: any) => void
) => {
    try {
        onLoading?.(true);
        //await loginToJasper();
        await callJasperReport(reportArgs);
    } catch (err) {
        console.error('حدث خطأ عند تحميل التقارير:', err);
        onError?.(err);
    } finally {
        onLoading?.(false);
    }
};
