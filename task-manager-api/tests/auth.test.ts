// ========================================
// TEST ENVIRONMENT
// ========================================

// Tell the backend that Jest is running.
// database.ts will therefore use TEST_DATABASE_URL.
process.env.NODE_ENV = "test";

// Load environment variables from .env.
require("dotenv").config();


// ========================================
// MOCK REDIS / BULLMQ QUEUE
// ========================================
// During Jest tests we do not want to connect
// to a real Redis server.
//
// taskService can still call taskQueue.add(),
// but Jest replaces it with this fake function.
jest.mock("../queues/taskQueue", () => ({
  add: jest.fn().mockResolvedValue({
    id: "test-job",
  }),
}));

// Supertest sends fake HTTP requests to Express.
const request = require("supertest");

// Mongoose lets us clean and close the test database.
const mongoose = require("mongoose");

// Import your Express app.
// We DO NOT import server.ts because we do not need app.listen().
const app = require("../app");

// Import your real database connection helper.
const connectDB = require("../config/database");

// Import models so we can clean their TEST collections.
const User = require("../models/userModel");
const Task = require("../models/taskModel");
const Session = require("../models/sessionModel");


// ========================================
// HELPER — CLEAN TEST DATABASE
// ========================================

const clearDatabase = async () => {
  // Sessions reference users, so clean sessions first.
  await Session.deleteMany({});

  // Remove fake tasks.
  await Task.deleteMany({});

  // Remove fake users.
  await User.deleteMany({});
};


// ========================================
// HELPER — GET COOKIE
// ========================================

// Find one cookie from a Supertest response.
//
// Example:
//
// getCookie(response, "refreshToken")
//
// returns:
//
// refreshToken=abc123...
const getCookie = (
  response: {
    headers: {
      "set-cookie"?: string[];
    };
  },
  cookieName: string,
) => {
  // Get all Set-Cookie headers.
  const cookies =
    response.headers["set-cookie"] || [];

  // Find the requested cookie.
  const cookie = cookies.find((item) =>
    item.startsWith(`${cookieName}=`),
  );

  // Return only:
  //
  // refreshToken=abc123
  //
  // instead of all cookie options.
  return cookie
    ? cookie.split(";")[0]
    : null;
};


// ========================================
// BEFORE ALL TESTS
// ========================================

// Run ONCE before this file starts.
beforeAll(async () => {
  // Connect using database.ts.
  //
  // Because NODE_ENV === "test",
  // this connects to TEST_DATABASE_URL.
  await connectDB();
});


// ========================================
// BEFORE EVERY TEST
// ========================================

beforeEach(async () => {
  // Give every test a clean database.
  //
  // Test 2 should never depend on data from Test 1.
  await clearDatabase();
});


// ========================================
// AFTER ALL TESTS
// ========================================

afterAll(async () => {
  // Remove any remaining fake data.
  await clearDatabase();

  // Close MongoDB so Jest can exit normally.
  await mongoose.connection.close();
});


// ========================================
// AUTH TESTS
// ========================================

describe("Authentication API", () => {

  // ======================================
  // 1. SIGNUP
  // ======================================

  test(
    "POST /api/v1/auth/signup creates a user",
    async () => {
      // ARRANGE:
      // Prepare valid signup information.
      const newUser = {
        name: "John Test",
        email: "john@test.com",
        password: "password123",
      };

      // ACT:
      // Send POST /api/v1/auth/signup.
      const response = await request(app)
        .post("/api/v1/auth/signup")
        .send(newUser);

      // ASSERT:
      // Your signup controller intentionally returns 201.
      expect(response.statusCode).toBe(201);

      // Your API uses status: "success".
      expect(response.body.status).toBe(
        "success",
      );

      // Make sure user exists in response.
      expect(
        response.body.data.user,
      ).toBeDefined();

      // Make sure correct email was returned.
      expect(
        response.body.data.user.email,
      ).toBe("john@test.com");

      // SECURITY:
      // Password must never be returned.
      expect(
        response.body.data.user.password,
      ).toBeUndefined();

      // Get cookies.
      const accessCookie = getCookie(
        response,
        "accessToken",
      );

      const refreshCookie = getCookie(
        response,
        "refreshToken",
      );

      // Signup should create both tokens.
      expect(accessCookie).not.toBeNull();
      expect(refreshCookie).not.toBeNull();

      // Make sure the user really exists in MongoDB.
      const userInDatabase =
        await User.findOne({
          email: "john@test.com",
        });

      expect(
        userInDatabase,
      ).not.toBeNull();

      // Your createSendToken() also creates a refresh session.
      const sessions =
        await Session.find();

      expect(sessions).toHaveLength(1);
    },
  );


  // ======================================
  // 2. SIGNUP VALIDATION
  // ======================================

  test(
    "POST /api/v1/auth/signup rejects invalid email",
    async () => {
      // ACT:
      // Email violates your Zod email rule.
      const response = await request(app)
        .post("/api/v1/auth/signup")
        .send({
          name: "John Test",
          email: "wrong-email",
          password: "password123",
        });

      // ASSERT:
      // validationMiddleware creates a 400 AppError.
      expect(response.statusCode).toBe(400);

      expect(response.body.status).toBe(
        "fail",
      );

      expect(response.body.message).toBe(
        "Validation failed",
      );

      // Your error middleware includes Zod errors.
      expect(
        response.body.errors,
      ).toBeDefined();
    },
  );


  // ======================================
  // 3. LOGIN SUCCESS
  // ======================================

  test(
    "POST /api/v1/auth/login logs in with correct credentials",
    async () => {
      // ARRANGE:
      // First create a real user through your API.
      await request(app)
        .post("/api/v1/auth/signup")
        .send({
          name: "John Test",
          email: "john@test.com",
          password: "password123",
        });

      // ACT:
      // Login with the same credentials.
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "john@test.com",
          password: "password123",
        });

      // ASSERT:
      expect(response.statusCode).toBe(200);

      expect(response.body.status).toBe(
        "success",
      );

      expect(
        response.body.data.user.email,
      ).toBe("john@test.com");

      // Password should still be hidden.
      expect(
        response.body.data.user.password,
      ).toBeUndefined();

      // Login should create authentication cookies.
      expect(
        getCookie(
          response,
          "accessToken",
        ),
      ).not.toBeNull();

      expect(
        getCookie(
          response,
          "refreshToken",
        ),
      ).not.toBeNull();
    },
  );


  // ======================================
  // 4. WRONG PASSWORD
  // ======================================

  test(
    "POST /api/v1/auth/login rejects wrong password",
    async () => {
      // ARRANGE:
      // Create user.
      await request(app)
        .post("/api/v1/auth/signup")
        .send({
          name: "John Test",
          email: "john@test.com",
          password: "password123",
        });

      // ACT:
      // Correct email but incorrect password.
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "john@test.com",
          password: "wrong-password",
        });

      // ASSERT:
      // Your controller returns 401.
      expect(response.statusCode).toBe(401);

      expect(response.body.status).toBe(
        "fail",
      );

      expect(response.body.message).toBe(
        "Incorrect email or password",
      );
    },
  );


  // ======================================
  // 5. PROTECTED ROUTE WITHOUT LOGIN
  // ======================================

  test(
    "GET /api/v1/tasks rejects user without access token",
    async () => {
      // ACT:
      // No signup.
      // No login.
      // No cookies.
      const response =
        await request(app).get(
          "/api/v1/tasks",
        );

      // ASSERT:
      // protect() should reject the request.
      expect(response.statusCode).toBe(401);

      expect(response.body.status).toBe(
        "fail",
      );

      expect(response.body.message).toBe(
        "You are not logged in",
      );
    },
  );


  // ======================================
  // 6. REFRESH TOKEN ROTATION
  // ======================================

  test(
    "POST /api/v1/auth/refresh rotates the refresh token",
    async () => {
      // ARRANGE:
      // Signup returns both cookies.
      const signupResponse =
        await request(app)
          .post("/api/v1/auth/signup")
          .send({
            name: "John Test",
            email: "john@test.com",
            password: "password123",
          });

      // Get Refresh Token A.
      const oldRefreshCookie = getCookie(
        signupResponse,
        "refreshToken",
      );

      expect(
        oldRefreshCookie,
      ).not.toBeNull();

      // ACT:
      // Send Refresh Token A to /refresh.
      const refreshResponse =
        await request(app)
          .post("/api/v1/auth/refresh")
          .set(
            "Cookie",
            oldRefreshCookie,
          );

      // ASSERT:
      expect(
        refreshResponse.statusCode,
      ).toBe(200);

      expect(
        refreshResponse.body.status,
      ).toBe("success");

      expect(
        refreshResponse.body.message,
      ).toBe(
        "Tokens refreshed successfully",
      );

      // Refresh should issue Access Token B.
      const newAccessCookie = getCookie(
        refreshResponse,
        "accessToken",
      );

      // Refresh should also issue Refresh Token B.
      const newRefreshCookie = getCookie(
        refreshResponse,
        "refreshToken",
      );

      expect(
        newAccessCookie,
      ).not.toBeNull();

      expect(
        newRefreshCookie,
      ).not.toBeNull();

      // The refresh cookie should have changed.
      expect(
        newRefreshCookie,
      ).not.toBe(oldRefreshCookie);

      // IMPORTANT:
      // Try using OLD Refresh Token A again.
      //
      // Your database session now contains the hash
      // of Refresh Token B, so Refresh A should fail.
      const reuseOldTokenResponse =
        await request(app)
          .post("/api/v1/auth/refresh")
          .set(
            "Cookie",
            oldRefreshCookie,
          );

      expect(
        reuseOldTokenResponse.statusCode,
      ).toBe(401);

      expect(
        reuseOldTokenResponse.body.message,
      ).toBe(
        "Invalid refresh session",
      );
    },
  );


  // ======================================
  // 7. REFRESH WITHOUT TOKEN
  // ======================================

  test(
    "POST /api/v1/auth/refresh rejects request without refresh token",
    async () => {
      // ACT:
      // No refresh cookie.
      const response =
        await request(app).post(
          "/api/v1/auth/refresh",
        );

      // ASSERT:
      expect(response.statusCode).toBe(401);

      expect(response.body.message).toBe(
        "Refresh token not found",
      );
    },
  );


  // ======================================
  // 8. LOGOUT
  // ======================================

  test(
    "POST /api/v1/auth/logout removes authentication",
    async () => {
      // request.agent() behaves like a browser.
      //
      // It remembers cookies between requests.
      const agent =
        request.agent(app);

      // ARRANGE:
      // Signup.
      await agent
        .post("/api/v1/auth/signup")
        .send({
          name: "John Test",
          email: "john@test.com",
          password: "password123",
        });

      // Before logout, protected route should work.
      const beforeLogout =
        await agent.get(
          "/api/v1/tasks",
        );

      expect(
        beforeLogout.statusCode,
      ).toBe(200);

      // ACT:
      // Logout.
      const logoutResponse =
        await agent.post(
          "/api/v1/auth/logout",
        );

      // ASSERT:
      expect(
        logoutResponse.statusCode,
      ).toBe(200);

      expect(
        logoutResponse.body.message,
      ).toBe(
        "Logged out successfully",
      );

      // Try protected route again.
      const afterLogout =
        await agent.get(
          "/api/v1/tasks",
        );

      // Cookies were cleared.
      expect(
        afterLogout.statusCode,
      ).toBe(401);
    },
  );
});