"use server"

import { signIn, signUp } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const result = await signIn(email, password);

  if (result.success) {
    redirect("/dashboard");
  }

  return { error: result.error || "Invalid credentials" };
}

export async function signupAction(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!name || !email || !password) {
    return { error: "All fields are required" };
  }

  const result = await signUp(name, email, password);

  if (result.success) {
    redirect("/dashboard");
  }

  return { error: result.error || "Failed to create account" };
}

export async function signoutAction() {
  const { deleteSession } = await import("@/lib/auth");
  await deleteSession();
  redirect("/login");
}
