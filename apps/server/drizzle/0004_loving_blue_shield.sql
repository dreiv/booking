CREATE TYPE "public"."booking_status_v2" AS ENUM('held', 'confirmed', 'cancelled', 'expired');--> statement-breakpoint
CREATE TABLE "booking" (
	"booking_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hotel_id" integer NOT NULL,
	"room_type_id" integer NOT NULL,
	"user_id" integer,
	"guest_email" text,
	"guest_first_name" text,
	"guest_last_name" text,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" "booking_status_v2" DEFAULT 'held' NOT NULL,
	"room_count" integer DEFAULT 1 NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_hotel_id_hotel_hotel_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotel"("hotel_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_room_type_id_room_type_room_type_id_fk" FOREIGN KEY ("room_type_id") REFERENCES "public"."room_type"("room_type_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;