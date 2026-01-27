import api from "./axios";

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
  const { data } = await api.post(
    endpoint,
    userData,
    {
      // if you need to send cookies:
      withCredentials: true,
    }
  );
  return data;
};
//  Logout User
export const logoutUser = async (): Promise<void> => {

  await api.post("/auth/logout");
  console.log("User logged out successfully.");

};

// Get Username (Cookie-based)
export const getUsername = async (): Promise<string> => {
  const { data } = await api.get("/auth/username");
  return data.name || "Guest";
};
