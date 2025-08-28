import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Health check routes
app.get("/", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "🏠 Real Estate AI Agent API is running!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "Real Estate AI Agent Backend Running!",
    features: ["Property Search", "AI Query Processing"],
    timestamp: new Date().toISOString()
  });
});

// Simple Property Schema
const propertySchema = new mongoose.Schema({
  title: String,
  type: String,
  location: String,
  city: String,
  bedrooms: Number,
  price: Number,
  description: String,
  forSale: { type: Boolean, default: true },
  dateAdded: { type: Date, default: Date.now }
});

const Property = mongoose.model("Property", propertySchema);

// API Routes
app.get("/api/properties", async (req, res) => {
  try {
    const properties = await Property.find({});
    res.json({ success: true, count: properties.length, properties });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/agent/query", async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ success: false, error: "Query is required" });
    }
    
    // Simple property search
    const properties = await Property.find({});
    
    const response = properties.length > 0 
      ? `Found ${properties.length} properties. Here are your options!`
      : "No properties found. Try adjusting your search criteria.";
    
    res.json({
      success: true,
      query: query,
      response: response,
      properties: properties,
      totalFound: properties.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Query error:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to process query",
      message: "Please try again."
    });
  }
});

// MongoDB Connection Function
const connectDB = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI;
    
    if (!MONGO_URI) {
      throw new Error("MONGO_URI environment variable is not set");
    }
    
    console.log("🔄 Connecting to MongoDB Atlas...");
    
    const conn = await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`✅ Database: ${conn.connection.name}`);
    
    // Add sample data if collection is empty
    const count = await Property.countDocuments();
    if (count === 0) {
      console.log("🌱 Adding sample properties...");
      
      const sampleProperties = [
        {
          title: "Luxury 2BHK Flat in North Goa",
          type: "flat",
          location: "Calangute",
          city: "North Goa",
          bedrooms: 2,
          price: 4500000,
          description: "Beautiful 2BHK flat near beach with modern amenities",
          forSale: true
        },
        {
          title: "Spacious 3BHK House in Panaji",
          type: "house",
          location: "Panaji",
          city: "North Goa",
          bedrooms: 3,
          price: 7500000,
          description: "Independent house with garden in prime location",
          forSale: true
        },
        {
          title: "Commercial Shop in Margao",
          type: "shop",
          location: "Margao",
          city: "South Goa",
          price: 3500000,
          description: "Prime location shop in busy market area",
          forSale: true
        }
      ];
      
      await Property.insertMany(sampleProperties);
      console.log(`✅ Added ${sampleProperties.length} sample properties`);
    }
    
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    console.error("Full error:", error);
    process.exit(1);
  }
};

// Start Server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Real Estate AI Agent running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 API Health: /api/health`);
    console.log(`🔗 Properties: /api/properties`);
    console.log(`🔗 AI Query: /api/agent/query`);
  });
}).catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await mongoose.connection.close();
  process.exit(0);
});

