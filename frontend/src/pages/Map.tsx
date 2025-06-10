import React from "react";
import { Box, Container, Typography, Grid } from "@mui/material";
import InfiniteCanvas from "@/components/shared/InfiniteCanvas";

const CELL_SIZE = 50;

const Map: React.FC = () => {
  return (
    <Container>
      <Typography variant="h1" align="center" sx={{ marginTop: "20px" }}>
        Map Page
      </Typography>

      <Box
        sx={{
          width: "800px",
          height: "600px",
          border: "1px solid gray",
          overflow: "hidden",
          margin: "auto",
          marginTop: "20px",
        }}
      >
        <InfiniteCanvas />
      </Box>
    </Container>
  );
};

export default Map;
