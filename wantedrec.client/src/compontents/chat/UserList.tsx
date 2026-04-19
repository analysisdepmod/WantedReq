import React, { useState, useMemo, useEffect } from "react";
import {
    List,
    ListItem,
    ListItemText,
    Divider,
    Avatar,
    CircularProgress,
    TextField,
    Box,
    Badge,
    Typography,
} from "@mui/material";
import { useChatUsers, User } from "../../hooks/useChatUsers";
import { useAllUnreadCounts } from "../../hooks/useAllUnreadCounts";
import { useLastMessages } from "../../hooks/useLastMessages";
import { getCurrentUserId } from "../../utils/auth";
 
import { useQueryClient } from "@tanstack/react-query";
import { getPresenceConnection } from "../../signalr/signalrConnections";

interface Props {
    onSelect: (user: User) => void;
}

const UserList: React.FC<Props> = ({ onSelect }) => {
    const presenceConnection = getPresenceConnection();

    const currentUserId = getCurrentUserId();
    const [searchTerm, setSearchTerm] = useState("");
    const [activeUserId, setActiveUserId] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const { usersQuery } = useChatUsers();
    const { privateUnreadCounts } = useAllUnreadCounts(currentUserId ?? "");
    const { lastMessages } = useLastMessages(currentUserId ?? "");

    const users = usersQuery.data ?? [];

    const filteredUsers = useMemo(() => {
        return users
            .filter((u) =>
                u.personName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.unitName.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => (b.isOnline ? 1 : 0) - (a.isOnline ? 1 : 0));
    }, [users, searchTerm]);

    useEffect(() => {
        const handleUserOnline = () => queryClient.invalidateQueries({ queryKey: ["chat-users"] });
        const handleUserOffline = () => queryClient.invalidateQueries({ queryKey: ["chat-users"] });

        presenceConnection.on("UserOnline", handleUserOnline);
        presenceConnection.on("UserOffline", handleUserOffline);

        return () => {
            presenceConnection.off("UserOnline", handleUserOnline);
            presenceConnection.off("UserOffline", handleUserOffline);
        };
    }, []);

    if (!currentUserId) return null;

    return (
        <Box p={0} sx={{ display: "flex", flexDirection: "column" }}>
            <Box
                sx={{
                    position: "sticky",
                    top: 0,
                    bgcolor: "background.paper",
                    zIndex: 1,
                    px: 2,
                    py: 1,
                    borderBottom: "1px solid #ddd",
                }}
            >
                <TextField
                    fullWidth
                    size="small"
                    placeholder="ابحث عن مستخدم..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{
                        '& .MuiInputBase-input': {
                            fontSize: '14px',
                        },
                    }}
                />
            </Box>

            {usersQuery.isLoading && <CircularProgress sx={{ m: 2 }} />}
            {usersQuery.isError && (
                <Typography sx={{ m: 2 }} color="error">
                    حدث خطأ أثناء تحميل المستخدمين
                </Typography>
            )}

            {!usersQuery.isLoading && !usersQuery.isError && (
                <List sx={{ flex: 1, overflowY: "auto", px: 2 }} >
                    {filteredUsers.length === 0 && (
                        <Typography variant="body2" color="textSecondary" sx={{ px: 1, py: 2 }}>
                            لا يوجد نتائج مطابقة
                        </Typography>
                    )}

                    {filteredUsers.map((user: User) => {
                        const unread = privateUnreadCounts[user.id] || 0;
                        const isActive = user.id === activeUserId;
                        const lastMsg = lastMessages[user.id];

                        return (
                            <React.Fragment key={user.id}>
                                <ListItem
                                    className="list-user-item"
                                    onClick={() => {
                                        setActiveUserId(user.id);
                                        onSelect(user);
                                    }}
                                    sx={{
                                        bgcolor: isActive ? "action.selected" : undefined,
                                        transition: "background-color 0.5s",
                                        borderRadius: 1,
                                        cursor: "pointer",
                                    }}
                                    aria-label={`فتح محادثة مع ${user.personName}`}
                                >
                                    <Badge
                                        color="error"
                                        badgeContent={unread > 0 ? unread : null}
                                        overlap="circular"
                                        anchorOrigin={{ vertical: "top", horizontal: "right" }}
                                    >
                                        <Avatar
                                            sx={{
                                                bgcolor: user.isOnline ? "success.main" : "text.disabled",
                                                mr: 2,
                                            }}
                                            aria-label={user.isOnline ? "متصل" : "غير متصل"}
                                        >
                                            {user.personName.charAt(0)}
                                        </Avatar>
                                    </Badge>

                                    <ListItemText
                                        primary={
                                            user.personName.length > 25
                                                ? `${user.personName.substring(0, 25)}...`
                                                : user.personName
                                        }
                                        secondary={
                                            <Box component="span" display="flex" flexDirection="column">
                                                <Typography component="span" variant="caption" color="textSecondary">
                                                    {user.unitName}
                                                </Typography>
                                                <Typography component="span" variant="caption" color="textSecondary">
                                                    {user.isOnline
                                                        ? "🟢 متصل الآن"
                                                        : user.lastSeen
                                                            ? `🔴 آخر ظهور: ${new Date(user.lastSeen).toLocaleString()}`
                                                            : "🔴 غير متصل"}
                                                </Typography>
                                                {lastMsg?.content && (
                                                    <>
                                                        <br />
                                                        <Typography component="span" variant="body2">
                                                            <strong>{lastMsg.content}</strong>
                                                        </Typography>
                                                    </>
                                                )}
                                            </Box>
                                        }
                                    />
                                </ListItem>
                                <Divider />
                            </React.Fragment>
                        );
                    })}
                </List>
            )}
        </Box>
    );
};

export default UserList;
