import React, { useState } from "react";
import {
    Box,
    TextField,
    IconButton,
    Typography,
    Paper,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
} from "@mui/material";
 
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import GroupIcon from "@mui/icons-material/Group";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { Group } from "../../hooks/useChatGroups";
import axios from "../../api";
import { useGroupMessages } from "../../hooks/useGroupMessages";
import { RootState } from "../../../app/store";
import { useSelector } from "react-redux";
import EmojiPicker from 'emoji-picker-react';
import DownloadIcon from '@mui/icons-material/Download';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon';
import SendIcon from '@mui/icons-material/Send';
interface User {
    id: string;
    personName: string;
    unitName: string;
}

interface Props {
    currentUserId: string;
    group: Group & { isAdmin?: boolean };
    onBack: () => void;
}

const GroupChatWindow: React.FC<Props> = ({ currentUserId, group, onBack }) => {
    const [membersOpen, setMembersOpen] = useState(false);
    const [members, setMembers] = useState<User[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editText, setEditText] = useState("");
    const [hoveredMessageId, setHoveredMessageId] = useState<number | null>(null);
    const { arlang } = useSelector((state: RootState) => state.setting);
    const [showPicker, setShowPicker] = useState(false);
    const [file, setFile] = useState<File | undefined>(undefined);

    const {
        text,
        setText,
        messages,
        isLoading,
        sendMessage,
        editMessage,
        deleteMessage,
        messagesEndRef,
        imagePreviews
    } = useGroupMessages(group.id, currentUserId);




    const downloadFile = async (messageId: number, fileName: string) => {
        try {
            const response = await axios.get(`/chat-groups/messages/${messageId}/file`, {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("فشل تحميل المرفق", error);
            alert("حدث خطأ أثناء تحميل الملف (ربما ليس لديك صلاحية الوصول)");
        }
    };

    const onEmojiClick = (emojiData: any) => {
        setText(prev => prev + emojiData.emoji);
    };
    const fetchMembers = async () => {
        try {
            const res = await axios.get(`/chat-groups/${group.id}/users`);
            setMembers(res.data);
            setMembersOpen(true);
        } catch (err) {
            console.error("فشل تحميل الأعضاء", err);
        }
    };

    const handleRemove = async (userId: string) => {
        if (!window.confirm("هل أنت متأكد من إزالة هذا العضو؟")) return;
        try {
            await axios.delete(`/chat-groups/${group.id}/users/${userId}`);
            setMembers((prev) => prev.filter((m) => m.id !== userId));
        } catch (err) {
            console.error("فشل إزالة العضو", err);
        }
    };
    function isEmojiOnly(text: string, deleted: boolean) {
        if (deleted) return '';
        if (/^[\p{Emoji}\s]+$/u.test(text.trim()))
            return 'Emoji';
        else return '';
    }
    return (
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {/* رأس المجموعة */}
            <Box
                sx={{
                    position: 'sticky',
                    top: 0,
                    zIndex:1000,
                    p: 2,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    bgcolor: "background.paper",
                }}
            >
                <IconButton onClick={onBack}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h6" className="group-name">{group.name}</Typography>
                <Box>
                    <IconButton onClick={fetchMembers} title="عرض الأعضاء">
                        <GroupIcon sx={{ fontSize: "24px" }} />
                    </IconButton>
                    {group.isClosed && (
                        <Typography color="error" ml={1}>
                            🛑 المداولة مغلقة
                        </Typography>
                    )}
                </Box>
            </Box>

            {/* الرسائل */}
            <Box sx={{ height:'100%', p: 2, overflowY: "auto", bgcolor: "background.default" }}>
                {isLoading ? (
                    <Box display="flex" justifyContent="center" mt={4}>
                        <CircularProgress />
                    </Box>
                ) : (
                    messages.map((msg) => (
                        <Box
                            key={msg.id}
                            onMouseEnter={() => setHoveredMessageId(msg.id)}
                            onMouseLeave={() => setHoveredMessageId(null)}
                            display="flex"
                            justifyContent={msg.senderId === currentUserId ? "flex-end" : "flex-start"}
                            mb={1}
                        >
                         
                            <Paper
                                sx={{
                                    fontFamily: 'typography.fontFamily',
                                    p: 1,
                                    minWidth: editingId === msg.id ? '75%' : '5%',
                                    maxWidth:  '75%'  ,
                                    backgroundColor:
                                        editingId === msg.id
                                            ? "white"
                                            : msg.senderId === currentUserId
                                                ? 'primary.main'
                                                : 'primary.contrastText',
                                    color:
                                        editingId === msg.id
                                            ? "dark"
                                        :msg.senderId === currentUserId ? 'primary.contrastText' : 'text.primary',
                                    borderRadius: 6,
                                    wordBreak: 'break-word',
                                    position: 'relative',
                                    px: 2,
                                    py: 1,
                                    mb: 1,
                                    boxShadow:0
                                }}

                            >
                                {msg.hasAttachment &&
                                    msg.attachmentMimeType?.startsWith("image/") &&
                                    imagePreviews[msg.id] && (
                                        <Box mb={1}>
                                        <img
                                            
                                                src={`${imagePreviews[msg.id]}`}
                                                alt={msg.attachmentName}
                                                style={{
                                                    maxWidth: "200px",
                                                    maxHeight: "200px",
                                                    borderRadius: 8,
                                                }}
                                            />
                                        </Box>
                                    )}

                                {msg.hasAttachment && !msg.isDeleted && (
                                    <Button
                                        size="small"
                                        onClick={() => downloadFile(msg.id, msg.attachmentName)}
                                        startIcon={<DownloadIcon />}
                                        className="text-light dow-icon"

                                    >
                                        تحميل المرفق
                                    </Button>
                                )}
                                {msg.senderId !== currentUserId && (
                                    <Typography className="senderName" variant="subtitle2">{msg.senderName}</Typography>
                                )}

                                {editingId === msg.id ? (
                                    <Box>
                                        <TextField
                                            fullWidth
                                            sx={{
                                                '& *': {
                                                    color: 'dark',

                                                },
                                            }}
                                            multiline
                                            minRows={2}
                                            value={editText}
                                            onChange={(e) => setEditText(e.target.value)}
                                        />
                                        <Box mt={1} display="flex" gap={2} sx={{background:'white',padding:'5px'} }>
                                            <Button
                                                variant="contained"
                                                onClick={() => {
                                                    editMessage(msg.id, editText);
                                                    setEditingId(null);
                                                    setEditText("");
                                                }}
                                            >
                                                حفظ
                                            </Button>
                                            <Button variant="outlined" onClick={() => setEditingId(null)}>
                                                إلغاء
                                            </Button>
                                        </Box>
                                    </Box>
                                ) : (
                                        <>
                                           
                                        <Typography
                                            className={`msg ${isEmojiOnly(msg.content, msg.isDeleted)}`}
                                            variant="body1"
                                                color={msg.isDeleted ? "text.secondary" : "inherit"}
                                                sx={{
                                                     
                                                    lineHeight: 1.2,
                                                }}
                                        >
                                            {msg.isDeleted  ? arlang?"🗑️ تم حذف الرسالة":"message Deleted" :arlang? msg.content:msg.contentEn}
                                            {msg.isEdited && !msg.isDeleted && (
                                                    <Typography component="span" variant="caption" sx={{color:'darkred'} }>
                                                    {" "}
                                                    (معدّلة)
                                                </Typography>
                                            )}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            display="block"
                                            textAlign="right"
                                        >
                                            {new Date(msg.sentAt).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </Typography>
                                    </>
                                )}

                                {msg.senderId === currentUserId &&
                                    !msg.isDeleted &&
                                    hoveredMessageId === msg.id &&
                                    editingId !== msg.id && (
                                        <Box
                                            sx={{
                                                position: "relative",
                                                bottom: 0,
                                                left: 0,
                                                display: "flex",
                                                gap: 1,
                                                 
                                            }}
                                        >
                                            <IconButton
                                                size="small"
                                                sx={{color:'red'} }
                                                onClick={() => {
                                                    setEditingId(msg.id);
                                                    setEditText(msg.content);
                                                }}
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                            size="small"
                                            sx={{ color: 'red' }}
                                                onClick={() => {
                                                    if (window.confirm("هل تريد حذف الرسالة؟")) {
                                                        deleteMessage(msg.id);
                                                    }
                                                }}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    )}
                            </Paper>
                        </Box>
                    ))
                )}
                <div ref={messagesEndRef} />
            </Box>

            {/* إدخال الرسائل */}
            {!group.isClosed && (
                <Box
                    sx={{
                        position: 'sticky',
                        bottom:0,
                        p: 2,
                        borderTop: "1px solid",
                        borderColor: "divider",
                        display: "flex",
                        alignItems: "center",
                        bgcolor: "background.paper",
                    }}
                >
                    <TextField
                        fullWidth
                        multiline
                        minRows={2}
                        maxRows={5}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage(text, file);
                                setFile(undefined);
                                setText("");
                            }
                        }}
                        sx={{
                            '& .MuiInputBase-input': {
                                fontSize: '14px',
                            },
                        }}
                    />
                    {file && (
                        <Box ml={2}>
                            <Typography variant="caption">{file.name}</Typography>
                            <IconButton size="small" onClick={() => setFile(undefined)}>❌</IconButton>
                        </Box>
                    )}
                    <input
                        type="file"
                        id="file-upload"
                        style={{ display: "none" }}
                        onChange={(e) => {
                            const selectedFile = e.target.files?.[0];
                            if (selectedFile && selectedFile.size > 0) {
                                console.log("🟢 File selected:", selectedFile.name, "Size:", selectedFile.size);
                                setFile(selectedFile);
                            } else {
                                console.warn("❌ الملف فارغ أو غير موجود");
                            }
                        }}
                        />
                    <label htmlFor="file-upload">
                        <IconButton
                            component="span"
                            title="إرفاق ملف"
                            sx={{
                                width: 48,
                                height: 48,
                            }}
                        >
                            <AttachFileIcon sx={{ fontSize: 24 }} />
                        </IconButton>
                    </label>

              
                    <IconButton
                        onClick={() => setShowPicker(!showPicker)}
                        title="إدراج إيموجي"
                    >
                        <InsertEmoticonIcon sx={{ fontSize: 24 }} />
                    </IconButton>
                    {showPicker &&
                        <Box sx={{position:'fixed',top:0,left:0,width:'100%'} }>
                            <EmojiPicker onEmojiClick={onEmojiClick} />
                        </Box>
                    }
                 
                    <Button
                        variant="contained"
                        dir="ltr"
                        endIcon={<SendIcon sx={{ transform: 'rotate(270deg)' }} />}
                        onClick={() => {
                            sendMessage(text, file ?? undefined);
                            setFile(undefined);
                            setText("");
                        }}
                        color="primary"
                        disabled={!text.trim() && !file}
                    >
                        إرسال
                    </Button>
                    
                </Box>
            )}

            {/* نافذة الأعضاء */}
            <Dialog open={membersOpen} onClose={() => setMembersOpen(false)} fullWidth>
                <DialogTitle className="group-name">أعضاء المجموعة</DialogTitle>
                <DialogContent dividers>
                    {members.map((user) => (
                        <Box
                            key={user.id}
                            py={1}
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                        >
                            <Box>
                                <Typography fontWeight="bold" className="user-group">{user.personName}</Typography>
                                <Typography variant="caption" className="user-group-unit"  color="textSecondary">
                                    {user.unitName}
                                </Typography>
                            </Box>

                            {group.isAdmin && user.id !== currentUserId && (
                                <Button
                                    color="error"
                                    size="small"
                                    onClick={() => handleRemove(user.id)}
                                >
                                    إزالة
                                </Button>
                            )}
                        </Box>
                    ))}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setMembersOpen(false)}>إغلاق</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default GroupChatWindow;
