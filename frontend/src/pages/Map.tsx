import React, { useState, useEffect, useMemo } from "react";
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
  ButtonGroup,
  Tooltip,
} from "@mui/material";
import InfiniteCanvas from "@/components/map/InfiniteCanvas";
import useCampaigns from "@/hooks/useCampaigns";
import CampaignContext from "@/context/CampaignContext";
import { Campaign, Character } from "@/util/types";
import { io, Socket } from "socket.io-client";
import { Map as MapType } from "@/util/types";

const drawButtonOptions = [
  { id: "place-marker", label: "Place Marker" },
  { id: "draw-lines", label: "Draw Line" },
  { id: "draw-box", label: "Draw box" },
  { id: "dance-time", label: "Do a little dance" },
  { id: "erase", label: "Erase" },
] as const;

const Map: React.FC = () => {
  const socket: Socket = useMemo(
    () =>
      io("http://localhost:5001", {
        withCredentials: true,
        transports: ["websocket"],
      }),
    []
  );
  const [newMapOpen, setNewMapOpen] = useState(false);
  const [newMapName, setNewMapName] = useState("");
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(
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

  const [connectOpen, setConnectOpen] = useState(false);
  const [dmMaps, setDmMaps] = useState<MapType[]>([]);
  const [dmOpen, setDmOpen] = useState(false);
  const [playerMaps, setPlayerMaps] = useState<MapType[]>([]);
  const [selectedMap, setSelectedMap] = useState<number | null>(null);
  const [mapConnected, setMapConnected] = useState(false);
  const [mapId, setMapId] = useState<number | null>(null);

  const handleClickOpenMap = async () => {
    try {
      const response = await fetch("api/map/get_dm_maps", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch DM maps.");
      }
      setDmMaps(data.maps || []);
      setDmOpen(true);
    } catch (error) {
      console.error("Error fetching DM maps:", error);
    }
  };

  // Get available maps from the server
  const handleClickConnectMap = async () => {
    try {
      const response = await fetch("api/map/get_player_maps", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch available maps.");
      }
      setPlayerMaps(data.maps || []);
      setConnectOpen(true);
    } catch (error) {
      console.error("Error fetching available maps:", error);
    }
  };

  // Create a map and emit to server
  const handleCreateMap = async () => {
    if (!socket.connected) {
      console.error("Socket is not connected.");
      return;
    }
    if (!newMapName.trim()) {
      console.error("Map name cannot be empty.");
      return;
    }
    if (selectedCampaignId === null || selectedCampaignId < 0) {
      console.error("Please select a valid campaign.");
      return;
    }

    socket.emit("create_map", {
      name: newMapName,
      campaign_id: selectedCampaignId,
    });

    setNewMapName("");
    setNewMapOpen(false);
    setSelectedCampaignId(-1);
  };

  // Join a map room
  const handleJoinMapRoom = (mapId: number) => {
    if (!socket.connected) {
      console.error("Socket is not connected.");
      return;
    }
    if (mapId === null || mapId < 0) {
      console.error("Invalid map ID.");
      return;
    }
    if (selectedMap !== null) {
      socket.emit("join_map_room", { map_id: mapId });
      setConnectOpen(false);
      setDmOpen(false);
    } else {
      console.error("No map selected to join.");
    }
  };

  const handleLeaveMapRoom = () => {
    if (!socket.connected) {
      console.error("Socket is not connected.");
      return;
    }
    if (mapId === null || mapId < 0) {
      console.error("Invalid map ID.");
      return;
    }
    socket.emit("leave_map_room", { map_id: mapId });
  };

  // Effect for socket stuff
  useEffect(() => {
    // Connect to the socket server when the component mounts
    socket.connect();

    const lastMapId = localStorage.getItem("mapId");
    if (lastMapId) {
      const mapId = Number(lastMapId);
      if (!isNaN(mapId) && mapId > 0) {
        socket.emit("join_map_room", { map_id: mapId });
      }
    }

    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    socket.on("map_created", (data) => {
      console.log("Map created:", data);
    });

    socket.on("map_connected", (data) => {
      console.log("Connected to map:", data);
      updateCurrentCampaign(data.campaign_id);
      setMapConnected(true);
      setMapId(data.map_id);
    });

    socket.on("map_disconnected", (data) => {
      console.log("Disconnected from map:", data);
      localStorage.removeItem("mapId");
      setMapConnected(false);
      setMapId(null);
    });

    return () => {
      // Cleanup: disconnect the socket when the component unmounts
      socket.off("error");
      socket.off("map_created");
      socket.off("map_connected");
      socket.off("map_disconnected");

      socket.disconnect();
    };
  }, [socket]);

  const handleClickNewMap = () => {
    setNewMapOpen(true);
  };

  const handleNewMapClose = () => {
    setNewMapOpen(false);
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

  useEffect(() => {
    if (mapConnected && mapId !== null) {
      localStorage.setItem("mapId", String(mapId));
    }
  }, [mapConnected, mapId]);

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
        <ButtonGroup variant="text" color="secondary">
          {mapConnected ? (
            <Button color="primary" onClick={handleLeaveMapRoom}>
              Disconnect from Map
            </Button>
          ) : (
            <>
              <Button color="primary" onClick={handleClickNewMap}>
                New Map
              </Button>
              <Button color="primary" onClick={handleClickOpenMap}>
                Open Map (DM)
              </Button>
              <Button color="primary" onClick={handleClickConnectMap}>
                Connect to Map (Player)
              </Button>
            </>
          )}
        </ButtonGroup>
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
                value={selectedCampaignId ?? ""}
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
              <Box
                sx={{
                  border: "1px solid gray",
                  margin: "20px",
                  padding: "10px",
                }}
              >
                {currentCampaign?.characters.map((character) => (
                  <Box
                    key={character.id}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "auto 1fr",
                      flexDirection: "column",
                      alignItems: "center",
                      margin: "5px",
                    }}
                  >
                    <Tooltip title={character.name} arrow>
                      <Typography
                        noWrap
                        sx={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          cursor: "default",
                          paddingRight: "10px",
                        }}
                      >
                        {character.name}:
                      </Typography>
                    </Tooltip>
                    <Box
                      component="label"
                      sx={{
                        width: "35px",
                        height: "35px",
                        borderRadius: "35px",
                        cursor: "pointer",
                        backgroundColor: "blueviolet",
                        "&:hover": {
                          border: "2px solid gray",
                        },
                      }}
                    />
                    <input
                      onChange={(e) => handlePlayerTokenClick(character)}
                      style={{
                        // Hide the default input but keep it functional
                        visibility: "hidden",
                        width: 0,
                        height: 0,
                        position: "absolute",
                      }}
                    />
                  </Box>
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
            socket={socket}
            mapId={mapId ?? -1}
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
            <Button variant="contained" onClick={handleCreateMap}>
              Create
            </Button>
          </DialogActions>
        </Dialog>

        {/* DM Map Selection Dialogue Box */}
        <Dialog open={dmOpen} onClose={() => setDmOpen(false)}>
          <DialogTitle>Select a Map</DialogTitle>
          <DialogContent>
            {dmMaps.length === 0 ? (
              <Typography variant="body1">
                No maps available. Create a new map first.
              </Typography>
            ) : (
              <TextField
                select
                fullWidth
                label="Select Map"
                value={selectedMap || ""}
                onChange={(e) => setSelectedMap(Number(e.target.value))}
                variant="standard"
                margin="dense"
              >
                {dmMaps.map((map) => (
                  <MenuItem key={map.id} value={map.id}>
                    {map.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDmOpen(false)}>Close</Button>
            {dmMaps.length > 0 && (
              <Button
                variant="contained"
                onClick={() => handleJoinMapRoom(selectedMap || -1)}
              >
                Connect
              </Button>
            )}
          </DialogActions>
        </Dialog>

        <Dialog open={connectOpen} onClose={() => setConnectOpen(false)}>
          <DialogTitle>Connect to Map</DialogTitle>
          <DialogContent>
            {playerMaps.length === 0 ? (
              <Typography variant="body1">
                No available maps to connect to.
              </Typography>
            ) : (
              <TextField
                select
                fullWidth
                label="Select Map"
                value={selectedMap || ""}
                onChange={(e) => setSelectedMap(Number(e.target.value))}
                variant="standard"
                margin="dense"
              >
                {playerMaps.map((map) => (
                  <MenuItem key={map.id} value={map.id}>
                    {map.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConnectOpen(false)}>Close</Button>
            {playerMaps.length > 0 && (
              <Button
                variant="contained"
                onClick={() => handleJoinMapRoom(selectedMap || -1)}
              >
                Connect
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Container>
    </Container>
  );
};

export default Map;
