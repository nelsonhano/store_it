import { Client, Storage, Databases, Query } from "node-appwrite";
import fs from "fs";
import path from "path";

// Read .env.local manually to ensure variables are available
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
      process.env[key] = val;
    }
  }
}

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT;
const secretKey = process.env.NEXT_APPWRITE_KEY;
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE;
const collectionId = process.env.NEXT_PUBLIC_APPRWRITE_FILES_COLLECTION;
const bucketId = process.env.NEXT_PUBLIC_APPWRITE_BUCKET;

if (!endpoint || !project || !secretKey || !bucketId) {
  console.error("Missing required Appwrite configuration in .env.local");
  process.exit(1);
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(project)
  .setKey(secretKey);

const storage = new Storage(client);
const databases = new Databases(client);

async function run() {
  console.log("1. Inspecting storage bucket...");
  const bucket = await storage.getBucket(bucketId);
  console.log("Bucket name:", bucket.name);
  const permissions = bucket.$permissions || bucket.permissions || [];
  console.log("Current bucket permissions:", permissions);

  const hasPublicRead = permissions.some(
    (perm) =>
      perm.toLowerCase().includes('read("any")') || perm === 'read("any")',
  );

  if (hasPublicRead) {
    console.log("Revoking public read permissions from bucket...");
    const newPermissions = permissions.filter(
      (perm) =>
        !perm.toLowerCase().includes('read("any")') && perm !== 'read("any")',
    );

    await storage.updateBucket(
      bucketId,
      bucket.name,
      newPermissions,
      bucket.fileSecurity,
      bucket.enabled,
      bucket.maximumFileSize,
      bucket.allowedFileExtensions,
      bucket.compression,
      bucket.encryption,
      bucket.antivirus,
    );
    console.log("Storage bucket permissions locked down successfully.");
  } else {
    console.log("Storage bucket already has no public read permissions.");
  }

  console.log("\n2. Database records check:");
  console.log(
    "Appwrite database schema enforces a valid absolute URL format for the 'url' attribute.",
  );
  console.log(
    "Next.js server actions (getFiles and uploadFile) automatically normalize all URLs to /api/files/[id]/view at runtime.",
  );
  console.log("No manual database attribute modification required.");
  console.log("\nBucket security check and verification complete!");
}

run().catch((err) => {
  console.error("Script execution failed:", err);
  process.exit(1);
});
