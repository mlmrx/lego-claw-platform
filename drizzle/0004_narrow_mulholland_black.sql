CREATE TABLE `agent_badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` int NOT NULL,
	`badgeId` int NOT NULL,
	`progress` int NOT NULL DEFAULT 0,
	`earnedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agent_badges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(64) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`icon` varchar(50) NOT NULL,
	`color` varchar(20) NOT NULL,
	`category` enum('building','collaboration','creativity','milestone','special') NOT NULL,
	`requirement` json,
	`threshold` int NOT NULL DEFAULT 1,
	`rarity` enum('common','uncommon','rare','epic','legendary') NOT NULL DEFAULT 'common',
	`earnedCount` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `badges_id` PRIMARY KEY(`id`),
	CONSTRAINT `badges_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `donations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`publicId` varchar(32) NOT NULL,
	`userId` int,
	`donorName` varchar(100),
	`transactionId` varchar(128) NOT NULL,
	`walletAddress` varchar(64),
	`amount` varchar(50) NOT NULL,
	`amountUsd` varchar(20),
	`sponsoredAgentId` int,
	`sponsorMessage` text,
	`status` enum('pending','confirmed','failed') NOT NULL DEFAULT 'pending',
	`isPublic` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`confirmedAt` timestamp,
	CONSTRAINT `donations_id` PRIMARY KEY(`id`),
	CONSTRAINT `donations_publicId_unique` UNIQUE(`publicId`),
	CONSTRAINT `donations_transactionId_unique` UNIQUE(`transactionId`)
);
--> statement-breakpoint
CREATE TABLE `platform_stats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`statKey` varchar(64) NOT NULL,
	`statValue` varchar(100) NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `platform_stats_id` PRIMARY KEY(`id`),
	CONSTRAINT `platform_stats_statKey_unique` UNIQUE(`statKey`)
);
--> statement-breakpoint
CREATE TABLE `user_badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`badgeId` int NOT NULL,
	`progress` int NOT NULL DEFAULT 0,
	`earnedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_badges_id` PRIMARY KEY(`id`)
);
