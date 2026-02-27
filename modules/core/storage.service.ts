import fs from "fs/promises"
import path from "path"
import { randomUUID } from "crypto"

// ---------------------------------------------------------------------------
// Storage Provider Interface
// ---------------------------------------------------------------------------

export interface StorageProvider {
    /** Upload a file and return its storage path (key) */
    upload(file: Buffer, fileName: string, mimeType: string): Promise<string>
    /** Get the local file path or pre-signed URL for a stored file */
    getFilePath(storagePath: string): string
    /** Read a file into a Buffer */
    read(storagePath: string): Promise<Buffer>
    /** Delete a stored file */
    delete(storagePath: string): Promise<void>
}

// ---------------------------------------------------------------------------
// Local Storage Provider — writes to ./uploads/
// ---------------------------------------------------------------------------

const UPLOADS_DIR = path.join(process.cwd(), "uploads")

class LocalStorageProvider implements StorageProvider {
    private async ensureDir(dir: string) {
        await fs.mkdir(dir, { recursive: true })
    }

    async upload(file: Buffer, fileName: string, _mimeType: string): Promise<string> {
        await this.ensureDir(UPLOADS_DIR)

        // Generate unique file name to avoid collisions
        const ext = path.extname(fileName)
        const baseName = path.basename(fileName, ext).replace(/[^a-zA-Z0-9_-]/g, "_")
        const uniqueName = `${baseName}-${randomUUID()}${ext}`
        const filePath = path.join(UPLOADS_DIR, uniqueName)

        await fs.writeFile(filePath, file)
        return uniqueName // storage key — just the filename within uploads/
    }

    getFilePath(storagePath: string): string {
        return path.join(UPLOADS_DIR, storagePath)
    }

    async read(storagePath: string): Promise<Buffer> {
        const filePath = this.getFilePath(storagePath)
        return fs.readFile(filePath)
    }

    async delete(storagePath: string): Promise<void> {
        const filePath = this.getFilePath(storagePath)
        try {
            await fs.unlink(filePath)
        } catch {
            // File may already be deleted
        }
    }
}

// ---------------------------------------------------------------------------
// S3-Compatible Storage Provider (stub — implement when needed)
// ---------------------------------------------------------------------------

class S3StorageProvider implements StorageProvider {
    async upload(_file: Buffer, _fileName: string, _mimeType: string): Promise<string> {
        throw new Error(
            "S3 storage not yet implemented. Install @aws-sdk/client-s3 and configure S3_BUCKET, S3_REGION, S3_ACCESS_KEY, S3_SECRET_KEY env vars."
        )
    }

    getFilePath(_storagePath: string): string {
        throw new Error("S3 storage not yet implemented.")
    }

    async read(_storagePath: string): Promise<Buffer> {
        throw new Error("S3 storage not yet implemented.")
    }

    async delete(_storagePath: string): Promise<void> {
        throw new Error("S3 storage not yet implemented.")
    }
}

// ---------------------------------------------------------------------------
// Factory — select provider based on env var
// ---------------------------------------------------------------------------

let _provider: StorageProvider | null = null

export function getStorageProvider(): StorageProvider {
    if (_provider) return _provider

    const providerType = process.env.STORAGE_PROVIDER || "local"

    switch (providerType) {
        case "s3":
            _provider = new S3StorageProvider()
            break
        case "local":
        default:
            _provider = new LocalStorageProvider()
            break
    }

    return _provider
}
