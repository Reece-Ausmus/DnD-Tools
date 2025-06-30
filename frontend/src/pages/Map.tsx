import React, { useState, useEffect, useMemo, useRef } from "react";
import { SnackbarProvider } from "../context/SnackbarContext";
import {
  Box,
  Container,
  Typography,
  Button,
  ButtonGroup,
  Tooltip,
  Stack,
  useTheme,
  Paper,
  Switch,
} from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import InfiniteCanvas, { ChildHandle } from "@/components/map/InfiniteCanvas";
import useCampaigns from "@/hooks/useCampaigns";
import { Campaign, Character, Marker, Line } from "@/util/types";
import { io, Socket } from "socket.io-client";
import { Map as MapType } from "@/util/types";
import MapExplorer from "@/components/map/MapExplorer";

const drawButtonOptions = [
  { id: "place-marker", label: "Place Marker" },
  { id: "draw-lines", label: "Draw Line" },
  { id: "draw-box", label: "Draw Box" },
  { id: "draw-circle", label: "Draw Circle" },
  { id: "dance-time", label: "Do a little dance" },
  { id: "erase", label: "Erase" },
] as const;

const Map: React.FC = () => {
  const infiniteCanvasRef = useRef<ChildHandle>(null);

  // Initialize socket connection
  const socket: Socket = useMemo(
    () =>
      io("http://localhost:5001", {
        withCredentials: true,
        transports: ["websocket"],
      }),
    []
  );

  // Ref to get map state from InfiniteCanvas
  const getMapStateRef = useRef<() => { markers: Marker[]; lines: Line[] }>();
  // Save map state to server
  const handleSaveMap = async () => {
    if (!mapId || !getMapStateRef.current) return;
    const { markers, lines } = getMapStateRef.current();
    try {
      const response = await fetch("/api/map/save_state", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ map_id: mapId, markers, lines }),
      });
      if (!response.ok) throw new Error("Failed to save map.");
      console.log("Map saved.");
    } catch (err) {
      console.error("Error saving map:", err);
    }
  };

  const handleDeleteMap = async () => {
    if (!mapId || !getMapStateRef.current) return;
    if (!socket.connected) {
      console.error("Socket is not connected.");
      return;
    }

    socket.emit("delete_map", {
      map_id: mapId,
    });
  };

  const [markerColor, setMarkerColor] = useState<string>("#E57373");
  const [wallColor, setWallColor] = useState<string>("#E57373");
  const [isGridOn, setGridOn] = useState<boolean>(true);
  const [isAxesOn, setAxesOn] = useState<boolean>(true);
  const [isPanelOpen, setPanelOpen] = useState(false);
  const theme = useTheme(); // theme for sliding animation

  const { campaigns, fetchCampaigns, campaignsLoading } = useCampaigns();
  const [currentCampaign, setCurrentCampaign] = useState<Campaign | null>(null);
  const [playerTokenSelected, setPlayerTokenSelected] =
    useState<Character | null>(null);

  const updateCurrentCampaign = (campaign_id: number) => {
    // find campaign by id
    const foundCampaign = campaigns.find(
      (campaign) => campaign.id === campaign_id
    );

    setCurrentCampaign(foundCampaign || null);
  };

  const handlePlayerTokenSingleClick = (character: Character) => {
    if (playerTokenSelected && character.id === playerTokenSelected.id) {
      setPlayerTokenSelected(null);
    } else {
      setPlayerTokenSelected(character);
    }

    setActiveDrawButtonIndex(null);
  };

  const handleDoubleClick = (character: Character) => {
    infiniteCanvasRef.current?.centerGridOnPoint(character.id);
  };

  const clickTimeoutRef = useRef<number | null>(null);

  const handlePlayerTokenClicking = (character: Character) => {
    if (clickTimeoutRef.current) {
      // second click within 200ms, do double click action
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      handleDoubleClick(character);
    } else {
      // first click, start timer
      // if no other click within 200ms, then do single click action
      clickTimeoutRef.current = window.setTimeout(() => {
        handlePlayerTokenSingleClick(character);
        clickTimeoutRef.current = null;
      }, 200); // 200ms delay
    }
  };

  const handleGridOnPress = () => {
    isGridOn ? setGridOn(false) : setGridOn(true);
  };

  const handleAxesOnPress = () => {
    isAxesOn ? setAxesOn(false) : setAxesOn(true);
  };

  const [mapConnected, setMapConnected] = useState(false);
  const [mapId, setMapId] = useState<number | null>(null);
  const [currentMap, setCurrentMap] = useState<MapType | null>(null);
  const [isDM, setIsDM] = useState(false);
  const [characterId, setCharacterId] = useState<number | null>(null);
  const [mapVisibility, setMapVisibility] = useState<boolean>(false);

  const handleToggleMapVisibility = async () => {
    const newVisibility = !mapVisibility;
    try {
      const response = await fetch("/api/map/set_visibility/" + mapId, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ map_id: mapId, map_visibility: newVisibility }),
      });

      if (!response.ok) throw new Error("Failed to update visibility.");
      console.log("Map visibility updated.");
      setMapVisibility(newVisibility);
      if (currentMap) {
        setCurrentMap({ ...currentMap, is_open: newVisibility });
      }
    } catch (err) {
      console.error("Error updating visibility:", err);
    }
  };

  // Create a map and emit to server
  const handleCreateMap = async (campaignId: number, mapName: string) => {
    if (!socket.connected) {
      console.error("Socket is not connected.");
      return;
    }
    if (!mapName.trim()) {
      console.error("Map name cannot be empty.");
      return;
    }
    if (campaignId === null || campaignId < 0) {
      console.error("Please select a valid campaign.");
      return;
    }

    socket.emit("create_map", {
      name: mapName,
      campaign_id: campaignId,
    });
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

    socket.emit("join_map_room", { map_id: mapId });
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

    socket.on("map_deleted", (data) => {
      console.log("Map deleted:", data);
      setMapConnected(false);
      setMapId(null);
      localStorage.removeItem("mapId");
      setIsDM(false);
    });

    socket.on("map_connected", (data) => {
      console.log("Connected to map:", data);
      const map = data.map;
      updateCurrentCampaign(map.campaign_id);
      setMapConnected(true);
      setCurrentMap(map);
      setMapId(map.id);
      setIsDM(data.isDM);
      if (data.isDM) {
        setMapVisibility(map.is_open);
      }
      if (data.character_id) {
        setCharacterId(data.character_id);
      }
    });

    socket.on("map_disconnected", (data) => {
      console.log("Disconnected from map:", data);
      localStorage.removeItem("mapId");
      setMapConnected(false);
      setMapId(null);
      setIsDM(false);
    });

    return () => {
      // Cleanup: disconnect the socket when the component unmounts
      socket.off("error");
      socket.off("map_created");
      socket.off("map_deleted");
      socket.off("map_connected");
      socket.off("map_disconnected");

      socket.disconnect();
    };
  }, [socket, campaigns]);

  // ActiveIndex holds the index of currently selecting drawing button
  const [activeDrawButtonIndex, setActiveDrawButtonIndex] = useState<
    number | null
  >(null);

  // handle pressing the drawing buttons
  const handleDrawButtonClick = (indexToActivate: number) => {
    setActiveDrawButtonIndex((prevIndex) =>
      prevIndex === indexToActivate ? null : indexToActivate
    );
    setPlayerTokenSelected(null);
  };

  useEffect(() => {
    fetchCampaigns();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        // Unselect drawing button on escape press
        setActiveDrawButtonIndex(null);
        setPlayerTokenSelected(null);
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

      {/* If there is no map selected, show Map Explorer. Else, show map */}

      {!mapConnected ? (
        <>
          <Box sx={{ display: "flex", width: "100%" }}>
            <Paper
              sx={{
                width: "50%",
                padding: 2,
                height: "600px",
                overflow: "auto",
                marginRight: 2,
              }}
            >
              <MapExplorer
                onMapClick={handleJoinMapRoom}
                onCreateMap={handleCreateMap}
              />
            </Paper>
            <Paper
              sx={{
                width: "50%",
                height: "600px",
                border: "1px dashed gray",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography variant="h4" color="textSecondary">
                (Future content area)
              </Typography>
            </Paper>
          </Box>
        </>
      ) : (
        <>
          <Tooltip title={currentMap?.name || "Unnamed Map"} arrow>
            <Typography
              variant="h2"
              align="center"
              noWrap
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                cursor: "default",
                paddingRight: "10px",
                margin: "20px",
              }}
            >
              {currentCampaign ? currentCampaign.name : "None"} |{" "}
              {currentMap ? currentMap.name : "unnamed"}
            </Typography>
          </Tooltip>

          <Box
            sx={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              border: "1px solid gray",
            }}
          >
            <ButtonGroup variant="text" color="secondary">
              {isDM ? (
                <>
                  <Button color="primary" onClick={handleLeaveMapRoom}>
                    Disconnect from Map
                  </Button>
                  <Button color="success" onClick={handleSaveMap}>
                    Save Map
                  </Button>
                  <Button color="error" onClick={handleDeleteMap}>
                    Delete Map
                  </Button>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      marginLeft: 2,
                    }}
                  >
                    <Typography variant="body1" sx={{ marginRight: 1 }}>
                      Map Visible?
                    </Typography>
                    <Switch
                      color="primary"
                      onChange={handleToggleMapVisibility}
                      checked={mapVisibility}
                    />
                  </Box>
                </>
              ) : (
                <Button color="primary" onClick={handleLeaveMapRoom}>
                  Disconnect from Map
                </Button>
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
                              border:
                                playerTokenSelected &&
                                character.id === playerTokenSelected.id
                                  ? "2px solid orange"
                                  : "2px solid gray",
                            },
                            border:
                              playerTokenSelected &&
                              character.id === playerTokenSelected.id
                                ? "2px solid orange"
                                : "none",
                          }}
                          onClick={(e) => handlePlayerTokenClicking(character)}
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
                position: "relative",
              }}
            >
              <SnackbarProvider>
                <InfiniteCanvas
                  activeDrawButton={activeDrawButton}
                  markerColor={markerColor}
                  wallColor={wallColor}
                  socket={socket}
                  mapId={mapId ?? -1}
                  getMapStateRef={getMapStateRef}
                  isDM={isDM}
                  isGridOn={isGridOn}
                  characterId={characterId ?? -1}
                  isAxesOn={isAxesOn}
                  playerTokenSelected={playerTokenSelected}
                  ref={infiniteCanvasRef}
                />
              </SnackbarProvider>
              {/* on-top-of-canvas sliding button tray */}
              <Stack
                spacing={1}
                sx={{
                  position: "absolute",
                  top: "16px",
                  right: 0,
                  border: "2px solid gray",
                  borderRadius: "5px",
                  padding: "3px",
                  zIndex: 2,
                  // ANIMATION - Slide in from the left
                  transform: isPanelOpen
                    ? "translateX(-16%)"
                    : "translateX(100%)",
                  transition: theme.transitions.create("transform", {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.leavingScreen,
                  }),
                }}
              >
                {/* Slider container buttons */}
                <Button
                  variant="contained"
                  color={isGridOn === true ? "primary" : "inherit"}
                  onClick={() => handleGridOnPress()}
                  sx={{
                    minWidth: 0,
                    width: "35px",
                    height: "35px",
                  }}
                >
                  grid
                </Button>
                <Button
                  variant="contained"
                  color={isAxesOn === true ? "primary" : "inherit"}
                  onClick={() => handleAxesOnPress()}
                  sx={{
                    minWidth: 0,
                    width: "35px",
                    height: "35px",
                  }}
                >
                  axes
                </Button>
              </Stack>

              {/* toggle button for tray slide out */}
              <Button
                onClick={() => setPanelOpen(!isPanelOpen)}
                style={{
                  position: "absolute",
                  top: "22px",
                  border: "2px solid gray",
                  backgroundColor: "black",
                  borderRadius: "5px",
                  height: "28px",
                  right: 0,
                  zIndex: 1,
                  minWidth: 0,
                  width: "auto",
                  padding: "0px 0px 0px 0px", // Reduce horizontal padding (vertical is 0)
                  color: isPanelOpen ? "primary" : "inherit",
                  // ANIMATION -- slide button with button tray
                  transform: isPanelOpen
                    ? "translateX(-180%)"
                    : "translateX(25%)",
                  transition: theme.transitions.create("transform", {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.leavingScreen,
                  }),
                }}
              >
                <ChevronRightIcon
                  sx={{
                    color: isPanelOpen ? "orange" : "gray",
                    fontSize: "30px",
                    // ANIMATION - rotate arrow
                    transform: isPanelOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: theme.transitions.create("transform", {
                      duration: theme.transitions.duration.shortest,
                    }),
                  }}
                />
              </Button>
            </Box>
          </Container>
        </>
      )}
    </Container>
  );
};

export default Map;
