import { useState, useEffect } from "react";
import { useNavigate, Link as RouterLink, useLocation } from "react-router-dom";
import useUser from "@/hooks/useUser";
import useAuthRedirect from "@/hooks/useAuthRedirect";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Link,
  TextField,
  Typography,
} from "@mui/material";
import Loading from "@/components/shared/Loading";

const LogIn: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { setUser, isLoggedIn } = useUser();
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const loading = useAuthRedirect();

  useEffect(() => {
    if (!loading && isLoggedIn) {
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    }
  }, [isLoggedIn, loading, location, navigate]);

  if (loading) return <Loading />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      setUser(email, password);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box mt={4}>
        <Typography variant="h4" gutterBottom>
          Log In
        </Typography>

        {error && <Alert severity="error">{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            margin="normal"
          />

          <TextField
            label="Password"
            type="password"
            fullWidth
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            margin="normal"
          />

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
          >
            Log In
          </Button>

          <Typography variant="body1" mt={4}>
            Don't have an account?{" "}
            <Link component={RouterLink} to="/signup">
              Sign Up
            </Link>
          </Typography>
        </form>
      </Box>
    </Container>
  );
};

export default LogIn;
