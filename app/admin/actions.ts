"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyPassword } from "../lib/password";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "../lib/session";

export type LoginFormState = { error?: string };

export async function loginAction(
  _prevState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const username = formData.get("username");
  const password = formData.get("password");

  const expectedUsername = process.env.ADMIN_USERNAME;

  if (typeof username !== "string" || typeof password !== "string" || !expectedUsername) {
    return { error: "Invalid username or password." };
  }

  let passwordOk = false;
  try {
    passwordOk = username === expectedUsername && verifyPassword(password);
  } catch {
    return { error: "Admin login isn't configured yet. Set ADMIN_USERNAME / ADMIN_PASSWORD_HASH." };
  }

  if (!passwordOk) {
    return { error: "Invalid username or password." };
  }

  const token = await createSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  redirect("/admin");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/admin/login");
}
