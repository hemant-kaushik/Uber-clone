import crypto from "crypto";
import { NextFunction, Request, Response } from "express";
import { User } from "../../models/user/User.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import * as authService from "./auth.service.js";
import { sendEmail, generatePasswordResetEmailTemplate } from "../../utils/emailService.js";
import pkg from "lodash";
const { omit } = pkg;

// Cookie options
const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production"
};

// Generate access and refresh tokens
const generateTokens = async (userId: string) => {
    try {
        const user = await authService.getUserById(userId);
        if (!user) throw new ApiError(404, "User not found");

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // Save refresh token to user
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Error while generating tokens");
    }
};

// Register user
export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { username, email, phoneNumber } = req.body;

        // Check if user already exists
        const existingUser = await authService.userExists(username, email, phoneNumber);

        if (existingUser) {
            return res.status(400).json(new ApiResponse(400, null, "User already exists"));
        }

        // Create user
        const user = await authService.createUser(req.body);

        // Generate tokens
        const { accessToken, refreshToken } = await generateTokens(user._id as string);

        // Get user without sensitive info
        const createdUser = omit(user?.toJSON(), ["password", "refreshToken"]);

        // Set cookies
        res.cookie("accessToken", accessToken, options);
        res.cookie("refreshToken", refreshToken, options);
        // Send response
        const data = { user: createdUser, accessToken, refreshToken };
        return res.status(200).json(new ApiResponse(200, data, "User registered successfully"));
    } catch (error) {
        next(error);
    }
};

// Login user
export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email }).select("+password");
        if (!user) {
            return res.status(404).json(new ApiResponse(404, null, "User does not exist"));
        }

        // Check password
        const isPasswordValid = await user.isPasswordCorrect(password);
        if (!isPasswordValid) {
            return res.status(401).json(new ApiResponse(401, null, "Invalid credentials"));
        }

        // Generate tokens
        const { accessToken, refreshToken } = await generateTokens(user._id as string);

        // Get user without sensitive info
        const loggedInUser = omit(user?.toJSON(), ["password", "refreshToken"]);
        // Set cookies
        res.cookie("accessToken", accessToken, options);
        res.cookie("refreshToken", refreshToken, options);
        // Send response
        const data = { user: loggedInUser, accessToken, refreshToken };
        return res.status(200).json(new ApiResponse(200, data, "User logged in successfully"));
    } catch (error) {
        next(error);
    }
};

// Logout user
export const logoutUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Clear refresh token from database
        await authService.clearRefreshToken(req.user._id);

        // Clear cookies
        res.clearCookie("accessToken", options);
        res.clearCookie("refreshToken", options);

        // Send response
        return res.status(200).json(new ApiResponse(200, null, "User logged out successfully"));
    } catch (error) {
        next(error);
    }
};

// Forgot password
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.body;

        // Find user by email
        const user = await authService.getUserByQuery({ email });
        if (!user) {
            return res.status(404).json(new ApiResponse(404, null, "User not found"));
        }

        // Generate reset token
        const resetToken = await user.generatePasswordResetToken();
        // Create reset URL
        const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password/${resetToken}`;

        try {
            // Send password reset email
            const emailOptions = {
                from: `${process.env.APP_NAME} <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
                to: user.email,
                subject: "Password Reset Request",
                html: generatePasswordResetEmailTemplate(user.username, resetUrl),
            }
            await sendEmail(emailOptions);
            // Prepare development data if needed
            const devData = process.env.NODE_ENV === 'development' ? { resetUrl, resetToken } : null;
            return res.status(200).json(new ApiResponse(200, devData, "Password reset instructions sent to email"));
        } catch (error) {
            // If email sending fails, reset the token
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save({ validateBeforeSave: false });

            throw new ApiError(500, "Error sending password reset email. Please try again later.");
        }
    } catch (error) {
        next(error);
    }
};

// Reset password
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        // Hash the token to compare with stored hash
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Find user by token and check if token hasn't expired
        const user = await authService.getUserByQuery({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });
        if (!user) {
            return res.status(400).json(new ApiResponse(400, null, "Token is invalid or has expired"));
        }

        // Set new password
        user.password = password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();
        // Generate new tokens
        const { accessToken, refreshToken } = await generateTokens(user._id as string);

        // Set cookies
        res.cookie("accessToken", accessToken, options);
        res.cookie("refreshToken", refreshToken, options);

        const data = { accessToken, refreshToken };
        return res.status(200).json(new ApiResponse(200, data, "Password reset successful"));
    } catch (error) {
        next(error);
    }
};

// Refresh access token
export const refreshAccessToken = async (req: Request, res: Response) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        // Verify refresh token
        const decodedToken = authService.verifyRefreshToken(incomingRefreshToken);

        // Find user
        const user = await authService.getUserById(decodedToken?._id);
        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        // Check if refresh token matches
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        // Generate new tokens
        const { accessToken, refreshToken } = await generateTokens(user._id as string);

        // Set cookies
        res.cookie("accessToken", accessToken, options);
        res.cookie("refreshToken", refreshToken, options);

        // Send response
        return res
            .status(200)
            .json(
                new ApiResponse(200,
                    { accessToken, refreshToken },
                    "Access token refreshed successfully"
                )
            );
    } catch (error: any) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
};

