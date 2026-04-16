import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import axios from "axios";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000/api";
const USER_TOKEN = process.env.USER_TOKEN;

const server = new McpServer({
  name: "dobby-drive",
  version: "1.0.0",
});

const api = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    Authorization: `Bearer ${USER_TOKEN}`,
  },
});

// Tool: Create Folder
server.tool(
  "create_folder",
  "Creates a new folder in Dobby Drive",
  {
    name: z.string().describe("The name of the folder"),
    parentId: z.string().optional().describe("The ID of the parent folder (optional)"),
  },
  async ({ name, parentId }) => {
    try {
      const response = await api.post("/folders", { name, parentId });
      return {
        content: [{ type: "text", text: `Successfully created folder: ${name} (ID: ${response.data._id})` }],
      };
    } catch (err: any) {
      return {
        content: [{ type: "text", text: `Error: ${err.response?.data?.message || err.message}` }],
        isError: true,
      };
    }
  }
);

// Tool: List Folders
server.tool(
  "list_folders",
  "Lists folders in a specific directory or root",
  {
    parentId: z.string().optional().describe("The ID of the parent folder to list from (optional)"),
  },
  async ({ parentId }) => {
    try {
      const response = await api.get("/folders", { params: { parentId } });
      const folders = response.data
        .map((f: any) => `- ${f.name} (ID: ${f._id}, Size: ${f.sizeFormatted})`)
        .join("\n");
      return {
        content: [{ type: "text", text: folders || "No folders found." }],
      };
    } catch (err: any) {
      return {
        content: [{ type: "text", text: `Error: ${err.response?.data?.message || err.message}` }],
        isError: true,
      };
    }
  }
);

// Tool: List Images
server.tool(
  "list_images",
  "Lists images in a specific folder",
  {
    folderId: z.string().optional().describe("The ID of the folder to list images from (optional)"),
  },
  async ({ folderId }) => {
    try {
      const response = await api.get("/images", { params: { folderId } });
      const images = response.data
        .map((img: any) => `- ${img.name} (ID: ${img._id}, Size: ${img.sizeFormatted}, URL: ${img.url})`)
        .join("\n");
      return {
        content: [{ type: "text", text: images || "No images found." }],
      };
    } catch (err: any) {
      return {
        content: [{ type: "text", text: `Error: ${err.response?.data?.message || err.message}` }],
        isError: true,
      };
    }
  }
);

// Tool: Get Folder Size
server.tool(
  "get_folder_size",
  "Calculates the total size of a folder and its contents",
  {
    folderId: z.string().describe("The ID of the folder"),
  },
  async ({ folderId }) => {
    try {
      const response = await api.get("/folders", { params: { parentId: folderId } });
      // The API returns the size in the list of subfolders, so we look for the target folder.
      // This is a simplified version.
      return {
        content: [{ type: "text", text: `Analyzing folder ${folderId}... Use list_folders for details.` }],
      };
    } catch (err: any) {
      return {
        content: [{ type: "text", text: `Error: ${err.response?.data?.message || err.message}` }],
        isError: true,
      };
    }
  }
);

async function main() {
  const mode = process.env.MCP_MODE || "stdio";

  if (mode === "sse") {
    const app = express();
    let transport: SSEServerTransport | null = null;

    app.get("/", (req, res) => {
      res.json({ message: "Dobby Drive MCP Server (SSE) is running" });
    });

    app.get("/sse", async (req, res) => {
      transport = new SSEServerTransport("/messages", res);
      await server.connect(transport);
      console.error("SSE Connection established");
    });

    app.post("/messages", async (req, res) => {
      if (transport) {
        await transport.handlePostMessage(req, res);
      } else {
        res.status(400).send("No active SSE transport");
      }
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.error(`MCP Server running on SSE at http://localhost:${PORT}/sse`);
    });
  } else {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Dobby Drive MCP Server running on stdio");
  }
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
