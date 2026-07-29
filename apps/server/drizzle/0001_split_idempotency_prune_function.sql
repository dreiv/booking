--> statement-breakpoint
CREATE OR REPLACE FUNCTION prune_expired_idempotency_keys_now(exclude_key text DEFAULT NULL)
RETURNS void AS $$
BEGIN
  DELETE FROM idempotency_keys
  WHERE created_at < now() - interval '24 hours'
    AND (exclude_key IS NULL OR key <> exclude_key);
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION prune_expired_idempotency_keys_trigger()
RETURNS trigger AS $$
BEGIN
  IF random() < 0.001 THEN
    PERFORM prune_expired_idempotency_keys_now(NEW.key);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
DROP TRIGGER IF EXISTS trg_prune_idempotency_keys ON idempotency_keys;
--> statement-breakpoint
CREATE TRIGGER trg_prune_idempotency_keys
AFTER INSERT ON idempotency_keys
FOR EACH ROW
EXECUTE FUNCTION prune_expired_idempotency_keys_trigger();
