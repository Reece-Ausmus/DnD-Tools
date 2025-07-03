import React from "react";
import useCampaigns from "@/hooks/useCampaigns";
import {
  Box,
  Button,
  ButtonGroup,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Popper,
  Select,
  TextField,
  Typography,
} from "@mui/material";

interface WelcomeProps {
  userData: {
    first: string;
    username: string;
    email: string;
  };
}

const Welcome: React.FC<WelcomeProps> = ({ userData }) => {
  const { fetchCampaigns, invites, fetchInvites } = useCampaigns();
  const [isSelecting, setIsSelecting] = React.useState<boolean>(false);
  const [campaignId, setCampaignId] = React.useState<string>("");
  const [characterId, setCharacterId] = React.useState<string>("");
  const [characters, setCharacters] = React.useState<any[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const anchorRef = React.useRef<HTMLButtonElement | null>(null);
  const popperRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    fetchInvites();
  }, []);

  const fetchCharacters = async () => {
    try {
      const response = await fetch("api/character/get_characters", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok)
        throw new Error(data.message || "Failed to get characters");

      setCharacters(data.characters);
      setCharacterId(String(data.characters[0].id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  React.useEffect(() => {
    fetchCharacters();
  }, [isSelecting]);

  const accept = async () => {
    try {
      const response = await fetch("api/campaign/accept_invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          campaign_id: campaignId,
          character_id: characterId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to accept invite");
      }

      fetchCampaigns();
      fetchInvites();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSelectClick = (character_id: string) => {
    setCharacterId(character_id);
  };

  const handleAcceptClick = (campaign_id: string) => {
    setCampaignId(campaign_id);
    setIsSelecting((prev) => !prev);
  };

  const handleDecline = async (campaign_id: string) => {
    try {
      const response = await fetch("api/campaign/decline_invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ campaign_id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to decline invite");
      }

      fetchInvites();
    } catch (err: any) {
      setError(err.message);
    }
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popperRef.current &&
        !popperRef.current.contains(event.target as Node) &&
        !anchorRef.current?.contains(event.target as Node)
      ) {
        setIsSelecting(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <Paper sx={{ padding: 2 }}>
      <Typography variant="h4">Hi, {userData.first}!</Typography>
      <Typography variant="body1">Username: {userData.username}</Typography>
      <Typography variant="body1">Email: {userData.email}</Typography>

      {invites.length > 0 && (
        <>
          <Typography variant="h5">Invites</Typography>
          {invites.map((invite) => (
            <Box key={String(invite.id)} display={"flex"} flexDirection={"row"}>
              <Typography key={String(invite.id)} variant="body1">
                {invite.dm} invited you to join {invite.name}
              </Typography>
              <ButtonGroup variant="text" color="secondary">
                <Button
                  color="success"
                  onClick={() => handleAcceptClick(String(invite.id))}
                  ref={anchorRef}
                >
                  Accept
                </Button>
                <Popper
                  open={isSelecting}
                  anchorEl={anchorRef.current}
                  placement="bottom-start"
                >
                  <Paper
                    ref={popperRef}
                    sx={{
                      p: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      width: 250,
                    }}
                  >
                    <Box>
                      <form>
                        <FormControl
                          fullWidth
                          variant="outlined"
                          margin="normal"
                          sx={{ minWidth: "120px" }}
                        >
                          <InputLabel id="character-label">
                            Select Character
                          </InputLabel>
                          <Select
                            labelId="character-label"
                            id="character-select"
                            value={characterId}
                            label="Select Character"
                            onMouseDown={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              handleSelectClick(e.target.value);
                            }}
                          >
                            {characters.map((character: any) => (
                              <MenuItem
                                key={String(character.id)}
                                value={String(character.id)}
                              >
                                {character.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </form>
                      <Button
                        variant="outlined"
                        onClick={accept}
                        color="primary"
                      >
                        Accept
                      </Button>
                    </Box>
                  </Paper>
                </Popper>
                <Button
                  color="error"
                  onClick={() => handleDecline(String(invite.id))}
                >
                  Decline
                </Button>
              </ButtonGroup>
            </Box>
          ))}
        </>
      )}
    </Paper>
  );
};

export default Welcome;
