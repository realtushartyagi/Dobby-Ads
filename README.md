# Dobby Drive - Full Stack Image & Folder Management

A production-ready Google Drive-like application for managing images and folders with nested hierarchy support, user-specific access, and recursive folder size calculation.

## 🚀 Features

- **🔐 Secure Authentication**: JWT-based login and signup with password hashing (bcrypt).
- **📁 Nested Folders**: Create infinite levels of nested folders.
- **🖼️ Image Uploads**: Upload images directly into folders with metadata tracking.
- **📊 Recursive Size Calculation**: Automatically sums size of all images in a folder and all its subfolders using MongoDB `$graphLookup`.
- **👤 Isolation**: Users only see and manage their own data.
- **🤖 MCP Integration**: Exposes backend actions as Model Context Protocol (MCP) tools for AI assistants.

## 🛠️ Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, Framer Motion, Lucide React, Axios.
- **Backend**: Node.js, Express, TypeScript, MongoDB (Mongoose), Multer.
- **Bonus**: Model Context Protocol (MCP) SDK.

## 🏁 Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB (Running locally or via Atlas)

### Installation

1. Clone the repository.
2. Run the installation script from the root:
   ```bash
   npm run install:all
   ```

### Running the Application

To run both the frontend and backend concurrently:
```bash
npm run dev
```

- **Frontend**: `http://localhost:5173`
- **Backend**: `http://localhost:5000`

### Running the MCP Server

```bash
cd mcp
npm run start
```

## 🛠️ MCP Configuration

To connect this server to Claude Desktop, add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "dobby-drive": {
      "command": "node",
      "args": ["D:/Dobby assessment/mcp/dist/index.js"],
      "env": {
        "BACKEND_URL": "http://localhost:5000/api",
        "USER_TOKEN": "YOUR_JWT_TOKEN_HERE"
      }
    }
  }
}
```

## 📐 System Design

### Database Schema

- **User**: `id, username, email, password`
- **Folder**: `id, name, parentId, userId`
- **Image**: `id, name, url, size, folderId, userId`

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/login` | Login and receive JWT |
| POST | `/api/folders` | Create a new folder |
| GET | `/api/folders` | List folders (supports `parentId` query) |
| POST | `/api/images/upload`| Upload image to a folder |
| GET | `/api/images` | List images in a folder |

---

Developed for the Dobby Ads Full Stack Developer Assignment.
