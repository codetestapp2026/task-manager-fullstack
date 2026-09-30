import type { QueryFilter } from "mongoose";

import Task = require("../models/taskModel");

import type { ITask } from "../types/task.types";

import type {
  CreateTaskInput,
  UpdateTaskInput,
} from "../validators/taskValidators";

// ========================================
// TYPES
// ========================================

interface FindTasksOptions {
  filter: QueryFilter<ITask>;
  sort: string;
  skip: number;
  limit: number;
}

type CreateTaskData = CreateTaskInput & {
  user: ITask["user"];
};

// ========================================
// FIND MANY TASKS
// ========================================

export const findTasks = async ({
  filter,
  sort,
  skip,
  limit,
}: FindTasksOptions) => {
  return Task.find(filter).sort(sort).skip(skip).limit(limit);
};

// ========================================
// COUNT TASKS
// ========================================

export const countTasks = async (filter: QueryFilter<ITask>) => {
  return Task.countDocuments(filter);
};

// ========================================
// FIND ONE TASK
// ========================================

export const findOneTask = async (filter: QueryFilter<ITask>) => {
  return Task.findOne(filter);
};

// ========================================
// CREATE TASK
// ========================================

export const createTask = async (data: CreateTaskData) => {
  return Task.create(data);
};

// ========================================
// UPDATE TASK
// ========================================

export const updateTask = async (
  filter: QueryFilter<ITask>,
  data: UpdateTaskInput,
) => {
  return Task.findOneAndUpdate(filter, data, {
    returnDocument: "after",
    runValidators: true,
  });
};

// ========================================
// DELETE TASK
// ========================================

export const deleteTask = async (filter: QueryFilter<ITask>) => {
  return Task.findOneAndDelete(filter);
};
