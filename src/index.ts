import dotenv from 'dotenv';
import { dbConnect } from './db/connection.js';
import app from './app.js';

const result = dotenv.config({
    path: './.env'
});

if (result.error) {
    console.error('Error loading .env file:', result.error);
    process.exit(1);
}

const PORT = process.env.PORT;
// db connection
dbConnect();

// server connection
app.listen(PORT, () => {
    console.log(`Server is running on port : ${PORT}`);
});