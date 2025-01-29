import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

// User interface extending Document
export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  role: "USER" | "DRIVER" | "ADMIN";
  refreshToken?: string;
  phoneNumber: string;
  avatar?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  address?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Methods
  isPasswordCorrect(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
  generatePasswordResetToken(): Promise<string>;
}

// User Schema
const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,    // option in a Mongoose schema automatically removes leading and trailing whitespace from string fields, ensuring data consistency and preventing errors from accidental user input
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false, // Exclude password from query results
    },
    role: {
      type: String,
      enum: ["USER", "DRIVER", "ADMIN"],
      default: "USER",
    },
    refreshToken: {
      type: String,
      select: false,
    },
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
    },
    avatar: {
      type: String, // URL to the avatar image
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    address: {
      type: String,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to check if password is correct
userSchema.methods.isPasswordCorrect = function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

// Method to generate access token
userSchema.methods.generateAccessToken = function (): string {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    throw new Error("JWT_ACCESS_SECRET is not set in the environment variables");
  }

  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      role: this.role,
    },
    secret,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || "1d" } as jwt.SignOptions
  );
};

// Method to generate refresh token
userSchema.methods.generateRefreshToken = function (): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET is not set in the environment variables");
  }

  return jwt.sign(
    {
      _id: this._id,
    },
    secret,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || "7d" } as jwt.SignOptions
  );
};

// Method to generate password reset token
userSchema.methods.generatePasswordResetToken = async function (): Promise<string> {
  // Generate a random token using crypto
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hash the token and save to database
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expiry to 10 minutes from now
  this.passwordResetExpires = new Date(Date.now() + 5 * 60 * 1000);

  await this.save({ validateBeforeSave: false });

  return resetToken;
};

export const User = mongoose.model<IUser>("User", userSchema);
