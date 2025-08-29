import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

// Configure environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://realestateaiagent.onrender.com', 'https://your-frontend.vercel.app']
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

// Health check routes
app.get("/", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "🏠 Real Estate AI Agent API is running!",
    database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "Real Estate AI Agent Backend Running!",
    features: ["Property Search", "AI Query Processing", "Natural Language Understanding"],
    database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    timestamp: new Date().toISOString()
  });
});

// Property Schema
const propertySchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, required: true },
  location: { type: String, required: true },
  city: { type: String, required: true },
  bedrooms: Number,
  bathrooms: Number,
  area: {
    value: Number,
    unit: { type: String, default: "sqft" }
  },
  price: { type: Number, required: true },
  forSale: { type: Boolean, default: true },
  amenities: [String],
  description: String,
  ownerContact: {
    name: String,
    phone: String,
    email: String
  },
  isAvailable: { type: Boolean, default: true },
  dateAdded: { type: Date, default: Date.now }
});

const Property = mongoose.model("Property", propertySchema);

// API Routes
app.get("/api/properties", async (req, res) => {
  try {
    const { type, location, maxPrice, bedrooms, forSale } = req.query;
    
    const filters = { isAvailable: true };
    if (type) filters.type = type;
    if (location) filters.$or = [
      { location: new RegExp(location, "i") },
      { city: new RegExp(location, "i") }
    ];
    if (maxPrice) filters.price = { $lte: Number(maxPrice) };
    if (bedrooms) filters.bedrooms = Number(bedrooms);
    if (forSale !== undefined) filters.forSale = forSale === "true";
    
    const properties = await Property.find(filters).limit(20);
    res.json({ 
      success: true, 
      count: properties.length, 
      properties,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Properties API error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/agent/query", async (req, res) => {
  try {
    const { query, sessionId } = req.body;
    
    if (!query) {
      return res.status(400).json({ 
        success: false, 
        error: "Query is required" 
      });
    }
    
    // Simple query parsing
    const queryLower = query.toLowerCase();
    const filters = { isAvailable: true };
    
    // Property type detection
    if (queryLower.includes("flat") || queryLower.includes("apartment") || queryLower.includes("bhk")) {
      filters.type = "flat";
    } else if (queryLower.includes("house") || queryLower.includes("villa")) {
      filters.type = "house";
    } else if (queryLower.includes("shop") || queryLower.includes("commercial")) {
      filters.type = "shop";
    }
    
    // BHK detection
    const bhkMatch = queryLower.match(/(\d+)\s*bhk/);
    if (bhkMatch) filters.bedrooms = parseInt(bhkMatch[1]);
    
    // Price detection
    const priceMatch = queryLower.match(/under\s*(\d+)\s*(lakh|crore)/i);
    if (priceMatch) {
      const amount = parseInt(priceMatch[1]);
      const unit = priceMatch[2].toLowerCase();
      filters.price = { $lte: amount * (unit === "crore" ? 10000000 : 100000) };
    }
    
    // Location detection
    const locations = ["goa", "north goa", "south goa", "panaji", "margao", "calangute"];
    for (const location of locations) {
      if (queryLower.includes(location)) {
        filters.$or = [
          { location: new RegExp(location, "i") },
          { city: new RegExp(location, "i") }
        ];
        break;
      }
    }
    
    // Search properties
    const properties = await Property.find(filters).limit(10);
    
    // Generate response
    let aiResponse;
    if (properties.length === 0) {
      aiResponse = `I couldn't find any properties matching "${query}". Let me help you explore other options. Would you like to adjust your budget, location, or property type?`;
    } else if (properties.length === 1) {
      const prop = properties[0];
      aiResponse = `Perfect! I found exactly one property that matches your search: ${prop.title} in ${prop.location}. It's a ${prop.type} priced at ₹${prop.price.toLocaleString()}. Would you like more details about this property?`;
    } else {
      const minPrice = Math.min(...properties.map(p => p.price));
      const maxPrice = Math.max(...properties.map(p => p.price));
      aiResponse = `Great! I found ${properties.length} properties matching your criteria. The options range from ₹${minPrice.toLocaleString()} to ₹${maxPrice.toLocaleString()}. Would you like me to show you the most suitable options?`;
    }
    
    res.json({
      success: true,
      query: query,
      response: aiResponse,
      properties: properties,
      filtersApplied: filters,
      totalFound: properties.length,
      sessionId: sessionId || `session_${Date.now()}`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Agent query error:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to process query",
      message: "I'm experiencing some technical difficulties. Please try again."
    });
  }
});

// Contact Owner simulation
app.post("/api/agent/contact-owner", async (req, res) => {
  try {
    const { propertyId } = req.body;
    
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ 
        success: false, 
        error: "Property not found" 
      });
    }
    
    // Simulate contact delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const responses = [
      "✅ Owner contacted successfully! They're available for property viewing this weekend.",
      "📞 Spoke with the owner - they're open to negotiations and can arrange a visit tomorrow.",
      "🏡 Owner confirms the property is available. Best viewing time is in the evening.",
      "💰 Good news! Owner is motivated to close quickly and open to reasonable offers."
    ];
    
    res.json({
      success: true,
      property: {
        id: property._id,
        title: property.title,
        location: property.location
      },
      contactResult: {
        success: true,
        message: responses[Math.floor(Math.random() * responses.length)],
        contactTime: new Date()
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Contact owner error:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to contact owner" 
    });
  }
});

// MongoDB Connection
const connectDB = async () => {
  try {
    // Debug environment variables
    console.log("🔍 Environment check:");
    console.log("NODE_ENV:", process.env.NODE_ENV);
    console.log("MONGO_URI exists:", !!process.env.MONGO_URI);
    console.log("MONGO_URI length:", process.env.MONGO_URI?.length || 0);
    
    const MONGO_URI = process.env.MONGO_URI;
    
    if (!MONGO_URI) {
      console.error("❌ Available environment variables:", Object.keys(process.env).filter(key => key.includes('MONGO') || key.includes('URI')));
      throw new Error("MONGO_URI environment variable is not set");
    }
    
    console.log("🔄 Connecting to MongoDB Atlas...");
    
    const conn = await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 5,
      retryWrites: true
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
          bathrooms: 2,
          area: { value: 1200, unit: "sqft" },
          price: 4500000,
          forSale: true,
          amenities: ["Swimming Pool", "Parking", "Garden"],
          description: "Beautiful 2BHK flat near beach with modern amenities",
          ownerContact: { name: "John Doe", phone: "9876543210", email: "john@example.com" }
        },
        {
          title: "Spacious 3BHK House in Panaji",
          type: "house",
          location: "Panaji",
          city: "North Goa",
          bedrooms: 3,
          bathrooms: 3,
          area: { value: 1800, unit: "sqft" },
          price: 7500000,
          forSale: true,
          amenities: ["Parking", "Garden", "Balcony"],
          description: "Independent house with garden in prime location"
        },
        {
          title: "Commercial Shop in Margao",
          type: "shop",
          location: "Margao",
          city: "South Goa",
          area: { value: 800, unit: "sqft" },
          price: 3500000,
          forSale: true,
          amenities: ["Main Road Access", "Parking"],
          description: "Prime location shop in busy market area"
        },
        {
          title: "1BHK Flat for Rent in Baga",
          type: "flat",
          location: "Baga",
          city: "North Goa",
          bedrooms: 1,
          bathrooms: 1,
          area: { value: 600, unit: "sqft" },
          price: 25000,
          forSale: false,
          amenities: ["Furnished", "Parking"],
          description: "Fully furnished 1BHK near Baga beach"
        },
        {
          title: "4BHK Villa with Pool",
          type: "villa",
          location: "Anjuna",
          city: "North Goa",
          bedrooms: 4,
          bathrooms: 4,
          area: { value: 3000, unit: "sqft" },
          price: 12000000,
          forSale: true,
          amenities: ["Swimming Pool", "Garden", "Parking", "Security"],
          description: "Luxury villa with private pool and garden"
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
    console.log(`🔗 Live URL: https://realestateaiagent.onrender.com`);
  });
}).catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
  }
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});
