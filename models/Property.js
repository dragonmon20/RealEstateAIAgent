import mongoose from "mongoose";

const propertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ["house", "flat", "plot", "shop", "office", "land", "villa"]
  },
  location: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    default: "Goa"
  },
  bedrooms: Number,
  bathrooms: Number,
  area: {
    value: Number,
    unit: {
      type: String,
      enum: ["sqft", "sqm", "acres"],
      default: "sqft"
    }
  },
  price: {
    type: Number,
    required: true
  },
  forSale: {
    type: Boolean,
    default: true
  },
  amenities: [String],
  description: String,
  ownerContact: {
    name: String,
    phone: String,
    email: String
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  dateAdded: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Property", propertySchema);
