// ════════════════════════════════════════════════════════
//  src/api/camerasApi.ts
//  ضعه في: src/api/camerasApi.ts
//
//  ⚠️  يحتاج CameraController في الباكايند بهذه الـ Endpoints:
//      GET  /api/cameras
//      GET  /api/cameras/{id}
//      PUT  /api/cameras/{id}/activate
//      PUT  /api/cameras/{id}/deactivate
// ════════════════════════════════════════════════════════

import axiosInstance from '../api';
import type { ApiResponse } from '../types/person.types';
import type { CameraDto, CameraDetailDto } from '../types/camera.types';

/** جلب كل الكاميرات — اختياري: فلتر بالحالة */
export const getCameras = async (params?: {
    isActive?: boolean;
}): Promise<CameraDto[]> => {
    const res = await axiosInstance.get<ApiResponse<CameraDto[]>>('/camera', { params });

    console.log("Cameras:",res.data.data);
    return res.data.data;
};

/** جلب كاميرا واحدة بالتفاصيل */
export const getCameraById = async (id: number): Promise<CameraDetailDto> => {
    const res = await axiosInstance.get<ApiResponse<CameraDetailDto>>(`/cameras/${id}`);
    return res.data.data;
};

/** تفعيل الكاميرا */
export const activateCamera = async (id: number): Promise<void> => {
    await axiosInstance.put<ApiResponse<boolean>>(`/cameras/${id}/activate`);
};

/** تعطيل الكاميرا */
export const deactivateCamera = async (id: number): Promise<void> => {
    await axiosInstance.put<ApiResponse<boolean>>(`/cameras/${id}/deactivate`);
};