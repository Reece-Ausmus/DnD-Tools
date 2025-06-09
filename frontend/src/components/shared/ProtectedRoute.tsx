import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import useUser from "@/hooks/useUser";
import Loading from "./Loading";

const ProtectedRoute: React.FC = () => {
  const { isLoggedIn, loading } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoggedIn === false) {
      navigate("/login", {
        replace: true,
        state: { from: location },
      });
    }
  }, [isLoggedIn, navigate, location]);

  if (loading) return <Loading />;

  return <Outlet />;
};

export default ProtectedRoute;
