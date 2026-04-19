import * as React from 'react';
import Box from '@mui/material/Box';
 
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import IconButton from '@mui/material/IconButton';
 
import Tooltip from '@mui/material/Tooltip';
 
import DeleteIcon from '@mui/icons-material/Delete';
import ModeEditOutlineIcon from '@mui/icons-material/ModeEditOutline';
import { SpiAttitudeDto } from '../Interfaces/GeneralInterface';
import Delete from '../pages/spniAttitude/Delete';
import { DeleteOutlined } from '@ant-design/icons';
import { SetError } from '../../app/reducers/craudSlice';
import { setModal } from '../../app/reducers/modalSlice';
import { AppDispatch } from '../../app/store';
import { useDispatch } from 'react-redux';
export default function EditMnue(record: SpiAttitudeDto) {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const dispatch = useDispatch<AppDispatch>();
    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };
    



    const deleteSpniAttitude = (row: SpiAttitudeDto) => {
        dispatch(SetError())
        dispatch(setModal({ modalIcon: <DeleteOutlined style={{ color: 'red' }} />, isOpen: true, content: <Delete  {...row} />, Width: 600, title: " حذف" })
        )
    };


    return (
        
         
        <>
            <Box sx={{ display: 'flex', alignItems: 'center', textAlign: 'center' }}>
                 
                <Tooltip title="العمليات">
                    <IconButton
                        onClick={handleClick}
                        size="small"
                        sx={{ ml: 2 }}
                        aria-controls={open ? 'account-menu' : undefined}
                        aria-haspopup="true"
                        aria-expanded={open ? 'true' : undefined}
                    >
                        <MoreVertIcon sx={{fontSize:'25px' }} ></MoreVertIcon>
                    </IconButton>
                </Tooltip>
            </Box>
            <Menu
                anchorEl={anchorEl}
                id="account-menu"
                open={open}
                onClose={handleClose}
                onClick={handleClose}
                slotProps={{
                    paper: {
                        elevation: 0,
                        sx: {
                            overflow: 'visible',
                            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                            mt: 1.5,
                            '& .MuiAvatar-root': {
                                width: 32,
                                height: 32,
                                ml: -0.5,
                                mr: 1,
                            },
                            '&::before': {
                                content: '""',
                                display: 'block',
                                position: 'absolute',
                                top: 0,
                                right: 14,
                                width: 10,
                                height: 10,
                                bgcolor: 'background.paper',
                                transform: 'translateY(-50%) rotate(45deg)',
                                zIndex: 0,
                            },
                        },
                    },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
               [
                
                <MenuItem onClick={handleClose} key={Math.random() }>
                    <ListItemIcon>
                        <ModeEditOutlineIcon style={{ color: 'darkblue' }} fontSize="small" />
                    </ListItemIcon>
                    تعديل
                </MenuItem>,
                <MenuItem onClick={handleClose} key={Math.random()}>
                    <ListItemIcon onClick={() => deleteSpniAttitude(record)}>
                        <DeleteIcon style={{ color: 'darkred' }} fontSize="small" />
                    </ListItemIcon>
                    حذف
                </MenuItem>
                 ]
                </Menu>
               
        </>
        
         
    );
}
