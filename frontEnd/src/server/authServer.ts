import * as superagent from "superagent";
import * as http from "./http";
import { ServerUrl } from "../config";
import { notifyLoggedOut } from "./authEvents";

export interface AuthStatusResponse {
  accountExists: boolean;
}

export interface AuthUserResponse {
  username: string;
}

export const getAuthStatusReq = async (): Promise<AuthStatusResponse> => {
  const res = await superagent.get(`${ServerUrl}/auth/status`);
  return res.body;
};

export const getMeReq = async (): Promise<AuthUserResponse> => {
  const res = await superagent.get(`${ServerUrl}/auth/me`);
  return res.body;
};

export const registerReq = async (
  username: string,
  password: string
): Promise<AuthUserResponse> => {
  const res = await superagent
    .post(`${ServerUrl}/auth/register`)
    .send({ username, password });
  return res.body;
};

export const loginReq = async (
  username: string,
  password: string
): Promise<AuthUserResponse> => {
  const res = await superagent
    .post(`${ServerUrl}/auth/login`)
    .send({ username, password });
  return res.body;
};

export const logoutReq = async (): Promise<void> => {
  try {
    await http.post(`${ServerUrl}/auth/logout`);
  } catch (error) {
    // an already-expired session still lands the user on the login page
    if ((error as any)?.status !== 401) {
      throw error;
    }
  } finally {
    notifyLoggedOut();
  }
};

export const changePasswordReq = async (
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  await http
    .post(`${ServerUrl}/auth/changePassword`)
    .send({ currentPassword, newPassword });
};
