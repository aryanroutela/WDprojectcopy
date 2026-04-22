const Bus = require("../models/Bus");
const Route = require("../models/Route");
const TripHistory = require("../models/TripHistory");
const { haversineDistance } = require("../utils/etaCalculator");
const { smartPredictETA, recordTripSegment, seedTripHistory, isPeakHour } = require("../utils/smartETA");

// ==================== 🧠 SMART ETA PREDICTION ====================

/**
 * Get AI-predicted ETA for a bus to a target checkpoint
 * GET /api/ai/eta/predict?busId=...&checkpointName=...
 */
const predictETA = async (req, res, next) => {
  try {
    const { busId, checkpointName } = req.query;

    if (!busId || !checkpointName) {
      return res.status(400).json({
        success: false,
        message: "busId and checkpointName are required"
      });
    }

    const bus = await Bus.findById(busId).populate("routeId").lean();
    if (!bus) {
      return res.status(404).json({ success: false, message: "Bus not found" });
    }

    // Find the target checkpoint
    const checkpoints = bus.checkpoints?.length > 0
      ? bus.checkpoints
      : bus.routeId?.checkpoints || [];

    const target = checkpoints.find(cp =>
      cp.name.toLowerCase().includes(checkpointName.toLowerCase())
    );

    if (!target) {
      return res.status(404).json({
        success: false,
        message: `Checkpoint "${checkpointName}" not found on this bus route`
      });
    }

    // Get smart prediction
    const prediction = await smartPredictETA(bus, target);

    res.status(200).json({
      success: true,
      busNumber: bus.busNumber,
      routeName: bus.routeName,
      targetCheckpoint: target.name,
      prediction
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Record a trip segment (called by driver location updates)
 * POST /api/ai/eta/record
 */
const recordTrip = async (req, res, next) => {
  try {
    const { busId, routeId, fromCheckpoint, toCheckpoint, travelTimeMinutes } = req.body;

    if (!busId || !fromCheckpoint || !toCheckpoint || !travelTimeMinutes) {
      return res.status(400).json({
        success: false,
        message: "busId, fromCheckpoint, toCheckpoint, and travelTimeMinutes are required"
      });
    }

    const record = await recordTripSegment({
      busId,
      routeId,
      fromCheckpoint,
      toCheckpoint,
      travelTimeMinutes
    });

    res.status(201).json({
      success: true,
      message: "Trip segment recorded for AI training",
      record
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get ETA prediction stats / model info
 * GET /api/ai/eta/stats?routeId=...
 */
const getETAStats = async (req, res, next) => {
  try {
    const { routeId } = req.query;
    const query = routeId ? { routeId } : {};

    const totalRecords = await TripHistory.countDocuments(query);
    const recentTrips = await TripHistory.find(query)
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();

    // Calculate average speed and travel time
    const avgStats = await TripHistory.aggregate([
      ...(routeId ? [{ $match: { routeId: require("mongoose").Types.ObjectId(routeId) } }] : []),
      {
        $group: {
          _id: null,
          avgTravelTime: { $avg: "$travelTimeMinutes" },
          avgSpeed: { $avg: "$avgSpeedKmh" },
          avgDistance: { $avg: "$distanceKm" },
          totalTrips: { $sum: 1 }
        }
      }
    ]);

    // Peak vs off-peak comparison
    const peakStats = await TripHistory.aggregate([
      ...(routeId ? [{ $match: { routeId: require("mongoose").Types.ObjectId(routeId) } }] : []),
      {
        $group: {
          _id: "$isPeakHour",
          avgTravelTime: { $avg: "$travelTimeMinutes" },
          avgSpeed: { $avg: "$avgSpeedKmh" },
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalRecords,
        modelReady: totalRecords >= 5,
        averages: avgStats[0] || null,
        peakVsOffPeak: peakStats,
        recentTrips: recentTrips.slice(0, 5)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Seed demo trip history data for a bus/route
 * POST /api/ai/eta/seed
 */
const seedDemoData = async (req, res, next) => {
  try {
    const { busId, routeId } = req.body;

    let checkpoints = [];
    let resolvedRouteId = routeId;
    let resolvedBusId = busId;

    if (busId) {
      const bus = await Bus.findById(busId).populate("routeId").lean();
      if (!bus) return res.status(404).json({ success: false, message: "Bus not found" });
      checkpoints = bus.checkpoints?.length > 0 ? bus.checkpoints : bus.routeId?.checkpoints || [];
      resolvedRouteId = bus.routeId?._id || routeId;
      resolvedBusId = bus._id;
    } else if (routeId) {
      const route = await Route.findById(routeId).lean();
      if (!route) return res.status(404).json({ success: false, message: "Route not found" });
      checkpoints = route.checkpoints;
      // Use any bus on this route
      const bus = await Bus.findOne({ routeId }).lean();
      resolvedBusId = bus?._id || null;
    }

    if (checkpoints.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Need at least 2 checkpoints with coordinates to seed data"
      });
    }

    const recordCount = await seedTripHistory(resolvedRouteId, resolvedBusId, checkpoints);

    res.status(201).json({
      success: true,
      message: `Seeded ${recordCount} trip history records for AI training`,
      recordCount
    });
  } catch (error) {
    next(error);
  }
};

// ==================== 🧭 SMART BUS RECOMMENDATION ====================

/**
 * Get smart bus recommendations
 * GET /api/ai/recommend?source=...&destination=...&lat=...&lng=...
 */
const getSmartRecommendations = async (req, res, next) => {
  try {
    const { source, destination, lat, lng } = req.query;

    if (!source) {
      return res.status(400).json({
        success: false,
        message: "source query parameter is required"
      });
    }

    // Get all active buses with route data
    const buses = await Bus.find({ status: "active" })
      .populate("driverId", "firstName lastName phone")
      .populate("routeId")
      .lean();

    const srcQuery = source.trim().toLowerCase();
    const dstQuery = destination?.trim().toLowerCase();
    const userLat = lat ? parseFloat(lat) : null;
    const userLng = lng ? parseFloat(lng) : null;

    const now = new Date();
    const hourOfDay = now.getHours();

    // Score and rank each bus
    const scored = await Promise.all(buses.map(async (bus) => {
      const checkpoints = bus.checkpoints?.length > 0
        ? bus.checkpoints
        : bus.routeId?.checkpoints || [];

      if (checkpoints.length === 0) return null;

      // Find matching source stop
      const srcStop = checkpoints.find(cp =>
        cp.name.toLowerCase().includes(srcQuery)
      );
      if (!srcStop) return null;

      // If destination specified, verify it comes after source
      let dstStop = null;
      if (dstQuery) {
        dstStop = checkpoints.find(cp =>
          cp.name.toLowerCase().includes(dstQuery) &&
          cp.sequence > srcStop.sequence
        );
        if (!dstStop) return null;
      }

      // ─── Calculate scoring factors ───

      // 1. Distance Score (0-100): How close the bus currently is to the source stop
      let distanceScore = 50; // default if no location
      let distanceKm = null;
      if (bus.currentLocation?.latitude && srcStop.latitude) {
        distanceKm = haversineDistance(
          bus.currentLocation.latitude,
          bus.currentLocation.longitude,
          srcStop.latitude,
          srcStop.longitude
        );
        // Closer = higher score. 0km=100, 10km=50, 20km+=0
        distanceScore = Math.max(0, Math.min(100, 100 - (distanceKm * 5)));
      }

      // 2. ETA Score (0-100): AI-predicted arrival time
      let etaMinutes = null;
      let etaMethod = "unknown";
      let etaScore = 50;
      try {
        const prediction = await smartPredictETA(bus, srcStop);
        etaMinutes = prediction.etaMinutes;
        etaMethod = prediction.method;
        if (etaMinutes !== null) {
          // Lower ETA = higher score. 0min=100, 30min=50, 60min+=0
          etaScore = Math.max(0, Math.min(100, 100 - (etaMinutes * 1.67)));
        }
      } catch (e) {
        // Silently fall back
      }

      // 3. Route Match Score (0-100): How well the route covers the journey
      let routeMatchScore = 60; // Base score for matching source
      if (dstStop) {
        // Bonus for covering the full journey
        routeMatchScore = 90;
        const routeSpan = checkpoints[checkpoints.length - 1].sequence - checkpoints[0].sequence;
        const journeySpan = dstStop.sequence - srcStop.sequence;
        // More direct routes (smaller portion of total) get a bonus
        if (routeSpan > 0) {
          const directness = 1 - (journeySpan / routeSpan);
          routeMatchScore += directness * 10;
        }
      }

      // 4. Seat Availability Score (0-100)
      const seatRatio = bus.seatsAvailable / bus.capacity;
      const seatScore = seatRatio * 100;

      // 5. Peak hour penalty (roads are slower during peak)
      const peakPenalty = isPeakHour(hourOfDay) ? -5 : 0;

      // ─── Weighted composite score ───
      const weights = {
        eta: 0.35,
        distance: 0.25,
        routeMatch: 0.25,
        seats: 0.15
      };

      const totalScore = Math.round(
        etaScore * weights.eta +
        distanceScore * weights.distance +
        routeMatchScore * weights.routeMatch +
        seatScore * weights.seats +
        peakPenalty
      );

      return {
        _id: bus._id,
        busNumber: bus.busNumber,
        routeName: bus.routeName,
        source: checkpoints[0]?.name,
        destination: checkpoints[checkpoints.length - 1]?.name,
        matchedSource: srcStop.name,
        matchedDestination: dstStop?.name || null,
        currentLocation: bus.currentLocation,
        // AI-enhanced info
        smartETA: {
          minutes: etaMinutes,
          method: etaMethod,
          isPeakHour: isPeakHour(hourOfDay)
        },
        distanceKm: distanceKm !== null ? +distanceKm.toFixed(2) : null,
        seatsAvailable: bus.seatsAvailable,
        capacity: bus.capacity,
        occupancy: ((bus.capacity - bus.seatsAvailable) / bus.capacity * 100).toFixed(1),
        seatStatus: bus.seatsAvailable > bus.capacity * 0.25
          ? "green"
          : bus.seatsAvailable > 0 ? "yellow" : "red",
        driver: bus.driverId,
        // Scoring breakdown
        scoring: {
          totalScore,
          breakdown: {
            etaScore: Math.round(etaScore),
            distanceScore: Math.round(distanceScore),
            routeMatchScore: Math.round(routeMatchScore),
            seatScore: Math.round(seatScore)
          },
          recommendation: totalScore >= 75 ? "⭐ Highly Recommended" :
                          totalScore >= 50 ? "👍 Good Option" :
                          "🔄 Alternative"
        }
      };
    }));

    // Filter nulls and sort by total score (descending)
    const results = scored
      .filter(Boolean)
      .sort((a, b) => b.scoring.totalScore - a.scoring.totalScore);

    res.status(200).json({
      success: true,
      count: results.length,
      searchedSource: source,
      searchedDestination: destination || null,
      isPeakHour: isPeakHour(hourOfDay),
      recommendations: results
    });
  } catch (error) {
    next(error);
  }
};

// ==================== 💬 AI CHATBOT ====================

/**
 * AI Chatbot endpoint
 * POST /api/ai/chat
 * Body: { message: "Which bus goes to X?" }
 */
const chatWithAI = async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required"
      });
    }

    // Gather real-time system data for context
    const activeBuses = await Bus.find({ status: "active" })
      .populate("driverId", "firstName lastName phone")
      .populate("routeId")
      .lean();

    const routes = await Route.find({ isActive: true }).lean();

    // Build system context with real data
    const busInfo = activeBuses.map(bus => {
      const checkpoints = bus.checkpoints?.length > 0
        ? bus.checkpoints
        : bus.routeId?.checkpoints || [];
      const stopNames = checkpoints.map(cp => cp.name).join(" → ");
      return `Bus ${bus.busNumber}: Route "${bus.routeName}", ` +
             `From ${bus.source} to ${bus.destination}, ` +
             `Stops: [${stopNames}], ` +
             `Seats: ${bus.seatsAvailable}/${bus.capacity}, ` +
             `Status: ${bus.status}` +
             (bus.currentLocation?.latitude
               ? `, Location: (${bus.currentLocation.latitude.toFixed(4)}, ${bus.currentLocation.longitude.toFixed(4)})`
               : ", Location: unknown") +
             (bus.eta ? `, ETA: ${bus.eta} min` : "");
    }).join("\n");

    const routeInfo = routes.map(r => {
      const stops = r.checkpoints.map(cp => cp.name).join(" → ");
      return `Route "${r.routeName}": ${stops} (${r.totalDistance}km)`;
    }).join("\n");

    const systemPrompt = `You are RouteFlow AI Assistant — a helpful, friendly chatbot for the RouteFlow bus tracking system.

CURRENT SYSTEM DATA:
=== Active Buses ===
${busInfo || "No active buses right now."}

=== Available Routes ===
${routeInfo || "No routes configured."}

CURRENT TIME: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
PEAK HOURS: 7am-10am and 5pm-8pm

INSTRUCTIONS:
- Answer questions about buses, routes, ETAs, and stops
- Be concise but helpful. Use emojis sparingly for friendliness
- If asked about a bus or stop that doesn't exist, say so politely
- For ETA queries, mention that estimates may vary due to traffic
- If asked something unrelated to transport, politely redirect
- Format responses for readability (use bullet points when listing)
- Always be accurate based on the data provided above
- If a bus location is unknown, mention it may not be transmitting`;

    // Call Google Gemini API
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    
    if (!apiKey) {
      // Fallback: rule-based responses when no API key
      const fallbackResponse = generateFallbackResponse(message, activeBuses, routes);
      return res.status(200).json({
        success: true,
        response: fallbackResponse,
        method: "rule_based",
        timestamp: new Date().toISOString()
      });
    }

    // Use Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const geminiPayload = {
      contents: [
        {
          role: "user",
          parts: [
            { text: systemPrompt + "\n\nUser question: " + message }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
        topP: 0.9
      }
    };

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      // Fall back to rule-based
      const fallbackResponse = generateFallbackResponse(message, activeBuses, routes);
      return res.status(200).json({
        success: true,
        response: fallbackResponse,
        method: "rule_based_fallback",
        timestamp: new Date().toISOString()
      });
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text 
      || "I'm sorry, I couldn't process that request. Please try again!";

    res.status(200).json({
      success: true,
      response: aiResponse,
      method: "gemini_ai",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Rule-based fallback when no AI API is available.
 * Handles common transport queries using pattern matching.
 */
const generateFallbackResponse = (message, buses, routes) => {
  const msg = message.toLowerCase().trim();

  // Query: "which bus goes to X" / "bus to X"
  const busToMatch = msg.match(/(?:bus|route).*(?:to|for|goes?\s*to|towards?)\s+(.+)/);
  if (busToMatch) {
    const dest = busToMatch[1].trim();
    const matching = buses.filter(bus => {
      const checkpoints = bus.checkpoints?.length > 0
        ? bus.checkpoints
        : bus.routeId?.checkpoints || [];
      return bus.destination?.toLowerCase().includes(dest) ||
             bus.source?.toLowerCase().includes(dest) ||
             checkpoints.some(cp => cp.name.toLowerCase().includes(dest));
    });

    if (matching.length > 0) {
      const list = matching.map(b => 
        `🚌 Bus ${b.busNumber} (${b.routeName}) — Seats: ${b.seatsAvailable}/${b.capacity}`
      ).join("\n");
      return `Here are the buses that pass through "${dest}":\n\n${list}`;
    }
    return `Sorry, I couldn't find any active buses going to "${dest}". Please check the destination name or try again later.`;
  }

  // Query: "when will bus X arrive" / "eta for bus X"
  const etaMatch = msg.match(/(?:when|eta|arrive|arrival|time).*(?:bus)\s*(\w+)/);
  if (etaMatch) {
    const busNum = etaMatch[1];
    const bus = buses.find(b => b.busNumber.toLowerCase().includes(busNum.toLowerCase()));
    if (bus) {
      const eta = bus.eta ? `${bus.eta} minutes` : "currently unavailable";
      return `🚌 Bus ${bus.busNumber} (${bus.routeName})\n` +
             `📍 ETA: ${eta}\n` +
             `💺 Seats: ${bus.seatsAvailable}/${bus.capacity}\n` +
             `📊 Status: ${bus.status}`;
    }
    return `I couldn't find bus "${busNum}". It may not be active right now.`;
  }

  // Query: "show all buses" / "active buses" / "list buses"
  if (msg.includes("all bus") || msg.includes("active bus") || msg.includes("list bus") || msg.includes("show bus")) {
    if (buses.length === 0) return "No buses are currently active. Please check back later!";
    const list = buses.map(b =>
      `🚌 ${b.busNumber} | ${b.routeName} | Seats: ${b.seatsAvailable}/${b.capacity}`
    ).join("\n");
    return `Currently active buses:\n\n${list}`;
  }

  // Query: "show routes" / "available routes"
  if (msg.includes("route") || msg.includes("all route")) {
    if (routes.length === 0) return "No routes are configured yet.";
    const list = routes.map(r => {
      const stops = r.checkpoints.map(cp => cp.name).join(" → ");
      return `📍 ${r.routeName}: ${stops}`;
    }).join("\n");
    return `Available routes:\n\n${list}`;
  }

  // Query: "buses near me" / "nearby"
  if (msg.includes("near") || msg.includes("nearby") || msg.includes("close")) {
    return "To find buses near you, please go to the Live Tracking page and enable location services. " +
           "You can also use the Smart Search feature to find buses at your nearest stop!";
  }

  // Query: "help"
  if (msg.includes("help") || msg.includes("what can you")) {
    return "🤖 I'm RouteFlow AI Assistant! I can help you with:\n\n" +
           "• \"Which bus goes to [place]?\" — Find buses to your destination\n" +
           "• \"When will bus [number] arrive?\" — Check bus ETA\n" +
           "• \"Show all active buses\" — List currently running buses\n" +
           "• \"Show available routes\" — See all bus routes\n" +
           "• \"Buses near me\" — Find nearby buses\n\n" +
           "Just ask your question naturally!";
  }

  // Default
  return "I'm RouteFlow AI Assistant! 🚌 I can help you find buses, check ETAs, and explore routes. " +
         "Try asking something like \"Which bus goes to [destination]?\" or type \"help\" for options.";
};

/**
 * Get chat suggestions (quick actions for the UI)
 * GET /api/ai/chat/suggestions
 */
const getChatSuggestions = async (req, res, next) => {
  try {
    const routes = await Route.find({ isActive: true }).lean();
    const activeBusCount = await Bus.countDocuments({ status: "active" });

    const suggestions = [
      "Show all active buses",
      "What routes are available?",
      "Help me find a bus"
    ];

    // Add dynamic suggestions based on real routes
    if (routes.length > 0) {
      const randomRoute = routes[Math.floor(Math.random() * routes.length)];
      const lastStop = randomRoute.checkpoints[randomRoute.checkpoints.length - 1]?.name;
      if (lastStop) {
        suggestions.push(`Which bus goes to ${lastStop}?`);
      }
    }

    res.status(200).json({
      success: true,
      activeBuses: activeBusCount,
      suggestions
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // ETA
  predictETA,
  recordTrip,
  getETAStats,
  seedDemoData,
  // Recommendations
  getSmartRecommendations,
  // Chatbot
  chatWithAI,
  getChatSuggestions
};
