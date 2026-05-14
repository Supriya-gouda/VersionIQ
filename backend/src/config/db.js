import mongoose from "mongoose";

async function connectWithMongoose(uri, options = {}) {
  const defaultOptions = {
    autoIndex: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 30000,
    retryWrites: true,
    ...options,
  };

  await mongoose.connect(uri, defaultOptions);
}

function registerLifecycleLogging() {
  mongoose.connection.on("error", (error) => {
    console.error("MongoDB connection error", error.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected");
  });

  mongoose.connection.on("connected", () => {
    console.log("MongoDB connected");
  });

  mongoose.connection.on("reconnected", () => {
    console.log("MongoDB reconnected");
  });
}

export async function connectDatabase(uri) {
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  registerLifecycleLogging();

  try {
    const isAtlas = uri.includes("mongodb+srv");
    const options = isAtlas ? { maxPoolSize: 10, minPoolSize: 2 } : {};

    await connectWithMongoose(uri, options);
    console.log(
      `Connected to MongoDB (${isAtlas ? "Atlas" : "Local"}) - ${uri.replace(/password:[^@]*@/, "password:****@")}`
    );
  } catch (error) {
    console.error(`Failed to connect to MongoDB: ${error.message}`);
    throw error;
  }
}

export async function stopDatabase() {
  try {
    await mongoose.disconnect();
    console.log("MongoDB disconnected gracefully");
  } catch (error) {
    console.error(`Error during MongoDB disconnect: ${error.message}`);
    throw error;
  }
}
