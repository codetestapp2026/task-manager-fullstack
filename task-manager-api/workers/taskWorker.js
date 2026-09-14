const { Worker } = require("bullmq");
const redisConnection =
  require("../config/redis");
const logger =
  require("../utils/logger");

const taskWorker = new Worker("task-notifications",async (job) => {

    logger.info(      {
        jobId: job.id,
        jobName: job.name,
        taskId: job.data.taskId,
      },
      "Background job started"
    );

    // Pretend notification takes 3 seconds
    await new Promise((resolve) => {
      setTimeout(resolve, 3000);
    });

    logger.info(
      {
        jobId: job.id,
        taskId: job.data.taskId,
        title: job.data.title,
      },
      "Task notification processed"
    );

    return {
      success: true,
    };
  },

  {
    connection: redisConnection,
  }
);

taskWorker.on("completed", (job) => {
  logger.info(
    {
      jobId: job.id,
    },
    "Background job completed"
  );
});

taskWorker.on("failed", (job, error) => {
  logger.error(
    {
      jobId: job?.id,
      err: error,
    },
    "Background job failed"
  );
});

const shutdown = async () => {
  logger.info("Closing task worker");
  await taskWorker.close();
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

module.exports = taskWorker;