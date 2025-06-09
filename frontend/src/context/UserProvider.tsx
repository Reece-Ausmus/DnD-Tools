import React, { useState, ReactNode } from "react";
import UserContext from "./UserContext";

const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [username, setUsername] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const res = await fetch("api/user/auth/status", {
          credentials: "include",
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to authenticate!");
        }
        if (data.isLoggedIn) {
          setUsername(data.username);
          setIsLoggedIn(true);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  const setUser = async (email: string, password: string) => {
    const res = await fetch("api/user/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });

    if (res.ok) {
      const data = await res.json();
      setUsername(data.username);
      setIsLoggedIn(true);
    }
  };

  const logout = async () => {
    await fetch("api/user/logout", { method: "POST", credentials: "include" });
    setUsername("");
    setIsLoggedIn(false);
  };

  return (
    <UserContext.Provider
      value={{ username, isLoggedIn, loading, setUser, logout }}
    >
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;
