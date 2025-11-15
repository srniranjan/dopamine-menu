import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertActivitySchema, insertDopamineMenuSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  console.log("Registering routes...");
  
  // Activity routes
  app.get("/api/activities", async (req, res) => {
    try {
      const stackUserId = (req as any).stackUserId;
      
      if (!stackUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const activities = await storage.getActivities(stackUserId);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // Batch endpoint must come before single POST to ensure proper route matching
  console.log("Registering POST /api/activities/batch route");
  app.post("/api/activities/batch", async (req, res) => {
    console.log("=== BATCH ENDPOINT HIT ===");
    console.log("Method:", req.method);
    console.log("Path:", req.path);
    console.log("URL:", req.url);
    console.log("Body:", req.body);
    try {
      const stackUserId = (req as any).stackUserId;
      
      if (!stackUserId) {
        console.log("No stackUserId found");
        return res.status(401).json({ message: "Authentication required" });
      }
      
      if (!Array.isArray(req.body)) {
        console.log("Request body is not an array:", typeof req.body);
        return res.status(400).json({ message: "Request body must be an array of activities" });
      }
      
      const validatedData = req.body.map((activity: any) => insertActivitySchema.parse(activity));
      const createdActivities = await storage.createActivities(validatedData, stackUserId);
      console.log("Created activities:", createdActivities.length);
      res.status(201).json(createdActivities);
    } catch (error) {
      console.error("Error in batch endpoint:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid activity data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create activities", error: error instanceof Error ? error.message : "Unknown error" });
      }
    }
  });

  app.post("/api/activities", async (req, res) => {
    try {
      const stackUserId = (req as any).stackUserId;
      
      if (!stackUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const validatedData = insertActivitySchema.parse(req.body);
      const activity = await storage.createActivity(validatedData, stackUserId);
      res.status(201).json(activity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid activity data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create activity" });
      }
    }
  });

  app.put("/api/activities/:id", async (req, res) => {
    try {
      const stackUserId = (req as any).stackUserId;
      if (!stackUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const id = parseInt(req.params.id);
      const existingActivity = await storage.getActivity(id);
      
      if (!existingActivity) {
        return res.status(404).json({ message: "Activity not found" });
      }
      
      if (existingActivity.stackUserId !== stackUserId) {
        return res.status(403).json({ message: "Not authorized to update this activity" });
      }
      
      const validatedData = insertActivitySchema.partial().parse(req.body);
      const activity = await storage.updateActivity(id, validatedData);
      
      if (!activity) {
        res.status(404).json({ message: "Activity not found" });
        return;
      }
      
      res.json(activity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid activity data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update activity" });
      }
    }
  });

  // Clear all activities (must be before individual delete)
  app.delete("/api/activities/all", async (req, res) => {
    try {
      console.log("Received request to clear all activities");
      const success = await storage.clearAllActivities();
      console.log("Clear all activities result:", success);
      if (success) {
        res.json({ message: "All activities cleared successfully" });
      } else {
        res.status(500).json({ message: "Failed to clear activities" });
      }
    } catch (error) {
      console.error("Error clearing all activities:", error);
      console.error("Full error:", error);
      res.status(500).json({ message: "Failed to clear activities", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.delete("/api/activities/:id", async (req, res) => {
    try {
      const stackUserId = (req as any).stackUserId;
      if (!stackUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const id = parseInt(req.params.id);
      const existingActivity = await storage.getActivity(id);
      
      if (!existingActivity) {
        return res.status(404).json({ message: "Activity not found" });
      }
      
      if (existingActivity.stackUserId !== stackUserId) {
        return res.status(403).json({ message: "Not authorized to delete this activity" });
      }
      
      const success = await storage.deleteActivity(id);
      
      if (!success) {
        res.status(404).json({ message: "Activity not found" });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete activity" });
    }
  });

  // Random activity endpoint
  app.get("/api/activities/random", async (req, res) => {
    try {
      const stackUserId = (req as any).stackUserId;
      if (!stackUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const { category } = req.query;
      const activities = await storage.getActivities(stackUserId);
      
      let filteredActivities = activities;
      if (category && typeof category === 'string') {
        filteredActivities = activities.filter(a => a.category === category);
      }
      
      if (filteredActivities.length === 0) {
        res.status(404).json({ message: "No activities found" });
        return;
      }
      
      const randomActivity = filteredActivities[Math.floor(Math.random() * filteredActivities.length)];
      res.json(randomActivity);
    } catch (error) {
      res.status(500).json({ message: "Failed to get random activity" });
    }
  });

  // Menu routes
  app.get("/api/menus", async (req, res) => {
    try {
      const menus = await storage.getMenus();
      res.json(menus);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch menus" });
    }
  });

  app.post("/api/menus", async (req, res) => {
    try {
      const validatedData = insertDopamineMenuSchema.parse(req.body);
      const menu = await storage.createMenu(validatedData);
      res.status(201).json(menu);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid menu data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create menu" });
      }
    }
  });

  app.put("/api/menus/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertDopamineMenuSchema.partial().parse(req.body);
      const menu = await storage.updateMenu(id, validatedData);
      
      if (!menu) {
        res.status(404).json({ message: "Menu not found" });
        return;
      }
      
      res.json(menu);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid menu data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update menu" });
      }
    }
  });

  app.delete("/api/menus/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteMenu(id);
      
      if (!success) {
        res.status(404).json({ message: "Menu not found" });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete menu" });
    }
  });



  // Complete an activity
  app.post("/api/activities/:id/complete", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { duration, mood } = req.body;
      
      const success = await storage.completeActivity(id, undefined, duration, mood);
      if (success) {
        res.json({ message: "Activity completed successfully" });
      } else {
        res.status(500).json({ message: "Failed to complete activity" });
      }
    } catch (error) {
      console.error(`Error completing activity: ${error}`);
      res.status(500).json({ message: "Failed to complete activity" });
    }
  });
  
  // Get recent activities
  app.get("/api/activities/recent", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const recent = await storage.getRecentActivities(limit);
      res.json(recent);
    } catch (error) {
      console.error(`Error getting recent activities: ${error}`);
      res.status(500).json({ message: "Failed to get recent activities" });
    }
  });
  
  // Get user stats
  app.get("/api/user/stats", async (req, res) => {
    try {
      const stats = await storage.getUserStats();
      res.json(stats || { currentStreak: 0, longestStreak: 0, dailyGoal: 3, activitiesCompleted: 0 });
    } catch (error) {
      console.error(`Error getting user stats: ${error}`);
      res.status(500).json({ message: "Failed to get user stats" });
    }
  });
  
  // Get suggested activities
  app.get("/api/activities/suggestions", async (req, res) => {
    try {
      const { mood, excludeRecent } = req.query;
      const suggestions = await storage.getSuggestedActivities(
        mood as string, 
        excludeRecent !== 'false'
      );
      res.json(suggestions);
    } catch (error) {
      console.error(`Error getting activity suggestions: ${error}`);
      res.status(500).json({ message: "Failed to get activity suggestions" });
    }
  });
  
  // Get activity suggestions after completing an activity
  app.get("/api/activities/:id/suggestions", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const activity = await storage.getActivity(id);
      
      if (!activity) {
        res.status(404).json({ message: "Activity not found" });
        return;
      }
      
      const suggestions = await storage.getActivitySuggestions(activity);
      res.json(suggestions);
    } catch (error) {
      console.error(`Error getting transition suggestions: ${error}`);
      res.status(500).json({ message: "Failed to get transition suggestions" });
    }
  });

  // Get activity logs
  app.get("/api/activities/:id/logs", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const logs = await storage.getActivityLogs(id);
      res.json(logs);
    } catch (error) {
      console.error(`Error getting activity logs: ${error}`);
      res.status(500).json({ message: "Failed to get activity logs" });
    }
  });

  // Sync Stack user to application users table
  app.post("/api/users/sync", async (req, res) => {
    try {
      const { stackUserId, username, name } = req.body;
      
      if (!stackUserId || !username) {
        return res.status(400).json({ 
          message: "Missing required fields: stackUserId and username" 
        });
      }
      
      // Create or get user
      const user = await storage.createOrGetUserByStackId(stackUserId, {
        username,
        name: name || undefined,
      });
      
      res.json({ 
        success: true, 
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
        }
      });
    } catch (error) {
      console.error("Error syncing user:", error);
      
      // Handle unique constraint violations
      if (error instanceof Error && error.message.includes('unique')) {
        return res.status(409).json({ 
          message: "Username already exists",
          error: error.message 
        });
      }
      
      res.status(500).json({ 
        message: "Failed to sync user",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
