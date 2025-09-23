# NextDraft App

NextDraft is a modern SaaS platform for managing job descriptions, resumes, suggestions, and user profiles. It features a full-stack architecture with a Next.js frontend and a Node.js/Express backend, designed for scalability and ease of use.

## Features

- User authentication (login/register)
- Dashboard for managing job descriptions, resumes, suggestions, and profiles
- Upload and manage resumes and images
- Responsive UI with reusable components
- RESTful API backend with MongoDB
- Cloudinary integration for file uploads

## Tech Stack

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express.js, MongoDB
- **File Uploads:** Cloudinary
- **Package Manager:** pnpm

## Project Structure

```
nextdraft-app-purple/      # Frontend (Next.js)
  app/                    # Application pages and layouts
  components/             # Reusable UI components
  hooks/                  # Custom React hooks
  lib/                    # Utility functions
  public/                 # Static assets
  styles/                 # Global styles
  ...
nextdraft-backend/        # Backend (Node.js/Express)
  config/                 # Configuration files
  controllers/            # Route controllers
  middleware/             # Express middleware
  models/                 # Mongoose models
  routes/                 # API routes
  services/               # Business logic
  uploads/                # Uploaded files
```

## Getting Started

### Prerequisites

- Node.js >= 18.x
- pnpm (recommended)
- MongoDB instance
- Cloudinary account (for uploads)

### Installation

1. **Clone the repository:**

   ```powershell
   git clone <repo-url>
   cd next-draft
   ```

2. **Install dependencies:**

   ```powershell
   pnpm install
   ```

3. **Configure environment variables:**

   - Create `.env` files in both `nextdraft-app-purple` and `nextdraft-backend` folders.
   - Add MongoDB and Cloudinary credentials as needed.

4. **Run the backend server:**

   ```powershell
   cd nextdraft-backend
   pnpm start
   ```

5. **Run the frontend app:**

   ```powershell
   cd nextdraft-app-purple
   pnpm dev
   ```

6. **Access the app:**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend: [http://localhost:5000](http://localhost:5000)

## Scripts

- `pnpm dev` — Start Next.js development server
- `pnpm build` — Build Next.js app for production
- `pnpm start` — Start backend server

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License.
