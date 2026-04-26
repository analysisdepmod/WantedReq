import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "../api";
import { useEffect, useMemo } from "react";
 
 

// 🧍‍♂️ نموذج لرسائل المستخدمين (الفردية)
export interface Message {
    id: number;
    senderId: string;
    content: string;
    sentAt: string;
    isDeleted: boolean;
    isEdited: boolean;
}

// 👥 نموذج عداد مجموعات النقاش
export interface GroupUnreadCount {
    chatGroupId: number;
    unreadCount: number;
}

// 🔊 أصوات التنبيه
 
import notificationAudioAddUser from "/sounds/Anemy.wav";
import { getChatConnection } from "../signalr/signalrConnections";
import { toast } from "react-toastify";

export const useAllUnreadCounts = (currentUserId: string) => {
    const isValidUser = !!currentUserId?.trim();
    const queryClient = useQueryClient();
    const chatConnection = getChatConnection();
    const handleGroup = (msg: any) => {
         
        queryClient.invalidateQueries({ queryKey: ["group-unread-counts", currentUserId] });
        if (msg.senderId === currentUserId) return;
        playSoundAndNotify(msg, "group");
    };
    const handlePrivate = (msg: any) => {
        queryClient.invalidateQueries({ queryKey: ["unread-messages", currentUserId] });
        if (msg.senderId === currentUserId) return;
        playSoundAndNotify(msg, "private");
    };
    const playSoundAndNotify = (msg: any, type: "private" | "group") => {
        try {
            const notificationAudio = new Audio("/sounds/Anemy.wav");
            notificationAudio.currentTime = 0;
            notificationAudio.play();
        } catch (err) {
            console.warn("تعذر تشغيل الصوت:", err);
        }

        toast.info(
            type === "private"
                ? `💬 رسالة جديدة من ${msg.senderName || "مستخدم"}`
                : `👥 رسالة جديدة في مجموعة`,

        );

        queryClient.invalidateQueries({ queryKey: ["unread-messages", currentUserId] });
        queryClient.invalidateQueries({ queryKey: ["group-unread-counts", currentUserId] });
    };
    // ✅ إشعارات الرسائل الفردية والجماعية
    useEffect(() => {

        //if (!isValidUser) return;

        chatConnection.on("ReceiveMessage", handlePrivate);
        chatConnection.on("ReceiveGroupMessage", handleGroup);

        return () => {
            chatConnection.off("ReceiveMessage", handlePrivate);
            chatConnection.off("ReceiveGroupMessage", handleGroup);
        };
    }, [currentUserId, queryClient]);

    const handleSent = () => {
        queryClient.invalidateQueries({ queryKey: ["group-unread-counts", currentUserId] });
    }
    const handlePrivateSent = () => {
        queryClient.invalidateQueries({ queryKey: ["messages", currentUserId] });
    }

    // ✅ تمت إضافتك إلى مجموعة
    useEffect(() => {
        if (!currentUserId) return;
        const audio = new Audio(notificationAudioAddUser);

        const handleYouAreAddedToGroup = (payload: {
            senderId: string;
            senderName: string;
            groupId: number;
            groupName: string;
        }) => {
            if (currentUserId == payload.senderId)
                return;

            audio?.play?.().catch(() => { });
               toast.success(`تمت إضافتك إلى المجموعة "${payload.groupName}" بواسطة ${payload.senderName}`, {
                
            });

            queryClient.invalidateQueries({ queryKey: ["group-unread-counts", currentUserId] });
        };

        chatConnection.off("YouAreAddedToGroup", handleYouAreAddedToGroup);
        chatConnection.on("YouAreAddedToGroup", handleYouAreAddedToGroup);

        return () => {
            chatConnection.off("YouAreAddedToGroup", handleYouAreAddedToGroup);
        };
    }, [currentUserId]);

    // ✅ تم إنشاء مجموعة جديدة
    useEffect(() => {
        if (!isValidUser) return;

        

        const handleGroupCreated = (payload: {
            groupId: number;
            groupName: string;
            createdBy: string;
        }) => {

            toast.success(`تم إنشاء مجموعة جديدة "${payload.groupName}" بواسطة ${payload.createdBy}`);
            queryClient.invalidateQueries({ queryKey: ["group-unread-counts", currentUserId] });
        };

        chatConnection.on("GroupCreated", handleGroupCreated);

        return () => {
            chatConnection.off("GroupCreated", handleGroupCreated);
        };
    }, [currentUserId, queryClient]);

    // ✅ عند تعديل رسالة جماعية
    useEffect(() => {
        if (!isValidUser) return;

        const handler = (payload: { GroupId: number }) => {
            queryClient.invalidateQueries({ queryKey: ["group-messages", payload.GroupId] });
            toast("✏️ تم تعديل رسالة في المجموعة");
        };

        chatConnection.on("GroupMessageEdited", handler);
        return () => chatConnection.off("GroupMessageEdited", handler);
    }, [currentUserId]);

    // ✅ عند حذف رسالة جماعية
    useEffect(() => {
        if (!isValidUser) return;

        const handler = (payload: { GroupId: number }) => {
            queryClient.invalidateQueries({ queryKey: ["group-messages", payload.GroupId] });
            toast("🗑️ تم حذف رسالة من المجموعة");
        };

        chatConnection.on("GroupMessageDeleted", handler);
        return () => chatConnection.off("GroupMessageDeleted", handler);
    }, [currentUserId]);

    // ✅ تحديث حالة المجموعة (إغلاق/فتح)
    useEffect(() => {
        if (!isValidUser) return;

        const handler = (payload: { GroupId: number; IsClosed: boolean }) => {
            toast(payload.IsClosed ? "🔒 تم إغلاق المجموعة" : "🔓 تم فتح المجموعة");
            queryClient.invalidateQueries({ queryKey: ["group-details", payload.GroupId] });
        };

        chatConnection.on("GroupStatusChanged", handler);
        return () => chatConnection.off("GroupStatusChanged", handler);
    }, [currentUserId]);

    // ✅ تم تعليم المجموعة كمقروءة
    useEffect(() => {
        if (!isValidUser) return;
       // payload: { GroupId: number }
        const handler = () => {
            queryClient.invalidateQueries({ queryKey: ["group-unread-counts", currentUserId] });
        };

        chatConnection.on("GroupMarkedAsRead", handler);
        return () => chatConnection.off("GroupMarkedAsRead", handler);
    }, [currentUserId]);

    // 📨 التأكيدات للمرسل
    useEffect(() => {
      

        const handleEditConfirmed = () => queryClient.invalidateQueries({ queryKey: ["group-messages"] });

        chatConnection.on("GroupMessageSent", handleSent);
        chatConnection.on("MessageSent", handlePrivateSent);
        chatConnection.on("GroupMessageEditConfirmed", handleEditConfirmed);

        return () => {
            chatConnection.off("GroupMessageSent", handleSent);
            chatConnection.off("MessageSent", handlePrivateSent);
            chatConnection.off("GroupMessageEditConfirmed", handleEditConfirmed);
        };
    }, [currentUserId]);

    // 📩 الرسائل الفردية غير المقروءة
    const {
        data: unreadPrivateMessages = [],
        isLoading: loadingPrivate,
        isError: errorPrivate,
    } = useQuery<Message[]>({
        queryKey: ["unread-messages", currentUserId],
        queryFn: async () => {
            const res = await axios.get("/chat/unread");
            return res.data;
        },
        enabled: isValidUser,
        staleTime: 1,
        refetchOnWindowFocus: false,
    });

    const privateUnreadCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const msg of unreadPrivateMessages) {
            const senderId = msg.senderId;
            counts[senderId] = (counts[senderId] || 0) + 1;
        }
        return counts;
    }, [unreadPrivateMessages]);

    const totalPrivateUnread = Object.values(privateUnreadCounts).reduce(
        (sum, count) => sum + count,
        0
    );

    // 👥 الرسائل الجماعية غير المقروءة
    const {
        data: groupUnreadData = [],
        isLoading: loadingGroup,
        isError: errorGroup,
    } = useQuery<GroupUnreadCount[]>({
        queryKey: ["group-unread-counts", currentUserId],
        queryFn: async () => {
            const res = await axios.get("/chat-groups/unread-group-count");
            return res.data;
        },
        enabled: isValidUser,
        //refetchInterval: 10000,
    });

    const groupUnreadCounts: Record<number, number> = useMemo(() => {
        const counts: Record<number, number> = {};
        for (const item of groupUnreadData) {
            counts[item.chatGroupId] = item.unreadCount;
        }
        return counts;
    }, [groupUnreadData]);

    const totalGroupUnread = Object.values(groupUnreadCounts).reduce(
        (sum, count) => sum + count,
        0
    );

    return {
        privateUnreadCounts,
        groupUnreadCounts,
        totalPrivateUnread,
        totalGroupUnread,
        totalUnread: totalPrivateUnread + totalGroupUnread,
        isLoading: loadingPrivate || loadingGroup,
        isError: errorPrivate || errorGroup,
    };
};

export default useAllUnreadCounts;
