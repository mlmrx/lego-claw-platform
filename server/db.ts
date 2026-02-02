import { eq, desc, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  agents, InsertAgent, Agent,
  skills, InsertSkill,
  agentSkills,
  buildProjects, InsertBuildProject,
  projectParticipants,
  agentMessages, InsertAgentMessage,
  collaborationRequests, InsertCollaborationRequest,
  agentFollows,
  activityFeed, InsertActivityFeedItem
} from "../drizzle/schema";
import { ENV } from './_core/env';
import { nanoid } from 'nanoid';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================
// USER QUERIES
// ============================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "displayName", "bio", "avatarUrl"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserStats(userId: number, stats: { totalAgents?: number; totalContributions?: number; reputation?: number }) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(stats).where(eq(users.id, userId));
}

// ============================================
// SKILL QUERIES
// ============================================

export async function getAllSkills() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(skills).orderBy(skills.category, skills.name);
}

export async function getSkillById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(skills).where(eq(skills.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getSkillBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(skills).where(eq(skills.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createSkill(skill: InsertSkill) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(skills).values(skill);
  return result[0].insertId;
}

export async function getBuiltInSkills() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(skills).where(eq(skills.isBuiltIn, true));
}

// ============================================
// AGENT QUERIES
// ============================================

export async function createAgent(agent: Omit<InsertAgent, 'publicId'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const publicId = nanoid(16);
  const result = await db.insert(agents).values({ ...agent, publicId });
  
  // Update owner's agent count
  await db.update(users)
    .set({ totalAgents: sql`${users.totalAgents} + 1` })
    .where(eq(users.id, agent.ownerId));
  
  return { id: result[0].insertId, publicId };
}

export async function getAgentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(agents).where(eq(agents.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAgentByPublicId(publicId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(agents).where(eq(agents.publicId, publicId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAgentsByOwner(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(agents).where(eq(agents.ownerId, ownerId)).orderBy(desc(agents.createdAt));
}

export async function getPublicAgents(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select()
    .from(agents)
    .where(eq(agents.isPublic, true))
    .orderBy(desc(agents.reputation), desc(agents.totalBricksPlaced))
    .limit(limit)
    .offset(offset);
}

export async function getActiveAgents(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select()
    .from(agents)
    .where(and(
      eq(agents.isPublic, true),
      sql`${agents.status} != 'offline'`
    ))
    .orderBy(desc(agents.lastActiveAt))
    .limit(limit);
}

export async function updateAgent(id: number, data: Partial<InsertAgent>) {
  const db = await getDb();
  if (!db) return;
  await db.update(agents).set({ ...data, updatedAt: new Date() }).where(eq(agents.id, id));
}

export async function updateAgentStatus(id: number, status: Agent['status']) {
  const db = await getDb();
  if (!db) return;
  await db.update(agents).set({ status, lastActiveAt: new Date() }).where(eq(agents.id, id));
}

export async function updateAgentStats(id: number, stats: { 
  totalBricksPlaced?: number; 
  totalBuildsContributed?: number;
  totalMessages?: number;
  totalCollaborations?: number;
  experience?: number;
  reputation?: number;
}) {
  const db = await getDb();
  if (!db) return;
  await db.update(agents).set(stats).where(eq(agents.id, id));
}

export async function deleteAgent(id: number, ownerId: number) {
  const db = await getDb();
  if (!db) return;
  
  await db.delete(agents).where(and(eq(agents.id, id), eq(agents.ownerId, ownerId)));
  
  // Update owner's agent count
  await db.update(users)
    .set({ totalAgents: sql`${users.totalAgents} - 1` })
    .where(eq(users.id, ownerId));
}

// ============================================
// AGENT SKILLS QUERIES
// ============================================

export async function addSkillToAgent(agentId: number, skillId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(agentSkills).values({ agentId, skillId });
  
  // Update skill's agent count
  await db.update(skills)
    .set({ agentCount: sql`${skills.agentCount} + 1` })
    .where(eq(skills.id, skillId));
}

export async function getAgentSkills(agentId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select({
    skill: skills,
    proficiency: agentSkills.proficiency,
    acquiredAt: agentSkills.acquiredAt
  })
    .from(agentSkills)
    .innerJoin(skills, eq(agentSkills.skillId, skills.id))
    .where(eq(agentSkills.agentId, agentId));
}

export async function updateAgentSkillProficiency(agentId: number, skillId: number, proficiency: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(agentSkills)
    .set({ proficiency })
    .where(and(eq(agentSkills.agentId, agentId), eq(agentSkills.skillId, skillId)));
}

// ============================================
// BUILD PROJECT QUERIES
// ============================================

export async function createBuildProject(project: Omit<InsertBuildProject, 'publicId'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const publicId = nanoid(16);
  const result = await db.insert(buildProjects).values({ ...project, publicId });
  return { id: result[0].insertId, publicId };
}

export async function getBuildProjectById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(buildProjects).where(eq(buildProjects.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getBuildProjectByPublicId(publicId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(buildProjects).where(eq(buildProjects.publicId, publicId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getActiveProjects(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select()
    .from(buildProjects)
    .where(eq(buildProjects.status, 'building'))
    .orderBy(desc(buildProjects.updatedAt))
    .limit(limit);
}

export async function getCompletedProjects(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select()
    .from(buildProjects)
    .where(eq(buildProjects.status, 'completed'))
    .orderBy(desc(buildProjects.completedAt))
    .limit(limit);
}

export async function getProjectsByCreator(creatorId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select()
    .from(buildProjects)
    .where(eq(buildProjects.creatorId, creatorId))
    .orderBy(desc(buildProjects.createdAt));
}

export async function updateBuildProject(id: number, data: Partial<InsertBuildProject>) {
  const db = await getDb();
  if (!db) return;
  await db.update(buildProjects).set({ ...data, updatedAt: new Date() }).where(eq(buildProjects.id, id));
}

export async function updateProjectBricks(id: number, brickData: unknown, currentBricks: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(buildProjects)
    .set({ brickData, currentBricks, updatedAt: new Date() })
    .where(eq(buildProjects.id, id));
}

export async function completeProject(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(buildProjects)
    .set({ status: 'completed', completedAt: new Date(), updatedAt: new Date() })
    .where(eq(buildProjects.id, id));
}

// ============================================
// PROJECT PARTICIPANT QUERIES
// ============================================

export async function addParticipantToProject(projectId: number, agentId: number, role: 'lead' | 'contributor' | 'observer' = 'contributor') {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(projectParticipants).values({ projectId, agentId, role });
  
  // Update project's contributor count
  await db.update(buildProjects)
    .set({ totalContributors: sql`${buildProjects.totalContributors} + 1` })
    .where(eq(buildProjects.id, projectId));
}

export async function getProjectParticipants(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select({
    participant: projectParticipants,
    agent: agents
  })
    .from(projectParticipants)
    .innerJoin(agents, eq(projectParticipants.agentId, agents.id))
    .where(eq(projectParticipants.projectId, projectId));
}

export async function updateParticipantContribution(projectId: number, agentId: number, bricksPlaced: number, messagesCount: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(projectParticipants)
    .set({ 
      bricksPlaced: sql`${projectParticipants.bricksPlaced} + ${bricksPlaced}`,
      messagesCount: sql`${projectParticipants.messagesCount} + ${messagesCount}`,
      lastContributedAt: new Date()
    })
    .where(and(
      eq(projectParticipants.projectId, projectId),
      eq(projectParticipants.agentId, agentId)
    ));
}

// ============================================
// AGENT MESSAGE QUERIES
// ============================================

export async function createAgentMessage(message: Omit<InsertAgentMessage, 'publicId'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const publicId = nanoid(16);
  const result = await db.insert(agentMessages).values({ ...message, publicId });
  
  // Update project's message count
  await db.update(buildProjects)
    .set({ totalMessages: sql`${buildProjects.totalMessages} + 1` })
    .where(eq(buildProjects.id, message.projectId));
  
  // Update agent's message count
  await db.update(agents)
    .set({ totalMessages: sql`${agents.totalMessages} + 1` })
    .where(eq(agents.id, message.agentId));
  
  return { id: result[0].insertId, publicId };
}

export async function getProjectMessages(projectId: number, limit = 50, beforeId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(agentMessages.projectId, projectId)];
  if (beforeId) {
    conditions.push(sql`${agentMessages.id} < ${beforeId}`);
  }
  
  return db.select({
    message: agentMessages,
    agent: agents
  })
    .from(agentMessages)
    .innerJoin(agents, eq(agentMessages.agentId, agents.id))
    .where(and(...conditions))
    .orderBy(desc(agentMessages.createdAt))
    .limit(limit);
}

// ============================================
// COLLABORATION REQUEST QUERIES
// ============================================

export async function createCollaborationRequest(request: Omit<InsertCollaborationRequest, 'publicId'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const publicId = nanoid(16);
  const result = await db.insert(collaborationRequests).values({ ...request, publicId });
  return { id: result[0].insertId, publicId };
}

export async function getPendingRequestsForAgent(agentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select()
    .from(collaborationRequests)
    .where(and(
      eq(collaborationRequests.toAgentId, agentId),
      eq(collaborationRequests.status, 'pending')
    ))
    .orderBy(desc(collaborationRequests.createdAt));
}

export async function respondToCollaborationRequest(id: number, status: 'accepted' | 'declined') {
  const db = await getDb();
  if (!db) return;
  await db.update(collaborationRequests)
    .set({ status, respondedAt: new Date() })
    .where(eq(collaborationRequests.id, id));
}

// ============================================
// ACTIVITY FEED QUERIES
// ============================================

export async function createActivityFeedItem(item: Omit<InsertActivityFeedItem, 'publicId'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const publicId = nanoid(16);
  await db.insert(activityFeed).values({ ...item, publicId });
}

export async function getRecentActivity(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select()
    .from(activityFeed)
    .orderBy(desc(activityFeed.createdAt))
    .limit(limit);
}

export async function getActivityForProject(projectId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select()
    .from(activityFeed)
    .where(eq(activityFeed.projectId, projectId))
    .orderBy(desc(activityFeed.createdAt))
    .limit(limit);
}

// ============================================
// AGENT FOLLOW QUERIES
// ============================================

export async function followAgent(followerId: number, followerType: 'user' | 'agent', followingAgentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(agentFollows).values({ followerId, followerType, followingAgentId });
}

export async function unfollowAgent(followerId: number, followerType: 'user' | 'agent', followingAgentId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(agentFollows)
    .where(and(
      eq(agentFollows.followerId, followerId),
      eq(agentFollows.followerType, followerType),
      eq(agentFollows.followingAgentId, followingAgentId)
    ));
}

export async function getAgentFollowers(agentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select()
    .from(agentFollows)
    .where(eq(agentFollows.followingAgentId, agentId));
}

export async function getAgentFollowerCount(agentId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(agentFollows)
    .where(eq(agentFollows.followingAgentId, agentId));
  return result[0]?.count ?? 0;
}
