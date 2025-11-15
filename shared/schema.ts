import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  stackUserId: text("stack_user_id").unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // 'appetizers', 'entrees', 'snacks', 'desserts', 'sides', 'specials'
  description: text("description"),
  duration: integer("duration"), // in minutes
  userId: integer("user_id"),
  stackUserId: text("stack_user_id"), // Use this for queries - no DB lookup needed
  completionCount: integer("completion_count").default(0).notNull(),
  lastCompleted: timestamp("last_completed"),
  emoji: text("emoji"),
});

export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  activityId: integer("activity_id").references(() => activities.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
  duration: integer("duration"), // actual duration in minutes
  mood: text("mood"), // user's mood before activity: 'low', 'neutral', 'high'
});

// New table for tracking daily goals and streaks
export const userStats = pgTable("user_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  date: timestamp("date").defaultNow().notNull(),
  dailyGoal: integer("daily_goal").default(3).notNull(), // activities per day goal
  activitiesCompleted: integer("activities_completed").default(0).notNull(),
  currentStreak: integer("current_streak").default(0).notNull(),
  longestStreak: integer("longest_streak").default(0).notNull(),
});

export const dopamineMenus = pgTable("dopamine_menus", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: integer("user_id"),
  activities: text("activities").array(), // array of activity IDs
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).pick({
  activityId: true,
  userId: true,
  duration: true,
  mood: true,
});

export const insertUserStatsSchema = createInsertSchema(userStats).pick({
  userId: true,
  dailyGoal: true,
  activitiesCompleted: true,
  currentStreak: true,
  longestStreak: true,
});

export const insertActivitySchema = createInsertSchema(activities).pick({
  name: true,
  category: true,
  description: true,
  duration: true,
  emoji: true,
});

export const insertDopamineMenuSchema = createInsertSchema(dopamineMenus).pick({
  name: true,
  activities: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertDopamineMenu = z.infer<typeof insertDopamineMenuSchema>;
export type DopamineMenu = typeof dopamineMenus.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertUserStats = z.infer<typeof insertUserStatsSchema>;
export type UserStats = typeof userStats.$inferSelect;

export const categoryColors = {
  appetizers: 'green',
  entrees: 'blue',
  snacks: 'teal',
  desserts: 'orange',
  sides: 'purple',
  specials: 'yellow'
} as const;

export const categoryIcons = {
  appetizers: 'coffee',
  entrees: 'activity',
  snacks: 'cookie',
  desserts: 'smartphone',
  sides: 'headphones',
  specials: 'star'
} as const;

export const categoryDescriptions = {
  appetizers: 'Quick 1-5 minute boosts',
  entrees: 'Main activities 15-60 minutes',
  snacks: 'Light activities 5-15 minutes',
  desserts: 'Easy dopamine hits',
  sides: 'Background stimulation',
  specials: 'Planned treats and bucket-filling activities'
} as const;

export type CategoryType = keyof typeof categoryColors;

// Export example activities for database initialization
export const exampleActivities: Record<CategoryType, Omit<Activity, 'id' | 'userId' | 'completionCount' | 'lastCompleted' | 'emoji'>[]> = {
  appetizers: [
    { name: "One minute of jumping jacks", category: "appetizers", duration: 1, description: null },
    { name: "Listen to a favorite song", category: "appetizers", duration: 3, description: null },
    { name: "Do a few stretches or yoga poses", category: "appetizers", duration: 5, description: null },
    { name: "Take a warm shower", category: "appetizers", duration: 10, description: null },
    { name: "Drink a cup of coffee", category: "appetizers", duration: 2, description: null },
  ],
  entrees: [
    { name: "Playing an instrument", category: "entrees", duration: 30, description: null },
    { name: "Going for a brisk walk", category: "entrees", duration: 20, description: null },
    { name: "Working on a hobby", category: "entrees", duration: 45, description: null },
    { name: "Exercising or HIIT class", category: "entrees", duration: 30, description: null },
    { name: "Journaling", category: "entrees", duration: 15, description: null },
  ],
  snacks: [
    { name: "Browse inspirational quotes", category: "snacks", duration: 5, description: null },
    { name: "Organize desk or workspace", category: "snacks", duration: 10, description: null },
    { name: "Quick meditation", category: "snacks", duration: 7, description: null },
    { name: "Call a friend briefly", category: "snacks", duration: 8, description: null },
    { name: "Look at cute animal photos", category: "snacks", duration: 3, description: null },
  ],
  desserts: [
    { name: "Scrolling through social media", category: "desserts", duration: 15, description: null },
    { name: "Playing Candy Crush", category: "desserts", duration: 10, description: null },
    { name: "Watching TV/Reality shows", category: "desserts", duration: 30, description: null },
    { name: "NY Times game app", category: "desserts", duration: 10, description: null },
    { name: "Texting friends", category: "desserts", duration: 5, description: null },
  ],
  sides: [
    { name: "Listening to white noise", category: "sides", duration: 0, description: null },
    { name: "Playing a podcast", category: "sides", duration: 0, description: null },
    { name: "Using a fidget tool", category: "sides", duration: 0, description: null },
    { name: "ASMR videos", category: "sides", duration: 0, description: null },
    { name: "Upbeat instrumental music", category: "sides", duration: 0, description: null },
  ],
  specials: [
    { name: "Attending a concert", category: "specials", duration: 180, description: null },
    { name: "Getting a massage", category: "specials", duration: 60, description: null },
    { name: "Weekend getaway", category: "specials", duration: 1440, description: null },
    { name: "Going out to dinner", category: "specials", duration: 120, description: null },
    { name: "Visiting a nail salon", category: "specials", duration: 60, description: null },
  ],
};
