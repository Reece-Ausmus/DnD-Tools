import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, CssBaseline, Container } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import UserProvider from "./context/UserProvider";
import CampaignProvider from "./context/CampaignProvider";
import CharacterProvider from "./context/CharacterProvider";
import theme from "./theme";
import ProtectedRoute from "./components/shared/ProtectedRoute";
import MenuBar from "./components/shared/MenuBar";
import Home from "./pages/Home";
import LogIn from "./pages/LogIn";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import CreateCharacter from "./pages/CreateCharacter";
import EditCharacter from "./pages/EditCharacter";
import CreateCampaign from "./pages/CreateCampaign";
import EditCampaign from "./pages/EditCampaign";
import Report from "./pages/Report";
import Map from "./pages/Map";

const App: React.FC = () => {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <UserProvider>
        <CampaignProvider>
          <CharacterProvider>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              <Router>
                <MenuBar />
                <Container sx={{ mt: 10 }}>
                  <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<LogIn />} />
                    <Route path="/signup" element={<SignUp />} />

                    {/* Protected routes */}
                    <Route element={<ProtectedRoute />}>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/report" element={<Report />} />
                      <Route path="/map" element={<Map />} />
                      <Route
                        path="/createcharacter"
                        element={<CreateCharacter />}
                      />
                      <Route
                        path="/editcharacter"
                        element={<EditCharacter />}
                      />
                      <Route
                        path="/createcampaign"
                        element={<CreateCampaign />}
                      />
                      <Route path="/editcampaign" element={<EditCampaign />} />
                    </Route>

                    {/* Catch-all route */}
                    <Route path="*" element={<Home />} />
                  </Routes>
                </Container>
              </Router>
            </ThemeProvider>
          </CharacterProvider>
        </CampaignProvider>
      </UserProvider>
    </LocalizationProvider>
  );
};

export default App;
