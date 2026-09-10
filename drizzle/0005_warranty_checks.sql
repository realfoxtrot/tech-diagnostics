CREATE TABLE `warranty_checks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`serial_number` text NOT NULL,
	`purchase_date` text,
	`result` text NOT NULL,
	`status` text DEFAULT 'pending',
	`created_at` text DEFAULT (datetime('now'))
);
