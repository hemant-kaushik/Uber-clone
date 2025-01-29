import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import appRouter from './routes/index.js';

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
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

// Routes
app.use("/api/vi", appRouter);

// Health check route : check if the server is running or not (standard practice)
app.get('/health', (_, res) => {
    res.status(200).json({ status: 'ok' });
});

app.all('*', (req: any, res: any) => {
    return res.status(404).json({
        success: false,
        err: "Invalid API Endpoint"
    })
});

export default app;
