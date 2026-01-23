import cors from "cors";
import * as dotenv from "dotenv";
import express, { type Request, type Response } from "express";
import path from "node:path";

dotenv.config({
    path: [path.resolve("../../../.env.local")]
});

const app = express();
const port = 1234;

app.use(cors());

app.get("/api/user-info/getInfo", (_req: Request, res: Response) => {
    res.json({
        email: "ava.morgan92@example.com",
        createdAt: "2024-08-19T10:42:15Z",
        status: "active"
    });
});

app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
