import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}));

// adding middleware to limit the json data size
app.use(express.json({
    limit: '16kb',
}));

// configure the data coming from url
app.use(express.urlencoded({
    extended: true,
    limit: '16kb',
}));

// configuration to store some files or folders on server
app.use(express.static('storage'));

// configuration for cookie parser
app.use(cookieParser());

export default app;
