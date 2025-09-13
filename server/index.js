import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import authRoutes from "./routes/AuthRoutes.js";
import contactRoutes from "./routes/ContactRoutes.js";
import channelRoutes from "./routes/ChannelRoutes.js";
import setupSocket from "./socket.js";
import http from "http";
import messageRoutes from "./routes/MessageRoutes.js";
import path from 'path';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const databaseURL = process.env.DATABASE_URL;

app.use(cors({
    origin: process.env.ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
}));

app.use("/uploads/profiles", express.static("uploads/profiles"));
app.use("/uploads/files" , express.static("uploads/files"));
app.use("/uploads/channels", express.static("uploads/channels"));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use(cookieParser());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/contacts" , contactRoutes);
app.use("/api/channels" , channelRoutes);
app.use("/api/message" , messageRoutes);


// Health check route
app.get('/', (req, res) => {
    res.send('Chat Application API is running');
});

// Check for required environment variables
if (!databaseURL) {
    console.error('DATABASE_URL is not set in environment variables.');
    process.exit(1);
}

// Connect to MongoDB and start server only after successful connection
mongoose.connect(databaseURL)
    .then(() => {
        console.log("DB Connection Successful");

        // Create HTTP server and attach Socket.IO
        const server = http.createServer(app);
        setupSocket(server);

        server.listen(port, (err) => {
            if (err) {
                console.error("Server failed to start:", err);
            } else {
                console.log(`Server is running at http://localhost:${port}`);
            }
        });
    })
    .catch((err) => {
        console.error("DB Connection Error:", err.message);
        process.exit(1);
    });