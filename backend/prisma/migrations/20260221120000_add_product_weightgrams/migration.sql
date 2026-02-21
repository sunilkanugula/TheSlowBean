-- Add required product weight in grams with safe default for existing rows
ALTER TABLE "Product"
ADD COLUMN "weightGrams" INTEGER NOT NULL DEFAULT 500;

ALTER TABLE "Product"
ALTER COLUMN "weightGrams" DROP DEFAULT;
