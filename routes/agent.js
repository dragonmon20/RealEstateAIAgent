import express from "express";
import Property from "../models/Property.js";
import { parsePropertyQuery, generateResponse, contactOwner } from "../utils/aiService.js";

const router = express.Router();

// Main AI Agent Query
router.post("/query", async (req, res) => {
  try {
    const { query, sessionId } = req.body;
    
    if (!query) {
      return res.status(400).json({ 
        success: false, 
        error: "Query is required" 
      });
    }
    
    // Parse the query
    const filters = parsePropertyQuery(query);
    console.log("Parsed filters:", filters);
    
    // Search properties
    const properties = await Property.find(filters).limit(10);
    
    // Generate AI response
    const aiResponse = await generateResponse(query, properties, filters);
    
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

// Contact Owner
router.post("/contact-owner", async (req, res) => {
  try {
    const { propertyId, message } = req.body;
    
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ 
        success: false, 
        error: "Property not found" 
      });
    }
    
    const contactResult = await contactOwner(propertyId);
    
    res.json({
      success: true,
      property: {
        id: property._id,
        title: property.title,
        location: property.location
      },
      contactResult: contactResult,
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

// Get property recommendations
router.post("/recommendations", async (req, res) => {
  try {
    const { budget, propertyType, location } = req.body;
    
    const filters = { isAvailable: true };
    if (budget) filters.price = { $lte: budget };
    if (propertyType) filters.type = propertyType;
    if (location) filters.$or = [
      { location: new RegExp(location, "i") },
      { city: new RegExp(location, "i") }
    ];
    
    const recommendations = await Property.find(filters)
      .sort({ price: 1 })
      .limit(5);
    
    res.json({
      success: true,
      recommendations: recommendations,
      count: recommendations.length,
      message: "Here are my top recommendations based on your preferences"
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: "Failed to get recommendations" 
    });
  }
});

export default router;
