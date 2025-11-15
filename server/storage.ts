import { 
  activities, 
  dopamineMenus, 
  users,
  activityLogs,
  userStats,
  type Activity, 
  type DopamineMenu, 
  type User,
  type ActivityLog,
  type UserStats,
  type InsertActivity, 
  type InsertDopamineMenu, 
  type InsertUser,
  type InsertActivityLog,
  type InsertUserStats
} from "@shared/schema";
import { db } from "./db";
import { eq, sql, desc, inArray, not, and } from "drizzle-orm";
import { exampleActivities } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByStackId(stackUserId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createOrGetUserByStackId(stackUserId: string, userData: { username: string; name?: string }): Promise<User>;
  
  // Activity management
  getActivities(stackUserId?: string): Promise<Activity[]>;
  getActivity(id: number): Promise<Activity | undefined>;
  createActivity(activity: InsertActivity, stackUserId?: string): Promise<Activity>;
  createActivities(activities: InsertActivity[], stackUserId?: string): Promise<Activity[]>;
  updateActivity(id: number, activity: Partial<InsertActivity>): Promise<Activity | undefined>;
  deleteActivity(id: number): Promise<boolean>;
  
  // Menu management
  getMenus(): Promise<DopamineMenu[]>;
  getMenu(id: number): Promise<DopamineMenu | undefined>;
  createMenu(menu: InsertDopamineMenu): Promise<DopamineMenu>;
  updateMenu(id: number, menu: Partial<InsertDopamineMenu>): Promise<DopamineMenu | undefined>;
  deleteMenu(id: number): Promise<boolean>;
  
  // Clear all activities
  clearAllActivities(): Promise<boolean>;
  
  // Activity tracking
  completeActivity(activityId: number, userId?: number, duration?: number, mood?: string): Promise<boolean>;
  getActivityLogs(activityId: number): Promise<ActivityLog[]>;
  getRecentActivities(limit?: number): Promise<ActivityLog[]>;
  
  // User stats and streaks
  getUserStats(userId?: number): Promise<UserStats | undefined>;
  updateUserStats(userId?: number): Promise<UserStats>;
  calculateStreak(userId?: number): Promise<number>;
  getSuggestedActivities(mood?: string, excludeRecent?: boolean): Promise<Activity[]>;
  getActivitySuggestions(currentActivity: Activity): Promise<Activity[]>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // No automatic initialization - force users through setup wizard
  }

  private async initializeExampleData() {
    try {
      // Insert example activities from all categories - only called when clearing all
      const allExampleActivities = Object.values(exampleActivities).flat();
      
      for (const activity of allExampleActivities) {
        await db.insert(activities).values({
          name: activity.name,
          category: activity.category,
          description: activity.description,
          duration: activity.duration,
          userId: null
        });
      }
    } catch (error) {
      console.error('Error initializing example data:', error);
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByStackId(stackUserId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.stackUserId, stackUserId));
    return user || undefined;
  }

  async createOrGetUserByStackId(
    stackUserId: string, 
    userData: { username: string; name?: string }
  ): Promise<User> {
    // Try to find existing user by Stack ID
    let user = await this.getUserByStackId(stackUserId);
    
    if (user) {
      return user;
    }
    
    // Check if username already exists (might be from old signup)
    const existingByUsername = await this.getUserByUsername(userData.username);
    if (existingByUsername) {
      // Update existing user with Stack ID
      const [updated] = await db
        .update(users)
        .set({ stackUserId })
        .where(eq(users.id, existingByUsername.id))
        .returning();
      return updated;
    }
    
    // Create new user
    const [newUser] = await db
      .insert(users)
      .values({
        stackUserId,
        username: userData.username,
        name: userData.name || null,
        password: '', // Empty since Stack handles auth
      })
      .returning();
    
    return newUser;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getActivities(stackUserId?: string): Promise<Activity[]> {
    if (stackUserId) {
      return await db.select().from(activities).where(eq(activities.stackUserId, stackUserId));
    }
    return await db.select().from(activities);
  }

  async getActivity(id: number): Promise<Activity | undefined> {
    const [activity] = await db.select().from(activities).where(eq(activities.id, id));
    return activity || undefined;
  }

  async createActivity(insertActivity: InsertActivity, stackUserId?: string): Promise<Activity> {
    const [activity] = await db
      .insert(activities)
      .values({
        ...insertActivity,
        stackUserId: stackUserId || null,
        userId: null,
        duration: insertActivity.duration || null,
        description: insertActivity.description || null
      })
      .returning();
    return activity;
  }

  async createActivities(insertActivities: InsertActivity[], stackUserId?: string): Promise<Activity[]> {
    if (insertActivities.length === 0) {
      return [];
    }
    
    const valuesToInsert = insertActivities.map(activity => ({
      ...activity,
      stackUserId: stackUserId || null,
      userId: null,
      duration: activity.duration || null,
      description: activity.description || null
    }));
    
    const createdActivities = await db
      .insert(activities)
      .values(valuesToInsert)
      .returning();
    
    return createdActivities;
  }

  async updateActivity(id: number, updateData: Partial<InsertActivity>): Promise<Activity | undefined> {
    const [activity] = await db
      .update(activities)
      .set(updateData)
      .where(eq(activities.id, id))
      .returning();
    return activity || undefined;
  }

  async deleteActivity(id: number): Promise<boolean> {
    const result = await db.delete(activities).where(eq(activities.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getMenus(): Promise<DopamineMenu[]> {
    return await db.select().from(dopamineMenus);
  }

  async getMenu(id: number): Promise<DopamineMenu | undefined> {
    const [menu] = await db.select().from(dopamineMenus).where(eq(dopamineMenus.id, id));
    return menu || undefined;
  }

  async createMenu(insertMenu: InsertDopamineMenu): Promise<DopamineMenu> {
    const [menu] = await db
      .insert(dopamineMenus)
      .values({
        ...insertMenu,
        userId: null,
        activities: insertMenu.activities || null
      })
      .returning();
    return menu;
  }

  async updateMenu(id: number, updateData: Partial<InsertDopamineMenu>): Promise<DopamineMenu | undefined> {
    const [menu] = await db
      .update(dopamineMenus)
      .set(updateData)
      .where(eq(dopamineMenus.id, id))
      .returning();
    return menu || undefined;
  }

  async deleteMenu(id: number): Promise<boolean> {
    const result = await db.delete(dopamineMenus).where(eq(dopamineMenus.id, id));
    return (result.rowCount || 0) > 0;
  }

  async clearAllActivities(): Promise<boolean> {
    try {
      // Delete in correct order to avoid foreign key constraints
      console.log("Clearing activity logs...");
      const deletedLogs = await db.delete(activityLogs);
      console.log(`Deleted ${deletedLogs?.rowCount || 0} activity logs`);
      
      console.log("Clearing activities...");
      const deletedActivities = await db.delete(activities);
      console.log(`Deleted ${deletedActivities?.rowCount || 0} activities`);
      
      console.log("Clear all activities completed - no re-initialization");
      return true;
    } catch (error) {
      console.error("Error clearing all activities:", error);
      console.error("Stack trace:", error);
      return false;
    }
  }

  async completeActivity(activityId: number, userId?: number, duration?: number, mood?: string): Promise<boolean> {
    try {
      // Update completion count and last completed timestamp
      await db
        .update(activities)
        .set({
          completionCount: sql`${activities.completionCount} + 1`,
          lastCompleted: sql`NOW()`
        })
        .where(eq(activities.id, activityId));

      // Create activity log entry
      await db.insert(activityLogs).values({
        activityId,
        userId,
        duration,
        mood,
      });
      
      // Update user stats after completing activity
      await this.updateUserStats(userId);

      return true;
    } catch (error) {
      console.error("Error completing activity:", error);
      return false;
    }
  }

  async getActivityLogs(activityId: number): Promise<ActivityLog[]> {
    try {
      return await db
        .select()
        .from(activityLogs)
        .where(eq(activityLogs.activityId, activityId));
    } catch (error) {
      console.error("Error getting activity logs:", error);
      return [];
    }
  }
  
  async getRecentActivities(limit: number = 5): Promise<ActivityLog[]> {
    try {
      return await db
        .select()
        .from(activityLogs)
        .orderBy(desc(activityLogs.completedAt))
        .limit(limit);
    } catch (error) {
      console.error("Error getting recent activities:", error);
      return [];
    }
  }
  
  async getUserStats(userId?: number): Promise<UserStats | undefined> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const [stats] = await db
        .select()
        .from(userStats)
        .where(sql`DATE(${userStats.date}) = DATE(${today})`);
      
      return stats || undefined;
    } catch (error) {
      console.error("Error getting user stats:", error);
      return undefined;
    }
  }
  
  async updateUserStats(userId?: number): Promise<UserStats> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get today's activity count
      const todayCount = await db
        .select({ count: sql`COUNT(*)` })
        .from(activityLogs)
        .where(sql`DATE(${activityLogs.completedAt}) = DATE(${today})`);
      
      const activitiesCompleted = Number(todayCount[0]?.count || 0);
      
      // Calculate current streak
      const currentStreak = await this.calculateStreak(userId);
      
      // Get or create today's stats
      let [existingStats] = await db
        .select()
        .from(userStats)
        .where(sql`DATE(${userStats.date}) = DATE(${today})`);
      
      if (existingStats) {
        // Update existing stats
        const [updatedStats] = await db
          .update(userStats)
          .set({
            activitiesCompleted,
            currentStreak,
            longestStreak: sql`GREATEST(${userStats.longestStreak}, ${currentStreak})`
          })
          .where(eq(userStats.id, existingStats.id))
          .returning();
        
        return updatedStats;
      } else {
        // Create new stats for today
        const [newStats] = await db
          .insert(userStats)
          .values({
            userId,
            date: today,
            activitiesCompleted,
            currentStreak,
            longestStreak: currentStreak
          })
          .returning();
        
        return newStats;
      }
    } catch (error) {
      console.error("Error updating user stats:", error);
      throw error;
    }
  }
  
  async calculateStreak(userId?: number): Promise<number> {
    try {
      // Get all days with activities in reverse chronological order
      const activityDays = await db
        .select({ date: sql`DATE(${activityLogs.completedAt})` })
        .from(activityLogs)
        .groupBy(sql`DATE(${activityLogs.completedAt})`)
        .orderBy(sql`DATE(${activityLogs.completedAt}) DESC`);
      
      if (activityDays.length === 0) return 0;
      
      let streak = 0;
      let currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      
      for (const day of activityDays) {
        const activityDate = new Date(day.date as string);
        const timeDiff = currentDate.getTime() - activityDate.getTime();
        const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        
        if (daysDiff === streak) {
          streak++;
        } else if (daysDiff === streak + 1 && streak === 0) {
          // Allow today or yesterday for starting a streak
          streak++;
        } else {
          break;
        }
      }
      
      return streak;
    } catch (error) {
      console.error("Error calculating streak:", error);
      return 0;
    }
  }
  
  async getSuggestedActivities(mood?: string, excludeRecent: boolean = true): Promise<Activity[]> {
    try {
      // Build conditions array
      const conditions = [];
      
      if (excludeRecent) {
        // Get recently completed activity IDs (last 3 activities)
        const recentLogs = await this.getRecentActivities(3);
        const recentActivityIds = recentLogs.map(log => log.activityId);
        
        if (recentActivityIds.length > 0) {
          conditions.push(not(inArray(activities.id, recentActivityIds)));
        }
      }
      
      // Simple mood-based filtering
      if (mood === 'low') {
        // Suggest quick appetizers and easy activities
        conditions.push(inArray(activities.category, ['appetizers', 'sides']));
      } else if (mood === 'high') {
        // Suggest engaging entrees and specials
        conditions.push(inArray(activities.category, ['entrees', 'specials']));
      }
      
      let suggestions;
      
      if (conditions.length > 0) {
        suggestions = await db
          .select()
          .from(activities)
          .where(and(...conditions))
          .limit(5);
      } else {
        suggestions = await db
          .select()
          .from(activities)
          .limit(5);
      }
      
      // Randomize the order
      return suggestions.sort(() => Math.random() - 0.5);
    } catch (error) {
      console.error("Error getting suggested activities:", error);
      return [];
    }
  }
  
  async getActivitySuggestions(currentActivity: Activity): Promise<Activity[]> {
    try {
      // Suggest complementary activities based on current activity category
      const suggestions: string[] = [];
      
      switch (currentActivity.category) {
        case 'appetizers':
          // After a quick boost, suggest main activities or background
          suggestions.push('entrees', 'sides');
          break;
        case 'entrees':
          // After main activity, suggest cool-down or rewards
          suggestions.push('desserts', 'sides', 'appetizers');
          break;
        case 'sides':
          // Background activities can lead to anything
          suggestions.push('appetizers', 'entrees');
          break;
        case 'desserts':
          // After indulgence, suggest productive activities
          suggestions.push('appetizers', 'entrees');
          break;
        case 'specials':
          // After special treat, suggest gentle activities
          suggestions.push('appetizers', 'sides');
          break;
      }
      
      if (suggestions.length === 0) return [];
      
      return await db
        .select()
        .from(activities)
        .where(and(
          inArray(activities.category, suggestions),
          sql`${activities.id} != ${currentActivity.id}`
        ))
        .limit(3);
    } catch (error) {
      console.error("Error getting activity suggestions:", error);
      return [];
    }
  }
}

export const storage = new DatabaseStorage();
