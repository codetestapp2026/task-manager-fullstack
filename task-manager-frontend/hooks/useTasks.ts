
"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Task } from "@/types/task";

type TasksResponse = {
  data: {
    tasks: Task[];
  };
};

async function fetchTasks(): Promise<Task[]> {
  const response: TasksResponse = await apiFetch("/tasks");

  return response.data.tasks;
}

export function useTasks() {
  return useQuery({
    queryKey: ["tasks"],
    queryFn: fetchTasks,
  });
}