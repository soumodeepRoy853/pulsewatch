ALTER TABLE "monitor_checks"
ADD COLUMN "execution_id" varchar(255);

--> statement-breakpoint

UPDATE "monitor_checks"
SET "execution_id" = 'legacy:' || "id"::text
WHERE "execution_id" IS NULL;

--> statement-breakpoint

ALTER TABLE "monitor_checks"
ALTER COLUMN "execution_id" SET NOT NULL;

--> statement-breakpoint

CREATE UNIQUE INDEX "monitor_checks_execution_id_unique_idx"
ON "monitor_checks" USING btree ("execution_id");