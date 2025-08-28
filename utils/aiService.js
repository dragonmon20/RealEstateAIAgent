import { spawn } from "child_process";
import axios from "axios";
import Property from "../models/Property.js";

// Ollama Integration
export async function queryOllama(prompt, model = "llama2") {
  return new Promise((resolve, reject) => {
    const process = spawn("ollama", ["run", model], { 
      stdio: ["pipe", "pipe", "pipe"] 
    });
    
    let output = "";
    let error = "";
    
    process.stdout.on("data", (data) => {
      output += data.toString();
    });
    
    process.stderr.on("data", (data) => {
      error += data.toString();
    });
    
    process.on("close", (code) => {
      if (code === 0) {
        resolve(output.trim());
      } else {
        reject(new Error(`Ollama failed: ${error}`));
      }
    });
    
    process.stdin.write(prompt);
    process.stdin.end();
  });
}

// OpenRouter Fallback
export async function queryOpenRouter(prompt) {
  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "meta-llama/llama-2-7b-chat-hf",
        messages: [
          {
            role: "system",
            content: "You are a professional real estate AI agent. Provide helpful, accurate responses about properties, locations, and real estate advice. Be conversational and informative."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY || ""}`,
          "Content-Type": "application/json"
        }
      }
    );
    
    return response.data.choices[0].message.content;
  } catch (error) {
    return "I'm here to help you with real estate queries. Could you please rephrase your question?";
  }
}

// Advanced Query Parser
export function parsePropertyQuery(query) {
  const filters = { isAvailable: true };
  const queryLower = query.toLowerCase();
  
  // Property types
  const propertyTypes = {
    "flat": ["flat", "apartment", "bhk"],
    "house": ["house", "villa", "bungalow"],
    "plot": ["plot", "land"],
    "shop": ["shop", "commercial", "showroom"],
    "office": ["office", "workspace"]
  };
  
  for (const [type, keywords] of Object.entries(propertyTypes)) {
    if (keywords.some(keyword => queryLower.includes(keyword))) {
      filters.type = type;
      break;
    }
  }
  
  // BHK detection
  const bhkMatch = queryLower.match(/(\d+)\s*bhk/);
  if (bhkMatch) filters.bedrooms = parseInt(bhkMatch[1]);
  
  // Price parsing
  const pricePatterns = [
    /under\s*(\d+)\s*(lakh|crore|thousand)/i,
    /below\s*(\d+)\s*(lakh|crore|thousand)/i,
    /(\d+)\s*(lakh|crore|thousand)\s*budget/i
  ];
  
  for (const pattern of pricePatterns) {
    const match = queryLower.match(pattern);
    if (match) {
      const amount = parseInt(match[1]);
      const unit = match[2].toLowerCase();
      const multiplier = unit === "crore" ? 10000000 : unit === "lakh" ? 100000 : 1000;
      filters.price = { $lte: amount * multiplier };
      break;
    }
  }
  
  // Location detection
  const locations = ["goa", "north goa", "south goa", "panaji", "margao", "mapusa", "ponda", "vasco", "calangute", "baga", "anjuna"];
  for (const location of locations) {
    if (queryLower.includes(location)) {
      filters.$or = [
        { location: new RegExp(location, "i") },
        { city: new RegExp(location, "i") }
      ];
      break;
    }
  }
  
  // Sale/Rent
  if (queryLower.includes("rent") || queryLower.includes("rental")) {
    filters.forSale = false;
  } else if (queryLower.includes("buy") || queryLower.includes("sale") || queryLower.includes("purchase")) {
    filters.forSale = true;
  }
  
  return filters;
}

// Generate contextual AI response
export async function generateResponse(query, properties, filters) {
  const context = `
User Query: "${query}"
Properties Found: ${properties.length}
Search Filters: ${JSON.stringify(filters)}
Property Details: ${properties.slice(0, 3).map(p => `${p.title} - ${p.type} in ${p.location} - ₹${p.price}`).join(", ")}

Generate a helpful, conversational response about these real estate search results. Be specific about the properties found and offer relevant advice.
`;

  try {
    const aiResponse = await queryOllama(context);
    return aiResponse;
  } catch {
    try {
      const fallbackResponse = await queryOpenRouter(context);
      return fallbackResponse;
    } catch {
      return generateFallbackResponse(query, properties, filters);
    }
  }
}

// Fallback response generator
function generateFallbackResponse(query, properties, filters) {
  if (properties.length === 0) {
    return `I couldn't find any properties matching "${query}". Let me help you explore other options. Would you like to adjust your budget, location, or property type?`;
  } else if (properties.length === 1) {
    const prop = properties[0];
    return `Perfect! I found exactly one property that matches your search: ${prop.title} in ${prop.location}. It's a ${prop.type} priced at ₹${prop.price.toLocaleString()}. Would you like more details about this property?`;
  } else {
    return `Great! I found ${properties.length} properties matching your criteria. The options range from ₹${Math.min(...properties.map(p => p.price)).toLocaleString()} to ₹${Math.max(...properties.map(p => p.price)).toLocaleString()}. Would you like me to show you the most suitable options or refine the search further?`;
  }
}

// Mock owner contact simulation
export async function contactOwner(propertyId) {
  // Simulate contact delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  const responses = [
    "✅ Owner contacted successfully! They're available for property viewing this weekend.",
    "📞 Spoke with the owner - they're open to negotiations and can arrange a visit tomorrow.",
    "🏡 Owner confirms the property is available. Best viewing time is in the evening.",
    "💰 Good news! Owner is motivated to close quickly and open to reasonable offers.",
    "📋 Owner would like to discuss terms directly. I can facilitate the introduction."
  ];
  
  return {
    success: true,
    message: responses[Math.floor(Math.random() * responses.length)],
    contactTime: new Date(),
    followUpRequired: Math.random() > 0.3
  };
}
