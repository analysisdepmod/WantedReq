import styled from "styled-components";
import { IconButton,  Button, Box } from "@mui/material";
 
export const CancelButton = styled(Button)`
  color: #030813;
  border-radius: 8px;
  background-color: #FFFFFF;
  font-size: 12px;
  font-weight: 500;
  width: 74px;
  height: 36px;
  &:hover {
    background-color: #F4F4F6;
  };
`;

export const SelectButton = styled(Button) <{bg?: string }>`
  color: #FFFFFF;
  background-color: ${(props) => props.bg || '#005FCC'};
  font-size: 12px;
  font-weight: 600;
  border-radius: 8px;
  width: 74px;
  min-width:fit-content;
  height: 36px;
  &:hover {
    background-color: #0044C7;
  };
`;
export const ClearIconButtonWrapper = styled.div`
  height: fit-content;
  display:inline;
  
`;
export const HeaderDialogWrapper = styled(Box)`
  height: fit-content;
  width:100%;
  display:flex;
  justify-content:space-between;
  
`;
export const ClearIconButton = styled(IconButton)`
  color: black;
  padding: 4px;
`;