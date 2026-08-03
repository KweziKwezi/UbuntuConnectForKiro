// Central API client for the UbuntuConnect ASP.NET Core backend.
//
// Base URL comes from VITE_API_URL (see .env). Defaults to the backend's
// default `dotnet run` HTTP profile (http://localhost:5275) from
// Properties/launchSettings.json.
//
// The backend must have CORS enabled for whatever origin the Vite dev
// server runs on (see Program.cs — a policy named "Frontend" has been
// added there for http://localhost:5173).

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || "http://localhost:5275/api";

const TOKEN_KEY = "uc_token";
const USER_KEY = "uc_user";

export interface StoredUser {
  userId: number;
  userType: "Individual" | "NPO" | "Business" | "Admin" | string;
  email: string;
  isVerified: boolean;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): StoredUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export function setSession(token: string, user: StoredUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  // 204 No Content — several endpoints (update/delete) return this
  if (res.status === 204) {
    return undefined as T;
  }

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : await res.text().catch(() => "");

  if (!res.ok) {
    const message =
      (isJson && body && (body.message || body.title)) ||
      (typeof body === "string" && body) ||
      `Request failed (${res.status})`;
    throw new ApiError(res.status, message);
  }

  return body as T;
}

const get = <T = unknown>(path: string) => request<T>(path, { method: "GET" });
const post = <T = unknown>(path: string, data?: unknown) =>
  request<T>(path, { method: "POST", body: data !== undefined ? JSON.stringify(data) : undefined });
const put = <T = unknown>(path: string, data?: unknown) =>
  request<T>(path, { method: "PUT", body: data !== undefined ? JSON.stringify(data) : undefined });
const del = <T = unknown>(path: string) => request<T>(path, { method: "DELETE" });

// ── Auth ────────────────────────────────────────────────────────────
export const authApi = {
  register: (dto: Record<string, unknown>) => post<{ message: string; userId: number; userType: string }>("/Auth/register", dto),
  login: (dto: { userEmail: string; password: string }) =>
    post<{ message: string; token: string; userId: number; userType: string; email: string; isVerified: boolean }>(
      "/Auth/login",
      dto
    ),
};

// ── Individual ──────────────────────────────────────────────────────
export const individualApi = {
  discoverNpos: () =>
    get<
      { npoId: number; organizationName: string; focusArea: string | null; mission: string | null; location: string | null; isVerified: boolean }[]
    >("/individual/discover-NPOs"),
  follow: (npoId: number) => post(`/individual/follow/${npoId}`),
  unfollow: (npoId: number) => del(`/individual/unfollow/${npoId}`),
  getNpoProfile: (npoId: number) => get(`/individual/npo/${npoId}`),
  applyVolunteer: (opportunityId: number, dto: Record<string, unknown>) =>
    post<{ message: string; applicationId: number }>(`/individual/volunteer/apply/${opportunityId}`, dto),
  getMyProfile: () => get("/individual/me"),
  updateMyProfile: (dto: Record<string, unknown>) => put("/individual/me", dto),
  getMyDonations: () => get<{ totalDonated: number; count: number; donations: unknown[] }>("/individual/my-donations"),
  getMyVolunteering: () => get<unknown[]>("/individual/my-volunteering"),
  getMyImpact: () =>
    get<{ totalDonated: number; totalHoursVolunteered: number; npoFollowing: number; volunteerRolesCompleted: number }>(
      "/individual/my-impact"
    ),
  getCommunityUpdates: () => get<unknown[]>("/individual/community-updates"),
  donate: (npoId: number, amount: number) =>
    post<{ message: string; transactionId: number; newBalance: number }>(`/individual/donate/${npoId}`, { amount }),
  getVolunteerApplication: (applicationId: number) => get(`/individual/volunteer/application/${applicationId}`),
  cancelVolunteerApplication: (applicationId: number) => del(`/individual/volunteer/application/${applicationId}`),
  changePassword: (dto: { currentPassword: string; newPassword: string }) => put("/individual/change-password", dto),
  deactivate: (password: string) => put("/individual/deactivate", { password }),
};

// ── NPO ─────────────────────────────────────────────────────────────
export const npoApi = {
  getAll: () => get<{ npoId: number; userId: number; nporegNum: string; organizationName: string; npofocusArea: string | null; npomission: string | null }[]>(
    "/npo"
  ),
  getById: (id: number) => get(`/npo/${id}`),
  getByUserId: (userId: number) => get(`/npo/user/${userId}`),
  getMyProfile: () => get("/npo/me"),
  updateMyProfile: (dto: Record<string, unknown>) => put("/npo/me", dto),
};

// ── Business ────────────────────────────────────────────────────────
export const businessApi = {
  getAll: () => get<{ businessId: number; userId: number; businessRegNum: string; industry: string | null; contactPersonName: string | null; contactPersonTitle: string | null; businessEmail: string | null; csrGoal: string | null }[]>(
    "/business"
  ),
  getById: (id: number) => get(`/business/${id}`),
  getByUserId: (userId: number) => get(`/business/user/${userId}`),
  getMyProfile: () => get("/business/me"),
  updateMyProfile: (dto: Record<string, unknown>) => put("/business/me", dto),
};

// ── Campaigns (Business partnership campaigns) ─────────────────────
export const campaignApi = {
  getAll: () => get<{ campaignId: number; businessId: number; title: string; description: string | null; category: string | null; budgetPerPartner: number | null }[]>(
    "/campaigns"
  ),
  getById: (id: number) => get(`/campaigns/${id}`),
  create: (dto: Record<string, unknown>) => post("/campaigns", dto),
  update: (id: number, dto: Record<string, unknown>) => put(`/campaigns/${id}`, dto),
  remove: (id: number) => del(`/campaigns/${id}`),
};

export const campaignApplicationApi = {
  apply: (campaignId: number, motivation?: string) =>
    post<{ message: string; applicationId: number }>(`/campaignapplications/apply/${campaignId}`, { motivation }),
  getByCampaign: (campaignId: number) => get(`/campaignapplications/campaign/${campaignId}`),
  approve: (id: number) => put(`/campaignapplications/${id}/approve`),
  reject: (id: number) => put(`/campaignapplications/${id}/reject`),
};

// ── Volunteer Opportunities ─────────────────────────────────────────
export const volunteerOpportunityApi = {
  getAll: () => get<
    { opportunityId: number; npoId: number; roleTitle: string; category: string | null; numOfPositions: number; description: string | null; skillsRequired: string | null; timeCommitment: string | null; duration: string | null; mediaUrl: string | null }[]
  >("/VolunteerOpportunity"),
  getById: (id: number) => get(`/VolunteerOpportunity/${id}`),
  getByNpo: (npoId: number) => get(`/VolunteerOpportunity/npo/${npoId}`),
  create: (dto: Record<string, unknown>) => post("/VolunteerOpportunity", dto),
  update: (id: number, dto: Record<string, unknown>) => put(`/VolunteerOpportunity/${id}`, dto),
  remove: (id: number) => del(`/VolunteerOpportunity/${id}`),
};

export const volunteerApplicationApi = {
  getAll: () => get<unknown[]>("/VolunteerApplication"),
  getByOpportunity: (opportunityId: number) => get<unknown[]>(`/VolunteerApplication/opportunity/${opportunityId}`),
  getByUser: (userId: number) => get<unknown[]>(`/VolunteerApplication/user/${userId}`),
  accept: (id: number) => put(`/VolunteerApplication/${id}/accept`),
  reject: (id: number) => put(`/VolunteerApplication/${id}/reject`),
  pending: (id: number) => put(`/VolunteerApplication/${id}/pending`),
};

// ── Posts / Feed ─────────────────────────────────────────────────────
export const postApi = {
  getAll: () => get<unknown[]>("/post"),
  getById: (id: number) => get(`/post/${id}`),
  getByUserId: (userId: number) => get<unknown[]>(`/post/user/${userId}`),
  create: (dto: { userId: number; postTitle: string; content?: string; mediaUrl?: string }) => post("/post", dto),
  update: (id: number, dto: { postTitle: string; content?: string; activityStatus?: string }) => put(`/post/${id}`, dto),
  remove: (id: number) => del(`/post/${id}`),
};

export const feedApi = {
  communityUpdates: () => get<unknown[]>("/feed/community-updates"),
};

// ── Wallet / Transactions ───────────────────────────────────────────
export const walletApi = {
  getBalance: (userId: number) => get<{ walletId: number; userId: number; balance: number }>(`/wallet/user/${userId}/balance`),
  deposit: (amount: number) => post<{ message: string; transactionId: number; newBalance: number }>("/wallet/deposit", { amount }),
};

export const transactionApi = {
  getByUser: (userId: number) => get<unknown[]>(`/transaction/user/${userId}`),
  getById: (id: number) => get(`/transaction/${id}`),
  withdraw: (userId: number, amount: number) =>
    post<{ transactionId: number; newBalance?: number }>("/transaction/withdraw", { userId, amount }),
};

// ── Reports (Admin / NPO) ───────────────────────────────────────────
export const reportApi = {
  donations: (params: { start?: string; end?: string; npoId?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.start) qs.set("start", params.start);
    if (params.end) qs.set("end", params.end);
    if (params.npoId) qs.set("npoId", String(params.npoId));
    const query = qs.toString();
    return get<{ totalDonated: number; count: number; transactions: unknown[] }>(`/reports/donations${query ? `?${query}` : ""}`);
  },
};

// ── Admin ────────────────────────────────────────────────────────────
export const adminApi = {
  getUsers: () => get<{ userId: number; email: string; userType: string; isActive: boolean; isVerified: boolean }[]>("/admin/users"),
  getUser: (id: number) => get(`/admin/users/${id}`),
  activateUser: (id: number) => put(`/admin/users/${id}/activate`),
  deactivateUser: (id: number) => put(`/admin/users/${id}/deactivate`),
  getVerifications: (status?: string) => get<unknown[]>(`/admin/verifications${status ? `?status=${status}` : ""}`),
  approveVerification: (id: number) => put(`/admin/verifications/${id}/approve`),
  rejectVerification: (id: number) => put(`/admin/verifications/${id}/reject`),
  getTransactions: (userId?: number) => get<unknown[]>(`/admin/transactions${userId ? `?userId=${userId}` : ""}`),
};
