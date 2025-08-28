import { MongoClient, ServerApiVersion } from 'mongodb';

// Your connection string with the NEW password
const uri = "mongodb+srv://1910shahidshaikh_db_user:mypass123@cluster0.lbszrzt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    console.log("🔄 Testing connection with new password...");
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("✅ SUCCESS! You are connected to MongoDB Atlas!");
    console.log("🎉 Authentication working perfectly!");
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
