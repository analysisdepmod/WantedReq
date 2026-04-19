import {
    Badge,
    IconButton,
    Tooltip,
    Menu,
    MenuItem,
    ListItemText,
    Typography,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import {  useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNotifications } from "../../hooks/useNotifications";
import { useSelector } from "react-redux";
import { RootState } from "../../../app/store";
import axios from "../../api";
 
const NotificationButton = () => {
    const { data: notifications = [] } = useNotifications();
    const unreadCount = notifications.length;
    const { arlang } = useSelector((state: RootState) => state.setting);
    const queryClient = useQueryClient();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };
 
    const markAsSeen = async (seenPostedId: number) => {
        await axios.post(`/Notifications/mark-as-seen/${seenPostedId}`);
        queryClient.invalidateQueries({ queryKey: ["unread-notifications"] });
        handleClose();
    };

    return (
        <>
            <Tooltip title="الإشعارات">
                <Badge
                    badgeContent={unreadCount > 0 ? unreadCount : null}
                    color="error"
                    overlap="circular"
                    anchorOrigin={{ vertical: "top", horizontal: "right" }}
                >
                    <IconButton onClick={handleOpen} sx={{ color: "inherit" }}>
                        <NotificationsIcon />
                    </IconButton>
                </Badge>
            </Tooltip>

            <Menu anchorEl={anchorEl} open={open} onClose={handleClose} className="list-notification-item">
                {unreadCount === 0 ? (
                    <MenuItem disabled>
                        <Typography color="text.secondary">لا توجد إشعارات جديدة</Typography>
                    </MenuItem>
                ) : (
                    notifications.map((item) => (
                        <MenuItem key={item.id}
                            onClick={() => {
                                markAsSeen(item.id);
                            }}

                        >
                            <ListItemText
                               
                                primary={arlang? item.action:item.actionEn}
                                secondary={new Date(item.postedDate).toLocaleString()}
                            />
                        </MenuItem>
                    ))
                )}
            </Menu>
        </>
    );
};

export default NotificationButton;
