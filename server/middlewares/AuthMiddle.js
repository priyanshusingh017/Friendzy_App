import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    // Try to get token from cookies or Authorization header
    let token = req.cookies?.jwt;
    if (!token && req.headers.authorization) {
        const authHeader = req.headers.authorization;
        if (authHeader.startsWith("Bearer ")) {
            token = authHeader.slice(7);
        }
    }
    if (!token) {
        return res.status(401).json({ error: "Authentication token missing." });
    }

    const secret = process.env.JWT_KEY;
    if (!secret) {
        return res.status(500).json({ error: "JWT secret not configured." });
    }

    jwt.verify(token, secret, (err, payload) => {
        if (err || !payload?.userId) {
            return res.status(403).json({ error: "Invalid or expired token." });
        }
        req.userId = payload.userId;
        req.user = payload; // Attach full payload if needed
        next();
    });
};