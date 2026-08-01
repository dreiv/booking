CREATE TYPE "public"."user_role" AS ENUM('admin', 'host', 'guest');--> statement-breakpoint
CREATE TABLE "hotel" (
	"hotel_id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"location" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"user_id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"google_id" text,
	"role" "user_role" NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id")
);
--> statement-breakpoint
ALTER TABLE "bookings" DROP COLUMN "room_type";--> statement-breakpoint
DROP TYPE "public"."room_type";