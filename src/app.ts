import express from "express";
import cors from "cors";
import morgan from "morgan";
import bodyParser from "body-parser";
import routes from "./routes";
import "express-async-errors";
import { errorHandler } from "./middleware/errorMiddleware";
import fs from "fs";
import path from "path";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const app = express();
app.use(cors());
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// static uploads
app.use("/uploads", express.static(path.join(process.cwd(), UPLOAD_DIR)));

// main routes
app.use("/api", routes);

// admin base (separate for UI endpoints)
import adminRoutes from "./routes/adminRoutes";
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => res.send("BUSYBRAINS SCHOOLS API"));

app.use(errorHandler);

export default app;