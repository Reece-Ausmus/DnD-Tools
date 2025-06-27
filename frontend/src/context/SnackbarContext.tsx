import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  SyntheticEvent,
} from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert, { AlertColor } from "@mui/material/Alert";

// The shape of the function that will be exposed to the rest of the app
interface SnackbarContextType {
  showSnackbar: (message: string, severity: AlertColor) => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(
  undefined
);

// The provider component that will wrap your app
export const SnackbarProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<AlertColor>("info"); // Default severity

  // Function to show the snackbar
  const showSnackbar = (newMessage: string, newSeverity: AlertColor) => {
    setMessage(newMessage);
    setSeverity(newSeverity);
    setOpen(true);
  };

  // Function to handle closing the snackbar
  const handleClose = (event?: SyntheticEvent | Event, reason?: string) => {
    // 'clickaway' means the user clicked outside the snackbar. We don't want to close it then.
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
  };

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      <Snackbar
        // This positions the snackbar at the top-center of the screen
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        open={open}
        // The snackbar will auto-hide after 5 seconds (5000ms)
        autoHideDuration={5000}
        onClose={handleClose}
      >
        {/* The Alert component provides the color and icon */}
        <Alert
          onClose={handleClose} // This gives us the 'X' button to close
          severity={severity}
          variant="filled"
          sx={{ width: "100%", backgroundColor: "orange" }}
        >
          {message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
};

// Custom hook to easily consume the context
export const useSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (context === undefined) {
    throw new Error("useSnackbar must be used within a SnackbarProvider");
  }
  return context;
};
