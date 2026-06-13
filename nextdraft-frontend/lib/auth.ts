export type Plan = "freemium" | "pro" | "expert";
export type UserStatus = "active" | "banned";
export type UserRole = "user" | "admin";

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
    paymentId?: string;
    adminAction?: boolean;
    createdAt?: string;
  }>;
  plan: Plan;
  planExpiresAt?: string | null;
  role?: UserRole;
  status?: UserStatus;
  profileImage?: {
    url: string;
    public_id: string;
  };
  token?: string;
  createdAt?: string;
}

const TOKEN_KEY = "token";
const USER_KEY = "user";

export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(TOKEN_KEY);
  return token && token.trim() ? token : null;
};

export const getUser = (): User | null => {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    const parsed = JSON.parse(userStr) as User;
    if (!parsed?._id || !parsed?.email) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const setUser = (user: User) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const setAuth = (user: User, token: string) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  const { token: _ignore, ...rest } = user;
  localStorage.setItem(USER_KEY, JSON.stringify(rest));
};

export const logout = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.location.href = "/auth/login";
};

export const isAuthenticated = (): boolean =>
  Boolean(getAuthToken() && getUser());

export const isAdmin = (user?: User | null): boolean => {
  const u = user ?? getUser();
  return u?.role === "admin";
};
