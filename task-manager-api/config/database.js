// const mongoose = require("mongoose");

// // Extra protection against MongoDB query selector injection
// mongoose.set("sanitizeFilter", true);

// const connectDB = async () => {
//   try {
//     console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);

//     await mongoose.connect(process.env.DATABASE_URL, {
//       serverSelectionTimeoutMS: 5000,
//     });

//     console.log("MongoDB connected successfully");
//   } catch (error) {
//     throw error;
//   }
// };

// module.exports = connectDB;

// // ======================
// we replce above with botton when use test

const mongoose = require("mongoose");

// Protect Mongoose queries against unsafe filter operators.
mongoose.set("sanitizeFilter", true);

const connectDB = async () => {
  // If Jest is running, use the TEST database.
  // Otherwise use your normal development database.
  const databaseURL =
    process.env.NODE_ENV === "test"
      ? process.env.TEST_DATABASE_URL
      : process.env.DATABASE_URL;

  // Safety check.
  if (!databaseURL) {
    throw new Error("Database URL is missing");
  }

  // EXTRA SAFETY:
  // If we are testing, make sure the URL really points
  // to task-manager-test.
  if (
    process.env.NODE_ENV === "test" &&
    !databaseURL.includes("task-manager-test")
  ) {
    throw new Error(
      "Tests must use the task-manager-test database",
    );
  }

  // Connect to the chosen MongoDB database.
  await mongoose.connect(databaseURL, {
    serverSelectionTimeoutMS: 5000,
  });

  //we can remove it or comment it 
  // console.log(
  //   process.env.NODE_ENV === "test"
  //     ? "MongoDB TEST database connected"
  //     : "MongoDB connected successfully",
  // );
};

module.exports = connectDB;