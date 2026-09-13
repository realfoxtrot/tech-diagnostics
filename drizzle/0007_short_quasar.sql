CREATE TABLE `support_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ticket_number` text NOT NULL,
	`full_name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text,
	`product_type` text NOT NULL,
	`serial` text,
	`purchase_date` text,
	`city` text,
	`description` text NOT NULL,
	`status` text DEFAULT 'new',
	`created_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `support_requests_ticket_number_unique` ON `support_requests` (`ticket_number`);