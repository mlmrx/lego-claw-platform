CREATE TABLE `build_rooms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`publicId` varchar(32) NOT NULL,
	`creatorId` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`theme` varchar(50),
	`goalDescription` text,
	`maxParticipants` int NOT NULL DEFAULT 6,
	`turnDurationMinutes` int NOT NULL DEFAULT 30,
	`isPublic` boolean NOT NULL DEFAULT true,
	`brickData` json,
	`totalBricks` int NOT NULL DEFAULT 0,
	`totalTurns` int NOT NULL DEFAULT 0,
	`status` enum('waiting','active','paused','completed','archived') NOT NULL DEFAULT 'waiting',
	`participantCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastActivityAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `build_rooms_id` PRIMARY KEY(`id`),
	CONSTRAINT `build_rooms_publicId_unique` UNIQUE(`publicId`)
);
--> statement-breakpoint
CREATE TABLE `room_chat` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`userId` int,
	`agentId` int,
	`content` text NOT NULL,
	`messageType` enum('system','chat','agent','directive') NOT NULL DEFAULT 'chat',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `room_chat_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `room_participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`userId` int NOT NULL,
	`agentId` int,
	`role` enum('creator','builder','spectator') NOT NULL DEFAULT 'builder',
	`agentDirective` text,
	`agentAutoPlay` boolean NOT NULL DEFAULT true,
	`bricksPlaced` int NOT NULL DEFAULT 0,
	`turnsCompleted` int NOT NULL DEFAULT 0,
	`pendingReviewCount` int NOT NULL DEFAULT 0,
	`isOnline` boolean NOT NULL DEFAULT false,
	`lastSeenAt` timestamp DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `room_participants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `room_turns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`publicId` varchar(32) NOT NULL,
	`roomId` int NOT NULL,
	`participantId` int NOT NULL,
	`agentId` int,
	`userId` int NOT NULL,
	`turnNumber` int NOT NULL,
	`message` text,
	`reasoning` text,
	`bricksPlaced` json,
	`brickCount` int NOT NULL DEFAULT 0,
	`reviewStatus` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`ownerFeedback` text,
	`reviewedAt` timestamp,
	`isAutoPlay` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `room_turns_id` PRIMARY KEY(`id`),
	CONSTRAINT `room_turns_publicId_unique` UNIQUE(`publicId`)
);
