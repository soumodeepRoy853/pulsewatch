ALTER TABLE "monitors" ADD COLUMN "consecutive_failures" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "monitors" ADD COLUMN "consecutive_successes" integer DEFAULT 0 NOT NULL;