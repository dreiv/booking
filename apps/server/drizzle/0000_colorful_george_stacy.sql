CREATE TYPE "public"."booking_status" AS ENUM('held', 'confirmed', 'cancelled', 'expired');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('payment', 'refund');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'host', 'guest');--> statement-breakpoint
CREATE TABLE "booking" (
	"booking_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hotel_id" integer NOT NULL,
	"room_type_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"guest_email" text NOT NULL,
	"guest_first_name" text,
	"guest_last_name" text,
	"check_in" date NOT NULL,
	"check_out" date NOT NULL,
	"status" "booking_status" DEFAULT 'held' NOT NULL,
	"room_count" integer DEFAULT 1 NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hotel" (
	"hotel_id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"location" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "idempotency_keys" (
	"key" text PRIMARY KEY NOT NULL,
	"request_path" text NOT NULL,
	"request_hash" text NOT NULL,
	"response_status" integer,
	"response_body" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room" (
	"room_id" serial PRIMARY KEY NOT NULL,
	"hotel_id" integer NOT NULL,
	"room_type_id" integer NOT NULL,
	"floor" integer NOT NULL,
	"number" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room_type" (
	"room_type_id" serial PRIMARY KEY NOT NULL,
	"hotel_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"max_occupancy" integer NOT NULL,
	"amenities" text,
	"overbooking_rate" numeric(4, 2) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room_type_inventory" (
	"hotel_id" integer NOT NULL,
	"room_type_id" integer NOT NULL,
	"date" date NOT NULL,
	"total_inventory" integer NOT NULL,
	"total_reserved" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "room_type_inventory_hotel_id_room_type_id_date_pk" PRIMARY KEY("hotel_id","room_type_id","date")
);
--> statement-breakpoint
CREATE TABLE "room_type_rate" (
	"hotel_id" integer NOT NULL,
	"room_type_id" integer NOT NULL,
	"date" date NOT NULL,
	"rate" numeric(10, 2) NOT NULL,
	CONSTRAINT "room_type_rate_hotel_id_room_type_id_date_pk" PRIMARY KEY("hotel_id","room_type_id","date")
);
--> statement-breakpoint
CREATE TABLE "transaction" (
	"transaction_id" serial PRIMARY KEY NOT NULL,
	"booking_id" uuid NOT NULL,
	"transaction_type" "transaction_type" NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"transaction_date" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text
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
ALTER TABLE "booking" ADD CONSTRAINT "booking_hotel_id_hotel_hotel_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotel"("hotel_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_room_type_id_room_type_room_type_id_fk" FOREIGN KEY ("room_type_id") REFERENCES "public"."room_type"("room_type_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room" ADD CONSTRAINT "room_hotel_id_hotel_hotel_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotel"("hotel_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room" ADD CONSTRAINT "room_room_type_id_room_type_room_type_id_fk" FOREIGN KEY ("room_type_id") REFERENCES "public"."room_type"("room_type_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_type" ADD CONSTRAINT "room_type_hotel_id_hotel_hotel_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotel"("hotel_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_type_inventory" ADD CONSTRAINT "room_type_inventory_hotel_id_hotel_hotel_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotel"("hotel_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_type_inventory" ADD CONSTRAINT "room_type_inventory_room_type_id_room_type_room_type_id_fk" FOREIGN KEY ("room_type_id") REFERENCES "public"."room_type"("room_type_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_type_rate" ADD CONSTRAINT "room_type_rate_hotel_id_hotel_hotel_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotel"("hotel_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_type_rate" ADD CONSTRAINT "room_type_rate_room_type_id_room_type_room_type_id_fk" FOREIGN KEY ("room_type_id") REFERENCES "public"."room_type"("room_type_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_booking_id_booking_booking_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."booking"("booking_id") ON DELETE no action ON UPDATE no action;