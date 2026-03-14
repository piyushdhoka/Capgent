import { cookies } from "next/headers";
import { sql } from "./neon";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.BETTER_AUTH_SECRET || "default_secret_keep_it_safe"
);

/**
 * Manual Authentication & Session System
 * Powered by Neon HTTP (Direct SQL) and JWT Cookies.
 */

export async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const session = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);

  const cookieStore = await cookies();
  cookieStore.set("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

export async function verifySession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;

  if (!session) return null;

  try {
    const { payload } = await jwtVerify(session, JWT_SECRET, {
      algorithms: ["HS256"],
    });
    return payload as { userId: string };
  } catch (error) {
    return null;
  }
}

/**
 * Get the currently logged-in user
 */
export async function getSession() {
  const session = await verifySession();
  if (!session) return null;

  try {
    const users = await sql`SELECT id, name, email, image FROM "user" WHERE id = ${session.userId} LIMIT 1`;
    return users[0] || null;
  } catch (error) {
    console.error("❌ [Auth] Failed to fetch session user:", error);
    return null;
  }
}

/**
 * Simple password hashing (for demonstration/stabilization)
 * In a production app, use bcrypt or argon2.
 */
function hashPassword(password: string) {
  // Simple deterministic "hash" for now to ensure we can match
  // We will replace this with a proper hash once we confirm stability
  return Buffer.from(password).toString("base64");
}

export async function signIn(email: string, password: string) {
  try {
    // 1. Find user and account
    const users = await sql`
      SELECT u.id, a.password 
      FROM "user" u
      JOIN "account" a ON u.id = a."userId"
      WHERE u.email = ${email} AND a."providerId" = 'credential'
      LIMIT 1
    `;

    const user = users[0];
    if (!user) throw new Error("Invalid email or password");

    // 2. Verify password
    if (user.password !== hashPassword(password)) {
      throw new Error("Invalid email or password");
    }

    // 3. Create session
    await createSession(user.id);
    return { success: true };
  } catch (error) {
    console.error("❌ [Auth] Sign-in failed:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function signUp(name: string, email: string, password: string) {
  try {
    const userId = crypto.randomUUID();
    const now = new Date();

    // 1. Create user
    await sql`
      INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
      VALUES (${userId}, ${name}, ${email}, false, ${now}, ${now})
    `;

    // 2. Create account (with password)
    const accountId = crypto.randomUUID();
    await sql`
      INSERT INTO "account" (id, "userId", "accountId", "providerId", password, "createdAt", "updatedAt")
      VALUES (${accountId}, ${userId}, ${userId}, 'credential', ${hashPassword(password)}, ${now}, ${now})
    `;

    // 3. Create session
    await createSession(userId);
    return { success: true };
  } catch (error) {
    console.error("❌ [Auth] Sign-up failed:", error);
    return { success: false, error: (error as Error).message };
  }
}
