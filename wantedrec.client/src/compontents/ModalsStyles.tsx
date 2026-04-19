import styled from "styled-components";
import Modal from "react-modal";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";
import { TableRow, Button } from "@mui/material";
import theme from "../theme";
 

export const StyledModal = styled(Modal)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 400px;
  background-color: ${theme.palette.background.paper};
  box-shadow: ${theme.shadows[1]};
  border-radius: 12px;
  padding: 36px 0 24px !important;
  outline: none;
  display: flex;
  justify-content: center;
  font-family: Montserrat,serif !important;
  z-index: 100;
`;

export const Container = styled.div`
  display:flex;
  flex-direction: column;
  width: 352px;
`;

export const Circle = styled.div`
  border-radius: 50%;
  background-color: #007CE8 !important;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${theme.spacing(0.1)};
  margin-bottom: 12px !important;
`;

export const StyledWarningRoundedIcon = styled(WarningRoundedIcon)`
  color: #ffffff;
  font-size: 3rem !important;
  margin: ${theme.spacing(1)};
`;

export const ModalHeading = styled.h1`
  font-family: font4 !important;
  font-weight: 700;
  font-size: 14px;
  line-height: 20px;
  margin-block: 0;
  color:#3B3030;
`;

export const ModalMessage = styled.h2`
  font-family: Open Sans;
  font-weight: 400;
  font-size: 14px;
  line-height: 19px;
  color: #919294 !important;
  margin: 20px 0 0 ;
`;

export const ModalButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  gap: 10px;
`;

export const ModalButton = styled.button`
  width: 74px;
  height:36px;
  border: none;
  padding-inline: 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  line-height: 15px;
  font-family: Montserrat,serif;
`;

export const ConfirmButton = styled(ModalButton)`
  color: #ffffff;
  font-weight: 600;
  &:hover {
    background-color: #1230AE
  }
`;

export const CancelButton = styled(ModalButton)`
  background-color: transparent;
  color: #030813;
  font-weight: 500;
  &:hover {
    background-color: #FF9D3D;
  }
`;

export const FormBox = styled.div`
  margin-bottom: ${theme.spacing(1)};
`;

export const StyledTableRow = styled(TableRow)`
  cursor: pointer;
  &:hover {
    
  };
`;

export const ErrorModalContainer = styled.div`
  max-width: 300px;
  background-color: white;
  padding: 8px 14px;
  border-radius: 12px;
  justify-content: center;
`;

export const ErrorModalHeader = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: ${theme.spacing(2)};
`;

export const ErrorModalTitle = styled.div`
  min-width: 300px;
  font-family: Open Sans,serif;
  font-weight: 700;
  font-size: 1.5rem;
  margin-bottom: 1rem;
`;

export const ErrorModalSubtitle = styled.div`
  font-family: Montserrat,serif;
  font-weight: 500;
  font-size: 1.1rem;
  text-align: start;
`;

export const JoinButton = styled(Button)`
  margin: 1rem 0;
  background: #007CE8;
  font-weight: 500;
  font-size: 1.125rem;
  width: 100%;
`;

export const NotificationModalContainer = styled.div`
  width: 240px;
  height: 45px;
  background-color: #E5E5EF;
  position: absolute;
  bottom: 30px;
  right: 30px;
  z-index: 1000;
  border: 2px solid #007CE8;
  box-shadow: 0 5px 5px 1px rgba(0, 42, 78, 0.1);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const NotificationModalMessage = styled.h2`
  line-height: 20px;
  color: #000000;
  margin-left: 12px;
`;
