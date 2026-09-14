"use client";

import { FormEvent, useState } from "react";
import type { Task } from "@/types/task";
import {
  useCreateTask,
  useUpdateTask,
} from "@/hooks/useTaskMutations";
import { toast } from "sonner";

type TaskFormProps = {
  task?: Task | null;
  onSuccess: (task: Task) => void;
  onCancel?: () => void;
};

export default function TaskForm({
  task,
  onSuccess,
  onCancel,
}: TaskFormProps) {
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(
    task?.description || "",
  );
  const [completed, setCompleted] = useState(
    task?.completed || false,
  );

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const isEditing = Boolean(task);

  const loading =
    createTask.isPending || updateTask.isPending;

  const error =
    createTask.error || updateTask.error;

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const taskData = {
      title,
      description,
      completed,
    };

    // Update existing task
    if (isEditing && task) {
      updateTask.mutate(
        {
          taskId: task._id,
          taskData,
        },
        {
          onSuccess: (updatedTask) => {
            toast.success(
              "Task updated successfully.",
            );

            onSuccess(updatedTask);
          },

          onError: (error) => {
            toast.error(
              error instanceof Error
                ? error.message
                : "Failed to update task.",
            );
          },
        },
      );

      return;
    }

    // Create new task
    createTask.mutate(taskData, {
      onSuccess: (newTask) => {
        toast.success(
          "Task created successfully.",
        );

        onSuccess(newTask);

        setTitle("");
        setDescription("");
        setCompleted(false);
      },

      onError: (error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to create task.",
        );
      },
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg bg-white p-6 shadow"
    >
      <h2 className="mb-5 text-xl font-semibold text-black">
        {isEditing ? "Edit Task" : "Create Task"}
      </h2>

      {/* Title */}
      <div className="mb-4">
        <label
          htmlFor="title"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Title
        </label>

        <input
          id="title"
          type="text"
          value={title}
          onChange={(event) =>
            setTitle(event.target.value)
          }
          required
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-black outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder="Enter task title"
        />
      </div>

      {/* Description */}
      <div className="mb-4">
        <label
          htmlFor="description"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Description
        </label>

        <textarea
          id="description"
          value={description}
          onChange={(event) =>
            setDescription(event.target.value)
          }
          rows={4}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-black outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder="Enter task description"
        />
      </div>

      {/* Completed */}
      <div className="mb-5 flex items-center gap-2">
        <input
          id="completed"
          type="checkbox"
          checked={completed}
          onChange={(event) =>
            setCompleted(event.target.checked)
          }
          className="h-4 w-4"
        />

        <label
          htmlFor="completed"
          className="text-sm text-gray-700"
        >
          Completed
        </label>
      </div>

      {/* Error */}
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error instanceof Error
            ? error.message
            : "Something went wrong"}
        </p>
      )}

      {/* Buttons */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-gray-900 px-5 py-3 font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {loading
            ? "Saving..."
            : isEditing
              ? "Update Task"
              : "Create Task"}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="w-full rounded-lg border border-gray-300 px-5 py-3 font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}