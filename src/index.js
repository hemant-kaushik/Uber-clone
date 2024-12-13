import dotenv from 'dotenv';
import { dbConnect } from './db/connection.js';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import app from './app.js';

// Get current file's directory
const __dirname = dirname(fileURLToPath(import.meta.url));

// Configure environment variables
const result = dotenv.config({
    path: resolve(__dirname, '../.env')
});

if (result.error) {
    console.error('Error loading .env file:', result.error);
    process.exit(1);
}

const PORT = process.env.PORT;
// db connection
await dbConnect();

// server connection
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});