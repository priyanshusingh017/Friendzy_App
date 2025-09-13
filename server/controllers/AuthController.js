import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const maxAge = 10 * 24 * 60 * 60; // 3 days in seconds

const createToken = (email, userId) => {
    return jwt.sign({ email, userId }, process.env.JWT_KEY, { expiresIn: maxAge });
};

export const signup = async (request, response, next) => {
    try {
        const { email, password } = request.body;
        if (!email || !password) {
            return response.status(400).json({ error: "Email and Password are required." });
        }
        const user = await User.create({ email, password });
        response.cookie("jwt", createToken(email, user.id), {
            maxAge: maxAge * 1000,
            secure: true,
            httpOnly: true,
            sameSite: "None",
        });
        return response.status(201).json({
            user: {
                id: user.id,
                email: user.email,
                profileSetup: user.profileSetup,
            },
        });
    } catch (error) {
        console.error(error);
        return response.status(500).json({ error: "Internal Server Error" });
    }
};

export const login = async (request, response, next) => {
    try {
        const { email, password } = request.body;
        if (!email || !password) {
            return response.status(400).json({ error: "Email and Password are required." });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return response.status(401).json({ error: "Invalid email or password." });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return response.status(401).json({ error: "Invalid email or password." });
        }
        response.cookie("jwt", createToken(user.email, user.id), {
            maxAge: maxAge * 1000,
            secure: true,
            httpOnly: true,
            sameSite: "None",
        });
        return response.status(200).json({
            user: {
                id: user.id,
                email: user.email,
                profileSetup: user.profileSetup,
                firstName: user.firstName,
                lastName: user.lastName,
                image: user.image,
                color: user.color,
            },
        });
    } catch (error) {
        console.error(error);
        return response.status(500).json({ error: "Internal Server Error" });
    }
};

export const getUserInfo = async (request, response, next) => {
    try {
        const userId = request.userId;
        if (!userId) {
            return response.status(400).json({ error: "User ID is required." });
        }
        const user = await User.findById(userId);
        if (!user) {
            return response.status(404).json({ error: "User not found." });
        }
        return response.status(200).json({
            user: {
                id: user.id,
                email: user.email,
                profileSetup: user.profileSetup,
                firstName: user.firstName,
                lastName: user.lastName,
                image: user.image,
                color: user.color,
            },
        });
    } catch (error) {
        console.error(error);
        return response.status(500).json({ error: "Internal Server Error" });
    }
};

export const updateProfile = async (request, response, next) => {
    try {
        const { userId } = request;
        const { firstName, lastName, color } = request.body;
        if (!firstName || !lastName || color === undefined || color === null || isNaN(color) || color < 0) {
            return response.status(400).json({ error: "Firstname, lastname, and color are required." });
        }

        const userData = await User.findByIdAndUpdate(userId, {
            firstName, lastName, color, profileSetup: true
        }, { new: true, runValidators: true });

        return response.status(200).json({
            id: userData.id,
            email: userData.email,
            profileSetup: userData.profileSetup,
            firstName: userData.firstName,
            lastName: userData.lastName,
            image: userData.image,
            color: userData.color,
        });
    } catch (error) {
        console.error(error);
        return response.status(500).json({ error: "Internal Server Error" });
    }
};

export const addProfileImage = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });
        if (!req.file) return res.status(400).json({ error: "No image provided" });

        // Only allow image file types
        const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/jpg"];
        if (!allowedTypes.includes(req.file.mimetype)) {
            return res.status(400).json({ error: "Only image files (jpg, jpeg, png, gif, webp) are allowed." });
        }

        // Save image path
        const imageUrl = `/uploads/profiles/${req.file.filename}`;
        const user = await User.findByIdAndUpdate(userId, { image: imageUrl }, { new: true });
        if (!user) return res.status(404).json({ error: "User not found" });
        return res.status(200).json({ image: user.image });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Error uploading image" });
    }
};

export const removeProfileImage = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        // Remove image reference from user
        const user = await User.findByIdAndUpdate(userId, { image: "" }, { new: true });
        if (!user) return res.status(404).json({ error: "User not found" });
        return res.status(200).json({ image: user.image });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Error removing image" });
    }
};

// Logout: clear JWT cookie and respond
export const logout = async (request, response, next) => {
    try {
        response.clearCookie("jwt", {
            httpOnly: true,
            secure: true,
            sameSite: "None",
        });
        return response.status(200).json({ message: "Logout successful." });
    } catch (error) {
        console.error(error);
        return response.status(500).json({ error: "Internal Server Error" });
    }
};