import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

export async function dbConnect() {
    try{
        const DB_URL = process.env.MONGODB_URL;
        const connectionInstance = await mongoose.connect(`${DB_URL}/${DB_NAME}`);
    } catch (error) {
        console.log('DB Connection Failed : ', error); 
        process.exit(1);
    }
}