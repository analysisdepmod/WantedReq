
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import {
    getCameras, getCameraById,
    activateCamera, deactivateCamera,
} from '../api/camerasApi';
import axiosInstance from '../api';
import type { CameraDto, CameraDetailDto } from '../types/camera.types';

export interface CameraUpsertPayload {
    name: string;
    code?: string;
    description?: string;
    ipAddress: string;
    streamUrl?: string;
    localDeviceIndex?: number;
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

const createCamera = (dto: CameraUpsertPayload): Promise<CameraDetailDto> =>
    axiosInstance.post('/cameras', dto).then(r => r.data.data);

const updateCamera = (id: number, dto: CameraUpsertPayload): Promise<CameraDetailDto> =>
    axiosInstance.put(`/cameras/${id}`, dto).then(r => r.data.data);

const deleteCamera = (id: number): Promise<void> =>
    axiosInstance.delete(`/cameras/${id}`).then(() => undefined);

// ── Hook ──────────────────────────────────────────────────
export function useCameras(filterActive?: boolean) {
    const qc = useQueryClient();
    const [msgApi, ctx] = message.useMessage();
    const [editingId, setEditingId] = useState<number | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [togglingId, setTogglingId] = useState<number | null>(null);

    const query = useQuery({
        queryKey: ['cameras', filterActive],
        queryFn: () => getCameras(filterActive !== undefined ? { isActive: filterActive } : undefined),
        refetchInterval: 30_000,
    });

    const invalidate = () => qc.invalidateQueries({ queryKey: ['cameras'] });

    const createMutation = useMutation({
        mutationFn: createCamera,
        onSuccess: () => { msgApi.success('تمت إضافة الكاميرا'); invalidate(); setModalOpen(false); },
        onError: () => msgApi.error('فشل إنشاء الكاميرا'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, dto }: { id: number; dto: CameraUpsertPayload }) => updateCamera(id, dto),
        onSuccess: () => { msgApi.success('تم تحديث الكاميرا'); invalidate(); setModalOpen(false); setEditingId(null); },
        onError: () => msgApi.error('فشل تحديث الكاميرا'),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteCamera,
        onSuccess: () => { msgApi.success('تمت معالجة طلب الحذف'); invalidate(); },
        onError: () => msgApi.error('فشل الحذف'),
    });

    const toggleMutation = useMutation({
        mutationFn: async (cam: CameraDto) => {
            setTogglingId(cam.cameraId);
            return cam.isActive ? deactivateCamera(cam.cameraId) : activateCamera(cam.cameraId);
        },
        onSuccess: (_, cam) => {
            msgApi.success(cam.isActive ? 'تم إيقاف الكاميرا' : 'تم تشغيل الكاميرا');
            invalidate();
        },
        onError: () => msgApi.error('فشل تغيير الحالة'),
        onSettled: () => setTogglingId(null),
    });

    const openCreate = () => { setEditingId(null); setModalOpen(true); };
    const openEdit   = (id: number) => { setEditingId(id); setModalOpen(true); };
    const closeModal = () => { setModalOpen(false); setEditingId(null); };

    const save = (dto: CameraUpsertPayload) => {
        if (editingId) updateMutation.mutate({ id: editingId, dto });
        else           createMutation.mutate(dto);
    };

    return {
        cameras:    query.data ?? [],
        isLoading:  query.isLoading,
        isFetching: query.isFetching,
        refetch:    query.refetch,
        // modal
        modalOpen, editingId, openCreate, openEdit, closeModal,
        // actions
        save,
        isSaving:   createMutation.isPending || updateMutation.isPending,
        deleteCamera: (id: number) => deleteMutation.mutate(id),
        isDeleting:   deleteMutation.isPending,
        toggleCamera: (cam: CameraDto) => toggleMutation.mutate(cam),
        togglingId,
        // context
        ctx, msgApi,
    };
}

// ── single camera ─────────────────────────────────────────
export function useCameraDetail(id: number) {
    return useQuery({
        queryKey: ['camera', id],
        queryFn:  () => getCameraById(id),
        enabled:  !!id && !isNaN(id),
    });
}
