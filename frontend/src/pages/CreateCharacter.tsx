import React, { useState } from "react";
import useCharacters from "@/hooks/useCharacters";
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
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const CreateCharacter: React.FC = () => {
  const navigate = useNavigate();
  const { races, fetchRaces, classTypes, fetchClasses } = useCharacters();
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [race, setRace] = useState("");
  const [classType, setClassType] = useState("");
  const [level, setLevel] = useState<number>(1);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  React.useEffect(() => {
    fetchRaces();
    fetchClasses();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Clear any previous messages
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("api/character/create_character", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name, gender, race, classType, level }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create character.");
      }

      setSuccessMessage(data.message);

      setName("");
      setRace("");
      setClassType("");
      setLevel(1);

      navigate("/dashboard");
    } catch (error: any) {
      setErrorMessage(
        error.data?.error || "An error occurred while creating the character."
      );
    }
  };

  return (
    <Container maxWidth="sm">
      <Box mt={4}>
        <Typography variant="h4" gutterBottom>
          Create a Character
        </Typography>

        {successMessage && <Alert severity="success">{successMessage}</Alert>}
        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

        <form onSubmit={handleSubmit}>
          <TextField
            label="Character Name"
            fullWidth
            variant="outlined"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            margin="normal"
          />

          <FormControl fullWidth variant="outlined" required margin="normal">
            <InputLabel>Gender</InputLabel>
            <Select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              label="Gender"
              required
            >
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Female">Female</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth variant="outlined" required margin="normal">
            <InputLabel>Race</InputLabel>
            <Select
              value={race}
              onChange={(e) => setRace(e.target.value)}
              label="Race"
              required
            >
              {races &&
                races.map((raceOption) => (
                  <MenuItem key={raceOption.id} value={raceOption.id}>
                    {raceOption.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          <FormControl fullWidth variant="outlined" required margin="normal">
            <InputLabel>Class</InputLabel>
            <Select
              value={classType}
              onChange={(e) => setClassType(e.target.value)}
              label="Class"
              required
            >
              {classTypes &&
                classTypes.map((classOption) => (
                  <MenuItem key={classOption.id} value={classOption.id}>
                    {classOption.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          <TextField
            label="Level"
            type="number"
            fullWidth
            variant="outlined"
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
            required
            margin="normal"
            slotProps={{
              htmlInput: { min: 1 },
            }}
          />

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
          >
            Create Character
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

export default CreateCharacter;
