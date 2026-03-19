PRAGMA foreign_keys = OFF;
--> statement-breakpoint
DROP TABLE IF EXISTS `category_items`;
--> statement-breakpoint
DROP TABLE IF EXISTS `categories`;
--> statement-breakpoint
DROP TABLE IF EXISTS `lists`;
--> statement-breakpoint
DROP TABLE IF EXISTS `library_settings`;
--> statement-breakpoint
DROP TABLE IF EXISTS `users`;
--> statement-breakpoint
PRAGMA foreign_keys = ON;
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text NOT NULL,
	`emailVerified` integer DEFAULT false NOT NULL,
	`image` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expiresAt` integer NOT NULL,
	`token` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`ipAddress` text,
	`userAgent` text,
	`userId` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);
--> statement-breakpoint
CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`accountId` text NOT NULL,
	`providerId` text NOT NULL,
	`userId` text NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`idToken` text,
	`accessTokenExpiresAt` integer,
	`refreshTokenExpiresAt` integer,
	`scope` text,
	`password` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`createdAt` integer,
	`updatedAt` integer
);
--> statement-breakpoint
CREATE TABLE `library_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`total_unit` text DEFAULT 'oz',
	`item_unit` text DEFAULT 'oz',
	`show_sidebar` integer DEFAULT 0,
	`currency_symbol` text DEFAULT '$',
	`default_list_id` integer,
	`opt_images` integer DEFAULT 0,
	`opt_price` integer DEFAULT 0,
	`opt_worn` integer DEFAULT 1,
	`opt_consumable` integer DEFAULT 1,
	`opt_list_description` integer DEFAULT 0,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `library_settings_user_id_unique` ON `library_settings` (`user_id`);
--> statement-breakpoint
CREATE TABLE `lists` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`name` text DEFAULT '',
	`description` text DEFAULT '',
	`external_id` text NOT NULL,
	`sort_order` integer DEFAULT 0,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lists_external_id_unique` ON `lists` (`external_id`);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`list_id` integer NOT NULL,
	`name` text DEFAULT '',
	`sort_order` integer DEFAULT 0,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`list_id`) REFERENCES `lists`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `category_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category_id` integer NOT NULL,
	`user_id` text NOT NULL,
	`global_item_id` integer,
	`name` text DEFAULT '',
	`description` text DEFAULT '',
	`weight` real DEFAULT 0,
	`author_unit` text DEFAULT 'oz',
	`price` real DEFAULT 0,
	`image` text DEFAULT '',
	`image_url` text DEFAULT '',
	`url` text DEFAULT '',
	`qty` integer DEFAULT 1,
	`worn` integer DEFAULT 0,
	`consumable` integer DEFAULT 0,
	`star` integer DEFAULT 0,
	`sort_order` integer DEFAULT 0,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
