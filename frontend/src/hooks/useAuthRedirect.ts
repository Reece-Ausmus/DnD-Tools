import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useUser from "@/hooks/useUser";

const useAuthRedirect = (defaultRedirect: string = "/dashboard") => {
  const { isLoggedIn, loading } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && isLoggedIn) {
      const from = location.state?.from?.pathname || defaultRedirect;
      navigate(from, { replace: true });
    }
  }, [loading, isLoggedIn, navigate, location, defaultRedirect]);

  return loading;
};

export default useAuthRedirect;
