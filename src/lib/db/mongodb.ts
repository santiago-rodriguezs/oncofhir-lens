import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

const globalForMongoose = global as typeof globalThis & {
  mongoState: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose | null> | null;
    available: boolean | null; // null = not tried yet
  };
};

const state = globalForMongoose.mongoState || { conn: null, promise: null, available: null };
if (!globalForMongoose.mongoState) {
  globalForMongoose.mongoState = state;
}

export async function connectDB(): Promise<typeof mongoose | null> {
  // Already determined unavailable
  if (state.available === false) return null;
  // Already connected
  if (state.conn) return state.conn;
  // No URI configured
  if (!MONGODB_URI) {
    state.available = false;
    console.warn('[MongoDB] MONGODB_URI not set — using in-memory storage');
    return null;
  }

  if (!state.promise) {
    state.promise = mongoose
      .connect(MONGODB_URI, { serverSelectionTimeoutMS: 3000 })
      .then((conn) => {
        state.available = true;
        state.conn = conn;
        console.log('[MongoDB] Connected successfully');
        return conn;
      })
      .catch((err) => {
        console.warn(`[MongoDB] Connection failed — falling back to in-memory: ${err.message}`);
        state.available = false;
        state.promise = null;
        return null;
      });
  }

  return state.promise;
}
