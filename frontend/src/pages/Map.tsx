import React, { useState, useEffect } from "react";
import { Box, Container, Typography, Grid, Button } from "@mui/material";
import InfiniteCanvas from "@/components/shared/InfiniteCanvas";

const drawButtonOptions = [
  { id: "place-marker", label: "Place Marker" },
  { id: "draw-lines", label: "Draw Line" },
  { id: "draw-box", label: "Draw box" },
] as const;

const Map: React.FC = () => {
  // ActiveIndex holds the index of currently selecting drawing button
  const [activeDrawButtonIndex, setActiveDrawButtonIndex] = useState<
    number | null
  >(null);

  // handle pressing the drawing buttons
  const handleDrawButtonClick = (indexToActivate: number) => {
    setActiveDrawButtonIndex((prevIndex) =>
      prevIndex === indexToActivate ? null : indexToActivate
    );
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        // Unselect drawing button on escape press
        setActiveDrawButtonIndex(null);
      }
    };

    // Add event listener to the whole document.
    document.addEventListener("keydown", handleKeyDown);

    // Return cleanup function to remove the listener when the component unmounts.
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []); // An empty dependency array ensures this effect runs only once on mount and cleans up on unmount.

  const activeDrawButton =
    activeDrawButtonIndex !== null
      ? drawButtonOptions[activeDrawButtonIndex].id
      : null;

  return (
    <Container>
      <Typography variant="h1" align="center" sx={{ marginTop: "20px" }}>
        Map Page
      </Typography>
      <Container
        sx={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "0px" }}
      >
        {/* Left column */}
        <Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column", // Stacks buttons vertically
              alignItems: "flex-start",
              gap: 2, // Adds space between buttons
              padding: 4,
            }}
          >
            {/* Map over the `drawButtonOptions` data array */}
            {drawButtonOptions.map((option, index) => (
              <Button
                key={option.id}
                variant="contained"
                // set button color based on activeDrawButton array
                color={activeDrawButtonIndex === index ? "primary" : "inherit"}
                onClick={() => handleDrawButtonClick(index)}
              >
                {option.label} {/* Use the unique label from our data */}
              </Button>
            ))}
            <div>Current Mode: {activeDrawButton || "None"}</div>
          </Box>
        </Box>
        {/* Right column */}
        <Box
          sx={{
            width: "800px",
            height: "800px",
            border: "1px solid gray",
            overflow: "hidden",
            margin: "auto",
            marginTop: "20px",
          }}
        >
          <InfiniteCanvas activeDrawButton={activeDrawButton} />
        </Box>
      </Container>
    </Container>
  );
};

export default Map;
