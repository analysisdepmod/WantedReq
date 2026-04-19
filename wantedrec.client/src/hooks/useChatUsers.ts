import { useQuery } from "@tanstack/react-query";
import axios from "../api";

export interface User {
    id: string;
    personName: string;
    unitName: string;
    isOnline: boolean;
    lastSeen: string | null;
}

export const useChatUsers = (enabled = true) => {
    const usersQuery = useQuery<User[]>({
        queryKey: ["chat-users"],
        queryFn: async () => {
            const response = await axios.get("/chat/users");
            return response.data;
        },
        enabled,
        staleTime: 10,
        refetchOnWindowFocus: false,
    });

    return { usersQuery };
};
