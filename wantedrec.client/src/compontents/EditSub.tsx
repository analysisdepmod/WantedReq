import * as React from 'react';
import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import DeleteIcon from '@mui/icons-material/Delete';
import ModeEditOutlineIcon from '@mui/icons-material/ModeEditOutline';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import AutoAwesomeMotionIcon from '@mui/icons-material/AutoAwesomeMotion';
import { Link} from 'react-router-dom';
import { SpiAttitudeDtoview } from '../Interfaces/GeneralInterface';
import { CalendarOutlined, PlusOutlined } from '@ant-design/icons';
import { useAttitude } from '../hooks/useAttitude';
import { setModal } from '../../app/reducers/dialogSlice';
import {  useState } from 'react';
import { ModalContent } from '../pages/spniAttitude/ModalContent';

export default function EditSub(record: SpiAttitudeDtoview) {
    const [year] = useState<number>(localStorage.getItem("year") as unknown as number);
    const {
        dispatch,
    } = useAttitude(year);

    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
  
    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const DeleteTargets = (row: SpiAttitudeDtoview) => {
        dispatch(setModal({
            dialogIcon: <CalendarOutlined />,
            isOpen: true,
            content: <ModalContent row = { row } flag = {4} />,
            width: 1000,
            height: 900,
            title: "بيانات  الهدف"
        }));
    };

   

    const updateattude = (row: SpiAttitudeDtoview) => {
       
        dispatch(
            setModal(
                {
                    dialogIcon: <PlusOutlined />,
                    isOpen: true,
                    content: <ModalContent row={row} flag={2}  />,
                    width: 1100,
                    height: 900,
                    title: "Update Attitude"
                })
        );
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
                        <  AutoAwesomeMotionIcon    sx={{fontSize:'25px' }} /> 
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
                            fontSize: '12px',
                            '& .MuiAvatar-root': {
                                width: 32,
                                height: 32,
                                ml: -0.5,
                                mr: 1,
                                fontSize:'12px',
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
                <Link to={`/NewTab/${record.targetId}/${record.manageMinistryId}`} target="_blank">
              
                    <MenuItem onClick={handleClose} key={Math.random()}>
                    <ListItemIcon >
                            <PendingActionsIcon style={{ color: 'darkgreen' }} fontSize="large" /> 
                    </ListItemIcon>
                  
                        <h5>معلومات تاريخية</h5>
                </MenuItem>
                </Link>
               
                {record.canEdit && [
                   
                    <MenuItem key={Math.random()} onClick={() => updateattude(record)} >
                    <ListItemIcon  >
                        <ModeEditOutlineIcon style={{ color: 'darkblue' }} fontSize="large" />
                    </ListItemIcon>
                        <h5>تعديل</h5>
                </MenuItem>,
                    <MenuItem onClick={() => DeleteTargets(record)}   key={Math.random()}>
                    <ListItemIcon >
                            <DeleteIcon style={{ color: 'darkred' }} fontSize="large" />
                    </ListItemIcon>
                        <h5>حذف</h5>
                        </MenuItem>
                    
                 ]}
                </Menu>

           




        </>
        
         
    );
}
