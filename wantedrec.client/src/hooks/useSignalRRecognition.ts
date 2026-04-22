// ════════════════════════════════════════════════════════
//  src/hooks/useSignalRRecognition.ts
//  هوك الاستقبال الفوري لأحداث التعرف عبر SignalR
//  نسخة عامة — جميع الأجهزة تستقبل أحداث التعرف
// ════════════════════════════════════════════════════════

import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { getRecognitionConnection, ensureStart } from '../signalr/signalrConnections';


export interface LiveRecognitionEvent {
    recognitionId?: number;
    personId?: number;
    personFullName?: string;
    cameraId?: number;
    cameraName?: string;
    score?: number;
    isSuspect: boolean;
    primaryImageBase64?: string;
    snapshotPath?: string;
    recognitionDateTime: string;

    // جديد — مهم جدًا
    userDeviceId?: number | null;

    // اختياري إذا تريد تمييز أوضح من الباكند
    isLocalCamera?: boolean;
}

const suspectAudio = new Audio('/sounds/alert.wav');
const normalAudio = new Audio('/sounds/message.wav');

function playSound(isSuspect: boolean) {
    const audio = isSuspect ? suspectAudio : normalAudio;
    audio.currentTime = 0;
    audio.play().catch(() => { });
}


export function useSignalRRecognition() {
    const qc = useQueryClient();
    const [events, setEvents] = useState<LiveRecognitionEvent[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    const connection = getRecognitionConnection();

    const addEvent = useCallback((evt: LiveRecognitionEvent) => {
        setEvents(prev => [evt, ...prev].slice(0, 200));

        // إبطال cache لإجبار التحديث
        qc.invalidateQueries({ queryKey: ['recognitions'] });
        qc.invalidateQueries({ queryKey: ['recognitions-home'] });
        qc.invalidateQueries({ queryKey: ['cameras'] });

        const msg = evt.isSuspect
            ? `⚠️ مشتبه به! ${evt.personFullName ?? 'غير معروف'} — ${evt.cameraName ?? 'كاميرا'}`
            : `✅ تعرف: ${evt.personFullName ?? 'غير معروف'} — ${evt.cameraName ?? 'كاميرا'}`;

        toast(msg, {
            type: evt.isSuspect ? 'error' : 'success',
            position: 'bottom-left',
            autoClose: evt.isSuspect ? 8000 : 4000,
            style: evt.isSuspect ? { background: '#7f1d1d', color: '#fecaca' } : undefined,
        });

        playSound(evt.isSuspect);
    }, [qc]);

    useEffect(() => {
        let mounted = true;

        ensureStart(connection, 'RecognitionHub')
            .then(() => {
                if (mounted) setIsConnected(true);
            })
            .catch(() => {
                if (mounted) setIsConnected(false);
            });

        const onRecognitionDetected = (data: LiveRecognitionEvent) => {
            addEvent({
                ...data,
                recognitionDateTime: data.recognitionDateTime ?? new Date().toISOString(),
            });
        };

        const onClose = () => setIsConnected(false);
        const onReconnected = () => setIsConnected(true);
        const onReconnecting = () => setIsConnected(false);

        connection.on('RecognitionDetected', onRecognitionDetected);
        connection.onclose(onClose);
        connection.onreconnected(onReconnected);
        connection.onreconnecting(onReconnecting);

        return () => {
            mounted = false;
            connection.off('RecognitionDetected', onRecognitionDetected);
            connection.off('close', onClose as any);
            connection.off('reconnected', onReconnected as any);
            connection.off('reconnecting', onReconnecting as any);
        };
    }, [connection, addEvent]);

    const clearEvents = useCallback(() => setEvents([]), []);

    return { events, isConnected, clearEvents };
}