"use client";

import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import type { Task } from "@/types/task";
import { toast } from "sonner";

type CreateTaskData = {
  title: string;
  description?: string;
  completed?: boolean;
};

type UpdateTaskData = {
  title: string;
  description?: string;
  completed?: boolean;
};

type TaskResponse = {
  data: {
    task: Task;
  };
};

/*
 * Create Task
 */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      taskData: CreateTaskData,
    ): Promise<Task> => {
      const response: TaskResponse = await apiFetch("/tasks", {
        method: "POST",
        body: JSON.stringify(taskData),
      });

      return response.data.task;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tasks"],
      });

      toast.success("Task created successfully.");
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

/*
 * Update Task
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      taskData,
    }: {
      taskId: string;
      taskData: UpdateTaskData;
    }): Promise<Task> => {
      const response: TaskResponse = await apiFetch(
        `/tasks/${taskId}`,
        {
          method: "PATCH",
          body: JSON.stringify(taskData),
        },
      );

      return response.data.task;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tasks"],
      });

      toast.success("Task updated successfully.");
    },

    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update task.",
      );
    },
  });
}

/*
 * Delete Task
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string): Promise<void> => {
      await apiFetch(`/tasks/${taskId}`, {
        method: "DELETE",
      });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tasks"],
      });

      toast.success("Task deleted successfully.");
    },

    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete task.",
      );
    },
  });
}