CREATE TYPE "public"."transaction_type" AS ENUM('payment', 'refund');--> statement-breakpoint
CREATE TABLE "transaction" (
	"transaction_id" serial PRIMARY KEY NOT NULL,
	"booking_id" uuid NOT NULL,
	"transaction_type" "transaction_type" NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"transaction_date" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_booking_id_booking_booking_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."booking"("booking_id") ON DELETE no action ON UPDATE no action;