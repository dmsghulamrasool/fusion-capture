import { MongoClient } from "mongodb";

// MongoDB native client for NextAuth adapter
// Check if we're in build time (no MONGODB_URI) - don't throw during build
const uri: string | undefined = process.env.MONGODB_URI;

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!uri) {
  // During build time, create a dummy promise that will fail at runtime
  // This prevents build errors while still requiring env var at runtime
  clientPromise = Promise.reject(
    new Error("Please add your Mongo URI to .env.local")
  ) as Promise<MongoClient>;
} else {
  if (process.env.NODE_ENV === "development") {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    let globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
      client = new MongoClient(uri);
      globalWithMongo._mongoClientPromise = client.connect();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
  } else {
    // In production mode, it's best to not use a global variable.
    client = new MongoClient(uri);
    clientPromise = client.connect();
  }
}

// Export MongoDB native client promise for NextAuth adapter
export default clientPromise;
