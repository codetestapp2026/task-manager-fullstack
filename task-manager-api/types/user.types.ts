import type {
  HydratedDocument,
  Types,
} from "mongoose";

export interface IProfileImage {
  url?: string;
  publicId?: string;
}

export interface IUser {
  name: string;
  email: string;
  password: string;
  role: "user" | "admin";
  profileImage?: IProfileImage;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  correctPassword(
    candidatePassword: string,
    userPassword: string
  ): Promise<boolean>;
}

export type UserDocument =
  HydratedDocument<IUser, IUserMethods>;

export type UserId = Types.ObjectId;