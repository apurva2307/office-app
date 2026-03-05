"use server"

import { signIn } from "@/modules/core/auth"
import { AuthError } from "next-auth"
import { redirect } from "next/navigation"
import { verifyTurnstileToken } from "@/modules/core/turnstile.service"

export async function loginAction(email: string, password: string, turnstileToken: string) {
    try {
        const tokenVerification = await verifyTurnstileToken(turnstileToken);
        if (!tokenVerification.success) {
            return { success: false, error: tokenVerification.error };
        }

        await signIn("credentials", {
            email,
            password,
            redirectTo: "/dashboard",
        })
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return { success: false, error: "Invalid email or password" }
                default:
                    return { success: false, error: "Something went wrong" }
            }
        }
        // Auth.js v5 throws NEXT_REDIRECT on success — re-throw it
        throw error
    }
}
