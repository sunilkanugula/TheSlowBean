-- Add Review table
CREATE TABLE IF NOT EXISTS "Review" (
  "id"        SERIAL PRIMARY KEY,
  "productId" INTEGER NOT NULL,
  "userId"    INTEGER NOT NULL,
  "rating"    INTEGER NOT NULL,
  "comment"   TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE,
  CONSTRAINT "Review_userId_fkey"    FOREIGN KEY ("userId")    REFERENCES "User"("id")    ON DELETE CASCADE,
  CONSTRAINT "Review_userId_productId_key" UNIQUE ("userId", "productId")
);

-- Add Coupon table
CREATE TABLE IF NOT EXISTS "Coupon" (
  "id"             SERIAL PRIMARY KEY,
  "code"           TEXT NOT NULL,
  "discountType"   TEXT NOT NULL,
  "discountValue"  DOUBLE PRECISION NOT NULL,
  "minOrderValue"  DOUBLE PRECISION NOT NULL DEFAULT 0,
  "maxUses"        INTEGER,
  "usedCount"      INTEGER NOT NULL DEFAULT 0,
  "expiresAt"      TIMESTAMP(3),
  "isActive"       BOOLEAN NOT NULL DEFAULT true,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Coupon_code_key" UNIQUE ("code")
);

-- Add Address table
CREATE TABLE IF NOT EXISTS "Address" (
  "id"        SERIAL PRIMARY KEY,
  "userId"    INTEGER NOT NULL,
  "label"     TEXT NOT NULL DEFAULT 'Home',
  "name"      TEXT NOT NULL,
  "phone"     TEXT NOT NULL,
  "altPhone"  TEXT,
  "line1"     TEXT NOT NULL,
  "city"      TEXT NOT NULL,
  "state"     TEXT NOT NULL,
  "pincode"   TEXT NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
