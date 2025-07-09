import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import useUser from "@/hooks/useUser";
import useAuthRedirect from "@/hooks/useAuthRedirect";
import {
  Container,
  Box,
  Typography,
  Alert,
  TextField,
  Link,
  Button,
} from "@mui/material";
import Loading from "@/components/shared/Loading";

const SignUp = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { setUser } = useUser();
  const loading = useAuthRedirect();
  const [error, setError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setErrorMessage("");

    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }

    try {
      const response = await fetch("/api/user/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
          first: firstName,
          last: lastName,
          username,
        }),
      });

      const data = await response.json();

      if (data.emailTaken) {
        setError("emailTaken");
        setErrorMessage("An account with this email already exists.");
        return;
      }
      if (data.usernameTaken) {
        setError("usernameTaken");
        setErrorMessage("This username is already taken.");
        return;
      }

      if (!response.ok) throw new Error(data.message || "Sign-up failed");

      setUser(email, password);
      setError("");
      setErrorMessage("");

      navigate("/dashboard");
    } catch (err: any) {
      setError("error");
      setErrorMessage(err.message);
    }
  };

  if (loading) return <Loading />;

  return (
    <Container maxWidth="sm">
      <Box mt={4}>
        <Typography variant="h4" gutterBottom>
          Sign Up
        </Typography>

        {error &&
          (error === "emailTaken" || error === "usernameTaken" ? (
            <Alert severity="error">
              {errorMessage}{" "}
              <Link component={RouterLink} to="/login">
                Log In
              </Link>
            </Alert>
          ) : (
            <Alert severity="error">{errorMessage}</Alert>
          ))}

        <form onSubmit={handleSubmit}>
          <Box display="flex" flexDirection="row" gap={2}>
            <TextField
              label="First Name"
              type="text"
              fullWidth
              variant="outlined"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              margin="normal"
            />

            <TextField
              label="Last Name"
              type="text"
              fullWidth
              variant="outlined"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              margin="normal"
            />
          </Box>

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
            label="Username"
            type="text"
            fullWidth
            variant="outlined"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
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

          <TextField
            label="Confirm Password"
            type="password"
            fullWidth
            variant="outlined"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
            Sign Up
          </Button>
        </form>
      </Box>
    </Container>
  );
};

export default SignUp;
