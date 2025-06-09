import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark", // Enables dark mode
    primary: {
      main: "#ff9800", // Orange as the main color
      light: "#ffb74d",
      dark: "#f57c00",
      contrastText: "#000", // Text color for buttons, etc.
    },
    secondary: {
      main: "#ffffff",
    },
    background: {
      default: "#121212", // Dark background
      paper: "#1e1e1e", // Slightly lighter for cards, modals, etc.
    },
    text: {
      primary: "#ffffff", // White text
      secondary: "#b0b0b0", // Grey text for subtle contrast
    },
  },
  typography: {
    fontFamily: `"Roboto", "Arial", sans-serif`,
    h1: { fontSize: "2.5rem", fontWeight: 600 },
    h2: { fontSize: "2rem", fontWeight: 500 },
    body1: { fontSize: "1rem" },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "8px", // Rounded buttons
          textTransform: "none", // Prevent all caps
        },
      },
    },
  },
});

export default theme;
