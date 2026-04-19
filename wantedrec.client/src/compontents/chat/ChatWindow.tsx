// ✅ ChatWindow.tsx - بعد التحسين
import React, { useEffect, useRef, useState } from "react";
import {
    Box,
    TextField,
    IconButton,
    Typography,
    Paper,
    CircularProgress,
    Button,
} from "@mui/material";
 
import DoneAllIcon from "@mui/icons-material/DoneAll";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { User } from "../../hooks/useChatUsers";
import { Message, useChatMessages } from "../../hooks/useChatMessages";
import EmojiPicker from 'emoji-picker-react';
import { useSelector } from "react-redux";
import { RootState } from "../../../app/store";
import DeleteIcon from "@mui/icons-material/Delete";
import { useQueryClient } from "@tanstack/react-query";
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon';
import SendIcon from '@mui/icons-material/Send';

import { getChatConnection } from "../../signalr/signalrConnections";
    const chatConnection = getChatConnection();
interface Props {
    currentUserId: string;
    selectedUser: User;
    onBack: () => void;
}

const ChatWindow: React.FC<Props> = ({ currentUserId, selectedUser, onBack }) => {

    const [text, setText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [otherTyping, setOtherTyping] = useState(false);
    const typingTimeout = useRef<NodeJS.Timeout | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { arlang } = useSelector((state: RootState) => state.setting);
    const queryClient = useQueryClient();
    const [showPicker, setShowPicker] = useState(false);

    const {
        messages,
        isLoading,
        sendMessage,
        markAsRead,
        deleteMessage 
    } = useChatMessages(currentUserId, selectedUser.id);

    const onEmojiClick = (emojiData: any) => {
        setText(prev => prev + emojiData.emoji);
    };

    // التمرير التلقائي
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // تعليم الرسائل كمقروءة
    useEffect(() => {
        messages.forEach((msg) => {
            if (msg.receiverId === currentUserId && !msg.isRead) {
                markAsRead(msg.id);
                chatConnection.invoke("MessageRead", msg.id, msg.senderId).catch(console.error);
            }
        });
    }, [messages, currentUserId, markAsRead]);

    // استقبال حدث "يكتب الآن"
    useEffect(() => {
        const handleTyping = (fromUserId: string) => {
            if (fromUserId === selectedUser.id) {
                setOtherTyping(true);
                setTimeout(() => setOtherTyping(false), 2000);
            }
        };

        chatConnection.on("UserTyping", handleTyping);
        return () => {
            chatConnection.off("UserTyping", handleTyping);
        };
    }, [selectedUser.id]);

    const handleSend = () => {
        if (!text.trim()) return;
        sendMessage(selectedUser.id,text,arlang );
        setText("");
    };

    const handleTyping = (value: string) => {
        setText(value);

        if (!isTyping) {
            setIsTyping(true);
            chatConnection.invoke("SendTyping", selectedUser.id).catch(console.error);
        }

        if (typingTimeout.current) clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => setIsTyping(false), 2000);
    };
    const handleDelete = (messageId: number) => {
        if (window.confirm("هل أنت متأكد أنك تريد حذف هذه الرسالة؟")) {
            deleteMessage(messageId);
        }
    };

    useEffect(() => {
        chatConnection.on("MessageDeleted", (messageId: number) => {
            queryClient.setQueryData(["messages", selectedUser.id], (old: Message[] = []) =>
                old.filter((msg) => msg.id !== messageId)
            );
        });

        return () => {
            chatConnection.off("MessageDeleted");
        };
    }, [selectedUser.id]);

    function isEmojiOnly(text: string, deleted: boolean) {
        if (deleted) return '';
        if (/^[\p{Emoji}\s]+$/u.test(text.trim()))
            return 'Emoji';
        else return '';
    }
    return (
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {/* العنوان */}
            <Box
                sx={{
                    p: 2,
                    borderBottom: "1px solid #ddd",
                    display: "flex",
                    alignItems: "center",
                    position: "sticky",
                    top: 0,
                    bgcolor: "background.paper",
                    zIndex: 2,
                }}
            >
                <IconButton onClick={onBack} aria-label="الرجوع إلى قائمة المستخدمين">
                    <ArrowBackIcon />
                </IconButton>
                <Box>
                    <Typography variant="h6" sx={{ ml: 1 }}>
                        {selectedUser.personName.length > 25
                            ? `${selectedUser.personName.substring(0, 25)}...`
                            : selectedUser.personName}
                    </Typography>
                    <Typography variant="h6" sx={{ ml: 1 }}>
                        {selectedUser.unitName}
                    </Typography>
                </Box>
               
            </Box>

            {/* الرسائل */}
            <Box sx={{ flexGrow: 1, p: 2, overflowY: "auto",bgcolor: "background.default",overflowX:'hidden' }}>
                {isLoading ? (
                    <Box display="flex" justifyContent="center" mt={4}>
                        <CircularProgress />
                    </Box>
                ) : (
                    messages.map((msg) => {
                        const isMine = msg.senderId === currentUserId;
                        return (
                            <Box
                                key={msg.id}
                                display="flex"
                                justifyContent={isMine ? "flex-end" : "flex-start"}
                                mb={1}
                            >
                                <Paper
                                    sx={{
                                        p: 1,
                                        maxWidth: "75%",
                                        backgroundColor:
                                            msg.senderId === currentUserId ? "primary.main" : "primary.contrastText",
                                        color:
                                            msg.senderId === currentUserId
                                                ? "primary.contrastText"
                                                : "text.primary",
                                        borderRadius: 7,
                                        wordBreak: "break-word",
                                        position: "relative",
                                        px: 2,
                                        py: 1,
                                        mb: 1,
                                        boxShadow:0
                                    }}
                                >
                                    <Typography className={`msg ${isEmojiOnly(msg.content, msg.isDeleted)}`}
                                        variant="body1"
                                        color={msg.isDeleted ? "text.disabled" : "inherit"}
                                        fontStyle={msg.isDeleted ? "italic" : "normal"}
                                        sx={{
                                            fontStyle: msg.isDeleted ? "italic" : "normal",
                                            color: msg.isDeleted ? "text.secondary" : "inherit",
                                            lineHeight: 1.2,
                                               
                                        }}
                                    >
                                        {msg.isDeleted ? (arlang ? "تم حذف الرسالة" : "Message deleted") : (arlang ? msg.content : msg.contentEn) }
                                    </Typography>
                                    {isMine && !msg.isDeleted && (
                                        <IconButton size="small" onClick={() => handleDelete(msg.id)} sx={{ ml: 1,position:'absolute',left:-30,top:10 }}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                    <Box display="flex" justifyContent="flex-end" mt={0.5}>
                                        <Typography variant="caption" mr={0.5}>
                                            {new Date(msg.sentAt).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </Typography>
                                        {isMine && (
                                            <DoneAllIcon
                                                fontSize="small"
                                                color={msg.isRead ? "primary" : "disabled"}
                                            />
                                        )}
                                    </Box>
                                </Paper>
                            </Box>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
                {otherTyping && (
                    <Typography variant="caption" color="textSecondary" sx={{ ml: 1, mt: 1 }}>
                        {arlang ? "يكتب الان..." : "... writting now "}
                    </Typography>
                )}
            </Box>

            {/* إدخال الرسائل */}
            <Box
                sx={{
                    p: 2,
                    borderTop: "1px solid #ddd",
                    display: "flex",
                    alignItems: "center",
                    position: "sticky",
                    bottom: 0,
                    bgcolor: "background.paper",
                    zIndex: 2,
                }}
            >
                <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    maxRows={5}
                    value={text}
                    onChange={(e) => handleTyping(e.target.value)}
                    placeholder={arlang ? "اكتب رسالتك..." : "... write your message "}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    sx={{
                        '& .MuiInputBase-input': {
                            fontSize: '14px',
                        },
                    }}
                />
                 
                
                <IconButton
                    onClick={() => setShowPicker(!showPicker)}
                    title="إدراج إيموجي"
                >
                    <InsertEmoticonIcon sx={{ fontSize: 24 }} />
                </IconButton>
                {showPicker &&
                    <Box sx={{ position: 'fixed', top: 0, left: 0, width: '100%' }}>
                        <EmojiPicker onEmojiClick={onEmojiClick} />
                    </Box>
                }

                <Button
                    variant="contained"
                    dir="ltr"
                    endIcon={<SendIcon sx={{ transform: 'rotate(270deg)' }} />}
                    onClick={handleSend}
                    color="primary"
                    disabled={!text.trim()}
                >
                    إرسال
                </Button>
            </Box>
        </Box>
    );
};

export default ChatWindow;