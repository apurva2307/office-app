"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Mail } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // In a real app, this would send a reset email
    // For now, we show a message directing them to contact an admin
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setSubmitted(true);
    setLoading(false);
  }

  if (submitted) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="w-full max-w-sm space-y-4">
          <h1 className="text-center text-xl font-bold text-gray-800">Sr. DFM Office App</h1>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="h-6 w-6 text-blue-500" />
                <CardTitle className="text-xl">Check with Admin</CardTitle>
              </div>
              <CardDescription>
                If an account exists for <strong>{email}</strong>, a Super Admin
                will be notified. Please contact your system administrator to
                receive a temporary password.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button className="w-full" variant="outline" asChild>
                <Link href="/login">Back to Login</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-center text-xl font-bold text-gray-800">Sr. DFM Office App</h1>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Forgot Password</CardTitle>
            <CardDescription>
              Enter your email address and we&apos;ll help you reset your
              password.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 mt-4">
              <Button className="w-full" type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Request Password Reset
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Remember your password?{" "}
                <Link href="/login" className="text-blue-600 hover:underline">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
