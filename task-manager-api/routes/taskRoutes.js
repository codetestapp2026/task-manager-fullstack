// const express = require("express");
// const {
//   createTask,
//   getAllTasks,
//   getTaskById,
//   updateTask,
//   deleteTask
// } = require("../controllers/taskController");
// const { protect } = require("../middleware/authMiddleware");

// const router = express.Router();

// // routes
// router.post("/", protect, createTask);
// router.get("/", protect, getAllTasks);
// router.get("/:id", protect, getTaskById);
// router.patch("/:id", protect, updateTask);
// router.delete("/:id", protect, deleteTask);

// module.exports = router;

// // ============================================
// More structured version
// const express = require("express");
// const {
//   createTask,
//   getAllTasks,
//   getTaskById,
//   updateTask,
//   deleteTask,
// } = require("../controllers/taskController");
// const { protect } = require("../middleware/authMiddleware");
// const validate = require("../middleware/validationMiddleware");
// const {
//   createTaskSchema,
//   updateTaskSchema,
// } = require("../validators/taskValidators");

// const router = express.Router();

// // Routes

// // GET all tasks
// // POST create task
// router
//   .route("/")
//   .get(protect, getAllTasks)
//   .post(protect, validate(createTaskSchema), createTask);

// // GET one task
// // PATCH update task
// // DELETE task
// router
//   .route("/:id")
//   .get(protect, getTaskById)
//   .patch(protect, validate(updateTaskSchema), updateTask)
//   .delete(protect, deleteTask);

// module.exports = router;

// ==================================
// using swagger

const express = require("express");
const {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");
const { protect } = require("../middleware/authMiddleware");
const validate = require("../middleware/validationMiddleware");
const {
  createTaskSchema,
  updateTaskSchema,
} = require("../validators/taskValidators");

const router = express.Router();

// document get
/**
 * @openapi
 * /tasks:
 *   get:
 *     tags:
 *       - Tasks
 *     summary: Get tasks
 *     description: Get tasks belonging to the authenticated user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: completed
 *         schema:
 *           type: boolean
 *         description: Filter by completed status
 *
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search tasks
 *
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sort results
 *
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Number of tasks per page
 *
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
 *       401:
 *         description: Not authenticated
 */

// create document which is post create

/**
 * @openapi
 * /tasks:
 *   post:
 *     tags:
 *       - Tasks
 *     summary: Create a task
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 example: Learn Swagger
 *
 *               description:
 *                 type: string
 *                 example: Document my Task Manager API
 *
 *               completed:
 *                 type: boolean
 *                 example: false
 *
 *     responses:
 *       201:
 *         description: Task created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authenticated
 */

// patch document

/**
 * @openapi
 * /tasks/{id}:
 *   patch:
 *     tags:
 *       - Tasks
 *     summary: Update a task
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Updated task
 *
 *               description:
 *                 type: string
 *
 *               completed:
 *                 type: boolean
 *                 example: true
 *
 *     responses:
 *       200:
 *         description: Task updated successfully
 *       400:
 *         description: Invalid data
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Task not found
 */
//=============
// Document DELETE
/**
 * @openapi
 * /tasks/{id}:
 *   delete:
 *     tags:
 *       - Tasks
 *     summary: Delete a task
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *
 *     responses:
 *       204:
 *         description: Task deleted successfully
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Task not found
 */

//=============
// Routes

// GET all tasks
// POST create task
router
  .route("/")
  .get(protect, getAllTasks)
  .post(protect, validate(createTaskSchema), createTask);

// GET one task
// PATCH update task
// DELETE task
router
  .route("/:id")
  .get(protect, getTaskById)
  .patch(protect, validate(updateTaskSchema), updateTask)
  .delete(protect, deleteTask);

module.exports = router;
