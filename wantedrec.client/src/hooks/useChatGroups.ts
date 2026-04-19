// src/hooks/useChatGroups.ts
import { useQuery } from "@tanstack/react-query";
import axios from "../api";

export interface Group {
    id: number;
    name: string;
    isClosed: boolean;
    createdAt: string;
    memberIds: string[];
}

export const useChatGroups = (currentUserId: string) => {
    const {
        data = [],
        isLoading,
        isError,
        error,
    } = useQuery<Group[]>({
        queryKey: ["chat-groups", currentUserId],
        queryFn: async () => {
            const res = await axios.get("/chat-groups/user");
            return res.data;
        },
        enabled: !!currentUserId,
        staleTime: 10000,
        refetchOnWindowFocus: false,
    });

    return { groups: data, isLoading, isError, error };
};
