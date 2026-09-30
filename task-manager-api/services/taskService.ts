import type { QueryFilter } from "mongoose";

import * as taskRepository from "../repositories/taskRepository";

import AppError = require("../utils/appError");

import taskQueue = require("../queues/taskQueue");

import type { UserDocument } from "../types/user.types";

import type { ITask, TaskQuery } from "../types/task.types";

import type {
  CreateTaskInput,
  UpdateTaskInput,
} from "../validators/taskValidators";

// ========================================
// BUILD USER FILTER
// ========================================

const buildUserFilter = (user: UserDocument): QueryFilter<ITask> => {
  const filter: QueryFilter<ITask> = {};

  // Normal user → only their tasks
  // Admin → all users' tasks
  if (user.role !== "admin") {
    filter.user = user._id;
  }

  return filter;
};

// ========================================
// GET ALL TASKS
// ========================================

export const getTasks = async (user: UserDocument, query: TaskQuery) => {
  // 1. PAGINATION
  const page = Number(query.page) || 1;

  const limit = Number(query.limit) || 100;

  const skip = (page - 1) * limit;

  // 2. FILTER
  const filter = buildUserFilter(user);

  if (query.completed !== undefined) {
    filter.completed = query.completed === "true";
  }

  // 3. SEARCH
  if (query.search) {
    const searchRegex = new RegExp(query.search, "i");

    filter.$or = [
      {
        title: searchRegex,
      },
      {
        description: searchRegex,
      },
    ];
  }

  // 4. COUNT TASKS
  const totalTasks = await taskRepository.countTasks(filter);

  const totalPages = Math.ceil(totalTasks / limit);

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

  // 7. RETURN RESULT
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

// ========================================
// CREATE TASK
// ========================================

export const createTask = async (
  user: UserDocument,
  taskData: CreateTaskInput,
) => {
  const task = await taskRepository.createTask({
    ...taskData,
    user: user._id,
  });

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
    },
  );

  return task;
};

// ========================================
// GET TASK BY ID
// ========================================

export const getTask = async (user: UserDocument, id: string) => {
  const filter = buildUserFilter(user);

  filter._id = id;

  const task = await taskRepository.findOneTask(filter);

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  return task;
};

// ========================================
// UPDATE TASK
// ========================================

export const updateTask = async (
  user: UserDocument,
  id: string,
  updateData: UpdateTaskInput,
) => {
  const filter = buildUserFilter(user);

  filter._id = id;

  const task = await taskRepository.updateTask(filter, updateData);

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  return task;
};

// ========================================
// DELETE TASK
// ========================================

export const deleteTask = async (user: UserDocument, id: string) => {
  const filter = buildUserFilter(user);

  filter._id = id;

  const task = await taskRepository.deleteTask(filter);

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  return task;
};
