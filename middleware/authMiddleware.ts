import { config } from 'dotenv'
import type { Request, Response, NextFunction } from "express"
import jwt, { type JwtPayload } from "jsonwebtoken"

config()

const SECRET_KEY = process.env.JWT_SECRET

export interface AuthenticatedRequest extends Request {
    user?: string | JwtPayload
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "Authorization token missing or malformed" })
        return
    }

    const token = authHeader.split(" ")[1]
    try {
        if (!SECRET_KEY) {
            throw new Error("JWT secret key is not defined")
        }

        const decoded = jwt.verify(token, SECRET_KEY)
        req.user = decoded
        next()
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            res.status(401).json({ error: "Token has expired" })
            return
        }

        if (err instanceof jwt.JsonWebTokenError) {
            res.status(401).json({ error: "Invalid token" })
            return
        }

        res.status(500).json({ error: "Internal server error" })
    }
}
