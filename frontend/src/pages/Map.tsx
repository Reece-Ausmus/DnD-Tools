import React, { useState } from "react";
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

const Map: React.FC = () => {
  const [newMapOpen, setNewMapOpen] = useState(false);
  const [newMapName, setNewMapName] = useState("");
  const [selectedCampaignId, setSelectedCampaignId] = useState(-1);

  const { campaigns, fetchCampaigns, campaignsLoading } = useCampaigns();

  // Fetch campaigns when the component mounts
  React.useEffect(() => {
    fetchCampaigns();
  }, []);

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

  return (
    <Container>
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="h1" align="center" sx={{ marginTop: "20px" }}>
          Map Page
        </Typography>
        <Button variant="contained" onClick={handleClickNewMap}>
          New Map
        </Button>
      </Box>

      <Box
        sx={{
          width: "800px",
          height: "600px",
          border: "1px solid gray",
          overflow: "hidden",
          margin: "auto",
          marginTop: "20px",
        }}
      >
        <InfiniteCanvas />
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
  );
};

export default Map;
