import "dotenv/config";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/arenas";

async function run() {
  await mongoose.connect(MONGODB_URI);
  const logs = await mongoose.connection.collection("paymentwebhooklogs").find({}).sort({_id: -1}).limit(2).toArray();
  console.log(JSON.stringify(logs, null, 2));
  process.exit(0);
}
run();
