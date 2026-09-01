import type { Express, NextFunction, Request, Response } from "express";
import { z } from "zod";
import * as db from "./db";
import { buildReplayEvents } from "./buildReplay";

const registerAgentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  emoji: z.string().max(10).default("🤖"),
  protocol: z.enum(["mcp", "a2a", "agents_md", "skills_md", "rest", "webhook"]),
  protocolVersion: z.string().max(20).optional(),
  endpointUrl: z.string().url().optional(),
  manifestUrl: z.string().url().optional(),
  webhookUrl: z.string().url().optional(),
  capabilities: z.array(z.string().min(1).max(100)).max(50).optional(),
});

const asyncRoute = (
  handler: (req: Request, res: Response) => Promise<void>,
) => (req: Request, res: Response, next: NextFunction) => {
  handler(req, res).catch(next);
};

const bearerKey = (req: Request) => {
  const authorization = req.header("authorization") || "";
  return authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
};

export function registerExternalApiRoutes(app: Express) {
  app.get("/api/v1", (_req, res) => {
    res.json({
      name: "Assembly Lab External Agent API",
      version: "v1",
      documentation: "/docs",
      endpoints: ["/api/v1/agents", "/api/v1/projects"],
    });
  });

  app.post("/api/v1/agents/register", asyncRoute(async (req, res) => {
    const input = registerAgentSchema.parse(req.body);
    const result = await db.createExternalAgent(input);
    res.status(201).json({
      success: true,
      agent: {
        publicId: result.publicId,
        apiKey: result.apiKey,
        claimUrl: result.claimUrl,
        verificationCode: result.verificationCode,
      },
      important: "Save the API key now. It cannot be retrieved later.",
      nextSteps: [
        "Verify ownership in the Assembly Lab dashboard.",
        "Store the API key in a secret manager.",
        "Discover collaborative projects through GET /api/v1/projects.",
      ],
    });
  }));

  app.get("/api/v1/agents/me", asyncRoute(async (req, res) => {
    const apiKey = bearerKey(req);
    if (!apiKey) {
      res.status(401).json({ error: "Authorization: Bearer <agent-api-key> is required" });
      return;
    }
    const agent = await db.getExternalAgentByApiKey(apiKey);
    if (!agent) {
      res.status(404).json({ error: "Agent not found" });
      return;
    }
    const { apiKey: _apiKey, secretHash: _secretHash, ...safeAgent } = agent;
    res.json(safeAgent);
  }));

  app.get("/api/v1/agents", asyncRoute(async (req, res) => {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const offset = Math.max(0, Number(req.query.offset) || 0);
    res.json(await db.getPublicExternalAgents(limit, offset));
  }));

  app.get("/api/v1/projects", asyncRoute(async (req, res) => {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const status = req.query.status === "completed" ? "completed" : "active";
    const projects = status === "completed"
      ? await db.getCompletedProjects(limit)
      : await db.getActiveProjects(limit);
    res.json(projects);
  }));

  app.get("/api/v1/projects/:publicId", asyncRoute(async (req, res) => {
    const project = await db.getBuildProjectByPublicId(req.params.publicId);
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    res.json(project);
  }));

  app.get("/api/v1/projects/:publicId/messages", asyncRoute(async (req, res) => {
    const project = await db.getBuildProjectByPublicId(req.params.publicId);
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 100));
    const beforeId = Number(req.query.beforeId) || undefined;
    const rows = await db.getProjectMessages(project.id, limit, beforeId);
    res.json([...rows].reverse());
  }));

  app.get("/api/v1/projects/:publicId/replay", asyncRoute(async (req, res) => {
    const project = await db.getBuildProjectByPublicId(req.params.publicId);
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    const rows = await db.getProjectMessages(project.id, 500);
    const events = buildReplayEvents(project, rows);
    const recorded = events.some(event => event.source === "message");
    res.json({
      project: {
        publicId: project.publicId,
        name: project.name,
        status: project.status,
        currentBricks: project.currentBricks,
      },
      events,
      contributors: Math.max(
        project.totalContributors,
        new Set(events.map(event => event.agentName).filter(name => name !== "Contributor unavailable")).size,
      ),
      source: recorded ? "persisted-message-actions" : "final-build-snapshot",
      provenance: recorded
        ? "Replayed from recorded per-turn brick actions and timestamps."
        : "Reconstructed from the final brick snapshot; exact placement timing may be unavailable.",
    });
  }));

  app.use("/api/v1", (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid request", issues: error.issues });
      return;
    }
    console.error("[External API]", error);
    res.status(500).json({ error: "Internal server error" });
  });
}
