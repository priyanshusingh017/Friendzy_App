import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import { compare } from "bcrypt";
import { uploadToGridFS, deleteFromGridFS } from "../config/gridfs.js";
import { generateFilename, processImage } from "../middlewares/uploadMiddleware.js"; // ✅ Import processImage

const maxAge = 3 * 24 * 60 * 60 * 1000;

const createToken = (email, userId) => {
  return jwt.sign({ email, userId }, process.env.JWT_KEY, {
    expiresIn: maxAge,
  });
};

export const signup = async (request, response, next) => {
  try {
    const { email, password } = request.body;
    if (!email || !password) {
      return response.status(400).send("Email and Password is required");
    }
    const user = await User.create({ email, password });
    response.cookie("jwt", createToken(email, user.id), {
      maxAge,
      secure: true,
      sameSite: "None",
      httpOnly: true,
    });

    return response.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        profileSetup: user.profileSetup,
      },
    });
  } catch (error) {
    console.log({ error });
    return response.status(500).send("Internal Server Error");
  }
};

export const login = async (request, response, next) => {
  try {
    console.log("📝 Login attempt:", {
      email: request.body.email,
      hasPassword: !!request.body.password,
      origin: request.headers.origin,
    });

    const { email, password } = request.body;
    if (!email || !password) {
      return response.status(400).send("Email and Password is required");
    }
    const user = await User.findOne({ email });
    if (!user) {
      return response.status(404).send("User not found.");
    }
    const auth = await compare(password, user.password);
    if (!auth) {
      return response.status(400).send("Password is incorrect.");
    }
    response.cookie("jwt", createToken(email, user.id), {
      maxAge,
      secure: true,
      sameSite: "None",
      httpOnly: true,
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
    console.error("❌ Login error:", error);
    return response.status(500).send("Internal Server Error");
  }
};

export const getUserInfo = async (request, response, next) => {
  try {
    const userData = await User.findById(request.userId);
    if (!userData) {
      return response.status(404).send("User not found.");
    }

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
    console.log({ error });
    return response.status(500).send("Internal Server Error");
  }
};

export const updateProfile = async (request, response, next) => {
  try {
    const { userId } = request;
    const { firstName, lastName, color } = request.body;

    if (!firstName || !lastName) {
      return response
        .status(400)
        .send("Firstname, lastname, and color is required.");
    }

    const userData = await User.findByIdAndUpdate(
      userId,
      {
        firstName,
        lastName,
        color,
        profileSetup: true,
      },
      { new: true, runValidators: true }
    );

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
    console.log({ error });
    return response.status(500).send("Internal Server Error");
  }
};

export const addProfileImage = async (request, response, next) => {
  try {
    if (!request.file) {
      return response.status(400).send("File is required.");
    }

    const userId = request.userId;
    const user = await User.findById(userId);

    // Delete old profile image from GridFS if exists
    if (user.image) {
      try {
        await deleteFromGridFS(user.image);
        console.log("✅ Old profile image deleted");
      } catch (error) {
        console.log("⚠️ Error deleting old image:", error.message);
      }
    }

    // ✅ Process image to fix orientation
    const processedBuffer = await processImage(request.file.buffer, request.file.mimetype);

    // Generate unique filename
    const filename = generateFilename(request.file.originalname);

    // Create plain metadata object
    const plainMetadata = {
      userId: String(userId),
      uploadDate: new Date().toISOString(),
      contentType: "image/jpeg", // ✅ Sharp converts to JPEG
      fileType: "profile-image",
    };

    console.log("📝 Uploading profile image:", filename);

    // Upload processed image to GridFS
    await uploadToGridFS(filename, processedBuffer, plainMetadata);

    console.log("✅ Profile image uploaded to GridFS:", filename);

    // Update user with new image filename
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { image: filename },
      { new: true, runValidators: true }
    );

    return response.status(200).json({
      image: updatedUser.image,
    });
  } catch (error) {
    console.log("❌ Error in addProfileImage:", error);
    return response.status(500).send("Internal Server Error");
  }
};

export const removeProfileImage = async (request, response, next) => {
  try {
    const { userId } = request;
    const user = await User.findById(userId);

    if (!user) {
      return response.status(404).send("User not found.");
    }

    if (user.image) {
      try {
        await deleteFromGridFS(user.image);
        console.log("✅ Profile image deleted from GridFS");
      } catch (error) {
        console.log("⚠️ Error deleting image:", error.message);
      }
    }

    user.image = null;
    await user.save();

    return response.status(200).send("Profile image removed successfully.");
  } catch (error) {
    console.log({ error });
    return response.status(500).send("Internal Server Error");
  }
};

export const logout = async (request, response, next) => {
  try {
    response.cookie("jwt", "", {
      maxAge: 1,
      secure: true,
      sameSite: "None",
      httpOnly: true,
    });
    return response.status(200).send("Logout successful.");
  } catch (error) {
    console.log({ error });
    return response.status(500).send("Internal Server Error");
  }
};