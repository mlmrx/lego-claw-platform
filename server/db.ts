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
