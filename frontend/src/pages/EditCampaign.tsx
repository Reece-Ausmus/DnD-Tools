import React, { useState } from "react";
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  Alert,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  FormLabel,
  FormControlLabel,
  Radio,
  RadioGroup,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { DatePicker, TimeField, TimePicker } from "@mui/x-date-pickers";
import dayjs, { Dayjs } from "dayjs";

const EditCampaign: React.FC = () => {
  const location = useLocation();
  const queryParam = new URLSearchParams(location.search);
  const id = queryParam.get("id");
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs());
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [meetingTime, setMeetingTime] = useState<Dayjs | null>(dayjs());
  const [meetingDay, setMeetingDay] = useState(dayjs().format("dddd"));
  const [meetingFrequency, setMeetingFrequency] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  React.useEffect(() => {
    if (id) fetchCampaign();
  }, [id]);

  const fetchCampaign = async () => {
    try {
      if (!id) {
        setErrorMessage("Campaign ID is missing.");
        return;
      }
      const response = await fetch(
        `/api/campaign/get_campaign/${encodeURIComponent(id)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to get campaign information.");
      }

      setName(data.campaign.name);
      setDescription(data.campaign.description);
      setStartDate(dayjs(data.campaign.start_date));
      setEndDate(data.campaign.end_date ? dayjs(data.campaign.end_date) : null);
      setMeetingTime(dayjs(data.campaign.meeting_time, "HH:mm"));
      setMeetingDay(data.campaign.meeting_day);
      setMeetingFrequency(data.campaign.meeting_frequency);
    } catch (error: any) {
      setErrorMessage(
        error.data?.error || "An error occurred while fetching the campaign."
      );
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Clear any previous messages
    setErrorMessage("");
    setSuccessMessage("");

    try {
      if (!id) {
        setErrorMessage("Campaign ID is missing.");
        return;
      }
      const formattedStartDate = startDate
        ? startDate.format("YYYY-MM-DD")
        : null;
      const formattedEndDate = endDate ? endDate.format("YYYY-MM-DD") : null;
      const formattedMeetingTime = meetingTime
        ? meetingTime.format("HH:mm")
        : null;

      const response = await fetch(
        `/api/campaign/edit_campaign/${encodeURIComponent(id)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            id,
            name,
            description,
            startDate: formattedStartDate,
            endDate: formattedEndDate,
            meetingTime: formattedMeetingTime,
            meetingDay,
            meetingFrequency,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to edit campaign.");
      }

      setSuccessMessage(data.message);

      setName("");
      setDescription("");
      setStartDate(null);
      setEndDate(null);
      setMeetingTime(null);
      setMeetingDay("");
      setMeetingFrequency("");

      navigate("/dashboard");
    } catch (error: any) {
      setErrorMessage(
        error.data?.error || "An error occurred while editing the campaign."
      );
    }
  };

  return (
    <Container maxWidth="md">
      <Box mt={4}>
        <Typography variant="h4" gutterBottom>
          Edit Campaign
        </Typography>

        {successMessage && <Alert severity="success">{successMessage}</Alert>}
        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

        <form onSubmit={handleSubmit}>
          <TextField
            label="Campaign Name"
            fullWidth
            variant="outlined"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            margin="normal"
          />

          <TextField
            label="Description"
            fullWidth
            multiline
            maxRows={4}
            variant="outlined"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            margin="normal"
          />

          <FormControl fullWidth variant="outlined" required margin="normal">
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={(date) => setStartDate(date)}
            />
          </FormControl>

          <FormControl fullWidth variant="outlined" margin="normal">
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={(date) => setEndDate(date)}
            />
          </FormControl>

          <FormControl fullWidth variant="outlined" required margin="normal">
            <TimeField
              label="Meeting Time"
              defaultValue={meetingTime}
              value={meetingTime}
              onChange={(time) => setMeetingTime(time)}
            />
          </FormControl>

          <FormControl>
            <FormLabel>Meeting Day</FormLabel>
            <RadioGroup
              row
              value={meetingDay}
              onChange={(e) => setMeetingDay(e.target.value)}
              defaultValue={meetingDay}
            >
              <FormControlLabel
                value="Sunday"
                control={<Radio />}
                label="Sunday"
              />
              <FormControlLabel
                value="Monday"
                control={<Radio />}
                label="Monday"
              />
              <FormControlLabel
                value="Tuesday"
                control={<Radio />}
                label="Tuesday"
              />
              <FormControlLabel
                value="Wednesday"
                control={<Radio />}
                label="Wednesday"
              />
              <FormControlLabel
                value="Thursday"
                control={<Radio />}
                label="Thursday"
              />
              <FormControlLabel
                value="Friday"
                control={<Radio />}
                label="Friday"
              />
              <FormControlLabel
                value="Saturday"
                control={<Radio />}
                label="Saturday"
              />
            </RadioGroup>
          </FormControl>

          <FormControl fullWidth variant="outlined" required margin="normal">
            <InputLabel>Meeting Frequency</InputLabel>
            <Select
              value={meetingFrequency}
              onChange={(e) => setMeetingFrequency(e.target.value)}
              label="Meeting Frequency"
              required
            >
              <MenuItem value="Weekly">Weekly</MenuItem>
              <MenuItem value="Bi-Weekly">Bi-Weekly</MenuItem>
              <MenuItem value="Monthly">Monthly</MenuItem>
              <MenuItem value="One-Shot">One-Shot</MenuItem>
            </Select>
          </FormControl>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
          >
            Edit Campaign
          </Button>
          <Button
            variant="contained"
            color="error"
            fullWidth
            sx={{ mt: 2 }}
            onClick={() => navigate("/dashboard")}
          >
            Cancel
          </Button>
        </form>
      </Box>
    </Container>
  );
};

export default EditCampaign;
