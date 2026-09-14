const taskRepository = require("../repositories/taskRepository");
const AppError = require("../utils/appError");
const taskQueue = require("../queues/taskQueue");


// Build filter based on user role
const buildUserFilter = (user) => {
  const filter = {};

  // Normal user → only their tasks
  // Admin → all users' tasks
  if (user.role !== "admin") {
    filter.user = user._id;
  }

  return filter;
};

// GET ALL TASKS
exports.getTasks = async (user, query) => {
  // 1. PAGINATION
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 100;
  const skip = (page - 1) * limit;

  // 2. FILTER
  const filter = buildUserFilter(user);

  // Optional completed filter
  if (query.completed !== undefined) {
    filter.completed = query.completed === "true";
  }

  // 3. SEARCHING
  if (query.search) {
    const searchRegex = new RegExp(query.search, "i");

    filter.$or = [{ title: searchRegex }, { description: searchRegex }];
  }

  // 4. COUNT MATCHING TASKS
  const totalTasks = await taskRepository.countTasks(filter);

  // Calculate total pages
  const totalPages = Math.ceil(totalTasks / limit);

  // Check if requested page exists
  if (page > totalPages && totalPages > 0) {
    throw new AppError("This page does not exist", 404);
  }

  // 5. SORTING
  const sort = query.sort || "-createdAt";

  // 6. GET TASKS
  const tasks = await taskRepository.findTasks({
    filter,
    sort,
    skip,
    limit,
  });

  // 7. RETURN DATA TO CONTROLLER
  return {
    tasks,

    pagination: {
      currentPage: page,
      limit,
      totalTasks,
      totalPages,
    },
  };
};

//====================------=====================
// create task

exports.createTask = async (
  user,
  taskData
) => {
  // 1. Create task normally in MongoDB
  const task =
    await taskRepository.createTask({
      ...taskData,
      user: user._id,
    });

  // 2. Add background job

await taskQueue.add(
  "task-created-notification",

  {
    taskId: task._id.toString(),
    userId: user._id.toString(),
    title: task.title,
  },

  {
    attempts: 3,

    backoff: {
      type: "exponential",
      delay: 10000,
    },
  }
);

  // 3. Return task to controller
  return task;
};


//===================
//get by id

exports.getTask = async (user, id) => {
  const filter = buildUserFilter(user);

  filter._id = id;

  const task =
    await taskRepository.findOneTask(filter);

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  return task;
};

//===============
// update task
exports.updateTask = async (
  user,
  id,
  updateData
) => {
  const filter = buildUserFilter(user);

  filter._id = id;

  const task = await taskRepository.updateTask(
    filter,
    updateData
  );

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  return task;
};

// ========
// delete task
exports.deleteTask = async (user, id) => {
  const filter = buildUserFilter(user);

  filter._id = id;

  const task =
    await taskRepository.deleteTask(filter);

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  return task;
};