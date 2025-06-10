import React from "react";
import { Box, Container, Typography, Grid } from "@mui/material";

const GRID_SIZE = 10; // Adjust this value as needed

const Map: React.FC = () => {
  return (
    <Container>
      <Typography variant="h1" align="center" sx={{ marginTop: "20px" }}>
        Map Page
      </Typography>

      {[...Array(GRID_SIZE)].map((_, rowIndex) => (
        <Grid
          container
          key={rowIndex}
          spacing={1}
          justifyContent="center"
          wrap="nowrap"
          sx={{ marginTop: 1 }}
        >
          {[...Array(GRID_SIZE)].map((_: unknown, colIndex: number) => (
            <Grid key={colIndex}>
              <Box
                sx={{
                  width: 50,
                  height: 50,
                  border: "1px solid black",
                  backgroundColor: "#f0f0f0",
                }}
              />
            </Grid>
          ))}
        </Grid>
      ))}
    </Container>
  );
};

export default Map;
