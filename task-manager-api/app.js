const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const { rateLimit } = require("express-rate-limit");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes");
const errorHandler = require("./middleware/errorMiddleware");
const cookieParser = require("cookie-parser");

//logger
const pinoHttp = require('pino-http');
const { randomUUID } = require('node:crypto');
const logger = require('./utils/logger');
// Swagger
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./docs/swagger");

const app = express();

// ========================================
// logger
// ========================================
app.use(
  pinoHttp({
    logger,

    // Create / reuse request ID
    genReqId(req, res) {
      const existingId = req.headers["x-request-id"];
      const id = existingId || randomUUID();

      res.setHeader("X-Request-Id", id);

      return id;
    },

    // Choose log level based on response
    customLogLevel(req, res, err) {
      if (err || res.statusCode >= 500) {
        return "error";
      }

      if (res.statusCode >= 400) {
        return "warn";
      }

      return "info";
    },

    // Keep request logs short and readable
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url,
        };
      },

      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  })
);
// ========================================
// HELMET
// ========================================
// Adds security-related HTTP response headers.
// Easy memory: Helmet = security headers.
app.use(helmet());

// ========================================
// CORS
// ========================================
// Controls which frontend origins are allowed to communicate
// with this backend from the browser.
//
// credentials: true allows cookies such as:
// accessToken and refreshToken
// to be sent between frontend and backend.
const allowedOrigins = [
  "http://localhost:3001",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no browser origin,
      // such as Postman and server-to-server requests.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error("Not allowed by CORS"),
      );
    },

    credentials: true,
  }),
);
// ========================================
// RATE LIMITING
// ========================================
// Allows a client to make up to 100 API requests
// during a 15-minute window.
//
// If the limit is exceeded:
// → 429 Too Many Requests.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply the rate limiter to every route starting with /api.
app.use("/api", apiLimiter);
// ========================================
// REQUEST SIZE LIMIT
// ========================================
// Parses JSON request bodies,
// but rejects JSON larger than 10 KB.
//
// Easy memory:
// Normal-size JSON → continue ✅
// Too large → reject ❌
app.use(express.json({ limit: "10kb" }));
// ========================================
// COOKIE PARSER
// ========================================
// Allows Express to read cookies through req.cookies.
//
// Example:
// req.cookies.accessToken
// req.cookies.refreshToken
app.use(cookieParser());
// ========================================
// ROOT ROUTE
// ========================================
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Task Manager Api is working",
  });
});
// ========================================
// HEALTH CHECK
// ========================================
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Backend is running",
  });
});
// ========================================
// ROUTES
// ========================================
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/tasks", taskRoutes);

// ========================================
// SWAGGER API DOCUMENTATION
// ========================================
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

// ========================================
// GLOBAL ERROR HANDLER
// ========================================
// Must stay after the routes so errors can reach it.
app.use(errorHandler);

module.exports = app;
