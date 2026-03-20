import Link from "next/link"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import { verifyEmailVerificationToken } from "@/lib/email-verification"
import { createSession } from "@/lib/auth"

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const sp = await searchParams
  const token = sp.token ? String(sp.token) : null

  if (!token) {
    redirect("/login?verify=missing")
  }

  const result = await verifyEmailVerificationToken(token)
  if (!result.ok) {
    // Failed/expired token.
    redirect("/login?verify=invalid")
  }

  // Verified: immediately create session and send user to the dashboard.
  if (!result.userId) {
    redirect("/login?verify=invalid")
  }

  await createSession(result.userId)
  redirect("/dashboard")

  // Unreachable, but keeps TS happy.
  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Verifying…</CardTitle>
          <CardDescription>Please wait.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/login">Go to login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

