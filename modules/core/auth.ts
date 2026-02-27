import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
    trustHost: true,
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials)

                if (!parsedCredentials.success) {
                    console.log("[AUTH] Credential parsing failed:", parsedCredentials.error.flatten())
                    return null
                }

                const { email, password } = parsedCredentials.data
                console.log("[AUTH] Attempting login for:", email)

                const user = await prisma.user.findUnique({ where: { email } })
                if (!user) {
                    console.log("[AUTH] User not found:", email)
                    return null
                }

                console.log("[AUTH] User found:", user.email, "Role:", user.globalRole)
                const passwordsMatch = await bcrypt.compare(password, user.passwordHash)
                console.log("[AUTH] Password match:", passwordsMatch)

                if (passwordsMatch) {
                    return { id: user.id, name: user.fullName, email: user.email, globalRole: user.globalRole }
                }

                console.log("[AUTH] Invalid password for:", email)
                return null
            },
        }),
    ],
    callbacks: {
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub
                session.user.role = token.role as string
                session.user.moduleAccess = token.moduleAccess as { moduleKey: string; accessLevel: string }[] || []

                // Fetch fresh name from DB so sidebar updates after profile change
                const dbUser = await prisma.user.findUnique({
                    where: { id: token.sub },
                    select: { fullName: true, globalRole: true }
                })
                if (dbUser) {
                    session.user.name = dbUser.fullName
                    session.user.role = dbUser.globalRole
                }
            }
            return session
        },
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as any).globalRole
                // Fetch module access from DB on login
                const access = await prisma.moduleAccess.findMany({
                    where: { userId: user.id! },
                    select: { moduleKey: true, accessLevel: true }
                })
                token.moduleAccess = access
            }
            return token
        }
    },
    pages: {
        signIn: '/login',
    }
})

