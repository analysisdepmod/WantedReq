import axiosInstance from '../api';
import type { ApiResponse } from '../types/person.types';
import type {
    LiveRecognitionResultDto,
    RecognitionDto,
    RecognitionReviewDto,
} from '../types/camera.types';

const STORAGE_KEY = 'current_device_id';

const getCurrentDeviceId = (): number | null => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = Number(raw);
    return Number.isNaN(parsed) ? null : parsed;
};

const getDeviceHeaders = () => {
    const currentDeviceId = getCurrentDeviceId();

    return currentDeviceId
        ? { 'X-User-Device-Id': String(currentDeviceId) }
        : undefined;
};

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
                ...getDeviceHeaders(),
            },
        },
    );

    return res.data.data;
};

/**
 * جلب سجل التعرف — GET /api/recognition/recognitions
 */
export const getRecognitions = async (params?: {
    cameraId?: number;
    personId?: number;
    fromDate?: string;
    toDate?: string;
    isMatch?: boolean;
    recognitionStatus?: number;
    pageSize?: number;
}): Promise<RecognitionDto[]> => {
    const res = await axiosInstance.get<ApiResponse<RecognitionDto[]>>(
        '/recognition/recognitions',
        {
            params,
        },
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
    await axiosInstance.put(
        `/recognitions/${id}/review`,
        dto,
        {
            headers: getDeviceHeaders(),
        },
    );
};