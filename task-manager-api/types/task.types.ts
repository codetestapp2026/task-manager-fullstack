import type { Types } from "mongoose";

export interface ITask {
  title: string;
  description?: string;
  completed: boolean;
  user: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskQuery {
  page?: string;
  limit?: string;
  completed?: string;
  search?: string;
  sort?: string;
}