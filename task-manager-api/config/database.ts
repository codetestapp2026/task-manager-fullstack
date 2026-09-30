import mongoose = require("mongoose");

// Protect Mongoose queries against unsafe filter operators.
mongoose.set("sanitizeFilter", true);

const connectDB = async (): Promise<void> => {
  const databaseURL =
    process.env.NODE_ENV === "test"
      ? process.env.TEST_DATABASE_URL
      : process.env.DATABASE_URL;

  if (!databaseURL) {
    throw new Error("Database URL is missing");
  }

  if (
    process.env.NODE_ENV === "test" &&
    !databaseURL.includes("task-manager-test")
  ) {
    throw new Error(
      "Tests must use the task-manager-test database"
    );
  }

  await mongoose.connect(databaseURL, {
    serverSelectionTimeoutMS: 5000,
  });
};

export = connectDB;