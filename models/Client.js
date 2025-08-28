import mongoose from "mongoose";

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  contact: {
    phone: String,
    email: String,
    whatsapp: String
  },
  requirements: [{
    propertyType: String,
    location: String,
    budgetMin: Number,
    budgetMax: Number,
    bedrooms: Number,
    forSale: Boolean,
    additionalNotes: String,
    dateAdded: {
      type: Date,
      default: Date.now
    }
  }],
  leadStatus: {
    type: String,
    enum: ["new", "contacted", "interested", "viewing_scheduled", "negotiating", "closed", "not_interested"],
    default: "new"
  },
  dateRegistered: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Client", clientSchema);
