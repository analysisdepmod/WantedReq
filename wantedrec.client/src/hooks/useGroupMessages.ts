import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import axios from "../api";
import { ensureStart, getChatConnection } from "../signalr/signalrConnections";
const chatConnection = getChatConnection();

export interface GroupMessage {
    id: number;
    senderId: string;
    content: string;
    contentEn?: string;
    sentAt: string;
    senderName: string;
    isDeleted: boolean;
    isEdited: boolean;
    attachmentUrl: string;
    attachmentName: string;
    hasAttachment: boolean;
    attachmentMimeType: string;
}
const token = localStorage.getItem("token");
export const useGroupMessages = (groupId: number, currentUserId: string) => {
    const queryClient = useQueryClient();
    const queryKey = ["group-messages", groupId];
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [text, setText] = useState("");
    const [imagePreviews, setImagePreviews] = useState<Record<number, string>>({});


    const loadImagePreview = async (messageId: number) => {
        try {
            const response = await axios.get(`/chat-groups/messages/${messageId}/file`, {
                responseType: "blob",
            });

            const blobUrl = URL.createObjectURL(response.data);
            setImagePreviews((prev) => ({ ...prev, [messageId]: blobUrl }));
        } catch (error) {
            console.error("❌ فشل تحميل الصورة:", error);
        }
    };

    // ✅ جلب الرسائل أول مرة
    const {
        data: messages = [],
        isLoading,
        isError,
        error,
    } = useQuery<GroupMessage[]>({
        queryKey,
        queryFn: async () => {
            const res = await axios.get(`/chat-groups/${groupId}/messages`);
            return res.data;
        },
        enabled: !!groupId,
        staleTime: 10000,
    });

    // ✅ Scroll تلقائي للأسفل
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // ✅ تعليم كمقروء عند التحميل
    useEffect(() => {
        if (messages.length > 0) {
            chatConnection.invoke("MarkGroupAsRead", groupId);
            queryClient.invalidateQueries({ queryKey: ["group-unread-counts", currentUserId] })
        }
    }, [groupId, messages.length]);

    // ✅ انضمام إلى المجموعة واستقبال الأحداث
    useEffect(() => {
        const join = async () => {
            await ensureStart(chatConnection, "GroupChat");
            await chatConnection.invoke("JoinGroup", groupId.toString());
        };
        join();

        const invalidate = () => {
            queryClient.invalidateQueries({ queryKey });
            queryClient.invalidateQueries({ queryKey: ["group-unread-counts", currentUserId] });
        };

        chatConnection.on("GroupMessageSent", invalidate);
        chatConnection.on("ReceiveGroupMessage", invalidate);
        chatConnection.on("GroupMessageEdited", invalidate);
        chatConnection.on("GroupMessageDeleted", invalidate);

        return () => {
            chatConnection.off("GroupMessageSent", invalidate);
            chatConnection.off("ReceiveGroupMessage", invalidate);
            chatConnection.off("GroupMessageEdited", invalidate);
            chatConnection.off("GroupMessageDeleted", invalidate);

            chatConnection.invoke("LeaveGroup", groupId.toString());
        };
    }, [groupId, currentUserId]);

    //// ✅ إرسال رسالة عبر SignalR
    //const sendMessage = async (text:string) => {
    //    if (!text.trim()) return;
    //    await chatConnection.invoke("SendGroupMessage", groupId, text, true, token); // استخدم التوكن حسب حاجتك
    //    setText("");
    //};
    const sendMessage = async (text: string, file?: File) => {
        const hasText = text.trim().length > 0;
        const hasFile = !!file;

        if (!hasText && !hasFile) return;

        if (hasFile) {
            const formData = new FormData();
            if (!hasText)
                formData.append("content", "@");
           else
            formData.append("content", text);
            formData.append("file", file); // لا حاجة للتحقق من وجوده مرتين

            await axios.post(`/chat-groups/${groupId}/messages`, formData); // لا تحدد Content-Type
        } else {
            await chatConnection.invoke("SendGroupMessage", groupId, text, true, token);
        }

        setText("");
    };


    // ✅ تعديل رسالة عبر SignalR
    const editMessage = async (messageId: number, content: string) => {
        if (!content.trim()) return;
        await chatConnection.invoke("EditGroupMessage", groupId, messageId, content);
    };

    // ✅ حذف رسالة عبر SignalR
    const deleteMessage = async (messageId: number) => {
        await chatConnection.invoke("DeleteGroupMessage", groupId, messageId);
        setImagePreviews((prev) => {
            const updated = { ...prev };
            if (updated[messageId]) {
                URL.revokeObjectURL(updated[messageId]); // تنظيف الذاكرة
                delete updated[messageId];
            }
            return updated;
        });

    };

    useEffect(() => {
        messages.forEach((msg) => {
            if (
                msg.hasAttachment && !msg.isDeleted &&
                msg.attachmentMimeType?.startsWith("image/") &&
                !imagePreviews[msg.id]
            ) {
                loadImagePreview(msg.id);
            }
            
               
           
        });
    }, [messages]);



    return {
        text,
        setText,
        messages,
        isLoading,
        isError,
        error,
        sendMessage,
        editMessage,
        deleteMessage,
        messagesEndRef,
        imagePreviews
    };
};
