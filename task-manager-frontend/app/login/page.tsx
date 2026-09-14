"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function LoginPage() {
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");

const [message, setMessage] = useState("");
const [error, setError] = useState("");

const router = useRouter();

async function handleSubmit(event: FormEvent<HTMLFormElement>) {
event.preventDefault();
setMessage("");
setError("");

try {
  const data = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });

  setMessage(data.message || "Login successful");

  router.push("/dashboard");
} catch (error) {
  setError(
    error instanceof Error
      ? error.message
      : "Something went wrong",
  );
}


}

return ( <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4"> <div className="w-full max-w-md"> <div className="mb-8 text-center"> <h1 className="text-4xl font-bold tracking-tight text-gray-900">
Welcome back </h1>

      <p className="mt-3 text-base text-gray-500">
        Log in to manage your tasks
      </p>
    </div>

    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg"
    >
      <div className="space-y-5">
        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Email
          </label>

          <input
            id="email"
            type="email"
            placeholder="john@example.com"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            required
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none placeholder:text-gray-400 transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
          />
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Password
          </label>

          <input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            required
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none placeholder:text-gray-400 transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full rounded-lg bg-gray-900 px-4 py-3 font-semibold text-white transition hover:bg-gray-800 active:scale-[0.99]"
        >
          Login
        </button>
      </div>

      {/* Messages */}
      {message && (
        <p className="mt-5 rounded-lg border border-green-200 bg-green-50 p-3 text-center text-sm text-green-700">
          {message}
        </p>
      )}

      {error && (
        <p className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-center text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Signup link */}
      <p className="mt-6 text-center text-sm text-gray-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-gray-900 underline underline-offset-4 transition hover:text-gray-600"
        >
          Create an account
        </Link>
      </p>
    </form>

    <p className="mt-6 text-center text-xs text-gray-400">
      Your information is securely protected.
    </p>
  </div>
</main>


);
}
