const { Queue } = require("bullmq");
const redisConnection =
  require("../config/redis");
  
const taskQueue = new Queue(
  "task-notifications",
  {
    connection: redisConnection,
  }
);
module.exports = taskQueue;