import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import validateRequest from "../middlewares/validateRequest.js";
import { registerUser, loginUser, logoutUser, refreshAccessToken, forgotPassword, resetPassword } from "../api/auth/auth.controller.js";
import { loginUserSchema, registerUserSchema, forgotPasswordSchema, resetPasswordSchema } from "../validations/user.js";

const authRouter = Router();

// Public routes
authRouter.post("/register", validateRequest(registerUserSchema), asyncHandler(registerUser));
authRouter.post("/login", validateRequest(loginUserSchema), asyncHandler(loginUser));
authRouter.post("/forgot-password", validateRequest(forgotPasswordSchema), asyncHandler(forgotPassword));
authRouter.post("/reset-password/:token", validateRequest(resetPasswordSchema), asyncHandler(resetPassword));
authRouter.post("/refresh-token", asyncHandler(refreshAccessToken));

// Protected routes
authRouter.post("/logout", verifyJWT, asyncHandler(logoutUser));

export default authRouter; 