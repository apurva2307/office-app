import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/modules/core/auth"
import { checkModuleAccess } from "@/modules/users/actions"
import { getStorageProvider } from "@/modules/core/storage.service"
import prisma from "@/lib/prisma"
import { AccessLevel } from "@prisma/client"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_MIME_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
]

export async function POST(request: NextRequest) {
    try {
        // Auth check
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Module access check
        const hasAccess = await checkModuleAccess("application", AccessLevel.WRITE)
        if (!hasAccess) {
            return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
        }

        const formData = await request.formData()
        const file = formData.get("file") as File | null
        const applicationId = formData.get("applicationId") as string | null

        if (!file || !applicationId) {
            return NextResponse.json({ error: "File and applicationId are required" }, { status: 400 })
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 })
        }

        // Validate mime type
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            return NextResponse.json({ error: "File type not allowed" }, { status: 400 })
        }

        // Verify that the application exists
        const application = await prisma.application.findUnique({
            where: { id: applicationId },
        })

        if (!application) {
            return NextResponse.json({ error: "Application not found" }, { status: 404 })
        }

        // Upload file
        const storage = getStorageProvider()
        const buffer = Buffer.from(await file.arrayBuffer())
        const storagePath = await storage.upload(buffer, file.name, file.type)

        // Create attachment record
        const attachment = await prisma.attachment.create({
            data: {
                fileName: file.name,
                filePath: storagePath,
                fileSize: file.size,
                mimeType: file.type,
                applicationId,
                uploadedById: session.user.id,
            },
        })

        return NextResponse.json({
            success: true,
            attachment: {
                id: attachment.id,
                fileName: attachment.fileName,
                fileSize: attachment.fileSize,
                mimeType: attachment.mimeType,
            },
        })
    } catch (error) {
        console.error("Upload error:", error)
        return NextResponse.json({ error: "Upload failed" }, { status: 500 })
    }
}
