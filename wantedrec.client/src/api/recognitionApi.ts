

import axiosInstance from '../api';
import type { ApiResponse } from '../types/person.types';
import type {
    LiveRecognitionResultDto,
    RecognitionDto,
    RecognitionReviewDto,
} from '../types/camera.types';

/**
 * إرسال صورة للتعرف — POST /api/recognition/identify
 * يُستخدم في كل من: صفحة الكاميرا المباشرة + صفحة رفع صورة
 */
export const identifyFace = async (
    file: File,
    cameraId?: number,
): Promise<LiveRecognitionResultDto> => {
    const form = new FormData();
    form.append('file', file, file.name || 'frame.jpg');

    const res = await axiosInstance.post<ApiResponse<LiveRecognitionResultDto>>(
        '/recognition/identify',
        form,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
                ...(cameraId !== undefined && { 'X-Camera-Id': String(cameraId) }),
            },
        },
    );
    return res.data.data;
};

/**
 * جلب سجل التعرف — GET /api/recognitions
 */
export const getRecognitions = async (params?: {
    cameraId?: number;
    personId?: number;
    fromDate?: string;
    toDate?: string;
    isMatch?: boolean;
    recognitionStatus?: number;
}): Promise<RecognitionDto[]> => {
    const res = await axiosInstance.get<ApiResponse<RecognitionDto[]>>(
        '/recognition/recognitions',
        { params },
    );
    return res.data.data;
};

/**
 * مراجعة عملية تعرف — PUT /api/recognitions/{id}/review
 */
export const reviewRecognition = async (
    id: number,
    dto: RecognitionReviewDto,
): Promise<void> => {
    await axiosInstance.put(`/recognitions/${id}/review`, dto);
};