
import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { getRecognitionConnection, ensureStart } from '../signalr/signalrConnections';
import {
    DangerLevel,
    DangerLevelLabel,
    PersonSecurityStatus,
    PersonSecurityStatusLabel,
} from '../types/person.types';

export interface LiveRecognitionEvent {
    recognitionId?: number;
    personId?: number;
    personFullName?: string;
    personDisplayName?: string;
    nationalId?: string;
    cameraId?: number;
    cameraName?: string;
    score?: number;
    isSuspect: boolean;
    primaryImageBase64?: string;
    snapshotPath?: string;
    recognitionDateTime: string;
    userDeviceId?: number | null;
    isLocalCamera?: boolean;

    securityStatus?: PersonSecurityStatus;
    dangerLevel?: DangerLevel;
    hasActiveAlert?: boolean;
    isArmedAndDangerous?: boolean;
    securityReason?: string;
    caseNumber?: string;
    issuedBy?: string;
    lastSeenAt?: string;
    lastSeenLocation?: string;
    alertInstructions?: string;
    aliases?: string;
    vehicleInfo?: string;
}

type EventSeverity = 'normal' | 'warning' | 'critical';

const suspectAudio = typeof Audio !== 'undefined' ? new Audio('/sounds/alert.wav') : null;
const normalAudio = typeof Audio !== 'undefined' ? new Audio('/sounds/message.wav') : null;

function resolveSeverity(evt: LiveRecognitionEvent): EventSeverity {
    if (
        evt.dangerLevel === DangerLevel.Critical ||
        evt.securityStatus === PersonSecurityStatus.Wanted ||
        evt.securityStatus === PersonSecurityStatus.WantedAndSuspect ||
        evt.hasActiveAlert ||
        evt.isArmedAndDangerous
    ) {
        return 'critical';
    }

    if (
        evt.isSuspect ||
        evt.securityStatus === PersonSecurityStatus.Suspect ||
        evt.dangerLevel === DangerLevel.High
    ) {
        return 'warning';
    }

    return 'normal';
}

function playSound(evt: LiveRecognitionEvent) {
    const severity = resolveSeverity(evt);
    const audio = severity === 'normal' ? normalAudio : suspectAudio;
    if (!audio) return;

    audio.currentTime = 0;
    audio.volume = severity === 'critical' ? 1 : severity === 'warning' ? 0.9 : 0.7;
    audio.play().catch(() => { });
}

function buildToastMessage(evt: LiveRecognitionEvent) {
    const name = evt.personFullName ?? evt.personDisplayName ?? 'غير معروف';
    const camera = evt.cameraName ?? 'كاميرا';
    const percent = evt.score !== undefined ? ` — ${Math.round(evt.score * 100)}%` : '';

    if (resolveSeverity(evt) === 'critical') {
        return `🚨 إنذار حرج: ${name} — ${camera}${percent}`;
    }

    if (resolveSeverity(evt) === 'warning') {
        return `⚠️ إنذار أمني: ${name} — ${camera}${percent}`;
    }

    return `✅ تعرف: ${name} — ${camera}${percent}`;
}

function pushBrowserNotification(evt: LiveRecognitionEvent) {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const name = evt.personFullName ?? evt.personDisplayName ?? 'غير معروف';
    const title = resolveSeverity(evt) === 'critical'
        ? `🚨 إنذار حرج — ${name}`
        : resolveSeverity(evt) === 'warning'
            ? `⚠️ إنذار أمني — ${name}`
            : `✅ تعرف ناجح — ${name}`;

    const security = evt.securityStatus !== undefined ? PersonSecurityStatusLabel[evt.securityStatus] : null;
    const danger = evt.dangerLevel !== undefined ? DangerLevelLabel[evt.dangerLevel] : null;

    const body = [
        evt.cameraName ? `الكاميرا: ${evt.cameraName}` : null,
        evt.nationalId ? `الهوية: ${evt.nationalId}` : null,
        security ? `الحالة: ${security}` : null,
        danger ? `الخطورة: ${danger}` : null,
        evt.lastSeenLocation ? `آخر ظهور: ${evt.lastSeenLocation}` : null,
        evt.alertInstructions ? `التعليمات: ${evt.alertInstructions}` : null,
    ].filter(Boolean).join(' | ');

    try {
        const notification = new Notification(title, {
            body,
            tag: evt.recognitionId ? `recognition-${evt.recognitionId}` : `recognition-${evt.personId}-${evt.cameraId}`,
            silent: true,
        });

        setTimeout(() => notification.close(), resolveSeverity(evt) === 'critical' ? 12000 : 8000);
    } catch {
        // ignore
    }
}

export function useSignalRRecognition() {
    const qc = useQueryClient();
    const [events, setEvents] = useState<LiveRecognitionEvent[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const connection = getRecognitionConnection();

    const addEvent = useCallback((evt: LiveRecognitionEvent) => {
        setEvents(prev => [evt, ...prev].slice(0, 200));

        qc.invalidateQueries({ queryKey: ['recognitions'] });
        qc.invalidateQueries({ queryKey: ['recognitions-home'] });
        qc.invalidateQueries({ queryKey: ['cameras'] });
        qc.invalidateQueries({ queryKey: ['persons'] });
        qc.invalidateQueries({ queryKey: ['person', evt.personId] });

        const severity = resolveSeverity(evt);
        toast(buildToastMessage(evt), {
            type: severity === 'critical' ? 'error' : severity === 'warning' ? 'warning' : 'success',
            position: 'bottom-left',
            autoClose: severity === 'critical' ? 10000 : severity === 'warning' ? 7000 : 4000,
            style:
                severity === 'critical'
                    ? { background: '#7f1d1d', color: '#fecaca' }
                    : severity === 'warning'
                        ? { background: '#78350f', color: '#fde68a' }
                        : undefined,
        });

        playSound(evt);
        pushBrowserNotification(evt);
    }, [qc]);

    useEffect(() => {
        let mounted = true;

        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().catch(() => { });
        }

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
