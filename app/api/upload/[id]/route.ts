import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/modules/core/auth"
import { getStorageProvider } from "@/modules/core/storage.service"
import prisma from "@/lib/prisma"

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Auth check
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params

        // Find the attachment
        const attachment = await prisma.attachment.findUnique({
            where: { id },
        })

        if (!attachment) {
            return NextResponse.json({ error: "Attachment not found" }, { status: 404 })
        }

        // Read file from storage
        const storage = getStorageProvider()
        const fileBuffer = await storage.read(attachment.filePath)

        // Return file with proper headers
        return new NextResponse(new Uint8Array(fileBuffer), {
            headers: {
                "Content-Type": attachment.mimeType,
                "Content-Disposition": `inline; filename="${attachment.fileName}"`,
                "Content-Length": String(attachment.fileSize),
            },
        })
    } catch (error) {
        console.error("Download error:", error)
        return NextResponse.json({ error: "Download failed" }, { status: 500 })
    }
}
