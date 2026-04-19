import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    List,
    ListItem,
    Checkbox,
    ListItemText,
    CircularProgress,
    Typography,
    IconButton,
    Box,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useChatUsers, User } from "../../hooks/useChatUsers";
import axios from "../../api";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
    open: boolean;
    onClose: () => void;
    currentUserId: string;
    editingGroup?: {
        id: number;
        name: string;
        memberIds: string[];
        createdAt: string;
        isClosed: boolean;
    };
}

const CreateGroupModal: React.FC<Props> = ({ open, onClose, currentUserId, editingGroup }) => {
    const isEdit = !!editingGroup;
    const [groupName, setGroupName] = useState(editingGroup?.name || "");
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>(editingGroup?.memberIds || []);
    const [loading, setLoading] = useState(false);

    const { usersQuery } = useChatUsers();
    const users = usersQuery.data?.filter(u => u.id !== currentUserId) || [];

    const queryClient = useQueryClient();

    useEffect(() => {
        if (!open) {
            setGroupName("");
            setSelectedUserIds([]);
        } else if (isEdit) {
            setGroupName(editingGroup?.name || "");
            setSelectedUserIds(editingGroup?.memberIds || []);
        }
    }, [open, isEdit, editingGroup]);

    const toggleUser = (userId: string) => {
        setSelectedUserIds(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const handleSave = async () => {
        if (!groupName.trim() || selectedUserIds.length === 0) return;
        setLoading(true);
        try {
            let groupId = editingGroup?.id;
            if (!isEdit) {
                const res = await axios.post("/chat-groups", { name: groupName });
                groupId = res.data.id;
            } else {
                await axios.put(`/chat-groups/${groupId}`, { name: groupName });
                await axios.delete(`/chat-groups/${groupId}/users/all`); // clear old members
            }

            for (const userId of selectedUserIds) {
                await axios.post(`/chat-groups/${groupId}/users`, { userId });
            }

            onClose();
            queryClient.invalidateQueries({ queryKey: ["chat-groups", currentUserId] });

        } catch (err) {
            console.error("Group save failed", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteGroup = async () => {
        if (!editingGroup) return;
        if (!window.confirm("هل أنت متأكد من حذف المجموعة؟")) return;
        setLoading(true);
        try {
            await axios.delete(`/chat-groups/${editingGroup.id}`);
            onClose();
            queryClient.invalidateQueries({ queryKey: ["chat-groups", currentUserId] });
        } catch (err) {
            console.error("Group deletion failed", err);
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = () => {
        if (!editingGroup) return;
        if (!window.confirm("هل أنت متأكد من حذف المجموعة؟")) return;
        setLoading(true);
        try {
            axios.post(`/chat-groups/${editingGroup?.id}/toggle-status`)
                .then(() => {
                    onClose();
                    queryClient.invalidateQueries({ queryKey: ["chat-groups", currentUserId] });
                })
                .catch(e => console.log(e));
        } catch (err) {
            console.error("Group deletion failed", err);
        } finally {
            setLoading(false);
        }
    }
    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>
                <Box display="flex" flexDirection="column">
                    <Typography variant="h6">تعديل المجموعة</Typography>
                    {editingGroup?.createdAt && (
                        <Typography variant="body2" color="text.secondary">
                            أنشئت في: {new Date(editingGroup.createdAt).toLocaleString("ar-EG")}
                        </Typography>
                    )}
                </Box>
            </DialogTitle>

            <DialogContent>
                <TextField
                    fullWidth
                    label="اسم المجموعة"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    margin="normal"
                    sx={{
                        position: 'sticky',
                        backgroundColor: 'white',
                        zIndex:2,
                        top: 0,
                        '& .MuiInputBase-input': {
                            fontSize: '14px',
                           
                        },
                    }}
                />
                {usersQuery.isLoading ? (
                    <CircularProgress />
                ) : (
                    <List className="list-users">
                        {users.map((user: User) => (
                            <ListItem
                                key={user.id}
                                onClick={() => toggleUser(user.id)}
                                component="li"
                                dense
                                 
                            >
                                <Checkbox checked={selectedUserIds.includes(user.id)} />
                                <ListItemText primary={user.personName} secondary={user.unitName} />
                            </ListItem>
                        ))}
                    </List>
                )}
            </DialogContent>

            <DialogActions>
                {isEdit && (
                    <IconButton onClick={handleDeleteGroup} disabled={loading} color="error">
                        <DeleteIcon />
                    </IconButton>
                )}
                {editingGroup && (
                    <Button
                        variant="outlined"
                        color={editingGroup.isClosed ? "success" : "warning"}
                        onClick={toggleStatus}
                    >
                        {editingGroup.isClosed ? "✅ فتح النقاش" : "🛑 إغلاق النقاش"}
                    </Button>
                )}


                <Button onClick={onClose} disabled={loading}>إلغاء</Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    color="primary"
                    disabled={loading || !groupName.trim() || selectedUserIds.length === 0}
                >
                    {loading ? "...جاري الحفظ" : isEdit ? "حفظ التعديلات" : "إنشاء"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CreateGroupModal;