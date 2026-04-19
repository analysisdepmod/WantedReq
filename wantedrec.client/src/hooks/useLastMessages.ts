import { useQuery } from "@tanstack/react-query";
import axios from "../api";
import { Message } from "./useChatMessages";

// هذا الهوك يُرجع آخر رسالة تم إرسالها أو استقبالها لكل مستخدم
export const useLastMessages = (currentUserId: string) => {
    const queryKey = ["last-messages", currentUserId];

    const {
        data: messages = [],
        isLoading,
        error,
    } = useQuery<Message[]>({
        queryKey,
        // 🔁 يفضل استخدام /chat/all مؤقتًا بدلاً من /chat/unread
        queryFn: async () => {
            const response = await axios.get("/chat/all");
            return response.data;
        },
        enabled: !!currentUserId && currentUserId.length > 10,
        staleTime: 10000,
        refetchOnWindowFocus: false,
    });

    const lastMessages = messages.reduce((acc, msg) => {
        const peerId = msg.senderId === currentUserId ? msg.receiverId : msg.senderId;
        const existing = acc[peerId];

        if (!existing || new Date(msg.sentAt) > new Date(existing.sentAt)) {
            acc[peerId] = msg;
        }

        return acc;
    }, {} as Record<string, Message>);

    return {
        lastMessages,
        isLoading,
        error,
        rawMessages: messages,
    };
};
