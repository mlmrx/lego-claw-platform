import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Users are verified human owners who can create and manage AI agents.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  // Owner profile fields
  displayName: varchar("displayName", { length: 100 }),
  bio: text("bio"),
  avatarUrl: text("avatarUrl"),
  // Stats
  totalAgents: int("totalAgents").default(0).notNull(),
  totalContributions: int("totalContributions").default(0).notNull(),
  reputation: int("reputation").default(0).notNull(),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Skills - Modular capabilities that agents can have
 * Skills define what an agent can do (design, engineering, color theory, etc.)
 */
export const skills = mysqlTable("skills", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(), // e.g., "structural-engineering"
  name: varchar("name", { length: 100 }).notNull(), // e.g., "Structural Engineering"
  description: text("description"),
  category: mysqlEnum("category", ["design", "engineering", "aesthetics", "specialty", "social"]).notNull(),
  // Skill configuration
  systemPrompt: text("systemPrompt"), // AI prompt that defines this skill's behavior
  capabilities: json("capabilities"), // JSON array of specific capabilities
  icon: varchar("icon", { length: 50 }), // Emoji or icon identifier
  color: varchar("color", { length: 20 }), // Theme color for this skill
  // Skill requirements
  minLevel: int("minLevel").default(1).notNull(), // Minimum agent level to acquire
  isBuiltIn: boolean("isBuiltIn").default(false).notNull(), // System-provided vs user-created
  // Stats
  agentCount: int("agentCount").default(0).notNull(), // How many agents have this skill
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Skill = typeof skills.$inferSelect;
export type InsertSkill = typeof skills.$inferInsert;

/**
 * Agents - AI builders that belong to human owners
 * Each agent has a unique personality, skills, and can collaborate with others
 */
export const agents = mysqlTable("agents", {
  id: int("id").autoincrement().primaryKey(),
  publicId: varchar("publicId", { length: 32 }).notNull().unique(), // Public identifier (nanoid)
  ownerId: int("ownerId").notNull(), // References users.id
  // Identity
  name: varchar("name", { length: 100 }).notNull(),
  emoji: varchar("emoji", { length: 10 }).notNull(),
  color: varchar("color", { length: 20 }).notNull(),
  tagline: varchar("tagline", { length: 200 }), // Short description
  bio: text("bio"), // Full description
  // Personality configuration
  personality: json("personality"), // JSON object with personality traits
  voiceStyle: mysqlEnum("voiceStyle", ["formal", "casual", "enthusiastic", "technical", "creative"]).default("casual"),
  // Status
  status: mysqlEnum("status", ["active", "idle", "building", "thinking", "chatting", "offline"]).default("idle").notNull(),
  isPublic: boolean("isPublic").default(true).notNull(), // Visible to other users
  isVerified: boolean("isVerified").default(false).notNull(), // Verified by platform
  // Stats
  level: int("level").default(1).notNull(),
  experience: int("experience").default(0).notNull(),
  totalBricksPlaced: int("totalBricksPlaced").default(0).notNull(),
  totalBuildsContributed: int("totalBuildsContributed").default(0).notNull(),
  totalMessages: int("totalMessages").default(0).notNull(),
  totalCollaborations: int("totalCollaborations").default(0).notNull(),
  reputation: int("reputation").default(0).notNull(),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastActiveAt: timestamp("lastActiveAt").defaultNow().notNull(),
});

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = typeof agents.$inferInsert;

/**
 * Agent Skills - Junction table linking agents to their skills
 */
export const agentSkills = mysqlTable("agent_skills", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId").notNull(), // References agents.id
  skillId: int("skillId").notNull(), // References skills.id
  // Skill proficiency
  proficiency: int("proficiency").default(1).notNull(), // 1-100 scale
  isActive: boolean("isActive").default(true).notNull(),
  // Timestamps
  acquiredAt: timestamp("acquiredAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AgentSkill = typeof agentSkills.$inferSelect;
export type InsertAgentSkill = typeof agentSkills.$inferInsert;

/**
 * Build Projects - Collaborative LEGO building projects
 */
export const buildProjects = mysqlTable("build_projects", {
  id: int("id").autoincrement().primaryKey(),
  publicId: varchar("publicId", { length: 32 }).notNull().unique(),
  creatorId: int("creatorId").notNull(), // References users.id (human owner who started it)
  // Project details
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  theme: varchar("theme", { length: 50 }), // space, medieval, nature, etc.
  style: varchar("style", { length: 50 }), // realistic, abstract, miniature, etc.
  // Build configuration
  targetBricks: int("targetBricks").default(100).notNull(),
  maxAgents: int("maxAgents").default(8).notNull(),
  isOpenToJoin: boolean("isOpenToJoin").default(true).notNull(),
  // Status
  status: mysqlEnum("status", ["planning", "building", "paused", "completed", "archived"]).default("planning").notNull(),
  // Build data
  brickData: json("brickData"), // JSON array of placed bricks with positions
  currentBricks: int("currentBricks").default(0).notNull(),
  // Stats
  totalContributors: int("totalContributors").default(0).notNull(),
  totalMessages: int("totalMessages").default(0).notNull(),
  likes: int("likes").default(0).notNull(),
  views: int("views").default(0).notNull(),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type BuildProject = typeof buildProjects.$inferSelect;
export type InsertBuildProject = typeof buildProjects.$inferInsert;

/**
 * Project Participants - Agents participating in build projects
 */
export const projectParticipants = mysqlTable("project_participants", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(), // References buildProjects.id
  agentId: int("agentId").notNull(), // References agents.id
  // Participation details
  role: mysqlEnum("role", ["lead", "contributor", "observer"]).default("contributor").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  // Contribution stats
  bricksPlaced: int("bricksPlaced").default(0).notNull(),
  messagesCount: int("messagesCount").default(0).notNull(),
  // Status
  isActive: boolean("isActive").default(true).notNull(),
  lastContributedAt: timestamp("lastContributedAt").defaultNow().notNull(),
});

export type ProjectParticipant = typeof projectParticipants.$inferSelect;
export type InsertProjectParticipant = typeof projectParticipants.$inferInsert;

/**
 * Agent Messages - Communication between agents in projects
 */
export const agentMessages = mysqlTable("agent_messages", {
  id: int("id").autoincrement().primaryKey(),
  publicId: varchar("publicId", { length: 32 }).notNull().unique(),
  projectId: int("projectId").notNull(), // References buildProjects.id
  agentId: int("agentId").notNull(), // References agents.id
  // Message content
  content: text("content").notNull(),
  messageType: mysqlEnum("messageType", ["idea", "action", "reaction", "question", "celebration", "system"]).default("idea").notNull(),
  // Reply threading
  replyToId: int("replyToId"), // References agentMessages.id
  mentionedAgentIds: json("mentionedAgentIds"), // JSON array of agent IDs mentioned
  // Associated action
  brickAction: json("brickAction"), // JSON object if this message resulted in brick placement
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AgentMessage = typeof agentMessages.$inferSelect;
export type InsertAgentMessage = typeof agentMessages.$inferInsert;

/**
 * Collaboration Requests - Agents requesting to collaborate with others
 */
export const collaborationRequests = mysqlTable("collaboration_requests", {
  id: int("id").autoincrement().primaryKey(),
  publicId: varchar("publicId", { length: 32 }).notNull().unique(),
  fromAgentId: int("fromAgentId").notNull(), // References agents.id
  toAgentId: int("toAgentId").notNull(), // References agents.id
  projectId: int("projectId"), // References buildProjects.id (optional)
  // Request details
  message: text("message"),
  requestType: mysqlEnum("requestType", ["join_project", "skill_help", "collaboration", "mentorship"]).notNull(),
  // Status
  status: mysqlEnum("status", ["pending", "accepted", "declined", "expired"]).default("pending").notNull(),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  respondedAt: timestamp("respondedAt"),
  expiresAt: timestamp("expiresAt"),
});

export type CollaborationRequest = typeof collaborationRequests.$inferSelect;
export type InsertCollaborationRequest = typeof collaborationRequests.$inferInsert;

/**
 * Agent Follows - Agents/owners following other agents
 */
export const agentFollows = mysqlTable("agent_follows", {
  id: int("id").autoincrement().primaryKey(),
  followerId: int("followerId").notNull(), // Can be user or agent
  followerType: mysqlEnum("followerType", ["user", "agent"]).notNull(),
  followingAgentId: int("followingAgentId").notNull(), // References agents.id
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AgentFollow = typeof agentFollows.$inferSelect;
export type InsertAgentFollow = typeof agentFollows.$inferInsert;

/**
 * Activity Feed - Platform-wide activity stream
 */
export const activityFeed = mysqlTable("activity_feed", {
  id: int("id").autoincrement().primaryKey(),
  publicId: varchar("publicId", { length: 32 }).notNull().unique(),
  // Actor
  actorType: mysqlEnum("actorType", ["user", "agent", "system"]).notNull(),
  actorId: int("actorId"), // References users.id or agents.id
  // Activity
  activityType: mysqlEnum("activityType", [
    "agent_created",
    "agent_skill_acquired",
    "project_created",
    "project_completed",
    "brick_placed",
    "collaboration_started",
    "milestone_reached",
    "message_sent"
  ]).notNull(),
  // Context
  projectId: int("projectId"), // References buildProjects.id
  agentId: int("agentId"), // References agents.id
  metadata: json("metadata"), // Additional context data
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActivityFeedItem = typeof activityFeed.$inferSelect;
export type InsertActivityFeedItem = typeof activityFeed.$inferInsert;
