// const Task = require("../models/taskModel");
// const asyncHandler = require("express-async-handler");
// const AppError = require("../utils/appError");

// //create task
// const createTask = asyncHandler(async (req, res) => {
//   const task = await Task.create({
//     title: req.body.title,
//     description: req.body.description,
//     completed: req.body.completed,
//     user: req.user._id,
//   });

//   res.status(201).json({
//     status: "success",
//     data: {
//       task,
//     },
//   });
// });
// // get all tasks
// // const getAllTasks = asyncHandler(async (req, res) => {
// //   let tasks;

// //   if (req.user.role === "admin") {
// //     // Admin → get ALL tasks
// //     tasks = await Task.find();
// //   } else {
// //     // Normal user → get ONLY their tasks
// //     tasks = await Task.find({
// //       user: req.user._id,
// //     });
// //   }

// //   if (tasks.length === 0) {
// //     return res.status(200).json({
// //       status: "success",
// //       message: "No tasks found",
// //       results: 0,
// //       data: {
// //         tasks: [],
// //       },
// //     });
// //   }

// //   res.status(200).json({
// //     status: "success",
// //     results: tasks.length,
// //     data: {
// //       tasks,
// //     },
// //   });
// // });

// // get all task with filter
// const getAllTasks = asyncHandler(async (req, res) => {

//   // 1. PAGINATION
//   const page = Number(req.query.page) || 1;
//   const limit = Number(req.query.limit) || 100;
//   const skip = (page - 1) * limit;

//   // 2. FILTER
//   const filter = {};

//   // Normal user → only their tasks
//   // Admin → all users' tasks
//   if (req.user.role !== "admin") {
//     filter.user = req.user._id;
//   }

//   // Optional completed filter
//   if (req.query.completed !== undefined) {
//     filter.completed = req.query.completed === "true";
//   }

//   // 3. SEARCHING
// if (req.query.search) {
//   const searchRegex = new RegExp(req.query.search, "i");

//   filter.$or = [
//     { title: searchRegex },
//     { description: searchRegex },
//   ];
// }

//   // 4. COUNT MATCHING TASKS
//   const totalTasks = await Task.countDocuments(filter);

//   // Calculate total pages
//   const totalPages = Math.ceil(totalTasks / limit);

//   // Check if requested page exists
//   if (page > totalPages && totalPages > 0) {
//     throw new AppError("This page does not exist", 404);
//   }

//   // 5. SORTING
//   const sort = req.query.sort || "-createdAt";

//   // 6. GET TASKS
//   const tasks = await Task.find(filter)
//     .sort(sort)
//     .skip(skip)
//     .limit(limit);


//   // 7. RESPONSE
//   res.status(200).json({
//     status: "success",
//     results: tasks.length,

//     pagination: {
//       currentPage: page,
//       limit,
//       totalTasks,
//       totalPages,
//     },

//     data: {
//       tasks,
//     },
//   });
// });

// //get task by id
// const getTaskById = asyncHandler(async (req, res) => {

//   let task;

//   if (req.user.role === "admin") {
//     // Admin can view any task
//     task = await Task.findById(req.params.id);
//   } else {
//     // Regular user can view only their own task
//     task = await Task.findOne({
//       _id: req.params.id,
//       user: req.user._id,
//     });
//   }
//   // if (!task) {
//   //   return res.status(404).json({
//   //     status: "fail",
//   //     message: "Task not found",
//   //   });
//   // }
//   if (!task) {
//     throw new AppError("Task not found", 404);
//   }

//   res.status(200).json({
//     status: "success",
//     data: {
//       task,
//     },
//   });
// });

// // update task by id
// const updateTask = asyncHandler(async (req, res) => {
//   let task;

//   if (req.user.role === "admin") {
//     // Admin can update any task
//     task = await Task.findByIdAndUpdate(req.params.id, req.body, {
//       returnDocument: "after",
//       runValidators: true,
//     });
//   } else {
//     // Regular user can update only their own task
//     task = await Task.findOneAndUpdate(
//       {
//         _id: req.params.id,
//         user: req.user._id,
//       },
//       req.body,
//     {
//   returnDocument: "after",
//   runValidators: true,
// },
//     );
//   }
//   // if (!task) {
//   //   return res.status(404).json({
//   //     status: "fail",
//   //     message: "Task not found",
//   //   });
//   // }
//   if (!task) {
//     throw new AppError("Task not found", 404);
//   }

//   res.status(200).json({
//     status: "success",
//     data: {
//       task,
//     },
//   });
// });

// // delete task

// const deleteTask = asyncHandler(async (req, res) => {
//   let task;

//   if (req.user.role === "admin") {
//     // Admin can delete any task
//     task = await Task.findByIdAndDelete(req.params.id);
//   } else {
//     // Regular user can delete only their own task
//     task = await Task.findOneAndDelete({
//       _id: req.params.id,
//       user: req.user._id,
//     });
//   }

//   // if (!task) {
//   //   return res.status(404).json({
//   //     status: "fail",
//   //     message: "Task not found",
//   //   });
//   // }
//   if (!task) {
//     throw new AppError("Task not found", 404);
//   }

//   res.status(200).json({
//     status: "success",
//     message: "Task deleted successfully",
//     data: null,
//   });
// });
// module.exports = {
//   createTask,
//   getAllTasks,
//   getTaskById,
//   updateTask,
//   deleteTask,
// };
