import React, { useState } from "react";
import { Box, Drawer, Fab, Tabs, Tab, Badge } from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
import UserList from "./UserList";
import ChatWindow from "./ChatWindow";
import GroupList from "./GroupList";
import GroupChatWindow from "./GroupChatWindow";
import CreateGroupModal from "./CreateGroupModal";
import NotificationButton from "./NotificationButton";
import { useSelector } from "react-redux";
import { RootState } from "../../../app/store";
import { User } from "../../hooks/useChatUsers";
import { Group } from "../../hooks/useChatGroups";
import { useAllUnreadCounts } from "../../hooks/useAllUnreadCounts";
import { RULES } from "../../Interfaces/roles";
 


const ChatWidget: React.FC<{ currentUserId: string, recEvents?: number }> = ({ currentUserId, recEvents }) => {
    const [open, setOpen] = useState(false);
    const [tabIndex, setTabIndex] = useState(0);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [groupModalOpen, setGroupModalOpen] = useState(false);
    const { arlang } = useSelector((state: RootState) => state.setting);
    const { userRoles } = useSelector((state: RootState) => state.auth.loginResponse);
    const Chat: boolean = userRoles?.includes(RULES.Chat);
    const ChatManager: boolean = userRoles?.includes(RULES.ChatManager);
    const {
        
        groupUnreadCounts,
        totalPrivateUnread,
        totalGroupUnread,
        totalUnread,
    } = useAllUnreadCounts(currentUserId);

   
   

    const [editingGroup, setEditingGroup] = useState<Group | undefined>(undefined);
   
    const handleSelectUser = (user: User) => {
        setSelectedUser(user);
        setSelectedGroup(null);
        setOpen(true);
    };

    const handleSelectGroup = (group: Group) => {
        setSelectedGroup(group);
        setSelectedUser(null);
        setOpen(true);
    };
 
    return (
        <div style={{ zIndex: 200 }}>
            <Box
                sx={{
                    right: arlang ? "auto" : 20,
                    left: arlang ? 20 : "auto",
                    display: "flex",
                    flexDirection: "row",
                    gap: 1.5,
                }}
            >
                <Fab color="primary" onClick={() => setOpen(true)} sx={{ width: 40, height: 40 }}>
                    {(Chat || ChatManager) ?<>
                        <ChatIcon fontSize="medium" />
                        {totalUnread > 0 && (
                            <Box
                                sx={{
                                    position: "absolute",
                                    top: 4,
                                    right: 4,
                                    backgroundColor: "error.main",
                                    color: "white",
                                    borderRadius: "50%",
                                    width: 20,
                                    height: 20,
                                    fontSize: "0.75rem",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                {totalUnread}
                            </Box>
                        )}</>
                        :null}

                </Fab>
                <Badge color="error" overlap="circular">
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "primary.main",
                            borderRadius: "50%",
                        }}
                    >
                        <NotificationButton recEvents={recEvents} />
                    </Box>
                </Badge>
            </Box>

            <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
                <Box sx={{ width: { xs: "100vw", sm: 650 }, height: "100vh", display: "flex", flexDirection: "column"}}>
                    <Tabs value={tabIndex} onChange={(_, val) => setTabIndex(val)} className="tabs">
                        <Tab
                            label={
                                <Box sx={{ mr: 1, p: 1.5, display: 'flex', flexDirection: 'row', justifyContent: 'space-around' }}>
                                    {arlang ? "محادثات فردية" : "Private"}
                                    {totalPrivateUnread > 0 && (
                                        <Badge badgeContent={totalPrivateUnread} color="error" style={{ marginTop: '-10px' }} />
                                    )}
                                </Box>
                            }
                        />
                        <Tab
                            label={
                                <Box sx={{ mr: 1,p:1.5, display: 'flex', flexDirection: 'row',justifyContent:'space-around' }}>
                                    {arlang ? "مجموعات المداولة" : "Groups"}
                                    {totalGroupUnread > 0 && (
                                        <Badge badgeContent={totalGroupUnread} color="error" style={{marginTop:'-10px'}} />
                                    )}
                                </Box>
                            }
                        />
                    </Tabs>



                    {/* ✅ المحادثات الفردية */}
                    {tabIndex === 0 && !selectedUser && <UserList onSelect={handleSelectUser} />}
                    {tabIndex === 0 && selectedUser && (
                        <ChatWindow currentUserId={currentUserId} selectedUser={selectedUser} onBack={() => setSelectedUser(null)} />
                    )}

                    {/* ✅ المحادثات الجماعية */}
                    {tabIndex === 1 && !selectedGroup && (
                        <GroupList
                            currentUserId={currentUserId}
                            onSelectGroup={handleSelectGroup}
                            onCreateGroup={() => {
                                setEditingGroup(undefined);
                                setGroupModalOpen(true);
                            }}
                            onEditGroup={(group) => {
                                setEditingGroup(group);
                                setGroupModalOpen(true);
                            }}
                            unreadCounts={groupUnreadCounts}
                        />

                    )}
                    {tabIndex === 1 && selectedGroup && (
                        <GroupChatWindow
                            currentUserId={currentUserId}
                            group={selectedGroup}
                            onBack={() => setSelectedGroup(null)}
                        />
                    )}
                </Box>
            </Drawer>

            <CreateGroupModal
                open={groupModalOpen}
                onClose={() => {
                    setGroupModalOpen(false);
                    setEditingGroup(undefined);
                }}
                currentUserId={currentUserId}
                editingGroup={editingGroup}
            />
        </div>
    );
};

export default ChatWidget;