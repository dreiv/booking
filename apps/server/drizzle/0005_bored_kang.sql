ALTER TABLE "bookings" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "bookings" CASCADE;--> statement-breakpoint
ALTER TABLE "booking" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "booking" ALTER COLUMN "status" SET DEFAULT 'held'::text;--> statement-breakpoint
DROP TYPE "public"."booking_status";--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('held', 'confirmed', 'cancelled', 'expired');--> statement-breakpoint
ALTER TABLE "booking" ALTER COLUMN "status" SET DEFAULT 'held'::"public"."booking_status";--> statement-breakpoint
ALTER TABLE "booking" ALTER COLUMN "status" SET DATA TYPE "public"."booking_status" USING "status"::"public"."booking_status";--> statement-breakpoint
ALTER TABLE "booking" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "booking" ALTER COLUMN "guest_email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "booking" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "booking" ALTER COLUMN "status" SET DATA TYPE "public"."booking_status" USING "status"::text::"public"."booking_status";--> statement-breakpoint
ALTER TABLE "booking" ALTER COLUMN "status" SET DEFAULT 'held';--> statement-breakpoint
DROP TYPE "public"."booking_status_v2";