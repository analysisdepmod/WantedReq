import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "../api";
import { useEffect } from "react";
import {  getNotificationConnection } from "../signalr/signalrConnections";
import { toast } from "react-toastify";
const connection = getNotificationConnection();

export interface NotificationItem {
    id: number;
    action: string;
    actionEn: string;
    postedDate: string;
    att_Controller_Name: string;
    whatAction: number;
    att_pk: number;
}

// 🧠 هوك لجلب قائمة الإشعارات غير المقروءة
export const useNotifications = () => {
  

    const queryClient = useQueryClient();

    const query = useQuery<NotificationItem[]>({
        queryKey: ["unread-notifications"],
        queryFn: async () => {
            const res = await axios.get("/Notifications/unreadNotifications");
            return res.data;
        },
        staleTime: 0,
    });


    useEffect(() => {
        const handler = (notification: NotificationItem) => {
            queryClient.invalidateQueries({ queryKey: ["unread-notifications"] });
            const audio = new Audio("/sounds/message.wav");
            audio.play().catch(() => { });
            // 💬 Toast الإشعار
            toast.info(`🔔 ${notification.action}`, {
                position: "bottom-left",
                autoClose: 4000,
                pauseOnHover: true,
                draggable: true,
            });
        };

        connection.on("ReciveNotification", handler);
        return () => connection.off("ReciveNotification", handler);
    }, [queryClient]);


    return query;
};

 
