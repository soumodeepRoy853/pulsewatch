CREATE TABLE "monitor_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"monitor_id" uuid NOT NULL,
	"status" varchar(20) NOT NULL,
	"status_code" integer,
	"response_time_ms" integer,
	"error_type" varchar(50),
	"error_message" text,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "monitor_checks" ADD CONSTRAINT "monitor_checks_monitor_id_monitors_id_fk" FOREIGN KEY ("monitor_id") REFERENCES "public"."monitors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "monitor_checks_monitor_checked_at_idx" ON "monitor_checks" USING btree ("monitor_id","checked_at");