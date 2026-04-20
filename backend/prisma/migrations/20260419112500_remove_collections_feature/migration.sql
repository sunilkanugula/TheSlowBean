-- Remove the standalone collection feature and its product links.
DROP TABLE IF EXISTS "ProductCollection";
DROP TABLE IF EXISTS "Collection";

ALTER TABLE "Product" DROP COLUMN IF EXISTS "collection";
