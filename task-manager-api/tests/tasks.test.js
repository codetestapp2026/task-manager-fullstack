// ========================================
// TEST ENVIRONMENT
// ========================================
// Make database.js use TEST_DATABASE_URL.
process.env.NODE_ENV = "test";
// Load .env.
require("dotenv").config();

// ========================================
// MOCK REDIS / BULLMQ QUEUE
// ========================================
jest.mock("../queues/taskQueue", () => ({
  add: jest.fn().mockResolvedValue({
    id: "test-job",
  }),
}));

// Supertest sends API requests.
const request = require("supertest");
// Mongoose is used for database cleanup
// and creating ObjectIds.
const mongoose = require("mongoose");
// Your Express application.
const app = require("../app");

// Your database connection helper.
const connectDB = require("../config/database");

// Models.
const User = require("../models/userModel");
const Task = require("../models/taskModel");
const Session = require("../models/sessionModel");


// ========================================
// CLEAN DATABASE
// ========================================

const clearDatabase = async () => {
  // Delete authentication sessions first.
  await Session.deleteMany({});
  // Delete tasks.
  await Task.deleteMany({});
  // Delete users last.
  await User.deleteMany({});
};


// ========================================
// CREATE LOGGED-IN USER
// ========================================

// Helper function.
//
// Instead of repeating:
//
// request.agent()
// signup
// cookies
//
// in every test, we put it here.
const createLoggedInUser = async (
  name,
  email,
) => {
  // Agent remembers cookies.
  const agent = request.agent(app);

  // Create user.
  const response = await agent
    .post("/api/v1/auth/signup")
    .send({
      name,
      email,
      password: "password123",
    });

  // Make sure our test setup succeeded.
  expect(response.statusCode).toBe(201);

  // Return agent + user.
  return {
    agent,
    user: response.body.data.user,
  };
};


// ========================================
// DATABASE SETUP
// ========================================

beforeAll(async () => {
  // Connect to task-manager-test.
  await connectDB();
});


beforeEach(async () => {
  // Fresh database before every test.
  await clearDatabase();
});


afterAll(async () => {
  // Final cleanup.
  await clearDatabase();

  // Close connection.
  await mongoose.connection.close();
});


// ========================================
// TASK TESTS
// ========================================

describe("Tasks API", () => {

  // ======================================
  // 1. AUTHENTICATION
  // ======================================

  test("GET /api/v1/tasks rejects unauthenticated user", async () => {
    // ACT:
    // Send request without cookies.
    const response = await request(app)
      .get("/api/v1/tasks");

    // ASSERT:
    expect(response.statusCode).toBe(401);

    expect(response.body.message).toBe(
      "You are not logged in",
    );
  });


  // ======================================
  // 2. CREATE TASK
  // ======================================

  test("POST /api/v1/tasks creates a task for logged-in user", async () => {
    // ARRANGE:
    // Create User A and login automatically.
    const { agent, user } =
      await createLoggedInUser(
        "User A",
        "usera@test.com",
      );

    // ACT:
    // Create task.
    const response = await agent
      .post("/api/v1/tasks")
      .send({
        title: "Learn Jest",
        description: "Practice Supertest",
        completed: false,
      });

    // ASSERT:
    expect(response.statusCode).toBe(201);

    expect(response.body.status).toBe("success");

    expect(response.body.data.task).toBeDefined();

    expect(response.body.data.task.title).toBe(
      "Learn Jest",
    );

    expect(
      response.body.data.task.description,
    ).toBe("Practice Supertest");

    expect(
      response.body.data.task.completed,
    ).toBe(false);

    // Very important:
    // Controller should attach req.user._id.
    expect(
      String(response.body.data.task.user),
    ).toBe(String(user._id));
  });


  // ======================================
  // 3. VALIDATION
  // ======================================

  test("POST /api/v1/tasks rejects empty title", async () => {
    // ARRANGE:
    const { agent } =
      await createLoggedInUser(
        "User A",
        "usera@test.com",
      );

    // ACT:
    // Your createTaskSchema trims this
    // and sees an empty string.
    const response = await agent
      .post("/api/v1/tasks")
      .send({
        title: "   ",
      });

    // ASSERT:
    expect(response.statusCode).toBe(400);

    expect(response.body.message).toBe(
      "Validation failed",
    );
  });


  // ======================================
  // 4. MASS-ASSIGNMENT / STRICT VALIDATION
  // ======================================

  test("POST /api/v1/tasks rejects user field supplied by client", async () => {
    // ARRANGE:
    const { agent } =
      await createLoggedInUser(
        "User A",
        "usera@test.com",
      );

    // ACT:
    // Client tries to manually choose task owner.
    //
    // Your Zod schema is .strict(),
    // so "user" is not allowed.
    const response = await agent
      .post("/api/v1/tasks")
      .send({
        title: "Bad Task",
        user: new mongoose.Types.ObjectId(),
      });

    // ASSERT:
    expect(response.statusCode).toBe(400);

    expect(response.body.message).toBe(
      "Validation failed",
    );
  });


  // ======================================
  // 5. GET ONLY OWN TASKS
  // ======================================

  test("GET /api/v1/tasks returns only normal user's tasks", async () => {
    // ARRANGE:
    // Create User A.
    const userA =
      await createLoggedInUser(
        "User A",
        "usera@test.com",
      );

    // Create User B.
    const userB =
      await createLoggedInUser(
        "User B",
        "userb@test.com",
      );

    // User A creates one task.
    await userA.agent
      .post("/api/v1/tasks")
      .send({
        title: "User A Task",
      });

    // User B creates another task.
    await userB.agent
      .post("/api/v1/tasks")
      .send({
        title: "User B Task",
      });

    // ACT:
    // User A requests /tasks.
    const response = await userA.agent.get(
      "/api/v1/tasks",
    );

    // ASSERT:
    expect(response.statusCode).toBe(200);

    expect(
      response.body.data.tasks,
    ).toHaveLength(1);

    expect(
      response.body.data.tasks[0].title,
    ).toBe("User A Task");

    // User B's task was NOT leaked.
    expect(
      String(response.body.data.tasks[0].user),
    ).toBe(String(userA.user._id));
  });


  // ======================================
  // 6. GET OWN TASK BY ID
  // ======================================

  test("GET /api/v1/tasks/:id returns user's own task", async () => {
    // ARRANGE:
    const { agent } =
      await createLoggedInUser(
        "User A",
        "usera@test.com",
      );

    // Create task.
    const createResponse = await agent
      .post("/api/v1/tasks")
      .send({
        title: "My Private Task",
      });

    // Get MongoDB ID.
    const taskId =
      createResponse.body.data.task._id;

    // ACT:
    const response = await agent.get(
      `/api/v1/tasks/${taskId}`,
    );

    // ASSERT:
    expect(response.statusCode).toBe(200);

    expect(response.body.data.task.title).toBe(
      "My Private Task",
    );
  });


  // ======================================
  // 7. CANNOT READ ANOTHER USER'S TASK
  // ======================================

  test("User B cannot read User A's task", async () => {
    // ARRANGE:
    const userA =
      await createLoggedInUser(
        "User A",
        "usera@test.com",
      );

    const userB =
      await createLoggedInUser(
        "User B",
        "userb@test.com",
      );

    // User A creates Task A.
    const createResponse =
      await userA.agent
        .post("/api/v1/tasks")
        .send({
          title: "User A Secret Task",
        });

    const taskId =
      createResponse.body.data.task._id;

    // ACT:
    // User B asks for User A's task.
    const response = await userB.agent.get(
      `/api/v1/tasks/${taskId}`,
    );

    // ASSERT:
    //
    // Your controller intentionally uses:
    //
    // Task.findOne({
    //   _id: taskId,
    //   user: req.user._id
    // })
    //
    // Therefore another user's task appears
    // as "not found".
    expect(response.statusCode).toBe(404);

    expect(response.body.message).toBe(
      "Task not found",
    );
  });


  // ======================================
  // 8. UPDATE OWN TASK
  // ======================================

  test("PATCH /api/v1/tasks/:id updates user's own task", async () => {
    // ARRANGE:
    const { agent } =
      await createLoggedInUser(
        "User A",
        "usera@test.com",
      );

    // Create original task.
    const createResponse = await agent
      .post("/api/v1/tasks")
      .send({
        title: "Old Title",
        completed: false,
      });

    const taskId =
      createResponse.body.data.task._id;

    // ACT:
    // Update title and completed.
    const response = await agent
      .patch(`/api/v1/tasks/${taskId}`)
      .send({
        title: "New Title",
        completed: true,
      });

    // ASSERT:
    expect(response.statusCode).toBe(200);

    expect(response.body.data.task.title).toBe(
      "New Title",
    );

    expect(
      response.body.data.task.completed,
    ).toBe(true);
  });


  // ======================================
  // 9. BROKEN ACCESS CONTROL TEST ⭐⭐⭐⭐⭐
  // ======================================

  test("User B cannot update User A's task", async () => {
    // ARRANGE:
    const userA =
      await createLoggedInUser(
        "User A",
        "usera@test.com",
      );

    const userB =
      await createLoggedInUser(
        "User B",
        "userb@test.com",
      );

    // User A owns this task.
    const createResponse =
      await userA.agent
        .post("/api/v1/tasks")
        .send({
          title: "Original Private Task",
        });

    const taskId =
      createResponse.body.data.task._id;

    // ACT:
    // User B tries to modify User A's task.
    const attackResponse =
      await userB.agent
        .patch(`/api/v1/tasks/${taskId}`)
        .send({
          title: "HACKED",
        });

    // ASSERT:
    // Your current controller returns 404,
    // not 403.
    //
    // That's because the ownership query
    // finds no task belonging to User B.
    expect(
      attackResponse.statusCode,
    ).toBe(404);

    // EXTRA ASSERT:
    // Make sure User B did not actually change it.
    const verifyResponse =
      await userA.agent.get(
        `/api/v1/tasks/${taskId}`,
      );

    expect(
      verifyResponse.body.data.task.title,
    ).toBe("Original Private Task");
  });


  // ======================================
  // 10. CANNOT DELETE ANOTHER USER'S TASK
  // ======================================

  test("User B cannot delete User A's task", async () => {
    // ARRANGE:
    const userA =
      await createLoggedInUser(
        "User A",
        "usera@test.com",
      );

    const userB =
      await createLoggedInUser(
        "User B",
        "userb@test.com",
      );

    // User A creates task.
    const createResponse =
      await userA.agent
        .post("/api/v1/tasks")
        .send({
          title: "Do Not Delete",
        });

    const taskId =
      createResponse.body.data.task._id;

    // ACT:
    // User B tries delete.
    const attackResponse =
      await userB.agent.delete(
        `/api/v1/tasks/${taskId}`,
      );

    // ASSERT:
    expect(
      attackResponse.statusCode,
    ).toBe(404);

    // Verify task still exists for User A.
    const verifyResponse =
      await userA.agent.get(
        `/api/v1/tasks/${taskId}`,
      );

    expect(verifyResponse.statusCode).toBe(200);

    expect(
      verifyResponse.body.data.task.title,
    ).toBe("Do Not Delete");
  });


  // ======================================
  // 11. DELETE OWN TASK
  // ======================================

  test("DELETE /api/v1/tasks/:id deletes user's own task", async () => {
    // ARRANGE:
    const { agent } =
      await createLoggedInUser(
        "User A",
        "usera@test.com",
      );

    // Create task.
    const createResponse = await agent
      .post("/api/v1/tasks")
      .send({
        title: "Delete This Task",
      });

    const taskId =
      createResponse.body.data.task._id;

    // ACT:
    const deleteResponse =
      await agent.delete(
        `/api/v1/tasks/${taskId}`,
      );

    // ASSERT:
    // Your deleteTask controller returns 204 No Content.
    expect(
      deleteResponse.statusCode,
    ).toBe(204);

    // Try reading deleted task.
    const getResponse = await agent.get(
      `/api/v1/tasks/${taskId}`,
    );

    expect(getResponse.statusCode).toBe(404);
  });


  // ======================================
  // 12. TASK NOT FOUND
  // ======================================

  test("GET /api/v1/tasks/:id returns 404 for missing task", async () => {
    // ARRANGE:
    const { agent } =
      await createLoggedInUser(
        "User A",
        "usera@test.com",
      );

    // This is a valid MongoDB ObjectId,
    // but no task exists with it.
    const fakeTaskId =
      new mongoose.Types.ObjectId();

    // ACT:
    const response = await agent.get(
      `/api/v1/tasks/${fakeTaskId}`,
    );

    // ASSERT:
    expect(response.statusCode).toBe(404);

    expect(response.body.message).toBe(
      "Task not found",
    );
  });


  // ======================================
  // 13. ADMIN CAN ACCESS OTHER USER'S TASK
  // ======================================

  test("Admin can access another user's task", async () => {
    // ARRANGE:
    // Create normal user.
    const normalUser =
      await createLoggedInUser(
        "Normal User",
        "normal@test.com",
      );

    // Create task belonging to normal user.
    const taskResponse =
      await normalUser.agent
        .post("/api/v1/tasks")
        .send({
          title: "Normal User Task",
        });

    const taskId =
      taskResponse.body.data.task._id;


    // Create another normal account.
    const admin =
      await createLoggedInUser(
        "Admin User",
        "admin@test.com",
      );


    // For testing, directly change its role
    // in the TEST database.
    await User.findByIdAndUpdate(
      admin.user._id,
      {
        role: "admin",
      },
    );


    // ACT:
    //
    // We do NOT need a new JWT because your JWT only
    // stores the user's ID.
    //
    // protect() loads the user fresh from MongoDB,
    // so it sees role === "admin".
    const response = await admin.agent.get(
      `/api/v1/tasks/${taskId}`,
    );


    // ASSERT:
    // Admin branch uses Task.findById().
    expect(response.statusCode).toBe(200);

    expect(response.body.data.task.title).toBe(
      "Normal User Task",
    );
  });
});