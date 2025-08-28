import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import propertyRoutes from "./routes/properties.js";
import agentRoutes from "./routes/agent.js";

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration for production
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.vercel.app', 'https://www.your-domain.com']
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json());

// Routes
app.use("/api/properties", propertyRoutes);
app.use("/api/agent", agentRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "🏠 Real Estate AI Agent API is running!",
    database: "Connected to MongoDB Atlas",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "Real Estate AI Agent Backend Running!",
    features: ["Property Search", "AI Query Processing", "Natural Language Understanding"]
  });
});

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://1910shahidshaikh_db_user:mypass123@cluster0.lbszrzt.mongodb.net/property-listings?retryWrites=true&w=majority&appName=Cluster0";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB Atlas!");
    app.listen(PORT, () => {
      console.log(`🚀 Real Estate AI Agent API running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch((err) => console.error("❌ MongoDB connection failed:", err.message));
