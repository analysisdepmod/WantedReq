import { createTheme } from "@mui/material/styles";
import { red } from "@mui/material/colors";

export const baseTheme = {
  // Global css settings for @Mui components
  components: {
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: "0.9rem",
        },
      },
    },
  },
  palette: {
    primary: {
      nav: "#FFFFFF",
      main: "#002A4E",
      border: "#919AA1",
      light: "#DFE8F3",
      green: "#3EC300",
    },
    button: {
      // default: "#002A4E",
      default: "#e4e4ef",
      defaultHover: "#c5c5d2",
      hoverDefault: "#0056FB",
      hover: "#004B8A",
      light: "#007CE8",
      hoverLight: "#004B8A",
      hoverDarker: "#003D6D",
      secondary: "#E0E0E0",
      hoverSecondary: "#d5d5d5",
      disabled: "#d4d0ce",
      textOnDisabled: "#9d9b9a",
      red: "#ff1644",
      hoverRed: "#d40001",
      white: "#FFFFFF",
      hoverWhite: "#EDEDED",
      gray: "#939597",
      hoverGray: "#474747",
      gray2: "#E5E5EF",
      hoverGray2: "#919AA1",
      niloGray: "#DFE8F3",
    },
    default: "#0056FB",
    content: "#D5E4FB",
    textOnBackground: "black",
    niloBackground: "#EDEDED",
    niloPrimary: "#002A4E",
    niloSecondary: "#007CE8",
    textOnPrimary: "white",
    border: "#A5A5A5",
    borderOnBackground: "#7F7F7F",
    nav: "#EDEDED",
    secondary: red,
    neutralSurface: "#EDEDED",
    selectedBorder: "#007CE8",
    addInputBackground: "#E5E5EF",
    postGroup: "#67BEFA",
    postGroupItemBorder: "#E5E5EF",
  },
  niloFont: "Work Sans, Montserrat, sans-serif",
  niloFontContent: "Roboto, Montserrat, sans-serif",
  borderRadius: "12px"
};

const themes = createTheme(baseTheme);

export default themes;
