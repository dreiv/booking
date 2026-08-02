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
ALTER TABLE "room" ADD CONSTRAINT "room_hotel_id_hotel_hotel_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotel"("hotel_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room" ADD CONSTRAINT "room_room_type_id_room_type_room_type_id_fk" FOREIGN KEY ("room_type_id") REFERENCES "public"."room_type"("room_type_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_type" ADD CONSTRAINT "room_type_hotel_id_hotel_hotel_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotel"("hotel_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_type_inventory" ADD CONSTRAINT "room_type_inventory_hotel_id_hotel_hotel_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotel"("hotel_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_type_inventory" ADD CONSTRAINT "room_type_inventory_room_type_id_room_type_room_type_id_fk" FOREIGN KEY ("room_type_id") REFERENCES "public"."room_type"("room_type_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_type_rate" ADD CONSTRAINT "room_type_rate_hotel_id_hotel_hotel_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotel"("hotel_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_type_rate" ADD CONSTRAINT "room_type_rate_room_type_id_room_type_room_type_id_fk" FOREIGN KEY ("room_type_id") REFERENCES "public"."room_type"("room_type_id") ON DELETE no action ON UPDATE no action;