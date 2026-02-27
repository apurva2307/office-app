import { DefaultSession, DefaultUser } from "next-auth"
import { DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
    interface User extends DefaultUser {
        globalRole?: string
    }

    interface Session {
        user: {
            id: string
            role: string
            moduleAccess: { moduleKey: string; accessLevel: string }[]
        } & DefaultSession["user"]
    }
}

declare module "next-auth/jwt" {
    interface JWT extends DefaultJWT {
        role?: string
        moduleAccess?: { moduleKey: string; accessLevel: string }[]
    }
}
