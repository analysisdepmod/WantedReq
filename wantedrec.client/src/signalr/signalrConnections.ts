// ════════════════════════════════════════════════════════
//  src/signalr/signalrConnections.ts
//  محدَّث — أضاف RecognitionHub
// ════════════════════════════════════════════════════════

import * as signalR from "@microsoft/signalr";
import { BASIC_URL1 } from "../api";

const createHub = (path: string): signalR.HubConnection =>
    new signalR.HubConnectionBuilder()
        .withUrl(`${BASIC_URL1}/hubs/${path}`, {
            accessTokenFactory: () => localStorage.getItem("token") || "",
        })
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.None)
        .build();

// ── Connections ───────────────────────────────────────────
let chatConnection = createHub("chathub");
let notificationConnection = createHub("notificationhub");
let presenceConnection = createHub("presencehub");
let recognitionConnection = createHub("recognitionhub"); // ← جديد

// ── Recreate (بعد login) ──────────────────────────────────
export const recreateChatConnection = () => (chatConnection = createHub("chathub"));
export const recreateNotificationConnection = () => (notificationConnection = createHub("notificationhub"));
export const recreatePresenceConnection = () => (presenceConnection = createHub("presencehub"));
export const recreateRecognitionConnection = () => (recognitionConnection = createHub("recognitionhub"));

// ── Getters ───────────────────────────────────────────────
export const getChatConnection = () => chatConnection;
export const getNotificationConnection = () => notificationConnection;
export const getPresenceConnection = () => presenceConnection;
export const getRecognitionConnection = () => recognitionConnection;

// ── ensureStart ───────────────────────────────────────────
export const ensureStart = async (
    connection: signalR.HubConnection,
    name = "Hub",
) => {
    if (connection.state === signalR.HubConnectionState.Connected) return;

    if (
        connection.state === signalR.HubConnectionState.Connecting ||
        connection.state === signalR.HubConnectionState.Reconnecting
    ) {
        return new Promise<void>((resolve) => {
            const id = setInterval(() => {
                if (connection.state === signalR.HubConnectionState.Connected) {
                    clearInterval(id); resolve();
                }
            }, 300);
        });
    }

    try {
        await connection.start();
        console.log(`🚀 ${name} started`);
    } catch (err) {
        console.error(`❌ ${name} error:`, err);
    }
};