import express from "express";
import dotenv from "dotenv";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import bodyParser from "body-parser";
import { Server } from "socket.io";
import connectDB from "./config/db";
import userRoute from "./routes/authRoutes";
import inventoryRoute from "./routes/inventoryRoute";
import forecastRoute from "./routes/forecastRoute";
import reportRoute from "./routes/reportRoute";
import notificationRouter from "./routes/notificationRoute";
import { sendUpdates } from "./utils/inventory";
import { Inventory } from "./models/Inventory";
import jwt from "jsonwebtoken";
import { parse } from "cookie";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5500;


// CORS: Allow ONLY specified frontends
const allowedOrigins = process.env.FRONTEND_URLS
  ? process.env.FRONTEND_URLS.split(",").map(o => o.trim())
  : [];

console.log("Allowed origins:", allowedOrigins);


app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS blocked: " + origin));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
  credentials: true,
}));
app.options("*", cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(cookieParser());


app.options("*", (req, res) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Credentials", "true");
  }
  res.sendStatus(204);
});

// Webhook
app.post('/api/sheet-update', async (req, res) => {
  try {
    console.log('Webhook Hit:', new Date());
    const sheetId = req.body?.sheetId || req.headers["x-goog-resource-id"];
    if (!sheetId) return res.status(400).json({ error: "Missing sheetId" });

    const inventory = await Inventory.findOne({ sheetId });
    if (!inventory) return res.status(404).json({ error: "No matching inventory" });

    await sendUpdates(inventory.userId.toString());
    res.status(200).send({ status: "ok" });
  } catch (err) {
    console.error("Error processing sheet update:", err);
    res.status(500).json({ error: "Failed to process sheet update" });
  }
});

// Health check
app.get("/", (req, res) => res.send("Server is running., " + JSON.stringify(process.env)));



// Routes
app.use('/auth', userRoute);
app.use('/inventory', inventoryRoute);
app.use('/forecast', forecastRoute);
app.use('/reports', reportRoute);
app.use('/notify', notificationRouter);


const server = http.createServer(app);

// Socket.IO restricted to React frontend
export const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.use((socket, next) => {
  try {
    const cookieHeader = socket.request.headers.cookie;

    if (!cookieHeader) {
      console.log("No cookie header in socket");
      return next(new Error("Unauthorized"));
    }

    const cookies = parse(cookieHeader);
    const token = cookies.token;

    if (!token) {
      console.log("Token missing in cookie");
      return next(new Error("Unauthorized"));
    }

    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as { _id: string };

    socket.data.userId = payload._id;

    console.log("Socket authenticated:", payload._id);

    next();
  } catch (err) {
    console.error("Socket auth error:", err);
    next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  console.log(`User ${socket.data.userId} connected`);
  socket.join(socket.data.userId);

  socket.on("disconnect", () => {
    console.log(`User ${socket.data.userId} disconnected`);
  });
});


// Connect DB and start server
connectDB().then(() => {
  server.listen(PORT, () => console.log(` Server running at http://localhost:${PORT}`));
});

export { app };
