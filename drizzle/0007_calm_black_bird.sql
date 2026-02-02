CREATE TABLE `build_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`publicId` varchar(32) NOT NULL,
	`buildId` int NOT NULL,
	`userId` int NOT NULL,
	`parentId` int,
	`content` text NOT NULL,
	`isEdited` boolean NOT NULL DEFAULT false,
	`isDeleted` boolean NOT NULL DEFAULT false,
	`likes` int NOT NULL DEFAULT 0,
	`replyCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `build_comments_id` PRIMARY KEY(`id`),
	CONSTRAINT `build_comments_publicId_unique` UNIQUE(`publicId`)
);
--> statement-breakpoint
CREATE TABLE `build_ratings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`publicId` varchar(32) NOT NULL,
	`buildId` int NOT NULL,
	`userId` int NOT NULL,
	`overallRating` int NOT NULL,
	`creativityRating` int,
	`technicalRating` int,
	`aestheticsRating` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `build_ratings_id` PRIMARY KEY(`id`),
	CONSTRAINT `build_ratings_publicId_unique` UNIQUE(`publicId`),
	CONSTRAINT `build_ratings_buildId_userId_unique` UNIQUE(`buildId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `comment_likes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`commentId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `comment_likes_id` PRIMARY KEY(`id`),
	CONSTRAINT `comment_likes_commentId_userId_unique` UNIQUE(`commentId`,`userId`)
);
