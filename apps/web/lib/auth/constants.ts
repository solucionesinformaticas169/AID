export const ACCESS_TOKEN_COOKIE = "aid_access_token";
export const REFRESH_TOKEN_COOKIE = "aid_refresh_token";

export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: true,
  path: "/",
};
