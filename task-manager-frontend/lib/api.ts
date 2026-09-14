

// const API_URL = process.env.NEXT_PUBLIC_API_URL;

// export async function apiFetch(
//   endpoint: string,
//   options: RequestInit = {}
// ) {
//   const response = await fetch(`${API_URL}${endpoint}`, {
//     ...options,
//     credentials: "include",
//     headers: {
//       "Content-Type": "application/json",
//       ...options.headers,
//     },
//   });

//   const data = await response.json();

//   if (!response.ok) {
//     throw new Error(data.message || "Something went wrong");
//   }

//   return data;
// }

// day 4 we use
// const API_URL = process.env.NEXT_PUBLIC_API_URL;

// export async function apiFetch(
//   endpoint: string,
//   options: RequestInit = {},
//   retry = true
// ) {
//   let response = await fetch(`${API_URL}${endpoint}`, {
//     ...options,
//     credentials: "include",
//     headers: {
//       "Content-Type": "application/json",
//       ...options.headers,
//     },
//   });

//   // If access token expired, try refresh once
//   if (
//     response.status === 401 &&
//     retry &&
//     endpoint !== "/auth/refresh"
//   ) {
//     const refreshResponse = await fetch(
//       `${API_URL}/auth/refresh`,
//       {
//         method: "POST",
//         credentials: "include",
//       }
//     );

//     // Refresh worked → retry original request
//     if (refreshResponse.ok) {
//       response = await fetch(`${API_URL}${endpoint}`, {
//         ...options,
//         credentials: "include",
//         headers: {
//           "Content-Type": "application/json",
//           ...options.headers,
//         },
//       });
//     }
//   }

//   const data = await response.json();

//   if (!response.ok) {
//     throw new Error(data.message || "Something went wrong");
//   }

//   return data;
// }

// ======================
// was showing error button tadking time to load on page
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {},
  retry = true
) {
  const headers = new Headers(options.headers);

  // Only add Content-Type when sending a body
  if (options.body) {
    headers.set("Content-Type", "application/json");
  }

  let response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers,
  });

  // If access token expired, try refresh once
  if (
    response.status === 401 &&
    retry &&
    endpoint !== "/auth/refresh"
  ) {
    const refreshResponse = await fetch(
      `${API_URL}/auth/refresh`,
      {
        method: "POST",
        credentials: "include",
      }
    );

    // Refresh worked → retry original request
    if (refreshResponse.ok) {
      response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        credentials: "include",
        headers,
      });
    }
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Something went wrong"
    );
  }

  return data;
}