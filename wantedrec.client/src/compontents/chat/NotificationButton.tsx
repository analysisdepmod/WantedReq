import {
    Menu,
    MenuItem,
    ListItemText,
    Typography,
} from "@mui/material";
import { Badge, Tooltip, Button } from 'antd';
import {

    BellOutlined,
   
} from '@ant-design/icons';

import {  useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNotifications } from "../../hooks/useNotifications";
import { useSelector } from "react-redux";
import { RootState } from "../../../app/store";
import axios from "../../api";

 interface Props{
     recEvents?:number
}
const NotificationButton = ({ recEvents }: Props) => {
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
                <Badge count={unreadCount > 0 ? unreadCount + recEvents! : null} size="small" offset={[-4, 4]}>
                    <Button
                        type="text"
                        shape="circle"
                        icon={<BellOutlined style={{ color: 'var(--app-muted)', fontSize: 16 }} />}
                        style={{ background: 'var(--app-hover)', border: 'none' }}
                        onClick={handleOpen}
                    />
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
