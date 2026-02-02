CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`userOpenId` varchar(64),
	`action` enum('api_key_created','api_key_deleted','api_key_rotated','agent_created','agent_deleted','agent_transferred','external_agent_registered','external_agent_verified','external_agent_claimed','external_agent_deleted','webhook_created','webhook_deleted','webhook_secret_rotated','login_success','login_failed','logout','ip_blocked','ip_unblocked','admin_role_granted','admin_role_revoked','user_banned','user_unbanned','data_exported','data_deleted','system_config_changed') NOT NULL,
	`entityType` enum('user','agent','external_agent','api_key','webhook','project','challenge','system'),
	`entityId` int,
	`entityPublicId` varchar(64),
	`ipAddress` varchar(45),
	`userAgent` text,
	`requestId` varchar(64),
	`details` json,
	`previousValue` json,
	`newValue` json,
	`status` enum('success','failure','partial') NOT NULL DEFAULT 'success',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
