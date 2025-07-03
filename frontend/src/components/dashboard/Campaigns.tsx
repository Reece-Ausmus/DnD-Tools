import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useUser from "@/hooks/useUser";
import useCampaigns from "@/hooks/useCampaigns";
import formatDate from "@/util/FormatDate";
import formatTime from "@/util/FormatTime";
import { Character, Campaign } from "@/util/types";
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
  Skeleton,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

const Campaigns: React.FC = () => {
  const navigate = useNavigate();
  const { username } = useUser();
  const { campaigns, fetchCampaigns, campaignsLoading } = useCampaigns();
  const [campaign, setCampaign] = React.useState<string>("");
  const [isInviting, setIsInviting] = React.useState<boolean>(false);
  const [inviteUsername, setInviteUsername] = React.useState<string>("");
  const [inviteError, setInviteError] = React.useState<string | null>(null);
  const anchorRef = React.useRef<HTMLButtonElement | null>(null);
  const popperRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleDelete = async (id: string) => {
    await fetch(`/api/campaign/delete_campaign/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ id: id }),
    });

    fetchCampaigns();
    setCampaign("");
  };

  const handleLeave = async (id: string) => {
    await fetch(`/api/campaign/leave_campaign/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ id: id }),
    });
    fetchCampaigns();
    setCampaign("");
  };

  const handleRemoveCharacter =
    (campgainId: string, characterId: string) => async () => {
      await fetch(
        `/api/campaign/remove_character/${encodeURIComponent(
          campgainId
        )}/${encodeURIComponent(characterId)}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            campaign_id: campgainId,
            character_id: characterId,
          }),
        }
      );
      fetchCampaigns();
    };

  const sendInvite = async () => {
    const response = await fetch("api/campaign/invite", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        campaign_id: campaign,
        username: inviteUsername,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      setInviteError(data.message || "Failed to send invite");
    }

    setIsInviting(false);
    setInviteUsername("");
  };

  const handleInviteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      sendInvite();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popperRef.current &&
        !popperRef.current.contains(event.target as Node) &&
        !anchorRef.current?.contains(event.target as Node)
      ) {
        setIsInviting(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInviteClick = () => {
    setIsInviting((prev) => !prev);
  };

  return (
    <Paper sx={{ padding: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <form>
          <FormControl
            fullWidth
            variant="outlined"
            margin="normal"
            sx={{ minWidth: "120px" }}
          >
            <InputLabel id="campaign-label">Campaign</InputLabel>
            <Select
              labelId="campaign-label"
              id="campaign-select"
              value={campaign}
              label="campaign"
              defaultValue="All"
              onChange={(e) => setCampaign(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {campaigns.map((campaign) => (
                <MenuItem key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </form>
        <Button variant="contained" onClick={() => navigate("/createcampaign")}>
          Create Campaign
        </Button>
      </Box>

      {campaignsLoading ? (
        <Skeleton variant="rounded" />
      ) : campaign === "" ? (
        <Container maxWidth="lg">
          {/* Display all campaigns */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell align="center">Name</TableCell>
                  <TableCell align="center">Description</TableCell>
                  <TableCell align="center">DM</TableCell>
                  <TableCell align="center">Start Date</TableCell>
                  <TableCell align="center">End Date</TableCell>
                  <TableCell align="center">Meeting Time</TableCell>
                  <TableCell align="center">Meeting Day</TableCell>
                  <TableCell align="center">Meeting Frequency</TableCell>
                  <TableCell align="center"># Characters</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell align="center">{campaign.name}</TableCell>
                    <TableCell align="center">
                      {campaign.description.length > 25
                        ? `${campaign.description.substring(0, 25)}...`
                        : campaign.description}
                    </TableCell>
                    <TableCell align="center">{campaign.dm}</TableCell>
                    <TableCell align="center">
                      {formatDate(campaign.start_date)}
                    </TableCell>
                    <TableCell align="center">
                      {campaign.end_date ? formatDate(campaign.end_date) : "-"}
                    </TableCell>
                    <TableCell align="center">
                      {formatTime(campaign.meeting_time)}
                    </TableCell>
                    <TableCell align="center">{campaign.meeting_day}</TableCell>
                    <TableCell align="center">
                      {campaign.meeting_frequency}
                    </TableCell>
                    <TableCell align="center">{campaign.char_count}</TableCell>
                    <TableCell align="center">
                      <Button
                        variant="text"
                        color="primary"
                        onClick={() => setCampaign(campaign.id)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Container>
      ) : (
        <Container maxWidth="lg">
          <Paper sx={{ padding: 2 }}>
            {/* Display individual campaign details */}
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="h4" color="primary">
                {campaigns.find((c) => c.id === campaign)?.name}
              </Typography>
              {campaigns.find((c) => c.id === campaign)?.dm === username ? (
                <ButtonGroup variant="text" color="secondary">
                  <Button
                    color="primary"
                    ref={anchorRef}
                    onClick={handleInviteClick}
                  >
                    Invite
                  </Button>
                  <Button
                    color="success"
                    onClick={() => navigate(`/editcampaign/?id=${campaign}`)}
                  >
                    Edit
                  </Button>
                  <Button color="error" onClick={() => handleDelete(campaign)}>
                    Delete
                  </Button>
                </ButtonGroup>
              ) : (
                <Button
                  color="error"
                  variant="text"
                  onClick={() => handleLeave(campaign)}
                >
                  Leave
                </Button>
              )}
            </Box>
            <Typography variant="subtitle1">
              {campaigns.find((c) => c.id === campaign)?.description}
            </Typography>
            <Box>
              <Typography variant="body2">
                DM: {campaigns.find((c) => c.id === campaign)?.dm}
              </Typography>
              <Typography variant="body2">
                Start Date:{" "}
                {formatDate(
                  campaigns.find((c) => c.id === campaign)?.start_date ?? null
                )}
              </Typography>
              {campaigns.find((c) => c.id === campaign)?.end_date && (
                <Typography variant="body2">
                  End Date:{" "}
                  {formatDate(
                    campaigns.find((c) => c.id === campaign)?.end_date ?? null
                  )}
                </Typography>
              )}
              <Typography variant="body2">
                Meeting Time:{" "}
                {formatTime(
                  campaigns.find((c) => c.id === campaign)?.meeting_time ?? null
                )}
              </Typography>
              <Typography variant="body2">
                Meeting Day:
                {campaigns.find((c) => c.id === campaign)?.meeting_day}
              </Typography>
              <Typography variant="body2">
                Meeting Frequency:{" "}
                {campaigns.find((c) => c.id === campaign)?.meeting_frequency}
              </Typography>
            </Box>
            <Typography variant="h5" color="primary">
              Characters
            </Typography>
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: "xs" }} aria-label="character table">
                <TableHead>
                  <TableRow>
                    <TableCell align="center">Name</TableCell>
                    <TableCell align="center">User</TableCell>
                    <TableCell align="center">Gender</TableCell>
                    <TableCell align="center">Race</TableCell>
                    <TableCell align="center">Class</TableCell>
                    <TableCell align="center">Level</TableCell>
                    {campaigns.find((c) => c.id === campaign)?.dm ===
                      username && <TableCell align="center">Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {campaigns
                    .find((c) => c.id === campaign)
                    ?.characters.map((character: Character) => (
                      <TableRow key={character.id}>
                        <TableCell align="center">{character.name}</TableCell>
                        <TableCell align="center">
                          {character.username}
                        </TableCell>
                        <TableCell align="center">{character.gender}</TableCell>
                        <TableCell align="center">{character.race}</TableCell>
                        <TableCell align="center">
                          {character.classType}
                        </TableCell>
                        <TableCell align="center">{character.level}</TableCell>
                        {campaigns.find((c) => c.id === campaign)?.dm ===
                          username && (
                          <TableCell align="center">
                            <Button
                              variant="text"
                              color="error"
                              onClick={handleRemoveCharacter(
                                campaign,
                                character.id
                              )}
                            >
                              Remove
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Popper
              open={isInviting}
              anchorEl={anchorRef.current}
              placement="top-start"
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
                <TextField
                  type="text"
                  label="Enter Username"
                  variant="outlined"
                  size="small"
                  value={inviteUsername}
                  onChange={(e) => setInviteUsername(e.target.value)}
                  onKeyDown={handleInviteKeyDown}
                  autoFocus
                />
                <Button variant="outlined" onClick={sendInvite} color="primary">
                  Send
                </Button>
              </Paper>
            </Popper>
          </Paper>
        </Container>
      )}
    </Paper>
  );
};

export default Campaigns;
