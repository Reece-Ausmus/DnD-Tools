import React, { useEffect } from "react";
import useCharacters from "@/hooks/useCharacters";
import {
  Box,
  Button,
  ButtonGroup,
  Container,
  Paper,
  Skeleton,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const Characters: React.FC = () => {
  const navigate = useNavigate();
  const { characters, fetchCharacters, charactersLoading } = useCharacters();

  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    fetchCharacters();
  }, []);

  const handleDelete = async (id: string) => {
    await fetch(`/api/character/delete_character/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ id }),
    });

    fetchCharacters();
  };

  return (
    <Paper sx={{ padding: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="h4">My Characters</Typography>
        <Button
          variant="contained"
          onClick={() => navigate("/createcharacter")}
        >
          Create Character
        </Button>
      </Box>

      {charactersLoading ? (
        <Skeleton variant="rounded" width={210} height={60} />
      ) : error ? (
        <Container>
          <Typography color="error">{error}</Typography>
        </Container>
      ) : (
        <Container maxWidth="lg">
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: "xs" }} aria-label="character table">
              <TableHead>
                <TableRow>
                  <TableCell align="center">Name</TableCell>
                  <TableCell align="center">Gender</TableCell>
                  <TableCell align="center">Race</TableCell>
                  <TableCell align="center">Class</TableCell>
                  <TableCell align="center">Level</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {characters.map((character) => (
                  <TableRow key={character.id}>
                    <TableCell align="center">{character.name}</TableCell>
                    <TableCell align="center">{character.gender}</TableCell>
                    <TableCell align="center">{character.race}</TableCell>
                    <TableCell align="center">{character.classType}</TableCell>
                    <TableCell align="center">{character.level}</TableCell>
                    <TableCell align="center">
                      <ButtonGroup variant="text" color="secondary">
                        <Button
                          color="success"
                          onClick={() =>
                            navigate(`/editcharacter/?id=${character.id}`)
                          }
                        >
                          Edit
                        </Button>
                        <Button
                          color="error"
                          onClick={() => handleDelete(character.id)}
                        >
                          Delete
                        </Button>
                      </ButtonGroup>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Container>
      )}
    </Paper>
  );
};

export default Characters;
