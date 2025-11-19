
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { randomBytes } from "crypto";

function generateRandomString(length = 16) {
    return randomBytes(length).toString("hex");
}

export async function docUploaderLocal(doc: Buffer, folder = "uploads/docs"): Promise<string> {
    const MAX_WIDTH = 4000;
    const MAX_HEIGHT = 4000;
    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

    let quality = 90;

    // Resize + compress
    let resizedBuffer = await sharp(doc)
        .resize({ width: MAX_WIDTH, height: MAX_HEIGHT, fit: "inside" })
        .jpeg({ quality })
        .toBuffer();

    // Keep reducing quality until size < 2MB
    while (resizedBuffer.length > MAX_FILE_SIZE && quality >= 50) {
        quality -= 10;
        resizedBuffer = await sharp(doc)
            .resize({ width: MAX_WIDTH, height: MAX_HEIGHT, fit: "inside" })
            .jpeg({ quality })
            .toBuffer();
    }

    if (resizedBuffer.length > MAX_FILE_SIZE) {
        throw new Error("Resized image still exceeds 2MB limit");
    }

    // Ensure folder exists
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
    }

    // Create file name and path
    const fileName = `${generateRandomString()}.jpg`;
    const filePath = path.join(folder, fileName);

    // Save file locally
    await fs.promises.writeFile(filePath, resizedBuffer);

    // Return file path relative to project root
    return filePath;
}