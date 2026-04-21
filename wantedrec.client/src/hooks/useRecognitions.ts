// ═══════════════════════════════════════════════════════
//  src/hooks/useRecognitions.ts
//  هوك سجل التعرف — جماعي وفردي
// ═══════════════════════════════════════════════════════
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { getRecognitions, reviewRecognition } from '../api/recognitionApi';
import type { RecognitionDto, RecognitionReviewDto } from '../types/camera.types';
import { RecognitionStatus } from '../types/camera.types';

export interface RecognitionFilters {
    cameraId?:    number;
    personId?:    number;
    status?:      number;
    dateRange?:   [string, string];
    isMatch?:     boolean;
}

export function useRecognitions(defaultFilters?: RecognitionFilters, autoRefresh = 20_000) {
    const qc = useQueryClient();
    const [msgApi, ctx] = message.useMessage();
    const [filters, setFilters] = useState<RecognitionFilters>(defaultFilters ?? {});

    const query = useQuery({
        queryKey: ['recognitions', filters],
        queryFn: () => getRecognitions({
            cameraId:          filters.cameraId,
            personId:          filters.personId,
            recognitionStatus: filters.status,
            fromDate:          filters.dateRange?.[0],
            toDate:            filters.dateRange?.[1],
            isMatch:           filters.isMatch ?? true,
        }),
        refetchInterval: autoRefresh,
    });

    const reviewMutation = useMutation({
        mutationFn: ({ id, dto }: { id: number; dto: RecognitionReviewDto }) =>
            reviewRecognition(id, dto),
        onSuccess: () => {
            msgApi.success('تم تحديث حالة التعرف');
            qc.invalidateQueries({ queryKey: ['recognitions'] });
        },
        onError: () => msgApi.error('فشل التحديث'),
    });

    const recognitions = query.data ?? [];

    const stats = useMemo(() => {
        const confirmed  = recognitions.filter(r => r.recognitionStatus === RecognitionStatus.Confirmed).length;
        const pending    = recognitions.filter(r => r.recognitionStatus === RecognitionStatus.Pending).length;
        const rejected   = recognitions.filter(r => r.recognitionStatus === RecognitionStatus.Rejected).length;
        const suspects   = recognitions.filter(r => r.personId).length;
        const avgScore   = recognitions.length
            ? recognitions.reduce((s, r) => s + (r.recognitionScore ?? 0), 0) / recognitions.length
            : 0;
        const cameras    = [...new Set(recognitions.map(r => r.cameraName).filter(Boolean))];
        const lastSeen   = recognitions[0]?.recognitionDateTime;

        // مسار حركة الشخص (لو فيه personId ثابت)
        const movementPath: RecognitionDto[] = [...recognitions]
            .sort((a, b) => new Date(a.recognitionDateTime).getTime() - new Date(b.recognitionDateTime).getTime());

        return { confirmed, pending, rejected, suspects, avgScore, cameras, lastSeen, movementPath };
    }, [recognitions]);

    const updateFilter = (patch: Partial<RecognitionFilters>) =>
        setFilters(f => ({ ...f, ...patch }));

    const clearFilters = () => setFilters(defaultFilters ?? {});

    return {
        recognitions,
        isLoading:   query.isLoading,
        isError:     query.isError,
        isFetching:  query.isFetching,
        refetch:     query.refetch,
        filters,
        updateFilter,
        clearFilters,
        stats,
        review: (id: number, dto: RecognitionReviewDto) => reviewMutation.mutate({ id, dto }),
        isReviewing: reviewMutation.isPending,
        ctx, msgApi,
    };
}

// ── فردي لشخص واحد ───────────────────────────────────────
export function usePersonRecognitions(personId: number) {
    return useRecognitions({ personId, isMatch: true }, 30_000);
}
