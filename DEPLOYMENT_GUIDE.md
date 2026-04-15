## 1. Finding your USER_TOKEN
Before deploying the MCP server, you need your unique authentication token.

1.  Open your **Dobby Drive** application in Chrome/Edge.
2.  Right-click anywhere and select **Inspect** (or press `F12`).
3.  Go to the **Application** tab at the top.
4.  In the left sidebar, expand **Local Storage** and select your website URL (e.g., `http://localhost:5173`).
5.  Find the key named **`token`**. 
6.  Copy the long string of text under the **Value** column. This is your **`USER_TOKEN`**.

---

## 2. Backend Deployment (Render)
Render is recommended for the Node.js backend.

1.  **Create a Web Service**: Link your GitHub repo.
2.  **Root Directory**: `server`
3.  **Build Command**: `npm install && npm run build`
4.  **Start Command**: `npm run start`
5.  **Environment Variables**:
    - `MONGODB_URI`: (Your MongoDB Atlas connection string)
    - `JWT_SECRET`: (Any strong random string)
    - `PORT`: `5000`
    - `CLOUDINARY_CLOUD_NAME`: (From your Cloudinary dashboard)
    - `CLOUDINARY_API_KEY`: (From your Cloudinary dashboard)
    - `CLOUDINARY_API_SECRET`: (From your Cloudinary dashboard)
    - `NODE_ENV`: `production`

---

## 3. Frontend Deployment (Vercel)
Vercel is the best home for Vite applications.

1.  **New Project**: Link your GitHub repo.
2.  **Root Directory**: `client`
3.  **Framework Preset**: `Vite`
4.  **Environment Variables**:
    - `VITE_API_URL`: (The URL of your live Render backend, e.g., `https://dobby-backend.onrender.com/api`)

---

## 4. MCP Server Deployment (Render)
To make your drive accessible to AI assistants online:

1.  **Create a NEW Web Service** on Render.
2.  **Root Directory**: `mcp` 
3.  **Build Command**: `npm install && npm run build`
4.  **Start Command**: `node dist/index.js`
5.  **Environment Variables**:
    - `PORT`: `3000`
    - `MCP_MODE`: `sse`
    - `BACKEND_URL`: (Your live Render backend URL ending in `/api`)
    - `USER_TOKEN`: (The token you found in Section 1)

---

## 5. Local Claude Desktop Connection
To use Dobby Drive with Claude Desktop locally:

1.  Open your Claude Desktop config (`%APPDATA%\Claude\claude_desktop_config.json`).
2.  Add this to the `mcpServers` object:
    ```json
    "dobby-drive": {
      "command": "node",
      "args": [
        "C:/path/to/dobby-drive/mcp/dist/index.js"
      ],
      "env": {
        "BACKEND_URL": "http://localhost:5000/api",
        "USER_TOKEN": "PASTE_YOUR_TOKEN_HERE"
      }
    }
    ```
3.  Restart Claude Desktop.
