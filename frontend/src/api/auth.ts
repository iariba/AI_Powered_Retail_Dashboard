import api from "./axios";
import {connectSocket} from "../socket"
import { disconnectSocket } from "../socket";
export interface AuthResponse {
  user?: {
    _id?: string;
    name?: string;
    email?: string;
  };
}

interface LoginData {
  email: string;
  password: string;
}

interface SignupData extends LoginData {
  name: string;
  confirmPassword: string;
}

// Authenticate User (Login/Register)
export const authenticateUser = async (
  isLogin: boolean,
  userData: LoginData | SignupData
): Promise<AuthResponse> => {
  const endpoint = isLogin ? "/auth/login" : "/auth/register";
  console.log(`Attempting to ${isLogin ? "login" : "register"} with:`, userData);
  const { data } = await api.post(
    endpoint,
    userData,
    {
   
      withCredentials: true,
    }
  );
  console.log("Authentication response:", data);
const rawToken = data.token;
if (!rawToken) {
  console.error("Login did not return token!");
  return data;
}
const token = rawToken.startsWith("Bearer ")
  ? rawToken.split(" ")[1]
  : rawToken;
localStorage.setItem("token", token);

  if (token) {
    console.log("token:", token);
    localStorage.setItem("token", token);

    // Connect socket AFTER login
    const socket = connectSocket(token);

    // Listen for stock updates
    socket.on("stock-update", (payload) => {
      console.log("Stock update received:", payload);

      // Optional: trigger refetch of insights
      window.dispatchEvent(new Event("inventory-updated"));
    });
  }
  return data;
};
//  Logout User
export const logoutUser = async (): Promise<void> => {

  await api.post("/auth/logout");
  localStorage.removeItem("token");

  //  Disconnect socket on logout
  disconnectSocket(); 
  console.log("User logged out successfully.");

};

export const getUsername = async (): Promise<string> => {
  const { data } = await api.get("/auth/username");
  return data.name || "Guest";
};
