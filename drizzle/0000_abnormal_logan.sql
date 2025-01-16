CREATE TABLE `profiles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cuid` text NOT NULL,
	`user_id` integer NOT NULL,
	`linked_schemas` text,
	`title` text,
	`profile` text,
	`node_id` text,
	`last_updated` integer NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `profiles_cuid_unique` ON `profiles` (`cuid`);--> statement-breakpoint
CREATE INDEX `profiles_id_index` ON `profiles` (`id`);--> statement-breakpoint
CREATE INDEX `profiles_cuid_index` ON `profiles` (`cuid`);--> statement-breakpoint
CREATE INDEX `profiles_user_id_index` ON `profiles` (`user_id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_token` text NOT NULL,
	`user_id` integer NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_session_token_unique` ON `sessions` (`session_token`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cuid` text NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`last_login` integer NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_cuid_unique` ON `users` (`cuid`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_id_index` ON `users` (`id`);--> statement-breakpoint
CREATE INDEX `users_cuid_index` ON `users` (`cuid`);