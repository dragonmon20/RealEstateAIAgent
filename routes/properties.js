import express from "express";
import Property from "../models/Property.js";

const router = express.Router();

// Get all properties with filters
router.get("/", async (req, res) => {
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
    
    const properties = await Property.find(filters);
    res.json({ success: true, count: properties.length, properties });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add new property
router.post("/", async (req, res) => {
  try {
    const property = new Property(req.body);
    await property.save();
    res.status(201).json({ success: true, property });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
