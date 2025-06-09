import { useNavigate } from "react-router-dom";
import { Button, ButtonGroup, Container, Typography } from "@mui/material";

const Home = () => {
  const navigate = useNavigate();

  return (
    <Container>
      <Typography variant="h1">Home</Typography>
      <Typography variant="body1">Welcome to the Home page!</Typography>
      <Typography variant="body1">Please log in to continue.</Typography>
      <ButtonGroup
        variant="text"
        aria-label="contained primary button group"
        color="secondary"
      >
        <Button color="primary" onClick={() => navigate("/login")}>
          Log In
        </Button>
        <Button color="primary" onClick={() => navigate("/signup")}>
          Sign Up
        </Button>
      </ButtonGroup>
    </Container>
  );
};

export default Home;
