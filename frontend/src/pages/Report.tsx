import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Container,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Grid,
  Input,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Slider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { PieChart } from "@mui/x-charts/PieChart";
import { DatePicker, TimeField } from "@mui/x-date-pickers";
import React, { useEffect, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import Loading from "@/components/shared/Loading";
import useCharacters from "@/hooks/useCharacters";
import { Campaign, Character } from "@/util/types";
import formatDate from "@/util/FormatDate";
import formatTime from "@/util/FormatTime";
import { clear } from "console";

const Report: React.FC = () => {
  const [campaignName, setCampaignName] = useState<string>("");
  const [startDateStart, setStartDateStart] = useState<Dayjs | null>(null);
  const [startDateEnd, setStartDateEnd] = useState<Dayjs | null>(null);
  const [endDateStart, setEndDateStart] = useState<Dayjs | null>(null);
  const [endDateEnd, setEndDateEnd] = useState<Dayjs | null>(null);
  const [meetingDay, setMeetingDay] = useState<string[]>([]);
  const [meetingTimeStart, setMeetingTimeStart] = useState<Dayjs | null>(null);
  const [meetingTimeEnd, setMeetingTimeEnd] = useState<Dayjs | null>(null);
  const [meetingFrequency, setMeetingFrequency] = useState<string[]>([]);
  const [charCountMin, setCharCountMin] = useState<number | null>(null);
  const [charCountMax, setCharCountMax] = useState<number | null>(null);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [numCampaigns, setNumCampaigns] = useState<number | null>(null);
  const [avgDuration, setAvgDuration] = useState<number | null>(null);
  const [avgCharCount, setAvgCharCount] = useState<number | null>(null);
  const [meetingDays, setMeetingDays] = useState<any[]>([]);
  const [meetingFrequencies, setMeetingFrequencies] = useState<any[]>([]);

  const [characterName, setCharacterName] = useState<string>("");
  const [gender, setGender] = useState<string[]>([]);
  const [classType, setClassType] = useState<string[]>([]);
  const [race, setRace] = useState<string[]>([]);
  const [levelMin, setLevelMin] = useState<number | null>(null);
  const [levelMax, setLevelMax] = useState<number | null>(null);

  const [characters, setCharacters] = useState<Character[]>([]);
  const [numCharacters, setNumCharacters] = useState<number | null>(null);
  const [avgLevel, setAvgLevel] = useState<number | null>(null);
  const [genderCounts, setGenderCounts] = useState<any[]>([]);
  const [classCounts, setClassCounts] = useState<any[]>([]);
  const [raceCounts, setRaceCounts] = useState<any[]>([]);

  const [reportType, setReportType] = useState<"campaign" | "character">(
    "campaign"
  );
  const [searchMode, setSearchMode] = useState<"strict" | "lax">("strict");

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { races, fetchRaces, classTypes, fetchClasses } = useCharacters();

  const pieColors = [
    "#ff9800",
    "#00bcff",
    "#8bc34a",
    "#e91e63",
    "#53a9f4",
    "#9c27b0",
    "#4caf50",
  ];

  const frequencies = ["Weekly", "Bi-Weekly", "Monthly", "One-Shot"];

  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  React.useEffect(() => {
    fetchRaces();
    fetchClasses();
  }, [loading]);

  const clearFilters = () => {
    setCampaignName("");
    setStartDateStart(null);
    setStartDateEnd(null);
    setEndDateStart(null);
    setEndDateEnd(null);
    setMeetingDay([]);
    setMeetingTimeStart(null);
    setMeetingTimeEnd(null);
    setMeetingFrequency([]);
    setCharCountMin(null);
    setCharCountMax(null);
    setCharacterName("");
    setGender([]);
    setClassType([]);
    setRace([]);
    setLevelMin(null);
    setLevelMax(null);
  };

  const handleCharCountMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "") {
      setCharCountMax(null);
      return;
    }
    const value = Number(raw);
    if (isNaN(value) || value < 0) return;
    else if (charCountMin !== null && value < charCountMin)
      setCharCountMax(charCountMin);
    else if (value > 20) setCharCountMax(20);
    else setCharCountMax(value);
  };

  const handleCharCountMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "") {
      setCharCountMin(null);
      return;
    }
    const value = Number(raw);
    if (isNaN(value) || value < 0) return;
    else if (charCountMax !== null && value > charCountMax)
      setCharCountMin(charCountMax);
    else if (value > 20) setCharCountMin(20);
    else setCharCountMin(value);
  };

  const handleLevelMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "") {
      setLevelMax(null);
      return;
    }
    const value = Number(raw);
    if (isNaN(value) || value < 0) return;
    else if (levelMin !== null && value < levelMin) setLevelMax(levelMin);
    else if (value > 20) setLevelMax(20);
    else setLevelMax(value);
  };

  const handleLevelMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "") {
      setLevelMin(null);
      return;
    }
    const value = Number(raw);
    if (isNaN(value) || value < 0) return;
    else if (levelMax !== null && value > levelMax) setLevelMin(levelMax);
    else if (value > 20) setLevelMin(20);
    else setLevelMin(value);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    fetchReportData();
  };

  const clearResults = () => {
    setCampaigns([]);
    setCharacters([]);
    setNumCampaigns(null);
    setAvgDuration(null);
    setAvgCharCount(null);
    setMeetingDays([]);
    setMeetingFrequencies([]);
    setNumCharacters(null);
    setAvgLevel(null);
    setGenderCounts([]);
    setClassCounts([]);
    setRaceCounts([]);
  };

  const fetchReportData = async () => {
    clearResults();
    let response = null;
    try {
      if (reportType === "campaign") {
        response = await fetch("/api/report/generate_campaign", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            campaignName,
            startDateStart,
            startDateEnd,
            endDateStart,
            endDateEnd,
            meetingDay,
            meetingTimeStart,
            meetingTimeEnd,
            meetingFrequency,
            charCountMin,
            charCountMax,
            searchMode,
          }),
        });
      } else {
        response = await fetch("/api/report/generate_character", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            characterName,
            gender,
            classType,
            race,
            levelMin,
            levelMax,
            searchMode,
          }),
        });
      }
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch report data.");
      }

      if (data.message == "no results") {
        alert("No results found.");
        setCampaigns([]);
        setCharacters([]);
        return;
      }

      if (reportType === "campaign") {
        setCampaigns(data.campaigns);
        setNumCampaigns(data.num_campaigns);
        setAvgDuration(data.avg_duration);
        setAvgCharCount(data.avg_char_count);
        setMeetingDays(data.meeting_days);
        setMeetingFrequencies(data.meeting_frequencies);
      } else {
        setCharacters(data.characters);
        setNumCharacters(data.num_characters);
        setAvgLevel(data.avg_level);
        setGenderCounts(data.gender_counts);
        setClassCounts(data.class_counts);
        setRaceCounts(data.race_counts);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <Container maxWidth="lg">
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 12 }}>
          <form onSubmit={handleSubmit}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 2,
                mb: 2,
              }}
            >
              <Typography variant="h4">Search</Typography>

              <Box display="flex" alignItems="center" gap={2}>
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel id="report-type-label">Type</InputLabel>
                  <Select
                    labelId="report-type-label"
                    value={reportType}
                    label="Type"
                    onChange={(e) =>
                      setReportType(e.target.value as "campaign" | "character")
                    }
                  >
                    <MenuItem value="campaign">Campaign</MenuItem>
                    <MenuItem value="character">Character</MenuItem>
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel id="search-mode-label">Search Mode</InputLabel>
                  <Select
                    labelId="search-mode-label"
                    value={searchMode}
                    label="Search Mode"
                    onChange={(e) =>
                      setSearchMode(e.target.value as "strict" | "lax")
                    }
                  >
                    <MenuItem value="strict">Strict</MenuItem>
                    <MenuItem value="lax">Lax</MenuItem>
                  </Select>
                </FormControl>

                <Button
                  variant="contained"
                  type="button"
                  onClick={() => {
                    clearFilters();
                  }}
                >
                  Clear Filters
                </Button>

                <Button variant="contained" type="submit">
                  Generate Report
                </Button>
              </Box>
            </Box>

            {reportType === "campaign" && (
              <Paper sx={{ flexGrow: 1, padding: 2, marginTop: 2 }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Campaign Name"
                      fullWidth
                      variant="outlined"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      margin="normal"
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      type="number"
                      label="Character Count Min"
                      value={charCountMin ?? ""}
                      onChange={handleCharCountMinChange}
                      fullWidth
                      variant="outlined"
                      margin="normal"
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      type="number"
                      label="Character Count Max"
                      value={charCountMax ?? ""}
                      onChange={handleCharCountMaxChange}
                      fullWidth
                      variant="outlined"
                      margin="normal"
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <Box display="flex" flexDirection="column">
                      <FormControl fullWidth variant="outlined" margin="normal">
                        <DatePicker
                          label="Start Date Start"
                          value={startDateStart}
                          onChange={(date) => setStartDateStart(date)}
                        />
                      </FormControl>
                      <FormControl fullWidth variant="outlined" margin="normal">
                        <DatePicker
                          label="Start Date End"
                          value={startDateEnd}
                          onChange={(date) => setStartDateEnd(date)}
                        />
                      </FormControl>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <Box display="flex" flexDirection="column">
                      <FormControl fullWidth variant="outlined" margin="normal">
                        <DatePicker
                          label="End Date Start"
                          value={endDateStart}
                          onChange={(date) => setEndDateStart(date)}
                        />
                      </FormControl>
                      <FormControl fullWidth variant="outlined" margin="normal">
                        <DatePicker
                          label="End Date End"
                          value={endDateEnd}
                          onChange={(date) => setEndDateEnd(date)}
                        />
                      </FormControl>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <Box display="flex" flexDirection="column">
                      <FormControl fullWidth variant="outlined" margin="normal">
                        <TimeField
                          label="Meeting Time Start"
                          defaultValue={meetingTimeStart}
                          value={meetingTimeStart}
                          onChange={(time) => setMeetingTimeStart(time)}
                        />
                      </FormControl>
                      <FormControl fullWidth variant="outlined" margin="normal">
                        <TimeField
                          label="Meeting Time End"
                          defaultValue={meetingTimeEnd}
                          value={meetingTimeEnd}
                          onChange={(time) => setMeetingTimeEnd(time)}
                        />
                      </FormControl>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControl fullWidth variant="outlined" margin="normal">
                      <Autocomplete
                        multiple
                        disableCloseOnSelect
                        options={frequencies}
                        getOptionLabel={(option) => option}
                        value={meetingFrequency}
                        onChange={(event, newValue) => {
                          setMeetingFrequency(newValue);
                        }}
                        defaultValue={[]}
                        filterSelectedOptions
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Meeting Frequencies"
                            placeholder="Select meeting frequency(ies)"
                          />
                        )}
                      />
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControl fullWidth variant="outlined" margin="normal">
                      <Autocomplete
                        multiple
                        disableCloseOnSelect
                        options={daysOfWeek}
                        getOptionLabel={(option) => option}
                        value={meetingDay}
                        onChange={(event, newValue) => {
                          setMeetingDay(newValue);
                        }}
                        defaultValue={[]}
                        filterSelectedOptions
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Meeting Days"
                            placeholder="Select meeting day(s)"
                          />
                        )}
                      />
                    </FormControl>
                  </Grid>
                </Grid>
              </Paper>
            )}

            {reportType === "character" && (
              <Paper sx={{ flexGrow: 1, padding: 2, marginTop: 2 }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Character Name"
                      fullWidth
                      variant="outlined"
                      value={characterName}
                      onChange={(e) => setCharacterName(e.target.value)}
                      margin="normal"
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      type="number"
                      label="Level Min"
                      fullWidth
                      value={levelMin ?? ""}
                      onChange={handleLevelMinChange}
                      margin="normal"
                      variant="outlined"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      type="number"
                      label="Level Max"
                      fullWidth
                      value={levelMax ?? ""}
                      onChange={handleLevelMaxChange}
                      margin="normal"
                      variant="outlined"
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <Autocomplete
                      multiple
                      disableCloseOnSelect
                      options={["Male", "Female", "Other"]}
                      getOptionLabel={(option) => option}
                      value={gender}
                      onChange={(event, newValue) => setGender(newValue)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Gender"
                          placeholder="Select gender(s)"
                          margin="normal"
                          fullWidth
                        />
                      )}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <Autocomplete
                      multiple
                      disableCloseOnSelect
                      options={classTypes?.map((c) => c.name) || []}
                      getOptionLabel={(option) => option}
                      value={classType}
                      onChange={(event, newValue) => setClassType(newValue)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Class"
                          placeholder="Select class(es)"
                          margin="normal"
                          fullWidth
                        />
                      )}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <Autocomplete
                      multiple
                      disableCloseOnSelect
                      options={races?.map((r) => r.name) || []}
                      getOptionLabel={(option) => option}
                      value={race}
                      onChange={(event, newValue) => setRace(newValue)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Race"
                          placeholder="Select race(s)"
                          margin="normal"
                          fullWidth
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </Paper>
            )}
          </form>
        </Grid>
        {campaigns.length > 0 && (
          <>
            <Grid size={{ xs: 12, md: 12 }}>
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
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {campaigns.map((campaign) => (
                      <TableRow key={String(campaign.id)}>
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
                          {campaign.end_date
                            ? formatDate(campaign.end_date)
                            : "-"}
                        </TableCell>
                        <TableCell align="center">
                          {formatTime(campaign.meeting_time)}
                        </TableCell>
                        <TableCell align="center">
                          {campaign.meeting_day}
                        </TableCell>
                        <TableCell align="center">
                          {campaign.meeting_frequency}
                        </TableCell>
                        <TableCell align="center">
                          {campaign.char_count}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <PieChart
                colors={pieColors}
                series={[
                  {
                    data: Object.entries(meetingDays)
                      .filter(([_, count]) => count > 0)
                      .map(([day, count]) => ({
                        value: count,
                        label: day,
                      })),
                    innerRadius: 30,
                    paddingAngle: 5,
                    cornerRadius: 5,
                  },
                ]}
                width={350}
                height={350}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <PieChart
                colors={pieColors}
                series={[
                  {
                    data: Object.entries(meetingFrequencies)
                      .filter(([_, count]) => count > 0)
                      .map(([frequency, count]) => ({
                        value: count,
                        label: frequency,
                      })),
                    innerRadius: 30,
                    paddingAngle: 5,
                    cornerRadius: 5,
                  },
                ]}
                width={350}
                height={350}
              />
            </Grid>
            <Grid
              size={{ xs: 12, md: 4 }}
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Paper sx={{ padding: 2, width: "100%" }}>
                <Typography variant="body1">
                  Number of Campaigns: {numCampaigns}
                </Typography>
                <Typography variant="body1">
                  Average Duration: {avgDuration?.toFixed(2)} days
                </Typography>
                <Typography variant="body1">
                  Average Character Count: {avgCharCount?.toFixed(2)}
                </Typography>
              </Paper>
            </Grid>
          </>
        )}
        {characters.length > 0 && (
          <>
            <Grid size={{ xs: 12, md: 12 }}>
              <TableContainer component={Paper}>
                <Table sx={{ minWidth: "xs" }} aria-label="character table">
                  <TableHead>
                    <TableRow>
                      <TableCell align="center">Name</TableCell>
                      <TableCell align="center">Gender</TableCell>
                      <TableCell align="center">Race</TableCell>
                      <TableCell align="center">Class</TableCell>
                      <TableCell align="center">Level</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {characters.map((character) => (
                      <TableRow key={String(character.id)}>
                        <TableCell align="center">{character.name}</TableCell>
                        <TableCell align="center">{character.gender}</TableCell>
                        <TableCell align="center">{character.race}</TableCell>
                        <TableCell align="center">
                          {character.classType}
                        </TableCell>
                        <TableCell align="center">{character.level}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <PieChart
                colors={pieColors}
                series={[
                  {
                    data: Object.entries(genderCounts)
                      .filter(([_, count]) => count > 0)
                      .map(([gender, count]) => ({
                        value: count,
                        label: gender,
                      })),
                    innerRadius: 30,
                    paddingAngle: 5,
                    cornerRadius: 5,
                  },
                ]}
                width={350}
                height={350}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <PieChart
                colors={pieColors}
                series={[
                  {
                    data: Object.entries(raceCounts)
                      .filter(([_, count]) => count > 0)
                      .map(([race, count]) => ({
                        value: count,
                        label: race,
                      })),
                    innerRadius: 30,
                    paddingAngle: 5,
                    cornerRadius: 5,
                  },
                ]}
                width={350}
                height={350}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <PieChart
                colors={pieColors}
                series={[
                  {
                    data: Object.entries(classCounts)
                      .filter(([_, count]) => count > 0)
                      .map(([classType, count]) => ({
                        value: count,
                        label: classType,
                      })),
                    innerRadius: 30,
                    paddingAngle: 5,
                    cornerRadius: 5,
                  },
                ]}
                width={350}
                height={350}
              />
            </Grid>
            <Grid
              size={{ xs: 12, md: 3 }}
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Paper sx={{ padding: 2, width: "100%" }}>
                <Typography variant="body1">
                  Number of Characters: {numCharacters}
                </Typography>
                <Typography variant="body1">
                  Average Level: {avgLevel?.toFixed(2)}
                </Typography>
              </Paper>
            </Grid>
          </>
        )}
      </Grid>
    </Container>
  );
};

export default Report;
