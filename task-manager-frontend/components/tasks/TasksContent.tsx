"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import TaskForm from "./TaskForm";
import { Pencil, Trash2, AlertTriangle } from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useTasks } from "@/hooks/useTasks";
import { useDeleteTask } from "@/hooks/useTaskMutations";
import { TaskListSkeleton } from "@/components/ui/LoadingSkeleton";

export default function TasksContent() {
  // Get tasks from React Query
  const { data: tasks = [], isLoading: loading, isError, error } = useTasks();

  // Delete mutation
  const deleteTask = useDeleteTask();

  // UI state
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("newest");

  // Controls whether Add Task form is visible
  const [showAddForm, setShowAddForm] = useState(false);
const [taskToDelete, setTaskToDelete] = useState<string | null>(
  null,
);
  // Search + Filter + Sort
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Search
    if (search.trim()) {
      const searchText = search.toLowerCase();

      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(searchText) ||
          task.description?.toLowerCase().includes(searchText),
      );
    }

    // Filter
    if (filter === "completed") {
      result = result.filter((task) => task.completed);
    }

    if (filter === "pending") {
      result = result.filter((task) => !task.completed);
    }

    // Sort
    if (sort === "newest") {
      result.sort(
        (a, b) =>
          new Date(b.createdAt || "").getTime() -
          new Date(a.createdAt || "").getTime(),
      );
    }

    if (sort === "oldest") {
      result.sort(
        (a, b) =>
          new Date(a.createdAt || "").getTime() -
          new Date(b.createdAt || "").getTime(),
      );
    }

    if (sort === "title") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [tasks, search, filter, sort]);

  // Delete task
function handleDelete(taskId: string) {
  setTaskToDelete(taskId);
}

function confirmDelete() {
  if (!taskToDelete) {
    return;
  }

  deleteTask.mutate(taskToDelete, {
    onSettled: () => {
      setTaskToDelete(null);
    },
  });
}

function cancelDelete() {
  if (deleteTask.isPending) {
    return;
  }

  setTaskToDelete(null);
}

  return (
    <div>
    <ConfirmDialog
      open={taskToDelete !== null}
      title="Delete Task?"
      message="Are you sure you want to delete this task? This action cannot be undone."
      confirmText="Delete"
      cancelText="Cancel"
      onConfirm={confirmDelete}
      onCancel={cancelDelete}
      loading={deleteTask.isPending}
      icon={<AlertTriangle size={24} />}
    />
    <main className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-6xl">
        {/* Back to Dashboard */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-lg bg-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-400"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black">Tasks</h1>

            <p className="mt-2 text-gray-600">
              Manage and organize your tasks.
            </p>
          </div>

          {/* Add Task Button */}
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="w-full rounded-lg bg-gray-900 px-5 py-3 font-medium text-white shadow-sm transition hover:bg-gray-800 sm:w-auto"
          >
            + Add Task
          </button>
        </div>

        {/* Add Task Form */}
        {showAddForm && (
          <div className="mb-6">
            <TaskForm
              onSuccess={() => {
                setShowAddForm(false);
              }}
              onCancel={() => {
                setShowAddForm(false);
              }}
            />
          </div>
        )}

        {/* Search / Filter / Sort */}
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          {/* Search */}
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-black outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />

          {/* Filter */}
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-black outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Tasks</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>

          {/* Sort */}
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-black outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="title">Title A-Z</option>
          </select>
        </div>

        {/* Loading */}
        {loading && <TaskListSkeleton />}

        {/* Error */}
        {!loading && isError && (
          <div className="rounded-lg bg-white p-8 text-center shadow">
            <p className="font-medium text-red-600">
              {error instanceof Error ? error.message : "Failed to load tasks."}
            </p>
          </div>
        )}

        {/* Empty */}
        {!loading && !isError && filteredTasks.length === 0 && (
          <div className="rounded-lg bg-white p-8 text-center shadow">
            <h2 className="text-xl font-semibold text-black">No tasks found</h2>

            <p className="mt-2 text-gray-600">
              {tasks.length === 0
                ? "You don't have any tasks yet."
                : "No tasks match your search or filter."}
            </p>
          </div>
        )}

        {/* Tasks */}
        {!loading && !isError && filteredTasks.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTasks.map((task) => (
              <div
                key={task._id}
                className="flex min-w-0 flex-col rounded-lg bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                {/* Task Header */}
                <div className="flex items-start justify-between gap-3">
                  <h2 className="min-w-0 break-words text-lg font-semibold text-black sm:text-xl">
                    {task.title}
                  </h2>

                  {/* Status */}
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium sm:px-3 sm:text-sm ${
                      task.completed
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {task.completed ? "Completed" : "Pending"}
                  </span>
                </div>

                {/* Description */}
                {task.description && (
                  <p className="mt-3 break-words text-sm leading-6 text-gray-600 sm:text-base">
                    {task.description}
                  </p>
                )}

                {/* Created Date */}
                {task.createdAt && (
                  <p className="mt-4 text-xs text-gray-400 sm:text-sm">
                    Created {new Date(task.createdAt).toLocaleDateString()}
                  </p>
                )}

                {/* Edit / Delete */}
                <div className="mt-auto flex items-center gap-2 pt-5">
                  {/* Edit */}
                  <Link
                    href={`/tasks/${task._id}/edit`}
                    title="Edit task"
                    aria-label="Edit task"
                    className="rounded-lg p-2.5 text-blue-600 transition hover:bg-blue-50 hover:text-blue-700"
                  >
                    <Pencil size={20} />
                  </Link>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => handleDelete(task._id)}
                    disabled={deleteTask.isPending}
                    title="Delete task"
                    aria-label="Delete task"
                    className="rounded-lg p-2.5 text-red-600 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deleteTask.isPending ? (
                      <span className="text-sm">...</span>
                    ) : (
                      <Trash2 size={20} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
    </div>
  );
}
