import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import axios from "../api";
import { ensureStart, getChatConnection } from "../signalr/signalrConnections";
const token = localStorage.getItem("token");
export interface Message {
    id: number;
    senderId: string;
    receiverId: string;
    content: string;
    contentEn: string;
    sentAt: string;
    isRead: boolean;
    readAt: string | null;
    isDeleted: boolean;
}

export const useChatMessages = (currentUserId: string, selectedUserId: string) => {
    const queryClient = useQueryClient();
    const queryKey = ["messages", selectedUserId];
    const chatConnection = getChatConnection();
    const isEnabled = !!currentUserId && !!selectedUserId && currentUserId.length > 10;

    // ✅ جلب الرسائل بين المستخدمين (مرة واحدة فقط)
    const {
        data: messages = [],
        isLoading,
        error,
    } = useQuery<Message[]>({
        queryKey,
        queryFn: async () => {
            const res = await axios.get(`/chat/messages/${selectedUserId}`);
            return res.data;
        },
        enabled: isEnabled,
        staleTime: 5000,
    });

     //✅ استقبال رسالة لحظيًا
    useEffect(() => {
        if (!isEnabled) return;
        //message: Message
        const handler = () => {
            queryClient.invalidateQueries({ queryKey });
        };

        chatConnection.on("MessageSent", handler);
        chatConnection.on("ReceiveMessage", handler);
        chatConnection.on("MessageRead", handler);
        chatConnection.on("MessageDeleted", handler);
        chatConnection.on("MessageDeletedConfirmed", handler);

        return () => {
            chatConnection.off("MessageSent", handler);
            chatConnection.off("ReceiveMessage", handler);
            chatConnection.off("MessageRead", handler);
            chatConnection.off("MessageDeleted", handler);
            chatConnection.off("MessageDeletedConfirmed", handler);
        };
    }, [currentUserId, selectedUserId]);

    // ✅ إرسال رسالة عبر SignalR
    const sendMessage = async (receiverId: string, content: string, ar = true) => {
        if (!content.trim()) return;
        await ensureStart(chatConnection, "PrivateChat");
        await chatConnection.invoke("SendMessage", receiverId, content, ar, token);
    };

    // ✅ تعليم كمقروء
    const markAsRead = async (messageId: number) => {
        await ensureStart(chatConnection, "PrivateChat");
        await chatConnection.invoke("MarkMessageAsRead", messageId);
        queryClient.invalidateQueries({ queryKey: ["unread-messages", currentUserId] });
    };

    // ✅ حذف الرسالة
    const deleteMessage = async (messageId: number) => {
        await ensureStart(chatConnection, "PrivateChat");
        await chatConnection.invoke("DeleteMessage", messageId);
    };

    return {
        messages,
        isLoading,
        error,
        sendMessage,
        markAsRead,
        deleteMessage,
    };
};
