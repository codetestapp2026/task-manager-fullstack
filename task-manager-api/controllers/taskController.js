const Task = require("../models/taskModel");
const asyncHandler = require("express-async-handler");
const AppError = require("../utils/appError");
const taskService = require("../services/taskService");

//create task
const createTask = asyncHandler(async (req, res, next) => {
  const task = await taskService.createTask(req.user, req.body);

  res.status(201).json({
    status: "success",

    data: {
      task,
    },
  });
});

//get All Task
const getAllTasks = asyncHandler(async (req, res) => {

  const result = await taskService.getTasks(req.user, req.query);

  res.status(200).json({
    status: "success",
    results: result.tasks.length,

    pagination: result.pagination,

    data: {
      tasks: result.tasks,
    },
  });
});

//get task by id
const getTaskById = asyncHandler(async (req, res, next) => {

  const task = await taskService.getTask(req.user, req.params.id);

  res.status(200).json({
    status: "success",

    data: {
      task,
    },
  });
});
//=============
// update task by id

const updateTask = asyncHandler(async (req, res, next) => {
  const task = await taskService.updateTask(req.user, req.params.id, req.body);

  res.status(200).json({
    status: "success",

    data: {
      task,
    },
  });
});

// delete task

const deleteTask = asyncHandler(async (req, res, next) => {
  await taskService.deleteTask(req.user, req.params.id);

  res.status(204).send();
});
module.exports = {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
};
