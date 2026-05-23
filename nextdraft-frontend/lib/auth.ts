export type Plan = "freemium" | "pro" | "expert";

export interface User {
  _id: string;
  name: string;
  email: string;
  pointsBalance?: number;
  pointsLedger?: Array<{
    type: "credit" | "debit";
    points: number;
    rupees?: number;
    reason?: string;
    createdAt?: string;
  }>;
  plan: Plan;
  planExpiresAt?: string | null;
  profileImage?: {
    url: string;
    public_id: string;
  };
  token?: string;
}


export const getAuthToken = (): string | null => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    return token && token.trim() ? token : null;
  }
  return null;
};

export const getUser = (): User | null => {
  if (typeof window !== "undefined") {
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    try {
      const parsed = JSON.parse(userStr) as User;
      if (!parsed?._id || !parsed?.email) return null;
      return parsed;
    } catch {
      return null;
    }
  }
  return null;
};

export const logout = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  }
};

export const isAuthenticated = (): boolean => {
  return !!getAuthToken() && !!getUser();
};
