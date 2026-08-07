CREATE EXTENSION IF NOT EXISTS pg_cron;
--> statement-breakpoint
-- Replace the insert-trigger approach with a scheduled job, and extend the
-- idempotency-key retention window from 24h to 48h.
CREATE OR REPLACE FUNCTION prune_expired_idempotency_keys_now(exclude_key text DEFAULT NULL)
RETURNS void AS $$
BEGIN
  DELETE FROM idempotency_keys
  WHERE created_at < now() - interval '48 hours'
    AND (exclude_key IS NULL OR key <> exclude_key);
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
DROP TRIGGER IF EXISTS trg_prune_idempotency_keys ON idempotency_keys;
--> statement-breakpoint
DROP FUNCTION IF EXISTS prune_expired_idempotency_keys_trigger();
--> statement-breakpoint
-- Release inventory + expire any booking hold past its TTL. Both the
-- inventory release and the status flip happen per booking, and
-- SKIP LOCKED means a booking mid-confirm/cancel is left alone this run
-- and picked up next run if it's still 'held' and past expires_at.
CREATE OR REPLACE FUNCTION prune_expired_booking_holds_now()
RETURNS void AS $$
DECLARE
  expired_booking RECORD;
BEGIN
  FOR expired_booking IN
    SELECT booking_id, hotel_id, room_type_id, room_count, check_in, check_out
    FROM booking
    WHERE status = 'held'
      AND expires_at IS NOT NULL
      AND expires_at < now()
    FOR UPDATE SKIP LOCKED
  LOOP
    UPDATE room_type_inventory
    SET total_reserved = total_reserved - expired_booking.room_count
    WHERE hotel_id = expired_booking.hotel_id
      AND room_type_id = expired_booking.room_type_id
      AND date >= expired_booking.check_in
      AND date < expired_booking.check_out;

    UPDATE booking
    SET status = 'expired', expires_at = NULL
    WHERE booking_id = expired_booking.booking_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
SELECT cron.schedule('prune-expired-booking-holds', '* * * * *', $$SELECT prune_expired_booking_holds_now();$$);
--> statement-breakpoint
SELECT cron.schedule('prune-idempotency-keys', '0 * * * *', $$SELECT prune_expired_idempotency_keys_now();$$);
