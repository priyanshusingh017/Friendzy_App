import jwt from 'jsonwebtoken';

export const verifyToken = (request, response, next) => {
    // Try to get token from cookies or Authorization header
    let token = request.cookies?.jwt;
    if (!token && request.headers.authorization) {
        const authHeader = request.headers.authorization;
        if (authHeader.startsWith("Bearer ")) {
            token = authHeader.slice(7);
        }
    }
    if (!token) {
        return response.status(401).json({ error: "Authentication token missing." });
    }

    const secret = process.env.JWT_KEY;
    if (!secret) {
        return response.status(500).json({ error: "JWT secret not configured." });
    }

    jwt.verify(token, secret, (err, payload) => {
        if (err || !payload?.userId) {
            return response.status(403).json({ error: "Invalid or expired token." });
        }
        request.userId = payload.userId;
        request.user = payload; // Attach full payload if needed
        next();
    });
};