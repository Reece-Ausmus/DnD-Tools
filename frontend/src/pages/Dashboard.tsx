import Welcome from "@/components/dashboard/Welcome";
import Characters from "@/components/dashboard/Characters";
import Campaigns from "@/components/dashboard/Campaigns";
import { Box, Grid } from "@mui/material";
import React, { useEffect, useState } from "react";
import Loading from "@/components/shared/Loading";

const Dashboard: React.FC = () => {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("api/user/me", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        const data = await response.json();
        setUserData(data);

        if (!response.ok)
          throw new Error(data.message || "Failed to get user information");
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Welcome userData={userData} />
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Characters />
        </Grid>

        <Grid size={{ xs: 12, md: 12 }}>
          <Campaigns />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
