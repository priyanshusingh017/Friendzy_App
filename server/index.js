import express from "express";
import dotenv from "dotenv";
import cors from "cors";

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const app = express();
const PORT = process.env.PORT || 8747;
const DATABASE_URL = process.env.DATABASE_URL;

// Allow multiple origins (production + all Vercel preview URLs)
const allowedOrigins = [
  process.env.ORIGIN,
  'https://friendzy-app.vercel.app',
  /https:\/\/friendzy-.*\.vercel\.app$/  // Matches all Vercel preview URLs
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // Allow requests with no origin (mobile apps, curl)
      
      const isAllowed = allowedOrigins.some(allowed => {
        if (typeof allowed === 'string') return allowed === origin;
        if (allowed instanceof RegExp) return allowed.test(origin);
        return false;
      });
      
      if (isAllowed) {
        callback(null, true);
      } else {
        console.log('CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);

app.use("/uploads/profiles", express.static(path.join(__dirname, "uploads/profiles")));
app.use("/uploads/files", express.static(path.join(__dirname, "uploads/files")));

app.use(cookieParser());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/contacts", contactsRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/channel", channelRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

console.log("Attempting connection with:", DATABASE_URL?.replace(/\/\/[^:]+:[^@]+@/, "//*****:*****@"));

mongoose
  .connect(DATABASE_URL)
  .then(() => {
    console.log("DB Connection Successful");
    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server is running on port ${PORT}`);
    });
    setupSocket(server);
  })
  .catch((err) => console.log("DB Connection Error:", err.message));