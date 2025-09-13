import mongoose from "mongoose";
import User from "../models/userModel.js";
import Message from "../models/MessagesModel.js";

/**
 * SearchContacts controller
 * Searches for contacts by name or email, excluding the current user
 */
export const SearchContacts = async (request, response, next) => {
    try {
        const { searchTerm } = request.body;
        if (!searchTerm) {
            return response.status(400).json({ error: "searchTerm is required." });
        }

        // Sanitize search term for regex
        const sanitizedsearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(sanitizedsearchTerm, "i");

        // Find contacts excluding the current user
        const contacts = await User.find({
            _id: { $ne: request.userId },
            $or: [
                { firstName: regex },
                { lastName: regex },
                { email: regex }
            ]
        });

        return response.status(200).json({ contacts });
    } catch (error) {
        console.error("SearchContacts error:", error);
        return response.status(500).json({ error: "Internal Server Error" });
    }
};

export const getContactsForDMList = async (request, response, next) => {
    try {
        let { userId } = request;
        userId = new mongoose.Types.ObjectId(userId);

        const contacts = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { sender: userId },
                        { recipient: userId }
                    ],
                },
            },
            { $sort: { timestamp: -1 } },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ["$sender", userId] }, "$recipient", "$sender"
                        ],
                    },
                    lastMessageTime: { $first: "$timestamp" },
                    lastMessage: { $first: "$content" },
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "contactInfo",
                },
            },
            { $unwind: "$contactInfo" },
            {
                $project: {
                    _id: 1,
                    lastMessageTime: 1,
                    lastMessage: 1,
                    email: "$contactInfo.email",
                    firstName: "$contactInfo.firstName",
                    lastName: "$contactInfo.lastName",
                    image: "$contactInfo.image",
                    color: "$contactInfo.color",
                },
            },
            { $sort: { lastMessageTime: -1 } },
        ]);

        return response.status(200).json({ contacts });
    } catch (error) {
        console.error("getContactsForDMList error:", error);
        return response.status(500).json({ error: "Internal Server Error" });
    }
};

export const getAllContacts = async (request, response, next) => {
    try {
        // Find all users except the current user, select only needed fields
        const users = await User.find(
            { _id: { $ne: request.userId } },
            "firstName lastName _id email image color"
        );

        // Map users to a simplified contact object
        const contacts = users.map(user => ({
            label: user.firstName
                ? `${user.firstName} ${user.lastName ? user.lastName : ""}`.trim()
                : user.email,
            _id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            image: user.image,
            color: user.color,
        }));

        return response.status(200).json({ contacts });
    } catch (error) {
        console.error("getAllContacts error:", error);
        return response.status(500).json({ error: "Internal Server Error" });
    }
};