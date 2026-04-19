import * as signalR from "@microsoft/signalr";
import { BASIC_URL1 } from "../api";

// 🛠️ دالة لإنشاء أي اتصال
const createHubConnection = (path: string): signalR.HubConnection => {
    return new signalR.HubConnectionBuilder()
        .withUrl(`${BASIC_URL1}/hubs/${path}`, {
            accessTokenFactory: () => localStorage.getItem("token") || "",
        })
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.None)
        .build();
};

// 🔁 متغيرات يمكن إعادة تعيينها
let chatConnection = createHubConnection("chathub");
let notificationConnection = createHubConnection("notificationhub");
let presenceConnection = createHubConnection("presencehub");

// ✅ دوال لإنشاء جديدة (تُستخدم بعد تسجيل الدخول)
export const recreateChatConnection = () => (chatConnection = createHubConnection("chathub"));
export const recreateNotificationConnection = () => (notificationConnection = createHubConnection("notificationhub"));
export const recreatePresenceConnection = () => (presenceConnection = createHubConnection("presencehub"));

// ✅ getter للاتصالات (لتفادي التصدير المباشر)
export const getChatConnection = () => chatConnection;
export const getNotificationConnection = () => notificationConnection;
export const getPresenceConnection = () => presenceConnection;

// ✅ دالة تشغيل آمنة
export const ensureStart = async (connection: signalR.HubConnection, name = "Hub") => {
    if (connection.state === signalR.HubConnectionState.Connected) {
        console.log(`✅ ${name} already connected`);
        return;
    }

    if (
        connection.state === signalR.HubConnectionState.Connecting ||
        connection.state === signalR.HubConnectionState.Reconnecting
    ) {
        console.log(`⏳ ${name} is ${connection.state}... waiting`);
        return new Promise<void>((resolve) => {
            const interval = setInterval(() => {
                if (connection.state === signalR.HubConnectionState.Connected) {
                    clearInterval(interval);
                    console.log(`✅ ${name} connected (after waiting)`);
                    resolve();
                }
            }, 300);
        });
    }

    try {
        await connection.start();
        console.log(`🚀 ${name} started`);
    } catch (err) {
        console.error(`❌ ${name} connection error:`, err);
    }
};
