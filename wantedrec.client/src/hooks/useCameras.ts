import axios from 'axios';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import {
    getCameraById,
    activateCamera,
    deactivateCamera,
} from '../api/camerasApi';
import axiosInstance from '../api';
import type { ApiResponse } from '../types/person.types';
import type { CameraDto, CameraDetailDto } from '../types/camera.types';

export interface CameraUpsertPayload {
    name: string;
    code?: string;
    description?: string;
    ipAddress: string;
    streamUrl?: string;
    localDeviceIndex?: number;
    userDeviceId?: number;
    latitude?: number;
    longitude?: number;
    floor?: string;
    area?: string;
    isIndoor: boolean;
    isActive: boolean;
    installationDate?: string;
    lastMaintenanceDate?: string;
    notes?: string;
}

const getDeviceHeaders = (currentDeviceId?: number | null) =>
    currentDeviceId !== undefined && currentDeviceId !== null
        ? { 'X-User-Device-Id': String(currentDeviceId) }
        : undefined;

const fetchCameras = (
    filterActive?: boolean,
    currentDeviceId?: number | null
): Promise<CameraDto[]> =>
    axiosInstance
        .get<ApiResponse<CameraDto[]>>('/cameras', {
            params: filterActive !== undefined ? { isActive: filterActive } : undefined,
            headers: getDeviceHeaders(currentDeviceId),
        })
        .then(r => r.data.data);

const createCamera = (
    dto: CameraUpsertPayload,
    currentDeviceId?: number | null
): Promise<ApiResponse<CameraDetailDto>> =>
    axiosInstance
        .post<ApiResponse<CameraDetailDto>>('/cameras', dto, {
            headers: getDeviceHeaders(currentDeviceId),
        })
        .then(r => r.data);

const updateCamera = (
    id: number,
    dto: CameraUpsertPayload,
    currentDeviceId?: number | null
): Promise<ApiResponse<CameraDetailDto>> =>
    axiosInstance
        .put<ApiResponse<CameraDetailDto>>(`/cameras/${id}`, dto, {
            headers: getDeviceHeaders(currentDeviceId),
        })
        .then(r => r.data);

const deleteCameraRequest = (
    id: number,
    currentDeviceId?: number | null
): Promise<ApiResponse<boolean>> =>
    axiosInstance
        .delete<ApiResponse<boolean>>(`/cameras/${id}`, {
            headers: getDeviceHeaders(currentDeviceId),
        })
        .then(r => r.data);

const getApiErrorMessage = (error: unknown, fallback: string): string => {
    if (axios.isAxiosError(error)) {
        const responseData = error.response?.data as { message?: string } | undefined;
        return responseData?.message || fallback;
    }

    if (error instanceof Error && error.message) {
        return error.message;
    }

    return fallback;
};

// ── Hook ──────────────────────────────────────────────────
export function useCameras(filterActive?: boolean, currentDeviceId?: number | null) {
    const qc = useQueryClient();
    const [msgApi, ctx] = message.useMessage();
    const [editingId, setEditingId] = useState<number | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [togglingId, setTogglingId] = useState<number | null>(null);

    const query = useQuery({
        queryKey: ['cameras', filterActive, currentDeviceId],
        queryFn: () => fetchCameras(filterActive, currentDeviceId),
        refetchInterval: 30_000,
    });

    const invalidate = () => qc.invalidateQueries({ queryKey: ['cameras'] });

    const createMutation = useMutation({
        mutationFn: (dto: CameraUpsertPayload) => createCamera(dto, currentDeviceId),
        onSuccess: (res) => {
            msgApi.success(res.message || 'تمت إضافة الكاميرا');
            invalidate();
            setModalOpen(false);
        },
        onError: (error) => msgApi.error(getApiErrorMessage(error, 'فشل إنشاء الكاميرا')),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, dto }: { id: number; dto: CameraUpsertPayload }) =>
            updateCamera(id, dto, currentDeviceId),
        onSuccess: (res) => {
            msgApi.success(res.message || 'تم تحديث الكاميرا');
            invalidate();
            setModalOpen(false);
            setEditingId(null);
        },
        onError: (error) => msgApi.error(getApiErrorMessage(error, 'فشل تحديث الكاميرا')),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => deleteCameraRequest(id, currentDeviceId),
        onSuccess: (res) => {
            msgApi.success(res.message || 'تمت معالجة طلب الحذف');
            invalidate();
        },
        onError: (error) => msgApi.error(getApiErrorMessage(error, 'فشل الحذف')),
    });

    const toggleMutation = useMutation({
        mutationFn: async (cam: CameraDto) => {
            setTogglingId(cam.cameraId);
            return cam.isActive ? deactivateCamera(cam.cameraId) : activateCamera(cam.cameraId);
        },
        onSuccess: (res) => {
            msgApi.success(res.message || 'تم تغيير حالة الكاميرا');
            invalidate();
        },
        onError: (error) => msgApi.error(getApiErrorMessage(error, 'فشل تغيير الحالة')),
        onSettled: () => setTogglingId(null),
    });

    const openCreate = () => {
        setEditingId(null);
        setModalOpen(true);
    };

    const openEdit = (id: number) => {
        setEditingId(id);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingId(null);
    };

    const save = (dto: CameraUpsertPayload) => {
        const isLocal = !dto.streamUrl?.trim();

        const finalDto: CameraUpsertPayload = {
            ...dto,
            streamUrl: dto.streamUrl?.trim() || undefined,
            ipAddress: dto.ipAddress || 'local',
            userDeviceId: isLocal ? (currentDeviceId ?? undefined) : undefined,
            localDeviceIndex: isLocal ? dto.localDeviceIndex : undefined,
        };

        if (isLocal && !currentDeviceId) {
            msgApi.error('لا يوجد جهاز حالي مختار. افتح صفحة المراقبة أولًا وحدد الجهاز.');
            return;
        }

        if (editingId) updateMutation.mutate({ id: editingId, dto: finalDto });
        else createMutation.mutate(finalDto);
    };

    return {
        cameras: query.data ?? [],
        isLoading: query.isLoading,
        isFetching: query.isFetching,
        refetch: query.refetch,

        // modal
        modalOpen,
        editingId,
        openCreate,
        openEdit,
        closeModal,

        // actions
        save,
        isSaving: createMutation.isPending || updateMutation.isPending,
        deleteCamera: (id: number) => deleteMutation.mutate(id),
        isDeleting: deleteMutation.isPending,
        toggleCamera: (cam: CameraDto) => toggleMutation.mutate(cam),
        togglingId,

        // context
        ctx,
        msgApi,
    };
}

// ── single camera ─────────────────────────────────────────
export function useCameraDetail(id: number) {
    return useQuery({
        queryKey: ['camera', id],
        queryFn: () => getCameraById(id),
        enabled: !!id && !isNaN(id),
    });
}
