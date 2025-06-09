import React from "react";
import { Box, Container, Typography } from "@mui/material";

const Map: React.FC = () => {
  return (
    <Container>
      <Typography variant="h1" align="center" sx={{ marginTop: "20px" }}>
        Map Page
      </Typography>
      <Box
        component="img"
        src="../images/hehe.jpeg"
        sx={{
          width: "300px",
          height: "auto",
        }}
      />
    </Container>
  );
};

export default Map;
