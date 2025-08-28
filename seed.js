import mongoose from "mongoose";
import Property from "./models/Property.js";

const MONGO_URI = "mongodb+srv://1910shahidshaikh_db_user:mypass123@cluster0.lbszrzt.mongodb.net/property-listings?retryWrites=true&w=majority&appName=Cluster0";

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
    location: "Margao Market",
    city: "South Goa",
    area: { value: 800, unit: "sqft" },
    price: 3500000,
    forSale: true,
    amenities: ["Main Road Access", "Parking"],
    description: "Prime location shop in busy market area"
  }
];

async function seedDatabase() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");
    
    await Property.deleteMany({});
    console.log("Cleared existing properties");
    
    await Property.insertMany(sampleProperties);
    console.log(`✅ Added ${sampleProperties.length} sample properties`);
    
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seedDatabase();
