import React, { useState, useEffect } from "react";
import { Campaign } from "@/util/types";
import useUser from "@/hooks/useUser";
import {
  List,
  ListItemButton,
  ListItemText,
  Box,
  Button,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  IconButton,
} from "@mui/material";
import useCampaigns from "@/hooks/useCampaigns";
import RefreshIcon from "@mui/icons-material/Refresh";

interface MapExplorerProps {
  onMapClick: (mapId: number) => void;
  onCreateMap?: (campaignId: number, mapName: string) => void;
}

const MapExplorer: React.FC<MapExplorerProps> = ({
  onMapClick,
  onCreateMap,
}) => {
  const { username } = useUser();
  const [role, setRole] = useState<"dm" | "player" | "">("dm");

  const { campaigns, fetchCampaigns } = useCampaigns();

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const filteredCampaigns = campaigns
    .map((campaign) => {
      const maps =
        role === "dm"
          ? campaign.maps
          : campaign.maps.filter((map) => map.is_open);
      return {
        ...campaign,
        maps,
      };
    })
    .filter(
      (campaign) =>
        campaign.maps.length > 0 &&
        (role === "dm" ? campaign.dm === username : campaign.dm !== username)
    );
  const [openCampaigns, setOpenCampaigns] = useState<{
    [key: number]: boolean;
  }>({});

  const handleToggleCampaign = (campaignId: number) => {
    setOpenCampaigns((prev) => ({ ...prev, [campaignId]: !prev[campaignId] }));
  };

  const [newMapOpen, setNewMapOpen] = useState(false);
  const [newMapName, setNewMapName] = useState("");
  const [newMapCampaignId, setNewMapCampaignId] = useState<number | null>(null);
  const dmCampaigns = campaigns.filter((campaign) => campaign.dm === username);

  return (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 2,
        }}
      >
        <ToggleButtonGroup
          value={role}
          exclusive
          onChange={(event, newRole) => {
            if (newRole !== null) {
              setRole(newRole);
            }
          }}
          sx={{ marginBottom: "10px" }}
        >
          <ToggleButton value="dm" sx={{ width: "100px" }}>
            DM
          </ToggleButton>
          <ToggleButton value="player" sx={{ width: "100px" }}>
            Player
          </ToggleButton>
        </ToggleButtonGroup>
        {role === "dm" ? (
          <Button
            variant="contained"
            onClick={() => setNewMapOpen(true)}
            sx={{
              height: "40px",
              width: "100px",
              marginBottom: "10px",
            }}
          >
            New Map
          </Button>
        ) : (
          <IconButton
            onClick={() => fetchCampaigns()}
            sx={{
              marginBottom: "10px",
            }}
          >
            <RefreshIcon sx={{ color: "#ffa726" }} />
          </IconButton>
        )}
      </Box>
      {filteredCampaigns.length > 0 ? (
        <Box sx={{ display: "flex", alignItems: "flex-start" }}>
          <List sx={{ minWidth: "200px", borderRight: "1px solid #ccc" }}>
            {filteredCampaigns.map((campaign) => (
              <ListItemButton
                key={campaign.id}
                onClick={() => handleToggleCampaign(campaign.id)}
                selected={openCampaigns[campaign.id]}
              >
                <ListItemText primary={campaign.name} />
              </ListItemButton>
            ))}
          </List>
          <Box sx={{ paddingLeft: 2 }}>
            {filteredCampaigns.map(
              (campaign) =>
                openCampaigns[campaign.id] && (
                  <List key={campaign.id} component="div">
                    {campaign.maps.map((map) => (
                      <ListItemButton
                        key={map.id}
                        onClick={() => onMapClick(map.id)}
                      >
                        <ListItemText primary={map.name} />
                      </ListItemButton>
                    ))}
                  </List>
                )
            )}
          </Box>
        </Box>
      ) : (
        <Typography sx={{ display: "flex", alignItems: "flex-start" }}>
          No maps available
        </Typography>
      )}

      {/* New Map Button Dialogue Box */}
      <Dialog open={newMapOpen} onClose={() => setNewMapOpen(false)}>
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
            value={newMapCampaignId ?? ""}
            onChange={(e) => setNewMapCampaignId(Number(e.target.value))}
            variant="standard"
            margin="dense"
          >
            {dmCampaigns.map((campaign) => (
              <MenuItem key={campaign.id} value={campaign.id}>
                {campaign.name}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewMapOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (newMapCampaignId && newMapName.trim() !== "") {
                onCreateMap?.(newMapCampaignId, newMapName);
                setNewMapOpen(false);
                setNewMapName("");
                setNewMapCampaignId(null);
              }
            }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MapExplorer;
