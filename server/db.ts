import { eq, desc, and, sql, gte } from "drizzle-orm";
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
  activityFeed, InsertActivityFeedItem,
  buildBookmarks, InsertBuildBookmark
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


// ============================================
// BUILD TEMPLATE QUERIES
// ============================================

import { 
  buildTemplates, InsertBuildTemplate,
  buildingChallenges, InsertBuildingChallenge,
  challengeParticipants, InsertChallengeParticipant,
  notifications, InsertNotification
} from "../drizzle/schema";

export async function createBuildTemplate(template: Omit<InsertBuildTemplate, 'publicId'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const publicId = nanoid(16);
  const result = await db.insert(buildTemplates).values({ ...template, publicId });
  return { id: result[0].insertId, publicId };
}

export async function getBuildTemplateByPublicId(publicId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(buildTemplates).where(eq(buildTemplates.publicId, publicId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPublicTemplates(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select()
    .from(buildTemplates)
    .where(eq(buildTemplates.isPublic, true))
    .orderBy(desc(buildTemplates.usageCount), desc(buildTemplates.likes))
    .limit(limit)
    .offset(offset);
}

export async function getFeaturedTemplates(limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select()
    .from(buildTemplates)
    .where(and(eq(buildTemplates.isPublic, true), eq(buildTemplates.isFeatured, true)))
    .orderBy(desc(buildTemplates.likes))
    .limit(limit);
}

export async function getTemplatesByCreator(creatorId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select()
    .from(buildTemplates)
    .where(eq(buildTemplates.creatorId, creatorId))
    .orderBy(desc(buildTemplates.createdAt));
}

export async function incrementTemplateUsage(templateId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(buildTemplates)
    .set({ usageCount: sql`${buildTemplates.usageCount} + 1` })
    .where(eq(buildTemplates.id, templateId));
}

export async function likeTemplate(templateId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(buildTemplates)
    .set({ likes: sql`${buildTemplates.likes} + 1` })
    .where(eq(buildTemplates.id, templateId));
}

export async function deleteTemplate(templateId: number, creatorId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(buildTemplates)
    .where(and(eq(buildTemplates.id, templateId), eq(buildTemplates.creatorId, creatorId)));
}

// ============================================
// BUILDING CHALLENGE QUERIES
// ============================================

export async function createChallenge(challenge: Omit<InsertBuildingChallenge, 'publicId'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const publicId = nanoid(16);
  const result = await db.insert(buildingChallenges).values({ ...challenge, publicId });
  return { id: result[0].insertId, publicId };
}

export async function getChallengeByPublicId(publicId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(buildingChallenges).where(eq(buildingChallenges.publicId, publicId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getActiveChallenges(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select()
    .from(buildingChallenges)
    .where(eq(buildingChallenges.status, 'active'))
    .orderBy(desc(buildingChallenges.startsAt))
    .limit(limit);
}

export async function getUpcomingChallenges(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select()
    .from(buildingChallenges)
    .where(eq(buildingChallenges.status, 'upcoming'))
    .orderBy(buildingChallenges.startsAt)
    .limit(limit);
}

export async function getCompletedChallenges(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select()
    .from(buildingChallenges)
    .where(eq(buildingChallenges.status, 'completed'))
    .orderBy(desc(buildingChallenges.endsAt))
    .limit(limit);
}

export async function updateChallengeStatus(challengeId: number, status: 'upcoming' | 'active' | 'voting' | 'completed' | 'cancelled') {
  const db = await getDb();
  if (!db) return;
  await db.update(buildingChallenges)
    .set({ status })
    .where(eq(buildingChallenges.id, challengeId));
}

export async function joinChallenge(challengeId: number, agentId: number, teamId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(challengeParticipants).values({ challengeId, agentId, teamId });
  
  // Update participant count
  await db.update(buildingChallenges)
    .set({ participantCount: sql`${buildingChallenges.participantCount} + 1` })
    .where(eq(buildingChallenges.id, challengeId));
}

export async function getChallengeParticipants(challengeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    participant: challengeParticipants,
    agent: agents
  })
    .from(challengeParticipants)
    .innerJoin(agents, eq(challengeParticipants.agentId, agents.id))
    .where(eq(challengeParticipants.challengeId, challengeId))
    .orderBy(desc(challengeParticipants.score));
}

export async function submitChallengeEntry(challengeId: number, agentId: number, submissionData: any) {
  const db = await getDb();
  if (!db) return;
  await db.update(challengeParticipants)
    .set({ submissionData, submittedAt: new Date() })
    .where(and(
      eq(challengeParticipants.challengeId, challengeId),
      eq(challengeParticipants.agentId, agentId)
    ));
  
  // Update submission count
  await db.update(buildingChallenges)
    .set({ submissionCount: sql`${buildingChallenges.submissionCount} + 1` })
    .where(eq(buildingChallenges.id, challengeId));
}

export async function updateChallengeScore(challengeId: number, agentId: number, score: number, rank?: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(challengeParticipants)
    .set({ score, rank })
    .where(and(
      eq(challengeParticipants.challengeId, challengeId),
      eq(challengeParticipants.agentId, agentId)
    ));
}

export async function getChallengesByCreator(creatorId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select()
    .from(buildingChallenges)
    .where(eq(buildingChallenges.creatorId, creatorId))
    .orderBy(desc(buildingChallenges.createdAt))
    .limit(limit);
}

// ============================================
// NOTIFICATION QUERIES
// ============================================

export async function createNotification(notification: Omit<InsertNotification, 'publicId'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const publicId = nanoid(16);
  await db.insert(notifications).values({ ...notification, publicId });
  return publicId;
}

export async function getUserNotifications(userId: number, limit = 50, includeRead = false) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(notifications.userId, userId), eq(notifications.isArchived, false)];
  if (!includeRead) {
    conditions.push(eq(notifications.isRead, false));
  }
  
  return db.select()
    .from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function getUnreadNotificationCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(and(
      eq(notifications.userId, userId),
      eq(notifications.isRead, false),
      eq(notifications.isArchived, false)
    ));
  return result[0]?.count ?? 0;
}

export async function markNotificationRead(notificationPublicId: string, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(and(
      eq(notifications.publicId, notificationPublicId),
      eq(notifications.userId, userId)
    ));
}

export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(and(
      eq(notifications.userId, userId),
      eq(notifications.isRead, false)
    ));
}

export async function archiveNotification(notificationPublicId: string, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications)
    .set({ isArchived: true })
    .where(and(
      eq(notifications.publicId, notificationPublicId),
      eq(notifications.userId, userId)
    ));
}

// Helper to send common notifications
export async function notifyOwnerOfAgent(agentId: number, type: InsertNotification['notificationType'], title: string, message: string, metadata?: any) {
  const agent = await getAgentById(agentId);
  if (!agent) return;
  
  await createNotification({
    userId: agent.ownerId,
    title,
    message,
    notificationType: type,
    agentId,
    metadata
  });
}


// ============================================
// EXTERNAL AGENTS QUERIES (Open Platform)
// ============================================

import { externalAgents, InsertExternalAgent, apiKeys, InsertApiKey, agentWebhooks, platformApiKeys, webhookEvents } from "../drizzle/schema";
import crypto from 'crypto';

export async function createExternalAgent(agent: Omit<InsertExternalAgent, 'publicId' | 'apiKey' | 'verificationCode'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const publicId = `ag_${nanoid(16)}`;
  const apiKey = `lego_live_${nanoid(32)}`;
  const verificationCode = `brick-${nanoid(4).toUpperCase()}`;
  
  const result = await db.insert(externalAgents).values({ 
    ...agent, 
    publicId, 
    apiKey,
    verificationCode 
  });
  
  return { 
    id: result[0].insertId, 
    publicId, 
    apiKey,
    verificationCode,
    claimUrl: `/claim/${publicId}`
  };
}

export async function getExternalAgentByApiKey(apiKey: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(externalAgents).where(eq(externalAgents.apiKey, apiKey)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getExternalAgentByPublicId(publicId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(externalAgents).where(eq(externalAgents.publicId, publicId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getExternalAgentsByOwner(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(externalAgents).where(eq(externalAgents.ownerId, ownerId)).orderBy(desc(externalAgents.createdAt));
}

export async function verifyExternalAgent(publicId: string, tweetUrl: string, ownerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(externalAgents)
    .set({ 
      verificationStatus: 'verified',
      verificationTweetUrl: tweetUrl,
      verifiedAt: new Date(),
      ownerId,
      status: 'active'
    })
    .where(eq(externalAgents.publicId, publicId));
}

export async function updateExternalAgent(id: number, data: Partial<InsertExternalAgent>) {
  const db = await getDb();
  if (!db) return;
  await db.update(externalAgents).set({ ...data, updatedAt: new Date() }).where(eq(externalAgents.id, id));
}

export async function updateExternalAgentStats(id: number, stats: { 
  totalRequests?: number; 
  totalBricksPlaced?: number;
  totalMessages?: number;
  reputation?: number;
}) {
  const db = await getDb();
  if (!db) return;
  
  const updates: Record<string, unknown> = {};
  if (stats.totalRequests !== undefined) updates.totalRequests = sql`${externalAgents.totalRequests} + ${stats.totalRequests}`;
  if (stats.totalBricksPlaced !== undefined) updates.totalBricksPlaced = sql`${externalAgents.totalBricksPlaced} + ${stats.totalBricksPlaced}`;
  if (stats.totalMessages !== undefined) updates.totalMessages = sql`${externalAgents.totalMessages} + ${stats.totalMessages}`;
  if (stats.reputation !== undefined) updates.reputation = sql`${externalAgents.reputation} + ${stats.reputation}`;
  
  await db.update(externalAgents).set(updates).where(eq(externalAgents.id, id));
}

export async function getPublicExternalAgents(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select()
    .from(externalAgents)
    .where(eq(externalAgents.verificationStatus, 'verified'))
    .orderBy(desc(externalAgents.reputation), desc(externalAgents.totalBricksPlaced))
    .limit(limit)
    .offset(offset);
}

// ============================================
// API KEYS QUERIES (BYOK)
// ============================================

export async function createApiKey(key: Omit<InsertApiKey, 'keyHint'> & { apiKey: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Simple encryption (in production, use proper encryption)
  const encryptedKey = Buffer.from(key.apiKey).toString('base64');
  const keyHint = `...${key.apiKey.slice(-4)}`;
  
  const { apiKey, ...rest } = key;
  const result = await db.insert(apiKeys).values({ 
    ...rest, 
    encryptedKey,
    keyHint 
  });
  
  return { id: result[0].insertId, keyHint };
}

export async function getApiKeysByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: apiKeys.id,
    provider: apiKeys.provider,
    providerName: apiKeys.providerName,
    keyHint: apiKeys.keyHint,
    defaultModel: apiKeys.defaultModel,
    totalCalls: apiKeys.totalCalls,
    lastUsedAt: apiKeys.lastUsedAt,
    isActive: apiKeys.isActive,
    isValid: apiKeys.isValid,
    createdAt: apiKeys.createdAt
  })
    .from(apiKeys)
    .where(eq(apiKeys.userId, userId))
    .orderBy(desc(apiKeys.createdAt));
}

export async function getDecryptedApiKey(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select()
    .from(apiKeys)
    .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)))
    .limit(1);
  
  if (result.length === 0) return undefined;
  
  // Simple decryption (in production, use proper decryption)
  const decryptedKey = Buffer.from(result[0].encryptedKey, 'base64').toString('utf-8');
  return { ...result[0], decryptedKey };
}

export async function updateApiKeyUsage(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(apiKeys)
    .set({ 
      totalCalls: sql`${apiKeys.totalCalls} + 1`,
      lastUsedAt: new Date()
    })
    .where(eq(apiKeys.id, id));
}

export async function setApiKeyInvalid(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(apiKeys).set({ isValid: false }).where(eq(apiKeys.id, id));
}

export async function deleteApiKey(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(apiKeys).where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)));
}

// ============================================
// PLATFORM API KEYS QUERIES
// ============================================

export async function createPlatformApiKey(data: { userId: number; name: string; permissions?: string[]; scopes?: string[] }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const rawKey = `lego_${nanoid(32)}`;
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const keyPrefix = rawKey.slice(0, 12);
  
  const result = await db.insert(platformApiKeys).values({
    userId: data.userId,
    name: data.name,
    keyHash,
    keyPrefix,
    permissions: data.permissions || ['read', 'write'],
    scopes: data.scopes || ['agents', 'projects', 'messages']
  });
  
  // Return the raw key only once - it cannot be retrieved later
  return { 
    id: result[0].insertId, 
    apiKey: rawKey,
    keyPrefix
  };
}

export async function getPlatformApiKeyByHash(rawKey: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const result = await db.select()
    .from(platformApiKeys)
    .where(and(eq(platformApiKeys.keyHash, keyHash), eq(platformApiKeys.isActive, true)))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function getPlatformApiKeysByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: platformApiKeys.id,
    name: platformApiKeys.name,
    keyPrefix: platformApiKeys.keyPrefix,
    permissions: platformApiKeys.permissions,
    scopes: platformApiKeys.scopes,
    totalRequests: platformApiKeys.totalRequests,
    lastUsedAt: platformApiKeys.lastUsedAt,
    isActive: platformApiKeys.isActive,
    createdAt: platformApiKeys.createdAt
  })
    .from(platformApiKeys)
    .where(eq(platformApiKeys.userId, userId))
    .orderBy(desc(platformApiKeys.createdAt));
}

export async function revokePlatformApiKey(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(platformApiKeys)
    .set({ isActive: false, revokedAt: new Date() })
    .where(and(eq(platformApiKeys.id, id), eq(platformApiKeys.userId, userId)));
}

// ============================================
// WEBHOOK QUERIES
// ============================================

export async function createWebhook(data: { externalAgentId: number; url: string; events: string[]; secret?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const secret = data.secret || nanoid(32);
  const result = await db.insert(agentWebhooks).values({
    externalAgentId: data.externalAgentId,
    url: data.url,
    events: data.events,
    secret
  });
  
  return { id: result[0].insertId, secret };
}

export async function getWebhooksByAgent(externalAgentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select()
    .from(agentWebhooks)
    .where(eq(agentWebhooks.externalAgentId, externalAgentId));
}

export async function getWebhooksForEvent(eventType: string) {
  const db = await getDb();
  if (!db) return [];
  
  // Get all active webhooks that subscribe to this event type
  return db.select()
    .from(agentWebhooks)
    .where(eq(agentWebhooks.isActive, true));
  // Note: In production, filter by events JSON array containing eventType
}

export async function updateWebhookStatus(id: number, success: boolean) {
  const db = await getDb();
  if (!db) return;
  
  if (success) {
    await db.update(agentWebhooks)
      .set({ lastDeliveredAt: new Date(), failureCount: 0 })
      .where(eq(agentWebhooks.id, id));
  } else {
    await db.update(agentWebhooks)
      .set({ 
        lastFailedAt: new Date(), 
        failureCount: sql`${agentWebhooks.failureCount} + 1`
      })
      .where(eq(agentWebhooks.id, id));
  }
}

export async function deleteWebhook(id: number, externalAgentId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(agentWebhooks)
    .where(and(eq(agentWebhooks.id, id), eq(agentWebhooks.externalAgentId, externalAgentId)));
}


// ============================================
// BADGES QUERIES
// ============================================

import { badges, userBadges, agentBadges, donations, platformStats } from "../drizzle/schema";

// Define badge types
const BADGE_DEFINITIONS = [
  // Building milestones
  { slug: "first-brick", name: "First Brick", description: "Place your first brick", icon: "🧱", color: "#E53935", category: "building" as const, threshold: 1, rarity: "common" as const },
  { slug: "brick-layer", name: "Brick Layer", description: "Place 100 bricks", icon: "🏗️", color: "#FB8C00", category: "building" as const, threshold: 100, rarity: "common" as const },
  { slug: "master-builder", name: "Master Builder", description: "Place 1,000 bricks", icon: "🏛️", color: "#FDD835", category: "building" as const, threshold: 1000, rarity: "uncommon" as const },
  { slug: "legendary-builder", name: "Legendary Builder", description: "Place 10,000 bricks", icon: "👑", color: "#8E24AA", category: "building" as const, threshold: 10000, rarity: "rare" as const },
  { slug: "brick-god", name: "Brick God", description: "Place 100,000 bricks", icon: "⚡", color: "#FFD700", category: "building" as const, threshold: 100000, rarity: "legendary" as const },
  
  // Collaboration badges
  { slug: "team-player", name: "Team Player", description: "Collaborate on 5 builds", icon: "🤝", color: "#1E88E5", category: "collaboration" as const, threshold: 5, rarity: "common" as const },
  { slug: "social-butterfly", name: "Social Butterfly", description: "Collaborate with 10 different agents", icon: "🦋", color: "#00BCD4", category: "collaboration" as const, threshold: 10, rarity: "uncommon" as const },
  { slug: "community-leader", name: "Community Leader", description: "Lead 10 build projects", icon: "🎖️", color: "#43A047", category: "collaboration" as const, threshold: 10, rarity: "rare" as const },
  
  // Creativity badges
  { slug: "creative-spark", name: "Creative Spark", description: "Complete your first build", icon: "✨", color: "#E91E63", category: "creativity" as const, threshold: 1, rarity: "common" as const },
  { slug: "artist", name: "Artist", description: "Complete 10 builds", icon: "🎨", color: "#9C27B0", category: "creativity" as const, threshold: 10, rarity: "uncommon" as const },
  { slug: "visionary", name: "Visionary", description: "Complete 50 builds", icon: "🔮", color: "#673AB7", category: "creativity" as const, threshold: 50, rarity: "rare" as const },
  
  // Milestone badges
  { slug: "rising-star", name: "Rising Star", description: "Reach 100 reputation", icon: "⭐", color: "#FF9800", category: "milestone" as const, threshold: 100, rarity: "common" as const },
  { slug: "veteran", name: "Veteran", description: "Be active for 30 days", icon: "🏆", color: "#795548", category: "milestone" as const, threshold: 30, rarity: "uncommon" as const },
  { slug: "hall-of-fame", name: "Hall of Fame", description: "Reach top 10 on leaderboard", icon: "🏅", color: "#FFD700", category: "milestone" as const, threshold: 10, rarity: "epic" as const },
  
  // Special badges
  { slug: "early-adopter", name: "Early Adopter", description: "Join during beta", icon: "🚀", color: "#2196F3", category: "special" as const, threshold: 1, rarity: "rare" as const },
  { slug: "supporter", name: "Supporter", description: "Support the platform with a donation", icon: "💝", color: "#E91E63", category: "special" as const, threshold: 1, rarity: "rare" as const },
  { slug: "verified", name: "Verified Builder", description: "Verify your X/Twitter account", icon: "✓", color: "#1DA1F2", category: "special" as const, threshold: 1, rarity: "uncommon" as const },
];

export async function initializeBadges() {
  const db = await getDb();
  if (!db) return;
  
  for (const badge of BADGE_DEFINITIONS) {
    try {
      await db.insert(badges).values({
        ...badge,
        requirement: { type: badge.category, metric: badge.slug }
      }).onDuplicateKeyUpdate({
        set: { name: badge.name } // No-op update
      });
    } catch (e) {
      // Badge already exists
    }
  }
}

export async function getAllBadges() {
  const db = await getDb();
  if (!db) return BADGE_DEFINITIONS.map((b, i) => ({ id: i + 1, ...b, earnedCount: 0, isActive: true, createdAt: new Date() }));
  return db.select().from(badges).where(eq(badges.isActive, true)).orderBy(badges.category, badges.rarity);
}

export async function getBadgeBySlug(slug: string) {
  const db = await getDb();
  if (!db) {
    const badge = BADGE_DEFINITIONS.find(b => b.slug === slug);
    return badge ? { id: 0, ...badge, earnedCount: 0, isActive: true, createdAt: new Date() } : undefined;
  }
  const result = await db.select().from(badges).where(eq(badges.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserBadges(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    badge: badges,
    earnedAt: userBadges.earnedAt,
    progress: userBadges.progress
  })
    .from(userBadges)
    .innerJoin(badges, eq(userBadges.badgeId, badges.id))
    .where(eq(userBadges.userId, userId))
    .orderBy(desc(userBadges.earnedAt));
}

export async function getAgentBadges(agentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    badge: badges,
    earnedAt: agentBadges.earnedAt,
    progress: agentBadges.progress
  })
    .from(agentBadges)
    .innerJoin(badges, eq(agentBadges.badgeId, badges.id))
    .where(eq(agentBadges.agentId, agentId))
    .orderBy(desc(agentBadges.earnedAt));
}

export async function awardBadgeToUser(userId: number, badgeSlug: string) {
  const db = await getDb();
  if (!db) return null;
  
  const badge = await getBadgeBySlug(badgeSlug);
  if (!badge) return null;
  
  // Check if already has badge
  const existing = await db.select()
    .from(userBadges)
    .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeId, badge.id)))
    .limit(1);
  
  if (existing.length > 0) return null;
  
  await db.insert(userBadges).values({
    userId,
    badgeId: badge.id,
    progress: badge.threshold
  });
  
  // Update badge earned count
  await db.update(badges)
    .set({ earnedCount: sql`${badges.earnedCount} + 1` })
    .where(eq(badges.id, badge.id));
  
  return badge;
}

export async function awardBadgeToAgent(agentId: number, badgeSlug: string) {
  const db = await getDb();
  if (!db) return null;
  
  const badge = await getBadgeBySlug(badgeSlug);
  if (!badge) return null;
  
  // Check if already has badge
  const existing = await db.select()
    .from(agentBadges)
    .where(and(eq(agentBadges.agentId, agentId), eq(agentBadges.badgeId, badge.id)))
    .limit(1);
  
  if (existing.length > 0) return null;
  
  await db.insert(agentBadges).values({
    agentId,
    badgeId: badge.id,
    progress: badge.threshold
  });
  
  // Update badge earned count
  await db.update(badges)
    .set({ earnedCount: sql`${badges.earnedCount} + 1` })
    .where(eq(badges.id, badge.id));
  
  return badge;
}

// ============================================
// DONATIONS QUERIES
// ============================================

export async function createDonation(data: {
  transactionId: string;
  walletAddress?: string;
  amount: string;
  amountUsd?: string;
  userId?: number;
  donorName?: string;
  sponsoredAgentId?: number;
  sponsorMessage?: string;
  isPublic?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const publicId = nanoid(16);
  const result = await db.insert(donations).values({
    publicId,
    ...data,
    status: 'confirmed'
  });
  
  // Update donation counter
  await updatePlatformStat('total_donations', '1', true);
  
  // Award supporter badge if user is logged in
  if (data.userId) {
    await awardBadgeToUser(data.userId, 'supporter');
  }
  
  return { id: result[0].insertId, publicId };
}

export async function getRecentDonations(limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select()
    .from(donations)
    .where(and(eq(donations.status, 'confirmed'), eq(donations.isPublic, true)))
    .orderBy(desc(donations.createdAt))
    .limit(limit);
}

export async function getDonationByTransactionId(transactionId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select()
    .from(donations)
    .where(eq(donations.transactionId, transactionId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getDonationStats() {
  const db = await getDb();
  if (!db) return { totalDonations: 0, totalAmount: '0' };
  
  const result = await db.select({
    count: sql<number>`COUNT(*)`,
    total: sql<string>`COALESCE(SUM(CAST(amount AS DECIMAL(20,9))), 0)`
  })
    .from(donations)
    .where(eq(donations.status, 'confirmed'));
  
  return {
    totalDonations: result[0]?.count || 0,
    totalAmount: result[0]?.total || '0'
  };
}

export async function getSponsoredAgents(limit = 10) {
  const db = await getDb();
  if (!db) return [];
  
  // Get agents with sponsorships
  return db.select({
    agent: agents,
    sponsorCount: sql<number>`COUNT(${donations.id})`,
    totalSponsored: sql<string>`COALESCE(SUM(CAST(${donations.amount} AS DECIMAL(20,9))), 0)`
  })
    .from(donations)
    .innerJoin(agents, eq(donations.sponsoredAgentId, agents.id))
    .where(eq(donations.status, 'confirmed'))
    .groupBy(agents.id)
    .orderBy(desc(sql`COUNT(${donations.id})`))
    .limit(limit);
}

// ============================================
// PLATFORM STATS QUERIES
// ============================================

export async function getPlatformStat(key: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select()
    .from(platformStats)
    .where(eq(platformStats.statKey, key))
    .limit(1);
  return result.length > 0 ? result[0].statValue : undefined;
}

export async function updatePlatformStat(key: string, value: string, increment = false) {
  const db = await getDb();
  if (!db) return;
  
  if (increment) {
    // Try to increment existing value
    const existing = await getPlatformStat(key);
    if (existing) {
      const newValue = (parseInt(existing) + parseInt(value)).toString();
      await db.update(platformStats)
        .set({ statValue: newValue })
        .where(eq(platformStats.statKey, key));
    } else {
      await db.insert(platformStats).values({ statKey: key, statValue: value });
    }
  } else {
    await db.insert(platformStats).values({ statKey: key, statValue: value })
      .onDuplicateKeyUpdate({ set: { statValue: value } });
  }
}

export async function getAllPlatformStats() {
  const db = await getDb();
  if (!db) return {};
  const result = await db.select().from(platformStats);
  return result.reduce((acc, stat) => {
    acc[stat.statKey] = stat.statValue;
    return acc;
  }, {} as Record<string, string>);
}


// ============================================
// SOCIAL INTEGRATIONS QUERIES
// ============================================

import { socialIntegrations, integrationEvents, InsertSocialIntegration, InsertIntegrationEvent } from "../drizzle/schema";

// Simple encryption for API keys (in production, use a proper KMS)
const ENCRYPTION_KEY = process.env.JWT_SECRET || 'default-encryption-key-change-me';

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedText: string): string {
  try {
    const [ivHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return '';
  }
}

export async function createSocialIntegration(data: {
  userId?: number;
  externalAgentId?: number;
  platform: InsertSocialIntegration['platform'];
  platformName?: string;
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  platformUserId?: string;
  platformUsername?: string;
  channelId?: string;
  channelUrl?: string;
  streamSettings?: Record<string, unknown>;
  scopes?: string[];
  permissions?: string[];
  autoStream?: boolean;
  notifyOnLive?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const publicId = nanoid(16);
  const keyHint = data.apiKey ? data.apiKey.slice(-4) : undefined;
  
  const result = await db.insert(socialIntegrations).values({
    publicId,
    userId: data.userId,
    externalAgentId: data.externalAgentId,
    platform: data.platform,
    platformName: data.platformName,
    encryptedApiKey: data.apiKey ? encrypt(data.apiKey) : undefined,
    encryptedApiSecret: data.apiSecret ? encrypt(data.apiSecret) : undefined,
    encryptedAccessToken: data.accessToken ? encrypt(data.accessToken) : undefined,
    encryptedRefreshToken: data.refreshToken ? encrypt(data.refreshToken) : undefined,
    keyHint,
    platformUserId: data.platformUserId,
    platformUsername: data.platformUsername,
    channelId: data.channelId,
    channelUrl: data.channelUrl,
    streamSettings: data.streamSettings,
    scopes: data.scopes,
    permissions: data.permissions,
    autoStream: data.autoStream ?? false,
    notifyOnLive: data.notifyOnLive ?? true,
  });
  
  return { id: result[0].insertId, publicId };
}

export async function getSocialIntegrationsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: socialIntegrations.id,
    publicId: socialIntegrations.publicId,
    platform: socialIntegrations.platform,
    platformName: socialIntegrations.platformName,
    keyHint: socialIntegrations.keyHint,
    platformUserId: socialIntegrations.platformUserId,
    platformUsername: socialIntegrations.platformUsername,
    channelId: socialIntegrations.channelId,
    channelUrl: socialIntegrations.channelUrl,
    streamSettings: socialIntegrations.streamSettings,
    autoStream: socialIntegrations.autoStream,
    notifyOnLive: socialIntegrations.notifyOnLive,
    isActive: socialIntegrations.isActive,
    isVerified: socialIntegrations.isVerified,
    lastVerifiedAt: socialIntegrations.lastVerifiedAt,
    totalStreams: socialIntegrations.totalStreams,
    totalViewers: socialIntegrations.totalViewers,
    lastStreamedAt: socialIntegrations.lastStreamedAt,
    createdAt: socialIntegrations.createdAt,
    updatedAt: socialIntegrations.updatedAt,
  })
    .from(socialIntegrations)
    .where(eq(socialIntegrations.userId, userId))
    .orderBy(desc(socialIntegrations.createdAt));
}

export async function getSocialIntegrationsByExternalAgent(externalAgentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: socialIntegrations.id,
    publicId: socialIntegrations.publicId,
    platform: socialIntegrations.platform,
    platformName: socialIntegrations.platformName,
    keyHint: socialIntegrations.keyHint,
    platformUserId: socialIntegrations.platformUserId,
    platformUsername: socialIntegrations.platformUsername,
    channelId: socialIntegrations.channelId,
    channelUrl: socialIntegrations.channelUrl,
    streamSettings: socialIntegrations.streamSettings,
    autoStream: socialIntegrations.autoStream,
    notifyOnLive: socialIntegrations.notifyOnLive,
    isActive: socialIntegrations.isActive,
    isVerified: socialIntegrations.isVerified,
    lastVerifiedAt: socialIntegrations.lastVerifiedAt,
    totalStreams: socialIntegrations.totalStreams,
    totalViewers: socialIntegrations.totalViewers,
    lastStreamedAt: socialIntegrations.lastStreamedAt,
    createdAt: socialIntegrations.createdAt,
    updatedAt: socialIntegrations.updatedAt,
  })
    .from(socialIntegrations)
    .where(eq(socialIntegrations.externalAgentId, externalAgentId))
    .orderBy(desc(socialIntegrations.createdAt));
}

export async function getSocialIntegrationByPublicId(publicId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select()
    .from(socialIntegrations)
    .where(eq(socialIntegrations.publicId, publicId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getSocialIntegrationWithCredentials(publicId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select()
    .from(socialIntegrations)
    .where(eq(socialIntegrations.publicId, publicId))
    .limit(1);
  
  if (result.length === 0) return undefined;
  
  const integration = result[0];
  return {
    ...integration,
    apiKey: integration.encryptedApiKey ? decrypt(integration.encryptedApiKey) : undefined,
    apiSecret: integration.encryptedApiSecret ? decrypt(integration.encryptedApiSecret) : undefined,
    accessToken: integration.encryptedAccessToken ? decrypt(integration.encryptedAccessToken) : undefined,
    refreshToken: integration.encryptedRefreshToken ? decrypt(integration.encryptedRefreshToken) : undefined,
  };
}

export async function updateSocialIntegration(publicId: string, ownerId: number, ownerType: 'user' | 'agent', data: {
  platformName?: string;
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  platformUserId?: string;
  platformUsername?: string;
  channelId?: string;
  channelUrl?: string;
  streamSettings?: Record<string, unknown>;
  scopes?: string[];
  permissions?: string[];
  autoStream?: boolean;
  notifyOnLive?: boolean;
  isActive?: boolean;
  tokenExpiresAt?: Date;
}) {
  const db = await getDb();
  if (!db) return;
  
  const updateData: Record<string, unknown> = {};
  
  if (data.platformName !== undefined) updateData.platformName = data.platformName;
  if (data.apiKey !== undefined) {
    updateData.encryptedApiKey = encrypt(data.apiKey);
    updateData.keyHint = data.apiKey.slice(-4);
  }
  if (data.apiSecret !== undefined) updateData.encryptedApiSecret = encrypt(data.apiSecret);
  if (data.accessToken !== undefined) updateData.encryptedAccessToken = encrypt(data.accessToken);
  if (data.refreshToken !== undefined) updateData.encryptedRefreshToken = encrypt(data.refreshToken);
  if (data.platformUserId !== undefined) updateData.platformUserId = data.platformUserId;
  if (data.platformUsername !== undefined) updateData.platformUsername = data.platformUsername;
  if (data.channelId !== undefined) updateData.channelId = data.channelId;
  if (data.channelUrl !== undefined) updateData.channelUrl = data.channelUrl;
  if (data.streamSettings !== undefined) updateData.streamSettings = data.streamSettings;
  if (data.scopes !== undefined) updateData.scopes = data.scopes;
  if (data.permissions !== undefined) updateData.permissions = data.permissions;
  if (data.autoStream !== undefined) updateData.autoStream = data.autoStream;
  if (data.notifyOnLive !== undefined) updateData.notifyOnLive = data.notifyOnLive;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.tokenExpiresAt !== undefined) updateData.tokenExpiresAt = data.tokenExpiresAt;
  
  const condition = ownerType === 'user'
    ? and(eq(socialIntegrations.publicId, publicId), eq(socialIntegrations.userId, ownerId))
    : and(eq(socialIntegrations.publicId, publicId), eq(socialIntegrations.externalAgentId, ownerId));
  
  await db.update(socialIntegrations)
    .set(updateData)
    .where(condition);
}

export async function deleteSocialIntegration(publicId: string, ownerId: number, ownerType: 'user' | 'agent') {
  const db = await getDb();
  if (!db) return;
  
  const condition = ownerType === 'user'
    ? and(eq(socialIntegrations.publicId, publicId), eq(socialIntegrations.userId, ownerId))
    : and(eq(socialIntegrations.publicId, publicId), eq(socialIntegrations.externalAgentId, ownerId));
  
  await db.delete(socialIntegrations).where(condition);
}

export async function verifySocialIntegration(publicId: string) {
  const db = await getDb();
  if (!db) return;
  
  await db.update(socialIntegrations)
    .set({ isVerified: true, lastVerifiedAt: new Date() })
    .where(eq(socialIntegrations.publicId, publicId));
}

export async function recordIntegrationEvent(data: {
  integrationId: number;
  eventType: InsertIntegrationEvent['eventType'];
  payload?: Record<string, unknown>;
  viewerCount?: number;
  duration?: number;
  status?: 'success' | 'failure';
  errorMessage?: string;
}) {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(integrationEvents).values({
    integrationId: data.integrationId,
    eventType: data.eventType,
    payload: data.payload,
    viewerCount: data.viewerCount,
    duration: data.duration,
    status: data.status ?? 'success',
    errorMessage: data.errorMessage,
  });
  
  // Update integration stats if stream ended
  if (data.eventType === 'stream_ended') {
    await db.update(socialIntegrations)
      .set({
        totalStreams: sql`${socialIntegrations.totalStreams} + 1`,
        totalViewers: sql`${socialIntegrations.totalViewers} + ${data.viewerCount || 0}`,
        lastStreamedAt: new Date(),
      })
      .where(eq(socialIntegrations.id, data.integrationId));
  }
}

export async function getIntegrationEvents(integrationId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select()
    .from(integrationEvents)
    .where(eq(integrationEvents.integrationId, integrationId))
    .orderBy(desc(integrationEvents.createdAt))
    .limit(limit);
}

export async function getActiveIntegrationsByPlatform(platform: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: socialIntegrations.id,
    publicId: socialIntegrations.publicId,
    userId: socialIntegrations.userId,
    externalAgentId: socialIntegrations.externalAgentId,
    platformUsername: socialIntegrations.platformUsername,
    channelId: socialIntegrations.channelId,
    autoStream: socialIntegrations.autoStream,
  })
    .from(socialIntegrations)
    .where(and(
      eq(socialIntegrations.platform, platform as any),
      eq(socialIntegrations.isActive, true),
      eq(socialIntegrations.isVerified, true)
    ));
}


// ============================================
// BUILD RATINGS & COMMENTS
// ============================================

import { buildRatings, buildComments, commentLikes, InsertBuildRating, InsertBuildComment } from "../drizzle/schema";

// Ratings

export async function createBuildRating(data: {
  buildId: number;
  userId: number;
  overallRating: number;
  creativityRating?: number;
  technicalRating?: number;
  aestheticsRating?: number;
}) {
  const db = await getDb();
  if (!db) return undefined;

  const publicId = nanoid(16);
  
  await db.insert(buildRatings).values({
    publicId,
    buildId: data.buildId,
    userId: data.userId,
    overallRating: data.overallRating,
    creativityRating: data.creativityRating,
    technicalRating: data.technicalRating,
    aestheticsRating: data.aestheticsRating,
  }).onDuplicateKeyUpdate({
    set: {
      overallRating: data.overallRating,
      creativityRating: data.creativityRating,
      technicalRating: data.technicalRating,
      aestheticsRating: data.aestheticsRating,
      updatedAt: new Date(),
    }
  });

  return publicId;
}

export async function getBuildRatings(buildId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select({
    id: buildRatings.id,
    publicId: buildRatings.publicId,
    userId: buildRatings.userId,
    overallRating: buildRatings.overallRating,
    creativityRating: buildRatings.creativityRating,
    technicalRating: buildRatings.technicalRating,
    aestheticsRating: buildRatings.aestheticsRating,
    createdAt: buildRatings.createdAt,
    userName: users.name,
    userDisplayName: users.displayName,
  })
    .from(buildRatings)
    .leftJoin(users, eq(buildRatings.userId, users.id))
    .where(eq(buildRatings.buildId, buildId))
    .orderBy(desc(buildRatings.createdAt));
}

export async function getBuildAverageRatings(buildId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select({
    avgOverall: sql<number>`AVG(${buildRatings.overallRating})`,
    avgCreativity: sql<number>`AVG(${buildRatings.creativityRating})`,
    avgTechnical: sql<number>`AVG(${buildRatings.technicalRating})`,
    avgAesthetics: sql<number>`AVG(${buildRatings.aestheticsRating})`,
    totalRatings: sql<number>`COUNT(*)`,
  })
    .from(buildRatings)
    .where(eq(buildRatings.buildId, buildId));

  return result[0] || null;
}

export async function getUserBuildRating(buildId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select()
    .from(buildRatings)
    .where(and(
      eq(buildRatings.buildId, buildId),
      eq(buildRatings.userId, userId)
    ))
    .limit(1);

  return result[0];
}

export async function deleteBuildRating(publicId: string, userId: number) {
  const db = await getDb();
  if (!db) return;

  await db.delete(buildRatings)
    .where(and(
      eq(buildRatings.publicId, publicId),
      eq(buildRatings.userId, userId)
    ));
}

// Comments

export async function createBuildComment(data: {
  buildId: number;
  userId: number;
  content: string;
  parentId?: number;
}) {
  const db = await getDb();
  if (!db) return undefined;

  const publicId = nanoid(16);
  
  const result = await db.insert(buildComments).values({
    publicId,
    buildId: data.buildId,
    userId: data.userId,
    content: data.content,
    parentId: data.parentId,
  });

  // Update reply count on parent if this is a reply
  if (data.parentId) {
    await db.update(buildComments)
      .set({ replyCount: sql`${buildComments.replyCount} + 1` })
      .where(eq(buildComments.id, data.parentId));
  }

  return publicId;
}

export async function getBuildComments(buildId: number, parentId?: number) {
  const db = await getDb();
  if (!db) return [];

  const condition = parentId 
    ? and(eq(buildComments.buildId, buildId), eq(buildComments.parentId, parentId), eq(buildComments.isDeleted, false))
    : and(eq(buildComments.buildId, buildId), sql`${buildComments.parentId} IS NULL`, eq(buildComments.isDeleted, false));

  return db.select({
    id: buildComments.id,
    publicId: buildComments.publicId,
    userId: buildComments.userId,
    content: buildComments.content,
    isEdited: buildComments.isEdited,
    likes: buildComments.likes,
    replyCount: buildComments.replyCount,
    createdAt: buildComments.createdAt,
    updatedAt: buildComments.updatedAt,
    userName: users.name,
    userDisplayName: users.displayName,
    userAvatarUrl: users.avatarUrl,
  })
    .from(buildComments)
    .leftJoin(users, eq(buildComments.userId, users.id))
    .where(condition)
    .orderBy(desc(buildComments.createdAt));
}

export async function getCommentById(publicId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select()
    .from(buildComments)
    .where(eq(buildComments.publicId, publicId))
    .limit(1);

  return result[0];
}

export async function updateBuildComment(publicId: string, userId: number, content: string) {
  const db = await getDb();
  if (!db) return;

  await db.update(buildComments)
    .set({ 
      content, 
      isEdited: true,
      updatedAt: new Date() 
    })
    .where(and(
      eq(buildComments.publicId, publicId),
      eq(buildComments.userId, userId)
    ));
}

export async function deleteBuildComment(publicId: string, userId: number) {
  const db = await getDb();
  if (!db) return;

  // Soft delete - mark as deleted but keep for reply count integrity
  await db.update(buildComments)
    .set({ 
      isDeleted: true,
      content: "[Comment deleted]",
      updatedAt: new Date() 
    })
    .where(and(
      eq(buildComments.publicId, publicId),
      eq(buildComments.userId, userId)
    ));
}

export async function likeComment(commentId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.insert(commentLikes).values({
      commentId,
      userId,
    });

    // Increment like count
    await db.update(buildComments)
      .set({ likes: sql`${buildComments.likes} + 1` })
      .where(eq(buildComments.id, commentId));

    return true;
  } catch (error) {
    // Duplicate - user already liked
    return false;
  }
}

export async function unlikeComment(commentId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;

  const result = await db.delete(commentLikes)
    .where(and(
      eq(commentLikes.commentId, commentId),
      eq(commentLikes.userId, userId)
    ));

  // Decrement like count if we deleted something
  await db.update(buildComments)
    .set({ likes: sql`GREATEST(${buildComments.likes} - 1, 0)` })
    .where(eq(buildComments.id, commentId));

  return true;
}

export async function hasUserLikedComment(commentId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;

  const result = await db.select()
    .from(commentLikes)
    .where(and(
      eq(commentLikes.commentId, commentId),
      eq(commentLikes.userId, userId)
    ))
    .limit(1);

  return result.length > 0;
}

export async function getBuildCommentCount(buildId: number) {
  const db = await getDb();
  if (!db) return 0;

  const result = await db.select({
    count: sql<number>`COUNT(*)`,
  })
    .from(buildComments)
    .where(and(
      eq(buildComments.buildId, buildId),
      eq(buildComments.isDeleted, false)
    ));

  return result[0]?.count || 0;
}


// ============================================
// BUILD BOOKMARKS
// ============================================

export async function createBookmark(data: {
  userId: number;
  buildId: number;
  collectionName?: string;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) return null;

  const publicId = nanoid(12);
  await db.insert(buildBookmarks).values({
    publicId,
    userId: data.userId,
    buildId: data.buildId,
    collectionName: data.collectionName,
    notes: data.notes,
  });

  return { publicId };
}

export async function removeBookmark(userId: number, buildId: number) {
  const db = await getDb();
  if (!db) return false;

  await db.delete(buildBookmarks)
    .where(and(
      eq(buildBookmarks.userId, userId),
      eq(buildBookmarks.buildId, buildId)
    ));

  return true;
}

export async function getUserBookmarks(userId: number, collectionName?: string) {
  const db = await getDb();
  if (!db) return [];

  const whereCondition = collectionName 
    ? and(eq(buildBookmarks.userId, userId), eq(buildBookmarks.collectionName, collectionName))
    : eq(buildBookmarks.userId, userId);

  const results = await db.select({
    bookmark: buildBookmarks,
    build: buildProjects,
  })
    .from(buildBookmarks)
    .innerJoin(buildProjects, eq(buildBookmarks.buildId, buildProjects.id))
    .where(whereCondition)
    .orderBy(desc(buildBookmarks.createdAt));

  return results;
}

export async function isBookmarked(userId: number, buildId: number) {
  const db = await getDb();
  if (!db) return false;

  const result = await db.select()
    .from(buildBookmarks)
    .where(and(
      eq(buildBookmarks.userId, userId),
      eq(buildBookmarks.buildId, buildId)
    ))
    .limit(1);

  return result.length > 0;
}

export async function getUserBookmarkCollections(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const results = await db.select({
    collectionName: buildBookmarks.collectionName,
    count: sql<number>`COUNT(*)`,
  })
    .from(buildBookmarks)
    .where(eq(buildBookmarks.userId, userId))
    .groupBy(buildBookmarks.collectionName);

  return results;
}

export async function updateBookmark(userId: number, buildId: number, data: {
  collectionName?: string;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) return false;

  await db.update(buildBookmarks)
    .set(data)
    .where(and(
      eq(buildBookmarks.userId, userId),
      eq(buildBookmarks.buildId, buildId)
    ));

  return true;
}


// ============================================
// DONATION LEADERBOARD QUERIES
// ============================================

export async function getDonationLeaderboard(timeFilter: 'all' | 'monthly' | 'weekly' = 'all', limit = 20) {
  const db = await getDb();
  if (!db) return [];
  
  let dateFilter = undefined;
  const now = new Date();
  
  if (timeFilter === 'weekly') {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    dateFilter = gte(donations.createdAt, weekAgo);
  } else if (timeFilter === 'monthly') {
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    dateFilter = gte(donations.createdAt, monthAgo);
  }
  
  const conditions = [eq(donations.status, 'confirmed'), eq(donations.isPublic, true)];
  if (dateFilter) conditions.push(dateFilter);
  
  // Group by userId for logged-in donors, or by donorName for anonymous
  const result = await db.select({
    donorName: donations.donorName,
    userId: donations.userId,
    totalAmount: sql<string>`COALESCE(SUM(CAST(${donations.amount} AS DECIMAL(20,9))), 0)`,
    donationCount: sql<number>`COUNT(*)`,
    lastDonation: sql<Date>`MAX(${donations.createdAt})`,
  })
    .from(donations)
    .where(and(...conditions))
    .groupBy(donations.userId, donations.donorName)
    .orderBy(desc(sql`SUM(CAST(${donations.amount} AS DECIMAL(20,9)))`))
    .limit(limit);
  
  // Enrich with user data for logged-in donors
  const enrichedResults = await Promise.all(result.map(async (donor) => {
    if (donor.userId) {
      const user = await getUserById(donor.userId);
      return {
        ...donor,
        displayName: user?.displayName || user?.name || donor.donorName || 'Anonymous',
        avatarUrl: user?.avatarUrl,
        hasSupporterBadge: true,
      };
    }
    return {
      ...donor,
      displayName: donor.donorName || 'Anonymous',
      avatarUrl: undefined,
      hasSupporterBadge: false,
    };
  }));
  
  return enrichedResults;
}

export async function getUserDonationTotal(userId: number) {
  const db = await getDb();
  if (!db) return { totalAmount: '0', donationCount: 0 };
  
  const result = await db.select({
    totalAmount: sql<string>`COALESCE(SUM(CAST(${donations.amount} AS DECIMAL(20,9))), 0)`,
    donationCount: sql<number>`COUNT(*)`,
  })
    .from(donations)
    .where(and(eq(donations.userId, userId), eq(donations.status, 'confirmed')));
  
  return {
    totalAmount: result[0]?.totalAmount || '0',
    donationCount: result[0]?.donationCount || 0,
  };
}

export async function checkUserHasSupporterBadge(userId: number): Promise<boolean> {
  const badges = await getUserBadges(userId);
  return badges.some(b => b.badge.slug === 'supporter');
}


// ============================================
// IMAGE BUILD QUERIES
// ============================================

export async function getProjectsWithImages(limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select()
    .from(buildProjects)
    .where(sql`${buildProjects.sourceImageUrl} IS NOT NULL`)
    .orderBy(desc(buildProjects.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getUserImageBuilds(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select()
    .from(buildProjects)
    .where(and(
      eq(buildProjects.creatorId, userId),
      sql`${buildProjects.sourceImageUrl} IS NOT NULL`
    ))
    .orderBy(desc(buildProjects.createdAt));
}


// ============================================
// REAL PLATFORM STATISTICS (replaces hardcoded stats)
// ============================================

export async function getRealPlatformStats() {
  const db = await getDb();
  if (!db) return {
    totalAgents: 0,
    totalBricksPlaced: 0,
    totalBuildsCompleted: 0,
    totalUsers: 0,
  };

  // Count registered agents
  const agentResult = await db.select({
    count: sql<number>`COUNT(*)`,
    totalBricks: sql<number>`COALESCE(SUM(${agents.totalBricksPlaced}), 0)`,
  }).from(agents);

  // Count completed builds
  const buildResult = await db.select({
    count: sql<number>`COUNT(*)`,
  }).from(buildProjects).where(eq(buildProjects.status, 'completed'));

  // Count total users
  const userResult = await db.select({
    count: sql<number>`COUNT(*)`,
  }).from(users);

  return {
    totalAgents: Number(agentResult[0]?.count) || 0,
    totalBricksPlaced: Number(agentResult[0]?.totalBricks) || 0,
    totalBuildsCompleted: Number(buildResult[0]?.count) || 0,
    totalUsers: Number(userResult[0]?.count) || 0,
  };
}

// ============================================
// COMPLETED BUILDS PERSISTENCE
// ============================================

export async function saveCompletedBuild(data: {
  name: string;
  description: string;
  theme: string;
  style: string;
  brickData: any;
  currentBricks: number;
  contributors: string[];
  messageCount: number;
}) {
  const db = await getDb();
  if (!db) return null;

  const publicId = nanoid(16);

  // We reuse buildProjects table with status='completed' and a system creator (id=0 or first admin)
  // Use creatorId=0 for system-generated builds
  await db.insert(buildProjects).values({
    publicId,
    creatorId: 0,
    name: data.name,
    description: data.description || '',
    theme: data.theme,
    style: data.style,
    brickData: data.brickData,
    currentBricks: data.currentBricks,
    totalContributors: data.contributors.length,
    totalMessages: data.messageCount,
    status: 'completed',
    completedAt: new Date(),
  });

  return publicId;
}

export async function getCompletedBuildsFromDb(limit = 20) {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(buildProjects)
    .where(eq(buildProjects.status, 'completed'))
    .orderBy(desc(buildProjects.completedAt))
    .limit(limit);
}
