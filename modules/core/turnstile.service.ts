"use server";

export async function verifyTurnstileToken(token: string) {
    const secret = process.env.TURNSTILE_SECRET_KEY;

    if (!secret) {
        console.warn("Turnstile secret key is not set. Assuming development mode, bypassing captcha.");
        return { success: true };
    }

    if (!token) {
        return { success: false, error: "Captcha token is required." };
    }

    const formData = new FormData();
    formData.append("secret", secret);
    formData.append("response", token);

    try {
        const url = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
        const result = await fetch(url, {
            body: formData,
            method: "POST",
        });

        const outcome = await result.json();
        return { success: outcome.success, error: outcome.success ? undefined : "Captcha verification failed. Please try again." };
    } catch (error) {
        console.error("Error verifying turnstile token:", error);
        return { success: false, error: "Failed to verify captcha." };
    }
}
