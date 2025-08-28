import express from "express";
import Conversation from "../models/Conversation.js";

const router = express.Router();

// Get conversation history
router.get("/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const conversation = await Conversation.findOne({ sessionId });
    
    if (!conversation) {
      return res.json({ messages: [] });
    }
    
    res.json(conversation);
  } catch (error) {
    console.error("Get conversation error:", error);
    res.status(500).json({ error: "Failed to get conversation" });
  }
});

// Clear conversation
router.delete("/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    await Conversation.findOneAndDelete({ sessionId });
    res.json({ success: true, message: "Conversation cleared" });
  } catch (error) {
    console.error("Clear conversation error:", error);
    res.status(500).json({ error: "Failed to clear conversation" });
  }
});

export default router;
