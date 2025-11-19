import fs from 'fs';
import { Request, Response } from 'express';
import path from 'path';

export const getSurveyApp = async (req: Request, res: Response) => {
    try {
        const filename = 'pServices.apk';
        const filePath = path.join(process.cwd(), 'files', filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'File not found' });
        }

        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/vnd.android.package-archive');

        res.download(filePath, (err) => {
            if (err) {
                console.error(`[${new Date().toISOString()}]`, err);
                if (!res.headersSent) {
                    res.status(500).json({ message: 'Error downloading file' });
                }
            }
        });
    } catch (err: any) {
        console.error(`[${new Date().toISOString()}]`, err);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Internal server error' });
        }
    }
};
