require("dotenv").config();

const connectDB = require("./config/database");
const app = require("./app");
const logger = require("./utils/logger");

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();

    logger.info("MongoDB connected successfully");

    app.listen(PORT, () => {
      logger.info({ port: PORT }, "Server started");
    });
  } catch (error) {
    logger.fatal({ err: error }, "MongoDB connection failed");

    process.exit(1);
  }
};

startServer();
