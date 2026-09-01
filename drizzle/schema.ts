import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean, unique } from "drizzle-orm/mysql-core";

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
  // Source image (for user-uploaded LEGO set builds)
  sourceImageUrl: text("sourceImageUrl"), // URL of uploaded LEGO box/set image
  legoSetInfo: json("legoSetInfo"), // AI-analyzed info: { setNumber, setName, pieceCount, estimatedDifficulty, colors, features }
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


/**
 * Build Templates - Saved build designs that can be reused
 */
export const buildTemplates = mysqlTable("build_templates", {
  id: int("id").autoincrement().primaryKey(),
  publicId: varchar("publicId", { length: 32 }).notNull().unique(),
  creatorId: int("creatorId").notNull(), // References users.id
  sourceProjectId: int("sourceProjectId"), // References buildProjects.id (if created from a project)
  // Template details
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  theme: varchar("theme", { length: 50 }),
  style: varchar("style", { length: 50 }),
  difficulty: mysqlEnum("difficulty", ["beginner", "intermediate", "advanced", "expert"]).default("intermediate"),
  // Build data
  brickData: json("brickData").notNull(), // JSON array of brick positions and colors
  totalBricks: int("totalBricks").default(0).notNull(),
  previewImage: text("previewImage"), // URL to preview image
  // Visibility
  isPublic: boolean("isPublic").default(true).notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  // Stats
  usageCount: int("usageCount").default(0).notNull(),
  likes: int("likes").default(0).notNull(),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BuildTemplate = typeof buildTemplates.$inferSelect;
export type InsertBuildTemplate = typeof buildTemplates.$inferInsert;

/**
 * Building Challenges - Timed competitions for agents
 */
export const buildingChallenges = mysqlTable("building_challenges", {
  id: int("id").autoincrement().primaryKey(),
  publicId: varchar("publicId", { length: 32 }).notNull().unique(),
  creatorId: int("creatorId"), // References users.id (null for system challenges)
  // Challenge details
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  theme: varchar("theme", { length: 50 }),
  rules: text("rules"),
  // Challenge type
  challengeType: mysqlEnum("challengeType", ["speed", "creativity", "collaboration", "precision", "themed"]).default("creativity").notNull(),
  mode: mysqlEnum("mode", ["solo", "team", "versus"]).default("solo").notNull(),
  // Timing
  durationMinutes: int("durationMinutes").default(30).notNull(),
  startsAt: timestamp("startsAt"),
  endsAt: timestamp("endsAt"),
  // Requirements
  minAgents: int("minAgents").default(1).notNull(),
  maxAgents: int("maxAgents").default(10).notNull(),
  minLevel: int("minLevel").default(1).notNull(),
  requiredSkills: json("requiredSkills"), // JSON array of skill IDs
  // Rewards
  experienceReward: int("experienceReward").default(100).notNull(),
  reputationReward: int("reputationReward").default(50).notNull(),
  // Status
  status: mysqlEnum("status", ["upcoming", "active", "voting", "completed", "cancelled"]).default("upcoming").notNull(),
  // Stats
  participantCount: int("participantCount").default(0).notNull(),
  submissionCount: int("submissionCount").default(0).notNull(),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BuildingChallenge = typeof buildingChallenges.$inferSelect;
export type InsertBuildingChallenge = typeof buildingChallenges.$inferInsert;

/**
 * Challenge Participants - Agents participating in challenges
 */
export const challengeParticipants = mysqlTable("challenge_participants", {
  id: int("id").autoincrement().primaryKey(),
  challengeId: int("challengeId").notNull(), // References buildingChallenges.id
  agentId: int("agentId").notNull(), // References agents.id
  teamId: int("teamId"), // For team challenges
  // Submission
  submissionData: json("submissionData"), // JSON with build data
  submittedAt: timestamp("submittedAt"),
  // Scoring
  score: int("score").default(0).notNull(),
  rank: int("rank"),
  // Timestamps
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type ChallengeParticipant = typeof challengeParticipants.$inferSelect;
export type InsertChallengeParticipant = typeof challengeParticipants.$inferInsert;

/**
 * Notifications - Alerts for owners about their agents
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  publicId: varchar("publicId", { length: 32 }).notNull().unique(),
  userId: int("userId").notNull(), // References users.id (owner to notify)
  // Notification content
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  notificationType: mysqlEnum("notificationType", [
    "collaboration_request",
    "build_completed",
    "level_up",
    "skill_acquired",
    "challenge_started",
    "challenge_ended",
    "challenge_won",
    "agent_mentioned",
    "template_used",
    "follower_gained",
    "achievement_unlocked",
    "system"
  ]).notNull(),
  // Related entities
  agentId: int("agentId"), // References agents.id
  projectId: int("projectId"), // References buildProjects.id
  challengeId: int("challengeId"), // References buildingChallenges.id
  // Metadata
  metadata: json("metadata"), // Additional context data
  actionUrl: text("actionUrl"), // URL to navigate to
  // Status
  isRead: boolean("isRead").default(false).notNull(),
  isArchived: boolean("isArchived").default(false).notNull(),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  readAt: timestamp("readAt"),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;


/**
 * API Keys - BYOK (Bring Your Own Key) for AI services
 * Owners store their own API keys for AI providers
 */
export const apiKeys = mysqlTable("api_keys", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // References users.id
  // Provider info
  provider: mysqlEnum("provider", ["openai", "anthropic", "google", "mistral", "groq", "together", "custom"]).notNull(),
  providerName: varchar("providerName", { length: 100 }), // Custom provider name
  // Key storage (encrypted in practice)
  encryptedKey: text("encryptedKey").notNull(), // Encrypted API key
  keyHint: varchar("keyHint", { length: 20 }), // Last 4 chars for identification
  // Configuration
  baseUrl: text("baseUrl"), // Custom base URL for API
  defaultModel: varchar("defaultModel", { length: 100 }), // Preferred model
  // Usage tracking
  totalCalls: int("totalCalls").default(0).notNull(),
  lastUsedAt: timestamp("lastUsedAt"),
  // Status
  isActive: boolean("isActive").default(true).notNull(),
  isValid: boolean("isValid").default(true).notNull(), // Set to false if key fails
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;

/**
 * External Agents - Agents registered from external platforms
 * Supports MCP, A2A, Agents.md, Skills.md protocols
 */
export const externalAgents = mysqlTable("external_agents", {
  id: int("id").autoincrement().primaryKey(),
  publicId: varchar("publicId", { length: 32 }).notNull().unique(),
  ownerId: int("ownerId"), // References users.id (null until claimed)
  // Agent identity
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  emoji: varchar("emoji", { length: 10 }).default("🤖"),
  // Protocol info
  protocol: mysqlEnum("protocol", ["mcp", "a2a", "agents_md", "skills_md", "rest", "webhook"]).notNull(),
  protocolVersion: varchar("protocolVersion", { length: 20 }),
  // Connection details
  endpointUrl: text("endpointUrl"), // Agent's API endpoint
  manifestUrl: text("manifestUrl"), // URL to agent's manifest file
  webhookUrl: text("webhookUrl"), // Webhook for notifications
  // Authentication
  apiKey: varchar("apiKey", { length: 64 }).notNull().unique(), // Platform-issued key for this agent
  secretHash: varchar("secretHash", { length: 128 }), // Hashed secret for webhook verification
  // Verification
  verificationStatus: mysqlEnum("verificationStatus", ["pending", "verified", "rejected", "expired"]).default("pending").notNull(),
  verificationCode: varchar("verificationCode", { length: 32 }), // Code for X post verification
  verificationTweetUrl: text("verificationTweetUrl"), // URL to verification tweet
  verifiedAt: timestamp("verifiedAt"),
  // Capabilities
  capabilities: json("capabilities"), // JSON array of supported actions
  supportedSkills: json("supportedSkills"), // JSON array of skill IDs
  // Rate limits
  rateLimit: int("rateLimit").default(100).notNull(), // Requests per minute
  dailyLimit: int("dailyLimit").default(10000).notNull(), // Requests per day
  // Stats
  totalRequests: int("totalRequests").default(0).notNull(),
  totalBricksPlaced: int("totalBricksPlaced").default(0).notNull(),
  totalMessages: int("totalMessages").default(0).notNull(),
  reputation: int("reputation").default(0).notNull(),
  // Status
  status: mysqlEnum("status", ["active", "inactive", "suspended", "banned"]).default("inactive").notNull(),
  lastActiveAt: timestamp("lastActiveAt"),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ExternalAgent = typeof externalAgents.$inferSelect;
export type InsertExternalAgent = typeof externalAgents.$inferInsert;

/**
 * Agent Webhooks - Webhook subscriptions for external agents
 */
export const agentWebhooks = mysqlTable("agent_webhooks", {
  id: int("id").autoincrement().primaryKey(),
  externalAgentId: int("externalAgentId").notNull(), // References externalAgents.id
  // Webhook details
  url: text("url").notNull(),
  events: json("events").notNull(), // JSON array of event types to subscribe to
  // Security
  secret: varchar("secret", { length: 64 }), // Shared secret for HMAC verification
  // Status
  isActive: boolean("isActive").default(true).notNull(),
  failureCount: int("failureCount").default(0).notNull(),
  lastDeliveredAt: timestamp("lastDeliveredAt"),
  lastFailedAt: timestamp("lastFailedAt"),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AgentWebhook = typeof agentWebhooks.$inferSelect;
export type InsertAgentWebhook = typeof agentWebhooks.$inferInsert;

/**
 * Platform API Keys - Keys issued to developers for API access
 */
export const platformApiKeys = mysqlTable("platform_api_keys", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // References users.id
  // Key details
  name: varchar("name", { length: 100 }).notNull(), // Friendly name
  keyHash: varchar("keyHash", { length: 128 }).notNull().unique(), // Hashed API key
  keyPrefix: varchar("keyPrefix", { length: 12 }).notNull(), // First 8 chars for identification (e.g., "lego_live_")
  // Permissions
  permissions: json("permissions"), // JSON array of allowed actions
  scopes: json("scopes"), // JSON array of scopes (read, write, admin)
  // Rate limits
  rateLimit: int("rateLimit").default(1000).notNull(), // Requests per minute
  dailyLimit: int("dailyLimit").default(100000).notNull(), // Requests per day
  // Usage tracking
  totalRequests: int("totalRequests").default(0).notNull(),
  lastUsedAt: timestamp("lastUsedAt"),
  // Status
  isActive: boolean("isActive").default(true).notNull(),
  expiresAt: timestamp("expiresAt"),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  revokedAt: timestamp("revokedAt"),
});

export type PlatformApiKey = typeof platformApiKeys.$inferSelect;
export type InsertPlatformApiKey = typeof platformApiKeys.$inferInsert;

/**
 * Webhook Events - Log of webhook deliveries
 */
export const webhookEvents = mysqlTable("webhook_events", {
  id: int("id").autoincrement().primaryKey(),
  webhookId: int("webhookId").notNull(), // References agentWebhooks.id
  // Event details
  eventType: varchar("eventType", { length: 50 }).notNull(),
  payload: json("payload").notNull(), // JSON payload sent
  // Delivery status
  status: mysqlEnum("status", ["pending", "delivered", "failed", "retrying"]).default("pending").notNull(),
  statusCode: int("statusCode"), // HTTP response code
  responseBody: text("responseBody"), // Response from webhook
  // Retry info
  attempts: int("attempts").default(0).notNull(),
  nextRetryAt: timestamp("nextRetryAt"),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  deliveredAt: timestamp("deliveredAt"),
});

export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type InsertWebhookEvent = typeof webhookEvents.$inferInsert;


/**
 * Badges - Achievement badges that can be earned
 */
export const badges = mysqlTable("badges", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }).notNull(), // Emoji or icon
  color: varchar("color", { length: 20 }).notNull(), // Badge color
  category: mysqlEnum("category", ["building", "collaboration", "creativity", "milestone", "special"]).notNull(),
  // Requirements
  requirement: json("requirement"), // JSON object with achievement criteria
  threshold: int("threshold").default(1).notNull(), // Value needed to earn
  // Rarity
  rarity: mysqlEnum("rarity", ["common", "uncommon", "rare", "epic", "legendary"]).default("common").notNull(),
  // Stats
  earnedCount: int("earnedCount").default(0).notNull(),
  // Status
  isActive: boolean("isActive").default(true).notNull(),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Badge = typeof badges.$inferSelect;
export type InsertBadge = typeof badges.$inferInsert;

/**
 * User Badges - Badges earned by users
 */
export const userBadges = mysqlTable("user_badges", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // References users.id
  badgeId: int("badgeId").notNull(), // References badges.id
  // Progress
  progress: int("progress").default(0).notNull(), // Current progress toward badge
  // Timestamps
  earnedAt: timestamp("earnedAt").defaultNow().notNull(),
});

export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserBadge = typeof userBadges.$inferInsert;

/**
 * Agent Badges - Badges earned by agents
 */
export const agentBadges = mysqlTable("agent_badges", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId").notNull(), // References agents.id
  badgeId: int("badgeId").notNull(), // References badges.id
  // Progress
  progress: int("progress").default(0).notNull(),
  // Timestamps
  earnedAt: timestamp("earnedAt").defaultNow().notNull(),
});

export type AgentBadge = typeof agentBadges.$inferSelect;
export type InsertAgentBadge = typeof agentBadges.$inferInsert;

/**
 * Donations - Track donations to the platform
 */
export const donations = mysqlTable("donations", {
  id: int("id").autoincrement().primaryKey(),
  publicId: varchar("publicId", { length: 32 }).notNull().unique(),
  // Donor info (optional - can be anonymous)
  userId: int("userId"), // References users.id (null for anonymous)
  donorName: varchar("donorName", { length: 100 }), // Display name
  // Transaction details
  transactionId: varchar("transactionId", { length: 128 }).notNull().unique(), // Blockchain tx ID
  walletAddress: varchar("walletAddress", { length: 64 }), // Donor's wallet
  // Amount
  amount: varchar("amount", { length: 50 }).notNull(), // Amount in SOL
  amountUsd: varchar("amountUsd", { length: 20 }), // USD equivalent at time of donation
  // Sponsorship
  sponsoredAgentId: int("sponsoredAgentId"), // References agents.id (for Sponsor a Builder)
  sponsorMessage: text("sponsorMessage"), // Optional message from sponsor
  // Status
  status: mysqlEnum("status", ["pending", "confirmed", "failed"]).default("pending").notNull(),
  // Visibility
  isPublic: boolean("isPublic").default(true).notNull(), // Show in public thank you list
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  confirmedAt: timestamp("confirmedAt"),
});

export type Donation = typeof donations.$inferSelect;
export type InsertDonation = typeof donations.$inferInsert;

/**
 * Platform Stats - Aggregate platform statistics
 */
export const platformStats = mysqlTable("platform_stats", {
  id: int("id").autoincrement().primaryKey(),
  statKey: varchar("statKey", { length: 64 }).notNull().unique(),
  statValue: varchar("statValue", { length: 100 }).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlatformStat = typeof platformStats.$inferSelect;
export type InsertPlatformStat = typeof platformStats.$inferInsert;


/**
 * Audit Logs - Track sensitive operations for security monitoring
 */
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  // Actor information
  userId: int("userId"), // References users.id (null for system/anonymous actions)
  userOpenId: varchar("userOpenId", { length: 64 }), // Backup identifier
  // Action details
  action: mysqlEnum("action", [
    // API Key operations
    "api_key_created",
    "api_key_deleted",
    "api_key_rotated",
    // Agent operations
    "agent_created",
    "agent_deleted",
    "agent_transferred",
    // External agent operations
    "external_agent_registered",
    "external_agent_verified",
    "external_agent_claimed",
    "external_agent_deleted",
    // Webhook operations
    "webhook_created",
    "webhook_deleted",
    "webhook_secret_rotated",
    // Authentication
    "login_success",
    "login_failed",
    "logout",
    "ip_blocked",
    "ip_unblocked",
    // Admin operations
    "admin_role_granted",
    "admin_role_revoked",
    "user_banned",
    "user_unbanned",
    // Data operations
    "data_exported",
    "data_deleted",
    // System
    "system_config_changed"
  ]).notNull(),
  // Target entity
  entityType: mysqlEnum("entityType", [
    "user",
    "agent",
    "external_agent",
    "api_key",
    "webhook",
    "project",
    "challenge",
    "system"
  ]),
  entityId: int("entityId"), // ID of the affected entity
  entityPublicId: varchar("entityPublicId", { length: 64 }), // Public ID for reference
  // Request context
  ipAddress: varchar("ipAddress", { length: 45 }), // IPv4 or IPv6
  userAgent: text("userAgent"),
  requestId: varchar("requestId", { length: 64 }), // Unique request identifier
  // Additional details
  details: json("details"), // JSON object with additional context
  previousValue: json("previousValue"), // State before change (for updates)
  newValue: json("newValue"), // State after change (for updates)
  // Result
  status: mysqlEnum("status", ["success", "failure", "partial"]).default("success").notNull(),
  errorMessage: text("errorMessage"), // Error details if failed
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;


/**
 * Social Streaming Integrations - Connect to streaming platforms
 * Supports Twitch, YouTube Live, X/Twitter, Discord, Kick, etc.
 * Users and agents can add their own API keys for streaming.
 */
export const socialIntegrations = mysqlTable("social_integrations", {
  id: int("id").autoincrement().primaryKey(),
  publicId: varchar("publicId", { length: 32 }).notNull().unique(),
  // Owner - either a user or an external agent
  userId: int("userId"), // References users.id (for user-owned integrations)
  externalAgentId: int("externalAgentId"), // References external_agents.id (for agent-owned)
  // Platform info
  platform: mysqlEnum("platform", [
    "twitch",
    "youtube",
    "twitter",
    "discord",
    "kick",
    "tiktok",
    "facebook",
    "instagram",
    "custom"
  ]).notNull(),
  platformName: varchar("platformName", { length: 100 }), // Custom platform name
  // Credentials (encrypted)
  encryptedApiKey: text("encryptedApiKey"), // Primary API key/token
  encryptedApiSecret: text("encryptedApiSecret"), // API secret if needed
  encryptedAccessToken: text("encryptedAccessToken"), // OAuth access token
  encryptedRefreshToken: text("encryptedRefreshToken"), // OAuth refresh token
  keyHint: varchar("keyHint", { length: 20 }), // Last 4 chars for identification
  // Platform-specific identifiers
  platformUserId: varchar("platformUserId", { length: 128 }), // User ID on the platform
  platformUsername: varchar("platformUsername", { length: 128 }), // Username on platform
  channelId: varchar("channelId", { length: 128 }), // Channel/stream ID
  channelUrl: text("channelUrl"), // URL to the channel
  // Configuration
  streamSettings: json("streamSettings"), // Platform-specific settings (quality, title template, etc.)
  autoStream: boolean("autoStream").default(false).notNull(), // Auto-start streaming on builds
  notifyOnLive: boolean("notifyOnLive").default(true).notNull(), // Notify when going live
  // Permissions
  scopes: json("scopes"), // OAuth scopes granted
  permissions: json("permissions"), // What this integration can do
  // Status
  isActive: boolean("isActive").default(true).notNull(),
  isVerified: boolean("isVerified").default(false).notNull(), // Credentials verified
  lastVerifiedAt: timestamp("lastVerifiedAt"),
  // Usage tracking
  totalStreams: int("totalStreams").default(0).notNull(),
  totalViewers: int("totalViewers").default(0).notNull(),
  lastStreamedAt: timestamp("lastStreamedAt"),
  // Token management
  tokenExpiresAt: timestamp("tokenExpiresAt"),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SocialIntegration = typeof socialIntegrations.$inferSelect;
export type InsertSocialIntegration = typeof socialIntegrations.$inferInsert;

/**
 * Integration Events - Log of streaming events
 */
export const integrationEvents = mysqlTable("integration_events", {
  id: int("id").autoincrement().primaryKey(),
  integrationId: int("integrationId").notNull(), // References social_integrations.id
  // Event details
  eventType: mysqlEnum("eventType", [
    "stream_started",
    "stream_ended",
    "viewer_joined",
    "chat_message",
    "donation_received",
    "subscription",
    "raid",
    "host",
    "follow",
    "error",
    "token_refreshed",
    "credentials_updated"
  ]).notNull(),
  // Event data
  payload: json("payload"), // Event-specific data
  // Metrics
  viewerCount: int("viewerCount"),
  duration: int("duration"), // Duration in seconds (for stream_ended)
  // Status
  status: mysqlEnum("status", ["success", "failure"]).default("success").notNull(),
  errorMessage: text("errorMessage"),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type IntegrationEvent = typeof integrationEvents.$inferSelect;
export type InsertIntegrationEvent = typeof integrationEvents.$inferInsert;

/**
 * Durable multi-platform broadcast schedules. Destinations contain only
 * integration public IDs; encrypted credentials remain in social_integrations.
 */
export const streamSchedules = mysqlTable("stream_schedules", {
  id: int("id").autoincrement().primaryKey(),
  publicId: varchar("publicId", { length: 32 }).notNull().unique(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  buildSessionId: varchar("buildSessionId", { length: 64 }).notNull(),
  cronExpression: varchar("cronExpression", { length: 120 }).notNull(),
  integrationPublicIds: json("integrationPublicIds").notNull(),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  isEnabled: boolean("isEnabled").default(true).notNull(),
  lastRunAt: timestamp("lastRunAt"),
  lastRunStatus: mysqlEnum("lastRunStatus", ["never", "configured", "skipped", "failed"]).default("never").notNull(),
  lastSessionId: varchar("lastSessionId", { length: 64 }),
  lastError: text("lastError"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StreamSchedule = typeof streamSchedules.$inferSelect;
export type InsertStreamSchedule = typeof streamSchedules.$inferInsert;

/** Historical snapshots of the session-management telemetry we can verify. */
export const streamAnalytics = mysqlTable("stream_analytics", {
  id: int("id").autoincrement().primaryKey(),
  publicId: varchar("publicId", { length: 32 }).notNull().unique(),
  userId: int("userId").notNull(),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  buildSessionId: varchar("buildSessionId", { length: 64 }).notNull(),
  status: mysqlEnum("status", ["configured", "stopped", "failed"]).notNull(),
  destinationCount: int("destinationCount").default(0).notNull(),
  totalViewers: int("totalViewers").default(0).notNull(),
  platformBreakdown: json("platformBreakdown"),
  chatMessageCount: int("chatMessageCount").default(0).notNull(),
  startedAt: timestamp("startedAt"),
  endedAt: timestamp("endedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StreamAnalytic = typeof streamAnalytics.$inferSelect;
export type InsertStreamAnalytic = typeof streamAnalytics.$inferInsert;

/**
 * Cross-platform highlight markers. These preserve timestamps and source
 * context; they do not claim to contain encoded video without a relay.
 */
export const streamClips = mysqlTable("stream_clips", {
  id: int("id").autoincrement().primaryKey(),
  publicId: varchar("publicId", { length: 32 }).notNull().unique(),
  userId: int("userId").notNull(),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  buildSessionId: varchar("buildSessionId", { length: 64 }).notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  startSeconds: int("startSeconds").notNull(),
  endSeconds: int("endSeconds").notNull(),
  platforms: json("platforms").notNull(),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StreamClip = typeof streamClips.$inferSelect;
export type InsertStreamClip = typeof streamClips.$inferInsert;


/**
 * Build Ratings - User ratings for LEGO builds
 * Allows users to rate builds on multiple dimensions
 */
export const buildRatings = mysqlTable("build_ratings", {
  id: int("id").autoincrement().primaryKey(),
  publicId: varchar("publicId", { length: 32 }).notNull().unique(),
  // References
  buildId: int("buildId").notNull(), // References builds.id
  userId: int("userId").notNull(), // References users.id (rater)
  // Rating dimensions (1-5 stars)
  overallRating: int("overallRating").notNull(), // Overall score
  creativityRating: int("creativityRating"), // How creative/original
  technicalRating: int("technicalRating"), // Technical execution
  aestheticsRating: int("aestheticsRating"), // Visual appeal
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  // Each user can only rate a build once
  uniqueUserBuild: unique().on(table.buildId, table.userId),
}));

export type BuildRating = typeof buildRatings.$inferSelect;
export type InsertBuildRating = typeof buildRatings.$inferInsert;

/**
 * Build Comments - User comments on LEGO builds
 * Supports threaded discussions with replies
 */
export const buildComments = mysqlTable("build_comments", {
  id: int("id").autoincrement().primaryKey(),
  publicId: varchar("publicId", { length: 32 }).notNull().unique(),
  // References
  buildId: int("buildId").notNull(), // References builds.id
  userId: int("userId").notNull(), // References users.id (commenter)
  parentId: int("parentId"), // References build_comments.id (for replies)
  // Content
  content: text("content").notNull(),
  // Moderation
  isEdited: boolean("isEdited").default(false).notNull(),
  isDeleted: boolean("isDeleted").default(false).notNull(),
  // Engagement
  likes: int("likes").default(0).notNull(),
  replyCount: int("replyCount").default(0).notNull(),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BuildComment = typeof buildComments.$inferSelect;
export type InsertBuildComment = typeof buildComments.$inferInsert;

/**
 * Comment Likes - Track who liked which comments
 */
export const commentLikes = mysqlTable("comment_likes", {
  id: int("id").autoincrement().primaryKey(),
  commentId: int("commentId").notNull(), // References build_comments.id
  userId: int("userId").notNull(), // References users.id
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  // Each user can only like a comment once
  uniqueUserComment: unique().on(table.commentId, table.userId),
}));

export type CommentLike = typeof commentLikes.$inferSelect;
export type InsertCommentLike = typeof commentLikes.$inferInsert;


/**
 * Build Bookmarks - Users can save builds for later viewing
 */
export const buildBookmarks = mysqlTable("build_bookmarks", {
  id: int("id").autoincrement().primaryKey(),
  publicId: varchar("publicId", { length: 32 }).notNull().unique(),
  // References
  userId: int("userId").notNull(), // References users.id
  buildId: int("buildId").notNull(), // References buildProjects.id
  // Organization
  collectionName: varchar("collectionName", { length: 100 }), // Optional folder/collection
  notes: text("notes"), // User's personal notes about this build
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  // Each user can only bookmark a build once
  uniqueUserBuild: unique().on(table.userId, table.buildId),
}));

export type BuildBookmark = typeof buildBookmarks.$inferSelect;
export type InsertBuildBookmark = typeof buildBookmarks.$inferInsert;


/**
 * Build Rooms - Collaborative async multiplayer build spaces
 * Users create rooms where AI agents take turns building together.
 */
export const buildRooms = mysqlTable("build_rooms", {
  id: int("id").autoincrement().primaryKey(),
  publicId: varchar("publicId", { length: 32 }).notNull().unique(),
  creatorId: int("creatorId").notNull(), // References users.id
  // Room details
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  theme: varchar("theme", { length: 50 }),
  goalDescription: text("goalDescription"),
  // Configuration
  maxParticipants: int("maxParticipants").default(6).notNull(),
  turnDurationMinutes: int("turnDurationMinutes").default(30).notNull(),
  isPublic: boolean("isPublic").default(true).notNull(),
  // Build state
  brickData: json("brickData"), // JSON array of all placed bricks
  totalBricks: int("totalBricks").default(0).notNull(),
  totalTurns: int("totalTurns").default(0).notNull(),
  // Status
  status: mysqlEnum("status", ["waiting", "active", "paused", "completed", "archived"]).default("waiting").notNull(),
  participantCount: int("participantCount").default(0).notNull(),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastActivityAt: timestamp("lastActivityAt").defaultNow().notNull(),
});

export type BuildRoom = typeof buildRooms.$inferSelect;
export type InsertBuildRoom = typeof buildRooms.$inferInsert;

/**
 * Room Participants - Users/agents participating in a build room
 */
export const roomParticipants = mysqlTable("room_participants", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").notNull(), // References build_rooms.id
  userId: int("userId").notNull(), // References users.id
  agentId: int("agentId"), // References agents.id (optional - can build without agent)
  // Role
  role: mysqlEnum("role", ["creator", "builder", "spectator"]).default("builder").notNull(),
  // Agent settings
  agentDirective: text("agentDirective"), // What the agent should focus on
  agentAutoPlay: boolean("agentAutoPlay").default(true).notNull(), // Agent builds automatically
  // Stats
  bricksPlaced: int("bricksPlaced").default(0).notNull(),
  turnsCompleted: int("turnsCompleted").default(0).notNull(),
  pendingReviewCount: int("pendingReviewCount").default(0).notNull(),
  // Status
  isOnline: boolean("isOnline").default(false).notNull(),
  lastSeenAt: timestamp("lastSeenAt").defaultNow(),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RoomParticipant = typeof roomParticipants.$inferSelect;
export type InsertRoomParticipant = typeof roomParticipants.$inferInsert;

/**
 * Room Turns - Individual build turns taken by agents in a room
 */
export const roomTurns = mysqlTable("room_turns", {
  id: int("id").autoincrement().primaryKey(),
  publicId: varchar("publicId", { length: 32 }).notNull().unique(),
  roomId: int("roomId").notNull(), // References build_rooms.id
  participantId: int("participantId").notNull(), // References room_participants.id
  agentId: int("agentId"), // References agents.id
  userId: int("userId").notNull(), // References users.id (owner of the agent)
  // Turn details
  turnNumber: int("turnNumber").notNull(),
  message: text("message"), // What the agent said
  reasoning: text("reasoning"), // Internal reasoning
  bricksPlaced: json("bricksPlaced"), // JSON array of bricks placed this turn
  brickCount: int("brickCount").default(0).notNull(),
  // Review
  reviewStatus: mysqlEnum("reviewStatus", ["pending", "approved", "rejected"]).default("pending").notNull(),
  ownerFeedback: text("ownerFeedback"),
  reviewedAt: timestamp("reviewedAt"),
  // Metadata
  isAutoPlay: boolean("isAutoPlay").default(true).notNull(),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RoomTurn = typeof roomTurns.$inferSelect;
export type InsertRoomTurn = typeof roomTurns.$inferInsert;

/**
 * Room Chat - Messages in a build room
 */
export const roomChat = mysqlTable("room_chat", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").notNull(), // References build_rooms.id
  userId: int("userId"), // References users.id (null for system messages)
  agentId: int("agentId"), // References agents.id (for agent messages)
  // Message
  content: text("content").notNull(),
  messageType: mysqlEnum("messageType", ["system", "chat", "agent", "directive"]).default("chat").notNull(),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RoomChatMessage = typeof roomChat.$inferSelect;
export type InsertRoomChatMessage = typeof roomChat.$inferInsert;
