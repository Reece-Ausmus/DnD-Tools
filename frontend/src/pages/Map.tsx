import React from "react";
import { Box, Container, Typography, Grid } from "@mui/material";
import { InfiniteCanvasComponent } from "@/components/shared/InfiniteCanvasComponent";

const CELL_SIZE = 50;

const Map: React.FC = () => {
  return (
    <Container>
      <Typography variant="h1" align="center" sx={{ marginTop: "20px" }}>
        Map Page
      </Typography>

      <Box
        sx={{
          width: "800px", // Or any fixed or responsive width
          height: "600px", // Adjust height as needed
          border: "1px solid gray", // Optional, for visual clarity
          overflow: "hidden", // Prevent scrolling inside the box
          margin: "auto", // Center horizontally
          marginTop: "20px", // Spacing below the title
        }}
      >
        <InfiniteCanvasComponent cellSize={CELL_SIZE} />
      </Box>
    </Container>
  );
};

export default Map;
