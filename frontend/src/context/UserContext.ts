import { createContext } from "react";

interface UserContextType {
  username: string;
  isLoggedIn: boolean;
  loading: boolean;
  setUser: (email: string, password: string) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export default UserContext;
