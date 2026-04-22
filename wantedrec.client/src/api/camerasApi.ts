// ════════════════════════════════════════════════════════
//  src/api/camerasApi.ts
// ════════════════════════════════════════════════════════

import axios, { BASIC_URL } from '../api';
import type { ApiResponse } from '../types/person.types';
import type { CameraDto, CameraDetailDto } from '../types/camera.types';

const getCurrentDeviceId = (): number | null => {
    const raw = localStorage.getItem('current_device_id');
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

export const getCameras = async (params?: { isActive?: boolean }): Promise<CameraDto[]> => {
    const res = await axios.get<ApiResponse<CameraDto[]>>('/cameras', {
        params,
        headers: getDeviceHeaders(),
    });

    return res.data.data;
};

export const getCameraById = async (id: number): Promise<CameraDetailDto> => {
    const res = await axios.get<ApiResponse<CameraDetailDto>>(`/cameras/${id}`, {
        headers: getDeviceHeaders(),
    });

    return res.data.data;
};

export const activateCamera = async (id: number) =>
    axios.put(`/cameras/${id}/activate`, undefined, {
        headers: getDeviceHeaders(),
    });

export const deactivateCamera = async (id: number) =>
    axios.put(`/cameras/${id}/deactivate`, undefined, {
        headers: getDeviceHeaders(),
    });

/**
 * رابط snapshot للكاميرات البعيدة (RTSP/MJPEG).
 * يُستخدم في <img src={snapshotUrl(id)} />
 * أو fetch كل X ثانية.
 * يُضيف timestamp لمنع الـ browser cache.
 */
export const snapshotUrl = (id: number, ts?: number): string =>
    `${BASIC_URL}/cameras/${id}/snapshot?t=${ts ?? Date.now()}`;