import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from "@mui/material";
import InfiniteCanvas from "@/components/shared/InfiniteCanvas";
import useCampaigns from "@/hooks/useCampaigns";
import CampaignContext from "@/context/CampaignContext";
import { Campaign, Character } from "@/util/types";

const drawButtonOptions = [
  { id: "place-marker", label: "Place Marker" },
  { id: "draw-lines", label: "Draw Line" },
  { id: "draw-box", label: "Draw box" },
  { id: "dance-time", label: "Do a little dance" },
  { id: "erase", label: "Erase" },
] as const;

const Map: React.FC = () => {
  const [newMapOpen, setNewMapOpen] = useState(false);
  const [newMapName, setNewMapName] = useState("");
  const [selectedCampaignId, setSelectedCampaignId] = useState<Number | null>(
    null
  );
  const [markerColor, setMarkerColor] = useState<string>("#E57373");
  const [wallColor, setWallColor] = useState<string>("#E57373");

  const { campaigns, fetchCampaigns, campaignsLoading } = useCampaigns();
  const [currentCampaign, setCurrentCampaign] = useState<Campaign | null>(null);

  const updateCurrentCampaign = (campaign_id: number) => {
    // find campaign by id
    const foundCampaign = campaigns.find(
      (campaign) => campaign.id === campaign_id
    );

    setCurrentCampaign(foundCampaign || null);
  };

  const handlePlayerTokenClick = (character: Character) => {};

  const handleClickNewMap = () => {
    setNewMapOpen(true);
  };

  const handleNewMapClose = () => {
    setNewMapOpen(false);
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch("api/map/create_map", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: newMapName,
          campaign_id: selectedCampaignId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create map.");
      }
      console.log("Map created successfully:", data);
    } catch (error) {
      console.error("Error creating map:", error);
    }

    setNewMapName("");
    setNewMapOpen(false);
    setSelectedCampaignId(-1);
  };

  // ActiveIndex holds the index of currently selecting drawing button
  const [activeDrawButtonIndex, setActiveDrawButtonIndex] = useState<
    number | null
  >(null);

  // handle pressing the drawing buttons
  const handleDrawButtonClick = (indexToActivate: number) => {
    setActiveDrawButtonIndex((prevIndex) =>
      prevIndex === indexToActivate ? null : indexToActivate
    );
  };

  useEffect(() => {
    fetchCampaigns();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        // Unselect drawing button on escape press
        setActiveDrawButtonIndex(null);
      }
    };

    // Add event listener to the whole document.
    document.addEventListener("keydown", handleKeyDown);

    // Return cleanup function to remove the listener when the component unmounts.
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []); // An empty dependency array ensures this effect runs only once on mount and cleans up on unmount.

  const activeDrawButton =
    activeDrawButtonIndex !== null
      ? drawButtonOptions[activeDrawButtonIndex].id
      : null;

  return (
    <Container sx={{ border: "1px solid gray" }}>
      <Typography variant="h1" align="center" sx={{ margin: "20px" }}>
        Map Page
      </Typography>
      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          border: "1px solid gray",
        }}
      >
        <Button variant="contained" onClick={handleClickNewMap}>
          New Map
        </Button>
      </Box>
      <Container sx={{ display: "grid", gridTemplateColumns: "auto 1fr" }}>
        {/* Left column */}
        <Box
          sx={{
            border: "1px solid gray",
            marginTop: "20px",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column", // Stacks buttons vertically
              alignItems: "flex-start",
              gap: 2, // Adds space between buttons
              paddingTop: "20px",
              width: "300px",
              border: "1px solid gray",
            }}
          >
            {/* Map over the `drawButtonOptions` data array */}
            {drawButtonOptions.map((option, index) => (
              <Container
                key={option.id}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr",
                  alignItems: "center",
                }}
              >
                {/* First Column: button */}
                <Button
                  variant="contained"
                  color={
                    activeDrawButtonIndex === index ? "primary" : "inherit"
                  }
                  onClick={() => handleDrawButtonClick(index)}
                >
                  {option.label}
                </Button>
                {/* Second Column: marker color circle */}
                {option.id === "place-marker" && (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "left",
                      marginLeft: "20px",
                    }}
                  >
                    <Box
                      component="label"
                      htmlFor="marker-color-picker"
                      sx={{
                        width: "35px",
                        height: "35px",
                        borderRadius: "35px",
                        cursor: "pointer",
                        backgroundColor: markerColor,
                        "&:hover": {
                          border: "2px solid gray",
                        },
                      }}
                    />
                    <input
                      type="color"
                      id="marker-color-picker"
                      value={markerColor}
                      onChange={(e) => setMarkerColor(e.target.value)}
                      style={{
                        // Hide the default input but keep it functional
                        visibility: "hidden",
                        width: 0,
                        height: 0,
                        position: "absolute",
                      }}
                    />
                  </Box>
                )}
                {/* Second Column: wall color circle */}
                {option.id === "draw-lines" && (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "left",
                      marginLeft: "20px",
                    }}
                  >
                    <Box
                      component="label"
                      htmlFor="wall-color-picker"
                      sx={{
                        width: "35px",
                        height: "35px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        backgroundColor: wallColor,
                        "&:hover": {
                          border: "2px solid gray",
                        },
                      }}
                    />
                    <input
                      type="color"
                      id="wall-color-picker"
                      value={wallColor}
                      onChange={(e) => setWallColor(e.target.value)}
                      style={{
                        // Hide the default input but keep it functional
                        visibility: "hidden",
                        width: 0,
                        height: 0,
                        position: "absolute",
                      }}
                    />
                  </Box>
                )}
              </Container>
            ))}
            <div style={{ paddingLeft: "20px" }}>
              Current Mode: {activeDrawButton || "None"}
            </div>
            <div style={{ paddingLeft: "20px" }}>
              {/* Select Campaign Drop Down */}
              <TextField
                select
                fullWidth
                label="Select Campaign"
                value={selectedCampaignId}
                onChange={(e) => {
                  const newId = Number(e.target.value);
                  setSelectedCampaignId(newId);
                  updateCurrentCampaign(newId);
                }}
                variant="standard"
                margin="dense"
              >
                <MenuItem key={""} value={""}>
                  {"None"}
                </MenuItem>
                {campaigns.map((campaign) => (
                  <MenuItem key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </MenuItem>
                ))}
              </TextField>
              <div>
                Current Campaign id: {String(selectedCampaignId) || "None"}
              </div>
              <div>Current DM id: {currentCampaign?.dm || "None"}</div>
              <div>
                Current campaign name: {currentCampaign?.name || "None"}
              </div>
              <div>Char count: {currentCampaign?.char_count || "None"}</div>
            </div>
            {/* player token area */}
            <div style={{ border: "1px solid gray", width: "100%" }}>
              <Typography variant="h2" align="left" sx={{ margin: "20px" }}>
                Player tokens:
              </Typography>
              <Box sx={{ border: "1px solid gray", margin: "20px" }}>
                Toekn
                {currentCampaign?.characters.map((character) => (
                  <button
                    key={character.id}
                    onClick={() => handlePlayerTokenClick(character)}
                    style={{ margin: "5px" }}
                  >
                    {character.name}
                  </button>
                ))}
              </Box>
            </div>
          </Box>
        </Box>
        {/* Right column */}
        <Box
          sx={{
            width: "800px",
            height: "800px",
            border: "1px solid gray",
            overflow: "hidden",
            margin: "auto",
            marginTop: "20px",
          }}
        >
          <InfiniteCanvas
            activeDrawButton={activeDrawButton}
            markerColor={markerColor}
            wallColor={wallColor}
          />
        </Box>

        {/* New Map Button Dialogue Box */}
        <Dialog open={newMapOpen} onClose={handleNewMapClose}>
          <DialogTitle>New Map</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="New Map Name"
              type="text"
              fullWidth
              variant="standard"
              value={newMapName}
              onChange={(e) => setNewMapName(e.target.value)}
            />
            <TextField
              select
              fullWidth
              label="Select Campaign"
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(Number(e.target.value))}
              variant="standard"
              margin="dense"
            >
              {campaigns.map((campaign) => (
                <MenuItem key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleNewMapClose}>Cancel</Button>
            <Button variant="contained" onClick={handleSubmit}>
              Create
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Container>
  );
};

export default Map;
