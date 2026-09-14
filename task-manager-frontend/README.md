# Task Manager Frontend

A full-stack Task Manager frontend built with Next.js, TypeScript, React, and Tailwind CSS.

The frontend provides user registration, login, logout, protected routes, dashboard functionality, task management, client-side search/filter/sort functionality, loading and error states, and integration with a RESTful Express backend API.

## Screenshots

### Home Page

[View Home Page Screenshot](https://github.com/Eagle-2026/task-manager-frontend/blob/main/public/screenshots/homePage.png)

### Login

[View Login Screenshot](https://github.com/Eagle-2026/task-manager-frontend/blob/main/public/screenshots/login.png)

### Signup

[View Signup Screenshot](https://github.com/Eagle-2026/task-manager-frontend/blob/main/public/screenshots/signup.png)

### Dashboard

[View Dashboard Screenshot](https://github.com/Eagle-2026/task-manager-frontend/blob/main/public/screenshots/dashboard.png)

### After Adding Task

[View Add Task Screenshot](https://github.com/Eagle-2026/task-manager-frontend/blob/main/public/screenshots/after-adding-Task.png)

### Edit Task

[View Edit Task Screenshot](https://github.com/Eagle-2026/task-manager-frontend/blob/main/public/screenshots/editTask.png)

### Delete Task

[View Delete Task Screenshot](https://github.com/Eagle-2026/task-manager-frontend/blob/main/public/screenshots/deleteTask.png)

### Logout

[View Logout Screenshot](https://github.com/Eagle-2026/task-manager-frontend/blob/main/public/screenshots/logOut.png)


## Live Demo

[View Live Application](https://task-manager-frontend-xi-kohl.vercel.app)



## Features

* User registration
* User login
* User logout
* Authentication state handling
* Protected routes
* Automatic redirect to the login page for unauthenticated users
* Dashboard
* Task creation
* Task listing
* Task updating
* Task deletion
* Search tasks by title or description
* Filter tasks by status
* Sort tasks by newest, oldest, or title
* Form state management
* Loading states
* Error handling
* Confirmation dialog before task deletion
* Toast notifications
* REST API integration
* Responsive user interface

## Technologies

* Next.js
* React
* TypeScript
* Tailwind CSS
* TanStack React Query
* Fetch API
* Lucide React
* Sonner

## Application Architecture

The frontend communicates with the Express backend through REST API requests.

```text
User
  ↓
Next.js UI
  ↓
React Components
  ↓
Custom Hooks / API Utility
  ↓
REST API
  ↓
Express Backend
  ↓
MongoDB
```

The backend handles authentication, authorization, validation, and database operations while the frontend handles the user interface, client-side state, and application interactions.

## Authentication

Authentication is handled by the backend using JWT-based authentication with HttpOnly cookies.

The frontend sends authenticated requests with credentials enabled so the browser can include the authentication cookie.

```text
Login
  ↓
Frontend sends credentials
  ↓
Express API verifies user
  ↓
JWT created
  ↓
HttpOnly cookie set
  ↓
Frontend redirects to Dashboard
  ↓
Protected API requests
```

The frontend uses a protected route component to verify authentication before displaying protected pages.

```text
Protected Route
      ↓
GET /api/users/me
      ↓
Authenticated?
   ↙       ↘
 Yes        No
  ↓          ↓
Show Page   Redirect
            /login
```

## Dashboard

The dashboard displays:

* Authenticated user's name
* Total tasks
* Completed tasks
* Pending tasks
* Navigation to the Tasks page
* Logout functionality

Task statistics are calculated from the tasks loaded for the authenticated user.

## Task Management

The Tasks page allows users to:

* Create tasks
* View tasks
* Edit tasks
* Delete tasks
* Search tasks
* Filter tasks
* Sort tasks

### Search

Tasks can be searched by:

* Title
* Description

Search is performed on the tasks loaded into the frontend.

### Filtering

Users can filter tasks by:

* All Tasks
* Pending
* Completed

### Sorting

Users can sort tasks by:

* Newest First
* Oldest First
* Title A-Z

## Data Fetching & Mutations

TanStack React Query is used for task data fetching and mutations.

The application uses custom hooks to separate API/data logic from UI components.

Examples include:

```text
useTasks()
useCreateTask()
useUpdateTask()
useDeleteTask()
```

This keeps task-related server state logic separate from the presentation components.

## API Integration

API requests are centralized through the frontend API utility.

The frontend communicates with endpoints such as:

```text
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/logout
GET  /api/users/me
GET  /api/tasks
POST /api/tasks
GET  /api/tasks/:id
PATCH /api/tasks/:id
DELETE /api/tasks/:id
```

Authenticated requests use:

```text
credentials: "include"
```

so the browser can send the HttpOnly authentication cookie with requests.

## Form Handling

Task forms use React state to manage:

* Title
* Description
* Completed status

The form supports both creating and editing tasks.

The frontend also displays loading and error states during task mutations.

## User Experience

The application provides feedback during user interactions through:

* Loading skeletons
* Error messages
* Confirmation dialogs
* Toast notifications
* Disabled buttons during pending operations

For example, deleting a task requires confirmation before the delete request is sent.

## Project Structure

```text
task-manager-frontend/
│
├── app/
│   ├── Login page
│   ├── Signup page
│   ├── Dashboard page
│   ├── Tasks page
│   └── Other application routes
│
├── components/
│   ├── auth/
│   ├── dashboard/
│   ├── tasks/
│   ├── ui/
│   └── Other reusable components
│
├── hooks/
│   ├── Task data hooks
│   ├── Task mutation hooks
│   └── Other custom hooks
│
├── lib/
│   └── API utility functions
│
├── public/
│   └── Static assets
│
├── types/
│   └── TypeScript types
│
├── .gitignore
├── package.json
├── package-lock.json
├── next.config.ts
├── tsconfig.json
└── README.md
```

## Environment Variables

Create a `.env.local` file in the frontend project:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

For production, update the value to the deployed backend API URL.

Do not commit `.env.local` to GitHub.

## Installation

Clone the repository:

```bash
git clone https://github.com/Eagle-2026/task-manager-frontend.git
```

Navigate into the project:

```bash
cd task-manager-frontend
```

Install dependencies:

```bash
npm install
```

Create a `.env.local` file and configure the backend API URL.

Start the development server:

```bash
npm run dev
```

The frontend will run on the local Next.js development server.

## Backend

This frontend communicates with the Task Manager REST API.

[Task Manager API](https://github.com/Eagle-2026/task-manager-api)

## Related Project

This project is part of a full-stack Task Manager application consisting of two repositories.

### Frontend

Next.js + TypeScript + Tailwind CSS + TanStack React Query

### Backend

Node.js + Express + MongoDB + Mongoose

```text
Frontend
   ↓
REST API
   ↓
Express Backend
   ↓
MongoDB
```

## Future Improvements

* Automated frontend testing
* API error handling improvements
* Enhanced accessibility
* Additional task management features
* Dashboard analytics
* Server-side task pagination integration
* More advanced search and filtering
* Improved loading and error experiences
