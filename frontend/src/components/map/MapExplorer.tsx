import React from "react";
import { Campaign } from "@/util/types";
import useUser from "@/hooks/useUser";
import { List, ListItemButton, ListItemText, Box } from "@mui/material";

interface MapExplorerProps {
  role: "dm" | "player" | "";
  campaigns: Campaign[];
  onMapClick: (mapId: number) => void;
}

const MapExplorer: React.FC<MapExplorerProps> = ({
  role,
  campaigns,
  onMapClick,
}) => {
  const { username } = useUser();

  const filteredCampaigns = campaigns.filter((campaign) =>
    role === "dm" ? campaign.dm === username : campaign.dm !== username
  );

  const [openCampaigns, setOpenCampaigns] = React.useState<{
    [key: number]: boolean;
  }>({});
  const handleToggleCampaign = (campaignId: number) => {
    setOpenCampaigns((prev) => ({ ...prev, [campaignId]: !prev[campaignId] }));
  };

  return (
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
  );
};

export default MapExplorer;
