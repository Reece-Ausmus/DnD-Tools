import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Paper,
} from "@mui/material";

import { Campaign, Map as MapType } from "@/util/types";

type MapExplorerProps = {
  role: "dm" | "player";
  campaigns: Campaign[];
  onJoinMap: (mapId: number) => void;
};

const MapExplorer: React.FC<MapExplorerProps> = ({
  role,
  campaigns,
  onJoinMap,
}) => {
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(
    null
  );

  // Filter campaigns based on role:
  // For DM, show campaigns where user is DM (assuming Campaign has is_dm or similar).
  // For player, show all campaigns (or those where user is a player).
  // For now, show all.
  const filteredCampaigns = campaigns; // TODO: filter by role if info available

  // Get selected campaign maps
  const selectedCampaign = filteredCampaigns.find(
    (c) => c.id === selectedCampaignId
  );
  const maps: MapType[] = selectedCampaign?.maps || [];

  return (
    <Paper sx={{ maxWidth: 600, margin: "auto", padding: 3 }}>
      <Typography variant="h4" align="center" gutterBottom>
        {role === "dm" ? "Your Campaigns (DM)" : "Campaigns (Player)"}
      </Typography>
      <List>
        {filteredCampaigns.length === 0 && (
          <Typography variant="body1" align="center">
            No campaigns found.
          </Typography>
        )}
        {filteredCampaigns.map((campaign) => (
          <React.Fragment key={campaign.id}>
            <ListItem
              component="div"
              button
              selected={selectedCampaignId === campaign.id}
              onClick={() => setSelectedCampaignId(campaign.id)}
            >
              <ListItemText
                primary={campaign.name}
                secondary={campaign.description}
              />
            </ListItem>
            <Divider />
          </React.Fragment>
        ))}
      </List>
      {selectedCampaign && (
        <Box sx={{ marginTop: 2 }}>
          <Typography variant="h6" gutterBottom>
            Maps in "{selectedCampaign.name}"
          </Typography>
          <List>
            {maps.length === 0 ? (
              <Typography variant="body2" align="center">
                No maps in this campaign.
              </Typography>
            ) : (
              maps.map((map) => (
                <ListItem key={map.id}>
                  <ListItemText primary={map.name} />
                  <ListItemSecondaryAction>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => onJoinMap(map.id)}
                    >
                      Connect
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              ))
            )}
          </List>
        </Box>
      )}
    </Paper>
  );
};

export default MapExplorer;
