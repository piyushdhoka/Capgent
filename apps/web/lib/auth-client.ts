/**
 * Harmless placeholder for auth-client.ts.
 * Better Auth is disabled in favor of manual auth.
 */
export const authClient = {
  signIn: { email: async () => ({ error: { message: "Auth disabled" } }) },
  signUp: { email: async () => ({ error: { message: "Auth disabled" } }) },
  signOut: async () => {},
  useSession: () => ({ data: null, isPending: false }),
} as any;
