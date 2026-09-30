import "dotenv/config";

import connectDB = require("./config/database");

import app = require("./app");

import logger = require("./utils/logger");

const PORT = Number(process.env.PORT) || 3000;

// ========================================
// START SERVER
// ========================================

const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    logger.info("MongoDB connected successfully");

    app.listen(PORT, () => {
      logger.info(
        {
          port: PORT,
        },
        "Server started",
      );
    });
  } catch (error: unknown) {
    logger.fatal(
      {
        err: error,
      },
      "MongoDB connection failed",
    );

    process.exit(1);
  }
};

startServer();
