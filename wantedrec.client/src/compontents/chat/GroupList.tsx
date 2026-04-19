import React from "react";
import { Box, List, ListItem, ListItemText, Typography, Divider, IconButton } from "@mui/material";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import { useChatGroups, Group } from "../../hooks/useChatGroups";
import EditIcon from "@mui/icons-material/Edit";
import { RootState } from "../../../app/store";
import { useSelector } from "react-redux";
import { RULES } from "../../Interfaces/roles";
interface Props {
    currentUserId: string;
    onSelectGroup: (group: Group) => void;
    onCreateGroup: () => void;
    onEditGroup: (group: Group) => void;
    unreadCounts: { [groupId: number]: number };
}

const GroupList: React.FC<Props> = ({ currentUserId, onSelectGroup, onCreateGroup, onEditGroup, unreadCounts }) => {
    const { groups, isLoading, error } = useChatGroups(currentUserId);
    const { userRoles } = useSelector((state: RootState) => state.auth.loginResponse);
    const ChatManager: boolean = userRoles?.includes(RULES.ChatManager);
    return (
        <Box p={1} sx={{
            backgroundColor: "primary.default",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            '& *': {
                fontSize: '12px',
                fontWeight:'bold'
            }
        }}>
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "end",
                    alignItems: "center",
                    mb: 1,
                }}
            >
                {ChatManager && <IconButton color="primary" onClick={onCreateGroup}>
                    <GroupAddIcon sx={{ fontSize: '30px' }} />
                </IconButton>}
            </Box>

            {isLoading && <Typography>...جاري التحميل</Typography>}
            {error && <Typography color="error">فشل تحميل الكروبات</Typography>}

            <List sx={{ flex: 1, overflowY: "auto", px: 2 }}>
                {groups.map((group) => (
                    <React.Fragment key={group.id}>
                        <ListItem
                            secondaryAction={
                                ChatManager? <IconButton edge="end" aria-label="edit" onClick={() => onEditGroup(group)}>
                                    <EditIcon />
                                </IconButton>:null
                            }
                            component="li"
                            sx={{
                                '& *': {
                                    fontSize: '15px',
                                    fontWeight: 'bold'
                                }
                            }}
                        >
                            <ListItemText
                                primary={
                                    <Box display="flex" alignItems="center" justifyContent="space-between">
                                        <Typography className="group-name" onClick={() => onSelectGroup(group)}>
                                            {group.name.length > 30 ? `${group.name.slice(0, 30)}...` : group.name}
                                        </Typography>
                                        {unreadCounts[group.id] > 0 && (
                                            <Box
                                                sx={{
                                                    backgroundColor: 'error.main',
                                                    color: 'white',
                                                    borderRadius: '50%',
                                                    width: 24,
                                                    height: 24,
                                                    fontSize: '0.75rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    ml: 1
                                                }}
                                            >
                                                {unreadCounts[group.id]}
                                            </Box>
                                        )}
                                        <span className="group-name-status">{group.isClosed ? "🛑 المداولة مغلقة" : "✅ المداولة مفتوحة"}</span>
                                    </Box>
                                }
                                secondary={null}
                            />
                        </ListItem>

                        <Divider />
                    </React.Fragment>
                ))}
                {groups.length === 0 && !isLoading && <Typography>لا توجد مجموعات حالياً.</Typography>}
            </List>
        </Box>
    );
};

export default GroupList;