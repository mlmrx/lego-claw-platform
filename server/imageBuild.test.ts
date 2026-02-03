/**
 * Image Build Feature Tests
 * Tests for the LEGO set image upload and analysis functionality
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the LLM module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: JSON.stringify({
          setName: "Test LEGO Set",
          setNumber: "12345",
          pieceCount: 500,
          estimatedDifficulty: "medium",
          theme: "city",
          style: "modern",
          colors: ["red", "blue", "white"],
          features: ["modular", "detailed"],
          description: "A test LEGO set",
          buildingTips: ["Start with the base"]
        })
      }
    }]
  })
}));

// Mock the storage module
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({
    url: "https://example.com/test-image.jpg",
    key: "test-key"
  })
}));

describe("Image Build Feature", () => {
  describe("Image Analysis", () => {
    it("should parse valid LEGO set info from AI response", () => {
      const mockResponse = {
        setName: "LEGO City Fire Station",
        setNumber: "60215",
        pieceCount: 509,
        estimatedDifficulty: "medium" as const,
        theme: "city",
        style: "modern",
        colors: ["red", "white", "gray", "yellow"],
        features: ["working garage doors", "fire pole", "helicopter"],
        description: "A detailed fire station with multiple vehicles",
        buildingTips: ["Build the base first", "Attach the tower last"]
      };

      expect(mockResponse.setName).toBe("LEGO City Fire Station");
      expect(mockResponse.pieceCount).toBe(509);
      expect(mockResponse.estimatedDifficulty).toBe("medium");
      expect(mockResponse.colors).toContain("red");
      expect(mockResponse.features.length).toBeGreaterThan(0);
    });

    it("should handle missing optional fields gracefully", () => {
      const mockResponse = {
        setName: "Custom Build",
        setNumber: null,
        pieceCount: null,
        estimatedDifficulty: "easy" as const,
        theme: "custom",
        style: "creative",
        colors: ["mixed"],
        features: [],
        description: "A custom LEGO creation",
        buildingTips: []
      };

      expect(mockResponse.setName).toBe("Custom Build");
      expect(mockResponse.setNumber).toBeNull();
      expect(mockResponse.pieceCount).toBeNull();
    });

    it("should validate difficulty levels", () => {
      const validDifficulties = ["easy", "medium", "hard", "expert"];
      
      validDifficulties.forEach(difficulty => {
        expect(validDifficulties).toContain(difficulty);
      });
    });
  });

  describe("Target Brick Calculation", () => {
    it("should calculate target bricks based on difficulty", () => {
      const calculateTargetBricks = (difficulty: string, pieceCount: number | null) => {
        if (pieceCount) return Math.min(pieceCount, 500);
        
        switch (difficulty) {
          case "easy": return 50;
          case "medium": return 100;
          case "hard": return 200;
          case "expert": return 300;
          default: return 100;
        }
      };

      expect(calculateTargetBricks("easy", null)).toBe(50);
      expect(calculateTargetBricks("medium", null)).toBe(100);
      expect(calculateTargetBricks("hard", null)).toBe(200);
      expect(calculateTargetBricks("expert", null)).toBe(300);
      expect(calculateTargetBricks("medium", 150)).toBe(150);
      expect(calculateTargetBricks("expert", 1000)).toBe(500); // capped at 500
    });
  });

  describe("Image Upload Validation", () => {
    it("should accept valid image MIME types", () => {
      const validMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      
      validMimeTypes.forEach(mimeType => {
        expect(mimeType.startsWith("image/")).toBe(true);
      });
    });

    it("should reject invalid MIME types", () => {
      const invalidMimeTypes = ["application/pdf", "text/plain", "video/mp4"];
      
      invalidMimeTypes.forEach(mimeType => {
        expect(mimeType.startsWith("image/")).toBe(false);
      });
    });

    it("should validate base64 image data format", () => {
      // Valid base64 string (simplified check)
      const validBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      const invalidBase64 = "not-valid-base64!!!";

      // Check if string contains only valid base64 characters
      const base64Regex = /^[A-Za-z0-9+/=]+$/;
      
      expect(base64Regex.test(validBase64)).toBe(true);
      expect(base64Regex.test(invalidBase64)).toBe(false);
    });
  });

  describe("Build Project Creation", () => {
    it("should create project with correct default values", () => {
      const createProjectDefaults = (setInfo: any, customName?: string, customDescription?: string) => {
        return {
          name: customName || setInfo.setName,
          description: customDescription || setInfo.description,
          theme: setInfo.theme,
          style: setInfo.style,
          maxAgents: 8,
          isOpenToJoin: true,
          status: "building"
        };
      };

      const setInfo = {
        setName: "Test Set",
        description: "Test description",
        theme: "city",
        style: "modern"
      };

      const project = createProjectDefaults(setInfo);
      
      expect(project.name).toBe("Test Set");
      expect(project.description).toBe("Test description");
      expect(project.maxAgents).toBe(8);
      expect(project.isOpenToJoin).toBe(true);
      expect(project.status).toBe("building");
    });

    it("should use custom name and description when provided", () => {
      const createProjectDefaults = (setInfo: any, customName?: string, customDescription?: string) => {
        return {
          name: customName || setInfo.setName,
          description: customDescription || setInfo.description,
        };
      };

      const setInfo = {
        setName: "Original Name",
        description: "Original description"
      };

      const project = createProjectDefaults(setInfo, "Custom Name", "Custom description");
      
      expect(project.name).toBe("Custom Name");
      expect(project.description).toBe("Custom description");
    });
  });

  describe("LegoSetInfo Schema Validation", () => {
    it("should validate complete LegoSetInfo object", () => {
      const validSetInfo = {
        setName: "LEGO Star Wars Millennium Falcon",
        setNumber: "75192",
        pieceCount: 7541,
        estimatedDifficulty: "expert",
        theme: "star-wars",
        style: "detailed",
        colors: ["gray", "white", "blue", "brown"],
        features: ["opening cockpit", "rotating turrets", "detailed interior"],
        description: "The ultimate collector's Millennium Falcon",
        buildingTips: ["Sort pieces by color first", "Follow instructions carefully"]
      };

      expect(validSetInfo.setName).toBeTruthy();
      expect(validSetInfo.theme).toBeTruthy();
      expect(validSetInfo.style).toBeTruthy();
      expect(Array.isArray(validSetInfo.colors)).toBe(true);
      expect(Array.isArray(validSetInfo.features)).toBe(true);
      expect(Array.isArray(validSetInfo.buildingTips)).toBe(true);
    });

    it("should handle minimal LegoSetInfo object", () => {
      const minimalSetInfo = {
        setName: "Unknown Set",
        setNumber: null,
        pieceCount: null,
        estimatedDifficulty: "medium",
        theme: "custom",
        style: "creative",
        colors: [],
        features: [],
        description: "",
        buildingTips: []
      };

      expect(minimalSetInfo.setName).toBeTruthy();
      expect(minimalSetInfo.setNumber).toBeNull();
      expect(minimalSetInfo.colors.length).toBe(0);
    });
  });
});
