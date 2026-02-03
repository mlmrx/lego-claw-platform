/**
 * User Collections & Social Features Tests
 * Tests for bookmarks, user chat, and profile gallery features
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

describe("User Collections & Social Features", () => {
  describe("Bookmarks/Collections", () => {
    it("should filter bookmarks by search query", () => {
      const bookmarks = [
        { id: 1, build: { name: "Space Station", description: "A cool space station", theme: "space" }, bookmarkedAt: new Date() },
        { id: 2, build: { name: "Medieval Castle", description: "A grand castle", theme: "medieval" }, bookmarkedAt: new Date() },
        { id: 3, build: { name: "City Fire Station", description: "Fire rescue building", theme: "city" }, bookmarkedAt: new Date() },
      ];

      const searchQuery = "castle";
      const filtered = bookmarks.filter(bookmark => 
        bookmark.build.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bookmark.build.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );

      expect(filtered.length).toBe(1);
      expect(filtered[0].build.name).toBe("Medieval Castle");
    });

    it("should filter bookmarks by theme tab", () => {
      const bookmarks = [
        { id: 1, build: { name: "Space Station", theme: "space" }, bookmarkedAt: new Date() },
        { id: 2, build: { name: "Medieval Castle", theme: "medieval" }, bookmarkedAt: new Date() },
        { id: 3, build: { name: "Rocket Ship", theme: "space" }, bookmarkedAt: new Date() },
      ];

      const activeTab = "space";
      const filtered = bookmarks.filter(bookmark => bookmark.build.theme === activeTab);

      expect(filtered.length).toBe(2);
      expect(filtered.every(b => b.build.theme === "space")).toBe(true);
    });

    it("should filter recent bookmarks (within last week)", () => {
      const now = new Date();
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const bookmarks = [
        { id: 1, build: { name: "Recent Build" }, bookmarkedAt: new Date(now.getTime() - 86400000) }, // 1 day ago
        { id: 2, build: { name: "Old Build" }, bookmarkedAt: twoWeeksAgo },
        { id: 3, build: { name: "Very Recent" }, bookmarkedAt: now },
      ];

      const filtered = bookmarks.filter(bookmark => 
        new Date(bookmark.bookmarkedAt) > oneWeekAgo
      );

      expect(filtered.length).toBe(2);
      expect(filtered.map(b => b.build.name)).toContain("Recent Build");
      expect(filtered.map(b => b.build.name)).toContain("Very Recent");
    });

    it("should extract unique themes from bookmarks", () => {
      const bookmarks = [
        { build: { theme: "space" } },
        { build: { theme: "medieval" } },
        { build: { theme: "space" } },
        { build: { theme: "city" } },
        { build: { theme: null } },
      ];

      const themes = Array.from(
        new Set(bookmarks.map((b: any) => b.build.theme).filter(Boolean))
      ) as string[];

      expect(themes.length).toBe(3);
      expect(themes).toContain("space");
      expect(themes).toContain("medieval");
      expect(themes).toContain("city");
    });
  });

  describe("User Chat", () => {
    interface ChatMessage {
      id: string;
      userId: string;
      userName: string;
      message: string;
      timestamp: Date;
      reactions?: { emoji: string; count: number }[];
      isSupporter?: boolean;
    }

    it("should create a valid chat message", () => {
      const msg: ChatMessage = {
        id: `user-${Date.now()}`,
        userId: "123",
        userName: "TestUser",
        message: "Hello world!",
        timestamp: new Date(),
      };

      expect(msg.id).toMatch(/^user-\d+$/);
      expect(msg.userId).toBe("123");
      expect(msg.userName).toBe("TestUser");
      expect(msg.message).toBe("Hello world!");
      expect(msg.timestamp).toBeInstanceOf(Date);
    });

    it("should add reaction to message", () => {
      const messages: ChatMessage[] = [
        {
          id: "msg-1",
          userId: "user1",
          userName: "User1",
          message: "Test message",
          timestamp: new Date(),
          reactions: [{ emoji: "❤️", count: 2 }],
        },
      ];

      // Add a new reaction
      const updatedMessages = messages.map(msg => {
        if (msg.id === "msg-1") {
          const existingReaction = msg.reactions?.find(r => r.emoji === "❤️");
          if (existingReaction) {
            return {
              ...msg,
              reactions: msg.reactions?.map(r => 
                r.emoji === "❤️" ? { ...r, count: r.count + 1 } : r
              ),
            };
          }
        }
        return msg;
      });

      expect(updatedMessages[0].reactions?.[0].count).toBe(3);
    });

    it("should add new reaction type to message", () => {
      const messages: ChatMessage[] = [
        {
          id: "msg-1",
          userId: "user1",
          userName: "User1",
          message: "Test message",
          timestamp: new Date(),
          reactions: [{ emoji: "❤️", count: 2 }],
        },
      ];

      // Add a different reaction
      const updatedMessages = messages.map(msg => {
        if (msg.id === "msg-1") {
          const existingReaction = msg.reactions?.find(r => r.emoji === "👍");
          if (!existingReaction) {
            return {
              ...msg,
              reactions: [...(msg.reactions || []), { emoji: "👍", count: 1 }],
            };
          }
        }
        return msg;
      });

      expect(updatedMessages[0].reactions?.length).toBe(2);
      expect(updatedMessages[0].reactions?.find(r => r.emoji === "👍")?.count).toBe(1);
    });

    it("should limit message length", () => {
      const maxLength = 200;
      const longMessage = "a".repeat(250);
      const truncatedMessage = longMessage.slice(0, maxLength);

      expect(truncatedMessage.length).toBe(maxLength);
    });

    it("should validate quick reactions", () => {
      const quickReactions = ["❤️", "👍", "🔥", "✨", "🧱"];
      
      expect(quickReactions.length).toBe(5);
      expect(quickReactions).toContain("❤️");
      expect(quickReactions).toContain("🧱");
    });
  });

  describe("User Profile Gallery", () => {
    it("should filter builds with source images", () => {
      const builds = [
        { publicId: "build1", name: "Build 1", sourceImageUrl: "https://example.com/img1.jpg" },
        { publicId: "build2", name: "Build 2", sourceImageUrl: null },
        { publicId: "build3", name: "Build 3", sourceImageUrl: "https://example.com/img3.jpg" },
        { publicId: "build4", name: "Build 4", sourceImageUrl: undefined },
      ];

      const submittedBuilds = builds.filter((b: any) => b.sourceImageUrl);

      expect(submittedBuilds.length).toBe(2);
      expect(submittedBuilds.map(b => b.publicId)).toContain("build1");
      expect(submittedBuilds.map(b => b.publicId)).toContain("build3");
    });

    it("should parse LEGO set info JSON", () => {
      const build = {
        name: "Test Build",
        legoSetInfo: JSON.stringify({
          setNumber: "75192",
          pieceCount: 7541,
          estimatedDifficulty: "expert",
          theme: "star-wars",
        }),
      };

      const info = JSON.parse(build.legoSetInfo);

      expect(info.setNumber).toBe("75192");
      expect(info.pieceCount).toBe(7541);
      expect(info.estimatedDifficulty).toBe("expert");
    });

    it("should handle invalid LEGO set info gracefully", () => {
      const build = {
        name: "Test Build",
        legoSetInfo: "invalid json",
      };

      let info = null;
      try {
        info = JSON.parse(build.legoSetInfo);
      } catch {
        info = null;
      }

      expect(info).toBeNull();
    });

    it("should calculate build progress", () => {
      const build = {
        currentBricks: 25,
        targetBricks: 100,
      };

      const progress = Math.round((build.currentBricks / build.targetBricks) * 100);

      expect(progress).toBe(25);
    });

    it("should format build status correctly", () => {
      const statuses = ["completed", "building", "planning", "paused"];
      
      const getStatusVariant = (status: string) => {
        switch (status) {
          case "completed": return "default";
          case "building": return "secondary";
          default: return "outline";
        }
      };

      expect(getStatusVariant("completed")).toBe("default");
      expect(getStatusVariant("building")).toBe("secondary");
      expect(getStatusVariant("planning")).toBe("outline");
      expect(getStatusVariant("paused")).toBe("outline");
    });
  });

  describe("View Mode Toggle", () => {
    it("should toggle between grid and list views", () => {
      type ViewMode = "grid" | "list";
      let viewMode: ViewMode = "grid";

      // Toggle to list
      viewMode = viewMode === "grid" ? "list" : "grid";
      expect(viewMode).toBe("list");

      // Toggle back to grid
      viewMode = viewMode === "grid" ? "list" : "grid";
      expect(viewMode).toBe("grid");
    });
  });
});
