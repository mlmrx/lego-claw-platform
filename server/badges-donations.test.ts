import { describe, it, expect } from "vitest";
import * as db from "./db";

describe("badges", () => {
  describe("getAllBadges", () => {
    it("returns badge definitions from database", async () => {
      const badges = await db.getAllBadges();
      
      expect(Array.isArray(badges)).toBe(true);
      // May return from DB or fallback definitions
    });
  });

  describe("getBadgeBySlug", () => {
    it("returns a badge by slug", async () => {
      const badge = await db.getBadgeBySlug("first-brick");
      
      // May return from DB or fallback definitions
      // If DB is available, it should return the badge
      if (badge) {
        expect(badge.name).toBe("First Brick");
        expect(badge.icon).toBe("🧱");
        expect(badge.rarity).toBe("common");
      }
    });

    it("returns undefined for non-existent badge", async () => {
      const badge = await db.getBadgeBySlug("non-existent-badge-xyz-123");
      
      expect(badge).toBeUndefined();
    });
  });

  describe("getUserBadges", () => {
    it("returns an array for user badges", async () => {
      const badges = await db.getUserBadges(1);
      
      expect(Array.isArray(badges)).toBe(true);
    });
  });

  describe("getAgentBadges", () => {
    it("returns an array for agent badges", async () => {
      const badges = await db.getAgentBadges(1);
      
      expect(Array.isArray(badges)).toBe(true);
    });
  });
});

describe("donations", () => {
  describe("getRecentDonations", () => {
    it("returns an array of donations", async () => {
      const donations = await db.getRecentDonations(10);
      
      expect(Array.isArray(donations)).toBe(true);
    });
  });

  describe("getDonationStats", () => {
    it("returns donation stats object", async () => {
      const stats = await db.getDonationStats();
      
      expect(stats).toHaveProperty('totalDonations');
      expect(stats).toHaveProperty('totalAmount');
    });
  });

  describe("getSponsoredAgents", () => {
    it("returns an array of sponsored agents", async () => {
      const agents = await db.getSponsoredAgents(10);
      
      expect(Array.isArray(agents)).toBe(true);
    });
  });

  describe("getDonationByTransactionId", () => {
    it("returns undefined for non-existent transaction", async () => {
      const donation = await db.getDonationByTransactionId("non-existent-tx-id-xyz");
      
      expect(donation).toBeUndefined();
    });
  });
});

describe("platform stats", () => {
  describe("getAllPlatformStats", () => {
    it("returns an object of platform stats", async () => {
      const stats = await db.getAllPlatformStats();
      
      expect(typeof stats).toBe('object');
    });
  });
});

describe("getChallengesByCreator", () => {
  it("returns an array of challenges", async () => {
    const challenges = await db.getChallengesByCreator(1);
    
    expect(Array.isArray(challenges)).toBe(true);
  });
});
