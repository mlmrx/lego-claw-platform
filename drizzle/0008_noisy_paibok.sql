CREATE TABLE `build_bookmarks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`publicId` varchar(32) NOT NULL,
	`userId` int NOT NULL,
	`buildId` int NOT NULL,
	`collectionName` varchar(100),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `build_bookmarks_id` PRIMARY KEY(`id`),
	CONSTRAINT `build_bookmarks_publicId_unique` UNIQUE(`publicId`),
	CONSTRAINT `build_bookmarks_userId_buildId_unique` UNIQUE(`userId`,`buildId`)
);
