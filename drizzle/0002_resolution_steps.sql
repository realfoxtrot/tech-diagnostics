CREATE TABLE `resolution_steps` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`resolution_id` integer NOT NULL,
	`text` text NOT NULL,
	`order` integer DEFAULT 0,
	`next_step_id` integer,
	`created_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`resolution_id`) REFERENCES `resolutions`(`id`) ON UPDATE no action ON DELETE cascade
);
