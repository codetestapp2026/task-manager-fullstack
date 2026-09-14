const { z } = require("zod");

const signupSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "Name must be at least 3 characters")
      .max(20, "Name cannot exceed 20 characters"),

    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Please provide a valid email"),

    password: z
      .string()
      .min(4, "Password must be at least 4 characters"),
  })
  .strict();

const loginSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Please provide a valid email"),

    password: z
      .string()
      .min(1, "Password is required"),
  })
  .strict();

module.exports = {
  signupSchema,
  loginSchema,
};