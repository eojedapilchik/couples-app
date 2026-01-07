import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  typography: {
    fontFamily: '"Space Grotesk", "Segoe UI", sans-serif',
  },
  palette: {
    primary: {
      main: "#e91e63",
    },
    secondary: {
      main: "#ffb74d",
    },
  },
});

export default theme;
