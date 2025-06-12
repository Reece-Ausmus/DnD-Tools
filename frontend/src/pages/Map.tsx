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
  const [selectedCampaignId, setSelectedCampaignId] = useState(-1);
  const [markerColor, setMarkerColor] = useState<string>("#E57373");

  const { campaigns, fetchCampaigns, campaignsLoading } = useCampaigns();

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
              padding: 4,
              width: "300px",
              border: "1px solid gray",
            }}
          >
            {/* Map over the `drawButtonOptions` data array */}
            {drawButtonOptions.map((option, index) => (
              <Button
                key={option.id}
                variant="contained"
                // set button color based on activeDrawButton array
                color={activeDrawButtonIndex === index ? "primary" : "inherit"}
                onClick={() => handleDrawButtonClick(index)}
              >
                {option.label} {/* Use the unique label from our data */}
              </Button>
            ))}
            <div>Current Mode: {activeDrawButton || "None"}</div>
            {/* 3. Add the Color Picker UI Element */}
            <Box
              sx={{
                mt: 2,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Box
                component="label"
                htmlFor="color-picker"
                sx={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  backgroundColor: markerColor,
                  // Simple hover effect
                  "&:hover": {
                    border: "2px solid gray",
                  },
                }}
              />
              <input
                type="color"
                id="color-picker"
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
          />
        </Box>

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
