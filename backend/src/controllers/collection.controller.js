import cloudinary from "../utils/cloudinary.js";
import prisma from "../utils/prisma.js";

const sanitizeCollectionName = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ");

export const getCollections = async (_req, res) => {
  try {
    const collections = await prisma.collection.findMany({
      orderBy: { name: "asc" },
    });
    res.json(collections);
  } catch (error) {
    console.error("GET COLLECTIONS ERROR:", error);
    res.status(500).json({ message: "Failed to load collections" });
  }
};

export const createCollection = async (req, res) => {
  try {
    const name = sanitizeCollectionName(req.body?.name);

    if (!name) {
      return res.status(400).json({ message: "Collection name is required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Collection image is required" });
    }

    const existing = await prisma.collection.findUnique({
      where: { name },
    });

    if (existing) {
      return res.status(409).json({ message: "Collection already exists" });
    }

    const upload = await cloudinary.uploader.upload(
      `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
      { folder: "collections" }
    );

    const created = await prisma.collection.create({
      data: {
        name,
        imageUrl: upload.secure_url,
      },
    });

    return res.status(201).json(created);
  } catch (error) {
    console.error("CREATE COLLECTION ERROR:", error);
    return res.status(500).json({ message: "Failed to create collection" });
  }
};

const getCollectionPublicIdFromUrl = (url) => {
  if (!url) return null;
  const parts = String(url).split("/");
  const file = parts[parts.length - 1];
  const name = file.split(".")[0];
  return `collections/${name}`;
};

export const deleteCollection = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid collection id" });
    }

    const existing = await prisma.collection.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ message: "Collection not found" });
    }

    await prisma.collection.delete({
      where: { id },
    });

    const publicId = getCollectionPublicIdFromUrl(existing.imageUrl);
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }

    return res.json({ message: "Collection deleted" });
  } catch (error) {
    console.error("DELETE COLLECTION ERROR:", error);
    return res.status(500).json({ message: "Failed to delete collection" });
  }
};
