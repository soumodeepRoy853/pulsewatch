CREATE TABLE "monitors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"url" varchar(2048) NOT NULL,
	"method" varchar(10) DEFAULT 'GET' NOT NULL,
	"interval_seconds" integer DEFAULT 60 NOT NULL,
	"timeout_ms" integer DEFAULT 5000 NOT NULL,
	"expected_status" integer DEFAULT 200 NOT NULL,
	"latency_threshold_ms" integer DEFAULT 1000 NOT NULL,
	"failure_threshold" integer DEFAULT 3 NOT NULL,
	"recovery_threshold" integer DEFAULT 2 NOT NULL,
	"status" varchar(20) DEFAULT 'UNKNOWN' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "monitors" ADD CONSTRAINT "monitors_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "monitors_organization_idx" ON "monitors" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "monitors_organization_enabled_idx" ON "monitors" USING btree ("organization_id","enabled");--> statement-breakpoint
CREATE INDEX "monitors_organization_deleted_idx" ON "monitors" USING btree ("organization_id","deleted_at");