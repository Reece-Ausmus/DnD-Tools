import React, { useEffect, useState } from "react";
import useUser from "@/hooks/useUser";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Menu,
  MenuItem,
  Box,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const MenuBar: React.FC = () => {
  const navigate = useNavigate();
  const { username, isLoggedIn, logout } = useUser();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    setAnchorEl(null);
    document.cookie =
      "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    navigate("/");
  };

  return (
    <AppBar position="sticky">
      <Toolbar>
        <Typography
          variant="h6"
          sx={{ flexGrow: 1, cursor: "pointer" }}
          onClick={() => navigate("/dashboard")}
        >
          DnD Tools
        </Typography>

        {isLoggedIn ? (
          <>
            <Button
              color="inherit"
              onClick={() => {
                navigate("/dashboard");
              }}
            >
              Dashboard
            </Button>

            <Button
              color="inherit"
              onClick={() => {
                navigate("/map");
              }}
            >
              Map
            </Button>

            <Button
              color="inherit"
              onClick={() => {
                navigate("/report");
              }}
            >
              Report
            </Button>

            <Button color="inherit" onClick={handleClick}>
              Account
            </Button>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <Box
                sx={{ display: "flex", flexDirection: "column", width: "100%" }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    padding: "10px",
                    color: "grey",
                    fontStyle: "italic",
                    flex: "1",
                  }}
                >
                  Username: {username}
                </Typography>

                {/* The Logout button stays left-aligned */}
                <MenuItem onClick={handleLogout} sx={{ padding: "10px" }}>
                  Logout
                </MenuItem>
              </Box>
            </Menu>
          </>
        ) : (
          <>
            <Button
              color="inherit"
              onClick={() => {
                navigate("/login");
              }}
            >
              Log In
            </Button>
            <Button
              color="inherit"
              onClick={() => {
                navigate("/signup");
              }}
            >
              Sign Up
            </Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default MenuBar;
