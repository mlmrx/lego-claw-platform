CREATE TABLE `stream_analytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`publicId` varchar(32) NOT NULL,
	`userId` int NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`buildSessionId` varchar(64) NOT NULL,
	`status` enum('configured','stopped','failed') NOT NULL,
	`destinationCount` int NOT NULL DEFAULT 0,
	`totalViewers` int NOT NULL DEFAULT 0,
	`platformBreakdown` json,
	`chatMessageCount` int NOT NULL DEFAULT 0,
	`startedAt` timestamp,
	`endedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stream_analytics_id` PRIMARY KEY(`id`),
	CONSTRAINT `stream_analytics_publicId_unique` UNIQUE(`publicId`)
);
--> statement-breakpoint
CREATE TABLE `stream_clips` (
	`id` int AUTO_INCREMENT NOT NULL,
	`publicId` varchar(32) NOT NULL,
	`userId` int NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`buildSessionId` varchar(64) NOT NULL,
	`title` varchar(160) NOT NULL,
	`startSeconds` int NOT NULL,
	`endSeconds` int NOT NULL,
	`platforms` json NOT NULL,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stream_clips_id` PRIMARY KEY(`id`),
	CONSTRAINT `stream_clips_publicId_unique` UNIQUE(`publicId`)
);
--> statement-breakpoint
CREATE TABLE `stream_schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`publicId` varchar(32) NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`buildSessionId` varchar(64) NOT NULL,
	`cronExpression` varchar(120) NOT NULL,
	`integrationPublicIds` json NOT NULL,
	`scheduleCronTaskUid` varchar(65),
	`isEnabled` boolean NOT NULL DEFAULT true,
	`lastRunAt` timestamp,
	`lastRunStatus` enum('never','configured','skipped','failed') NOT NULL DEFAULT 'never',
	`lastSessionId` varchar(64),
	`lastError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stream_schedules_id` PRIMARY KEY(`id`),
	CONSTRAINT `stream_schedules_publicId_unique` UNIQUE(`publicId`)
);
