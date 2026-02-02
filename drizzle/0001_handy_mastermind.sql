CREATE TABLE `activity_feed` (
	`id` int AUTO_INCREMENT NOT NULL,
	`publicId` varchar(32) NOT NULL,
	`actorType` enum('user','agent','system') NOT NULL,
	`actorId` int,
	`activityType` enum('agent_created','agent_skill_acquired','project_created','project_completed','brick_placed','collaboration_started','milestone_reached','message_sent') NOT NULL,
	`projectId` int,
	`agentId` int,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_feed_id` PRIMARY KEY(`id`),
	CONSTRAINT `activity_feed_publicId_unique` UNIQUE(`publicId`)
);
--> statement-breakpoint
CREATE TABLE `agent_follows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`followerId` int NOT NULL,
	`followerType` enum('user','agent') NOT NULL,
	`followingAgentId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agent_follows_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agent_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`publicId` varchar(32) NOT NULL,
	`projectId` int NOT NULL,
	`agentId` int NOT NULL,
	`content` text NOT NULL,
	`messageType` enum('idea','action','reaction','question','celebration','system') NOT NULL DEFAULT 'idea',
	`replyToId` int,
	`mentionedAgentIds` json,
	`brickAction` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agent_messages_id` PRIMARY KEY(`id`),
	CONSTRAINT `agent_messages_publicId_unique` UNIQUE(`publicId`)
);
--> statement-breakpoint
CREATE TABLE `agent_skills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` int NOT NULL,
	`skillId` int NOT NULL,
	`proficiency` int NOT NULL DEFAULT 1,
	`isActive` boolean NOT NULL DEFAULT true,
	`acquiredAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agent_skills_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`publicId` varchar(32) NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`emoji` varchar(10) NOT NULL,
	`color` varchar(20) NOT NULL,
	`tagline` varchar(200),
	`bio` text,
	`personality` json,
	`voiceStyle` enum('formal','casual','enthusiastic','technical','creative') DEFAULT 'casual',
	`status` enum('active','idle','building','thinking','chatting','offline') NOT NULL DEFAULT 'idle',
	`isPublic` boolean NOT NULL DEFAULT true,
	`isVerified` boolean NOT NULL DEFAULT false,
	`level` int NOT NULL DEFAULT 1,
	`experience` int NOT NULL DEFAULT 0,
	`totalBricksPlaced` int NOT NULL DEFAULT 0,
	`totalBuildsContributed` int NOT NULL DEFAULT 0,
	`totalMessages` int NOT NULL DEFAULT 0,
	`totalCollaborations` int NOT NULL DEFAULT 0,
	`reputation` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastActiveAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agents_id` PRIMARY KEY(`id`),
	CONSTRAINT `agents_publicId_unique` UNIQUE(`publicId`)
);
--> statement-breakpoint
CREATE TABLE `build_projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`publicId` varchar(32) NOT NULL,
	`creatorId` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`theme` varchar(50),
	`style` varchar(50),
	`targetBricks` int NOT NULL DEFAULT 100,
	`maxAgents` int NOT NULL DEFAULT 8,
	`isOpenToJoin` boolean NOT NULL DEFAULT true,
	`status` enum('planning','building','paused','completed','archived') NOT NULL DEFAULT 'planning',
	`brickData` json,
	`currentBricks` int NOT NULL DEFAULT 0,
	`totalContributors` int NOT NULL DEFAULT 0,
	`totalMessages` int NOT NULL DEFAULT 0,
	`likes` int NOT NULL DEFAULT 0,
	`views` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	CONSTRAINT `build_projects_id` PRIMARY KEY(`id`),
	CONSTRAINT `build_projects_publicId_unique` UNIQUE(`publicId`)
);
--> statement-breakpoint
CREATE TABLE `collaboration_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`publicId` varchar(32) NOT NULL,
	`fromAgentId` int NOT NULL,
	`toAgentId` int NOT NULL,
	`projectId` int,
	`message` text,
	`requestType` enum('join_project','skill_help','collaboration','mentorship') NOT NULL,
	`status` enum('pending','accepted','declined','expired') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`respondedAt` timestamp,
	`expiresAt` timestamp,
	CONSTRAINT `collaboration_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `collaboration_requests_publicId_unique` UNIQUE(`publicId`)
);
--> statement-breakpoint
CREATE TABLE `project_participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`agentId` int NOT NULL,
	`role` enum('lead','contributor','observer') NOT NULL DEFAULT 'contributor',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	`bricksPlaced` int NOT NULL DEFAULT 0,
	`messagesCount` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`lastContributedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_participants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `skills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(64) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`category` enum('design','engineering','aesthetics','specialty','social') NOT NULL,
	`systemPrompt` text,
	`capabilities` json,
	`icon` varchar(50),
	`color` varchar(20),
	`minLevel` int NOT NULL DEFAULT 1,
	`isBuiltIn` boolean NOT NULL DEFAULT false,
	`agentCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `skills_id` PRIMARY KEY(`id`),
	CONSTRAINT `skills_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `displayName` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `totalAgents` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `totalContributions` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `reputation` int DEFAULT 0 NOT NULL;