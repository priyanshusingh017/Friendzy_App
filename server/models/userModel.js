import { genSalt, hash } from "bcrypt";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "Email is Required."],
        unique: true,
    },
    password: {
        type: String,
        required: [true, "Password is Required."],
    },
    firstName: {
        type: String,
        required: false
    },
    lastName: {
        type: String,
        required: false
    },
    image: {
        type: String,
        required: false
    },
    color: {
        type: Number,
        required: false
    },
    profileSetup: {
        type: Boolean,
        default: false,
    }
});

userSchema.pre("save", async function(next) {
    if (!this.isModified("password")) return next();
    try {
        const salt = await genSalt(10); // Specify rounds
        this.password = await hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

const User = mongoose.model("User", userSchema);

export default User;

