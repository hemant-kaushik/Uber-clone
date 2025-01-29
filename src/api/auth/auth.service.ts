import { User } from "../../models/user/User.js";
import jwt from "jsonwebtoken";

export const getUserById = async (id: string) => {
    return await User.findById(id);
};

export const clearRefreshToken = async (id: string) => {
    return await User.findByIdAndUpdate(id, { $unset: { refreshToken: 1 } });
};

export const userExists = async (username: string, email: string, phoneNumber: string) => {
    return await User.findOne({ $or: [{ username }, { email }, { phoneNumber }] });
};

export const getUserByQuery = async (query: any) => {
    return await User.findOne(query);
};

export const createUser = async (userData: any) => {
    return await User.create(userData);
};

export const verifyRefreshToken = (token: string) => {
    return jwt.verify(
        token,
        process.env.JWT_REFRESH_SECRET || ""
    ) as jwt.JwtPayload;
};