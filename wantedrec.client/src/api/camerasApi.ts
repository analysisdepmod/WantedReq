// ════════════════════════════════════════════════════════
//  src/api/camerasApi.ts
// ════════════════════════════════════════════════════════

import axiosInstance, { BASIC_URL } from '../api';
import type { ApiResponse } from '../types/person.types';
import type { CameraDto, CameraDetailDto } from '../types/camera.types';

export const getCameras = async (params?: { isActive?: boolean }): Promise<CameraDto[]> => {
    const res = await axiosInstance.get<ApiResponse<CameraDto[]>>('/cameras', { params });
    return res.data.data;
};

export const getCameraById = async (id: number): Promise<CameraDetailDto> => {
    const res = await axiosInstance.get<ApiResponse<CameraDetailDto>>(`/cameras/${id}`);
    return res.data.data;
};

export const activateCamera = async (id: number) =>
    axiosInstance.put(`/cameras/${id}/activate`);

export const deactivateCamera = async (id: number) =>
    axiosInstance.put(`/cameras/${id}/deactivate`);

/**
 * رابط snapshot للكاميرات البعيدة (RTSP/MJPEG).
 * يُستخدم في <img src={snapshotUrl(id)} />  أو fetch كل X ثانية.
 * يُضيف timestamp لمنع الـ browser cache.
 */
export const snapshotUrl = (id: number, ts?: number): string =>
    `${BASIC_URL}/cameras/${id}/snapshot?t=${ts ?? Date.now()}`;