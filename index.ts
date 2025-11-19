import { config } from "dotenv";
import express, { Request, Response } from "express";
import type { ClientRequest } from "http";
import cors from "cors";
import { createProxyMiddleware, Options } from "http-proxy-middleware";
import { authMiddleware } from "./middleware/authMiddleware";
import path from "path";
import authRoute from "./route/auth/auth.route";
import citizenAuthRoute from "./route/citizen/auth.route";
import cryptographyRoute from "./route/cryptography/cryptography.route";
import panelRoute from "./route/panel/panel.route";
import citizenRoute from "./route/citizen/citizen.route";
import surveyRoute from "./route/survey/survey.route";
import consumerRoute from "./route/consumer/consumer.route";
import mobileSurveyRoute from "./route/mobile-survey/survey.route";
import driverRoute from "./route/driver/driver.route";
import dashboardRoute from "./route/dashboard/dashboard.route";
import mobileDriverRoute from "./route/mobile-driver/driver.route";
import downloadRoute from "./route/download/download.route";
import propertyRoute from "./route/property/property.route";
import { createServer } from "http";
import { Server } from "socket.io";

config();

// Swagger setup
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger-output.json");

const app = express();
app.set("trust proxy", true);

// app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const port = process.env.PORT || 6975;
const microservices = JSON.parse(process.env.MICROSERVICES || "{}");

// Middleware setup
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposedHeaders: ["Content-Disposition"],
  })
);

// Proxy configuration
app.use(
  [
    "/api/service/:service",
    "/api/service/:service/",
    "/api/service/:service/*splat",
  ],
  (req, res, next) => {
    const serviceName = req.params.service;
    const serviceUrl = microservices[serviceName];
    if (serviceUrl) {
      createProxyMiddleware({
        target: serviceUrl,
        changeOrigin: true,
        logger: console,
        pathRewrite: (path, req) => {
          const serviceReq = req as Request;
          const rewritten = path.replace(
            new RegExp(`^/api/service/${serviceName}`),
            ""
          );
          const finalUrl = serviceUrl + rewritten;

          console.log(
            `[Proxy] ${serviceReq.method} ${serviceReq.originalUrl} → ${finalUrl}`
          );

          return rewritten;
        },
        onProxyReq: (proxyReq: ClientRequest, req: Request, res: Response) => {
          if (req.headers["authorization"]) {
            proxyReq.setHeader("authorization", req.headers["authorization"]);
          }
        },
        logLevel: "debug",
      } as Options)(req, res, next);
    } else {
      res.status(404).json({ error: `Service '${serviceName}' not found` });
    }
  }
);

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

// Root endpoint
app.get("/", (req: Request, res: Response) => {
  res.send("Panipat Panel API");
});

// Routes
app.use("/api/auth", authRoute);
app.use("/api/auth/citizen", citizenAuthRoute);
app.use('/api/download', downloadRoute)
app.use("/api/property", propertyRoute);
app.use(authMiddleware);
app.use("/api/panel", panelRoute);
app.use("/api/citizen", citizenRoute);
app.use("/api/mobile-survey", mobileSurveyRoute);
app.use("/api/survey", surveyRoute);
app.use("/api/consumer", consumerRoute);
app.use("/api/driver", driverRoute);
app.use("/api/dashboard", dashboardRoute);
app.use("/api/mobile-driver", mobileDriverRoute);
app.use("/api/cryptography", cryptographyRoute);

// Create HTTP server
const httpServer = createServer(app);

// ✅ Create and export Socket.IO instance
export const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"],
});

// ✅ Socket.IO connection handling (no ULB logic)
io.on("connection", (socket) => {
  console.log(`✅ Socket connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`❌ Socket disconnected: ${socket.id}`);
  });
});

// Start server
httpServer.listen(port, () => {
  console.log(`🚀 Panipat Panel server running at port: ${port}`);
});
