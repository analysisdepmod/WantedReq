// ════════════════════════════════════════════════════════
//  src/hooks/useSignalRRecognition.ts
//  هوك الاستقبال الفوري لأحداث التعرف عبر SignalR
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

        // إشعار مرئي
        const msg = evt.isSuspect
            ? `⚠️ مشتبه به! ${evt.personFullName} — ${evt.cameraName}`
            : `✅ تعرف: ${evt.personFullName} — ${evt.cameraName}`;

        toast(msg, {
            type: evt.isSuspect ? 'error' : 'success',
            position: 'bottom-left',
            autoClose: evt.isSuspect ? 8000 : 4000,
            style: evt.isSuspect ? { background: '#7f1d1d', color: '#fecaca' } : undefined,
        });

        playSound(evt.isSuspect);
    }, [qc]);

    useEffect(() => {
        // بدء الاتصال
        ensureStart(connection, 'RecognitionHub').then(() => {
            setIsConnected(true);
        });

        // استقبال الأحداث
        connection.on('RecognitionDetected', (data: LiveRecognitionEvent) => {
            addEvent({
                ...data,
                recognitionDateTime: data.recognitionDateTime ?? new Date().toISOString(),
            });
        });

        // مراقبة حالة الاتصال
        connection.onclose(() => setIsConnected(false));
        connection.onreconnected(() => setIsConnected(true));
        connection.onreconnecting(() => setIsConnected(false));

        return () => {
            connection.off('RecognitionDetected');
        };
    }, [connection, addEvent]);

    const clearEvents = useCallback(() => setEvents([]), []);

    return { events, isConnected, clearEvents };
}