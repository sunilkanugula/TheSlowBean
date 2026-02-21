-- Add new DeliveryStatus values required for Shiprocket lifecycle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'DeliveryStatus' AND e.enumlabel = 'CONFIRMED'
  ) THEN
    ALTER TYPE "DeliveryStatus" ADD VALUE 'CONFIRMED';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'DeliveryStatus' AND e.enumlabel = 'RETURN_REQUESTED'
  ) THEN
    ALTER TYPE "DeliveryStatus" ADD VALUE 'RETURN_REQUESTED';
  END IF;
END $$;

-- Introduce Order.deliveryStatus as the only source of truth
ALTER TABLE "Order"
ADD COLUMN IF NOT EXISTS "deliveryStatus" "DeliveryStatus" NOT NULL DEFAULT 'CREATED';

UPDATE "Order"
SET "deliveryStatus" = CASE "orderStatus"::text
  WHEN 'PENDING' THEN 'CREATED'::"DeliveryStatus"
  WHEN 'SHIPPED' THEN 'IN_TRANSIT'::"DeliveryStatus"
  WHEN 'DELIVERED' THEN 'DELIVERED'::"DeliveryStatus"
  WHEN 'FAILED' THEN 'FAILED'::"DeliveryStatus"
  WHEN 'RETURN_REQUESTED' THEN 'RETURN_REQUESTED'::"DeliveryStatus"
  WHEN 'RETURN_APPROVED' THEN 'RETURN_REQUESTED'::"DeliveryStatus"
  WHEN 'RETURN_REJECTED' THEN 'FAILED'::"DeliveryStatus"
  WHEN 'RETURNED' THEN 'RETURNED'::"DeliveryStatus"
  ELSE 'CREATED'::"DeliveryStatus"
END
WHERE "orderStatus" IS NOT NULL;

ALTER TABLE "Order" DROP COLUMN IF EXISTS "orderStatus";
DROP TYPE IF EXISTS "OrderStatus";

-- Shiprocket shipment payload model
ALTER TABLE "DeliveryShipment"
DROP COLUMN IF EXISTS "partner",
DROP COLUMN IF EXISTS "externalShipmentId",
ADD COLUMN IF NOT EXISTS "shiprocketOrderId" TEXT;

-- Timeline status now uses DeliveryStatus enum
ALTER TABLE "OrderTrackingEvent"
ALTER COLUMN "status" TYPE "DeliveryStatus"
USING CASE
  WHEN upper("status") = 'CREATED' THEN 'CREATED'::"DeliveryStatus"
  WHEN upper("status") = 'CONFIRMED' THEN 'CONFIRMED'::"DeliveryStatus"
  WHEN upper("status") = 'PICKED_UP' THEN 'PICKED_UP'::"DeliveryStatus"
  WHEN upper("status") = 'IN_TRANSIT' THEN 'IN_TRANSIT'::"DeliveryStatus"
  WHEN upper("status") = 'OUT_FOR_DELIVERY' THEN 'OUT_FOR_DELIVERY'::"DeliveryStatus"
  WHEN upper("status") = 'DELIVERED' THEN 'DELIVERED'::"DeliveryStatus"
  WHEN upper("status") = 'FAILED' THEN 'FAILED'::"DeliveryStatus"
  WHEN upper("status") = 'RETURN_REQUESTED' THEN 'RETURN_REQUESTED'::"DeliveryStatus"
  WHEN upper("status") = 'RETURNED' THEN 'RETURNED'::"DeliveryStatus"
  WHEN upper("status") = 'PENDING' THEN 'CREATED'::"DeliveryStatus"
  WHEN upper("status") = 'SHIPPED' THEN 'IN_TRANSIT'::"DeliveryStatus"
  WHEN upper("status") = 'RETURN_APPROVED' THEN 'RETURN_REQUESTED'::"DeliveryStatus"
  WHEN upper("status") = 'RETURN_REJECTED' THEN 'FAILED'::"DeliveryStatus"
  ELSE 'IN_TRANSIT'::"DeliveryStatus"
END;

UPDATE "OrderTrackingEvent"
SET "source" = 'SHIPROCKET'
WHERE "source" IS NULL OR trim("source") = '';

ALTER TABLE "OrderTrackingEvent"
ALTER COLUMN "source" SET DEFAULT 'SHIPROCKET',
ALTER COLUMN "source" SET NOT NULL;
