import api from "./axios";
import type { AuthResponse, User } from "../types";

export const authApi = {
  register: async (data: {
    full_name: string;
    email: string;
    username: string;
    password: string;
  }): Promise<AuthResponse> => {
    const res = await api.post("/auth/register", data);
    return res.data;
  },

  login: async (identifier: string, password: string): Promise<AuthResponse> => {
    const res = await api.post("/auth/login", { identifier, password });
    return res.data;
  },

  googleLogin: async (credential: string): Promise<AuthResponse> => {
    const res = await api.post("/auth/google", { credential });
    return res.data;
  },

  getMe: async (): Promise<User> => {
    const res = await api.get("/auth/me");
    return res.data;
  },
};

export const teamsApi = {
  list: async () => (await api.get("/teams")).data,
  myTeams: async () => (await api.get("/teams/my")).data,
  get: async (id: string) => (await api.get(`/teams/${id}`)).data,
  create: async (data: { name: string; description?: string; project_id?: string }) =>
    (await api.post("/teams", data)).data,
  update: async (id: string, data: { name?: string; description?: string; project_id?: string }) =>
    (await api.put(`/teams/${id}`, data)).data,
  delete: async (id: string) => (await api.delete(`/teams/${id}`)).data,
  addMember: async (teamId: string, userId: string, role: string) =>
    (await api.post(`/teams/${teamId}/members`, { user_id: userId, role_in_team: role })).data,
  removeMember: async (teamId: string, userId: string) =>
    (await api.delete(`/teams/${teamId}/members/${userId}`)).data,
};

export const projectsApi = {
  list: async () => (await api.get("/projects")).data,
  myTeamProjects: async () => (await api.get("/projects/my-team")).data,
  listForTeam: async (teamId: string) => (await api.get(`/projects/team/${teamId}`)).data,
  get: async (id: string) => (await api.get(`/projects/${id}`)).data,
  create: async (data: object) => (await api.post("/projects", data)).data,
  update: async (id: string, data: object) => (await api.put(`/projects/${id}`, data)).data,
  delete: async (id: string) => (await api.delete(`/projects/${id}`)),
  uploadRequirements: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return (await api.post(`/projects/${id}/upload-requirements`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })).data;
  },
  analyzeProject: async (id: string) =>
    (await api.post(`/projects/${id}/analyze`)).data,
};

export const employeesApi = {
  list: async () => (await api.get("/employees")).data,
  get: async (id: string) => (await api.get(`/employees/${id}`)).data,
  invite: async (data: object) => (await api.post("/employees/invite", data)).data,
  deactivate: async (id: string) => (await api.patch(`/employees/${id}/deactivate`)).data,
  delete: async (id: string) => (await api.delete(`/employees/${id}`)),
  resetPassword: async (id: string, new_password: string) =>
    (await api.post(`/employees/${id}/reset-password`, { new_password })).data,
};

export const meetingsApi = {
  myMeetings: async () => (await api.get("/meetings/my")).data,
  allMeetings: async () => (await api.get("/meetings/all")).data,
  teamMeetings: async (teamId: string) => (await api.get(`/meetings/team/${teamId}`)).data,
  get: async (id: string) => (await api.get(`/meetings/${id}`)).data,
  upload: async (formData: FormData) =>
    (await api.post("/meetings", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })).data,
  delete: async (id: string) => (await api.delete(`/meetings/${id}`)),
};

export const aiApi = {
  triggerProcessing: async (meetingId: string) =>
    (await api.post(`/ai/process/${meetingId}`)).data,
  getStatus: async (meetingId: string) => (await api.get(`/ai/status/${meetingId}`)).data,
  health: async () => (await api.get("/ai/health")).data,
  chat: async (payload: { question: string; project_id?: string; team_id?: string }) =>
    (await api.post("/ai/chat", payload)).data,
};

export const analyticsApi = {
  teamAnalytics: async (teamId: string) => (await api.get(`/analytics/team/${teamId}`)).data,
  meetingsAnalytics: async (teamId: string) => (await api.get(`/analytics/meetings/${teamId}`)).data,
  meetingDetail: async (meetingId: string) =>
    (await api.get(`/analytics/meeting/${meetingId}/detail`)).data,
};
