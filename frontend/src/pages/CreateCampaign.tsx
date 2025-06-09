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
import { useNavigate } from "react-router-dom";
import { DatePicker, TimeField, TimePicker } from "@mui/x-date-pickers";
import dayjs, { Dayjs } from "dayjs";

const CreateCampaign: React.FC = () => {
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Clear any previous messages
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const formattedStartDate = startDate
        ? startDate.format("YYYY-MM-DD")
        : null;
      const formattedEndDate = endDate ? endDate.format("YYYY-MM-DD") : null;
      const formattedMeetingTime = meetingTime
        ? meetingTime.format("HH:mm")
        : null;

      const response = await fetch("api/campaign/create_campaign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name,
          description,
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          meetingTime: formattedMeetingTime,
          meetingDay,
          meetingFrequency,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create campaign.");
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
        error.data?.error || "An error occurred while creating the campaign."
      );
    }
  };

  return (
    <Container maxWidth="md">
      <Box mt={4}>
        <Typography variant="h4" gutterBottom>
          Create a Campaign
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
            Create Campaign
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

export default CreateCampaign;
