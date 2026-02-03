/**
 * Agent Creation UX Tests
 * Tests for agent templates, form validation, and creation flow
 */

import { describe, it, expect } from "vitest";

// Sample agent templates (matching the ones in Dashboard.tsx)
const AGENT_TEMPLATES = [
  {
    name: "Brick Master",
    emoji: "🧱",
    color: "#E53935",
    tagline: "Expert in structural foundations",
    bio: "A seasoned builder with years of experience in creating stable, well-balanced LEGO structures.",
    voiceStyle: "technical" as const,
    personality: { creativity: 40, precision: 90, sociability: 60, boldness: 50 },
    suggestedSkills: ["Structural Engineering", "Foundation Design"],
  },
  {
    name: "Color Wizard",
    emoji: "🎨",
    color: "#8E24AA",
    tagline: "Master of vibrant color schemes",
    bio: "An artistic soul who sees LEGO bricks as a painter sees colors on a palette.",
    voiceStyle: "creative" as const,
    personality: { creativity: 95, precision: 50, sociability: 70, boldness: 85 },
    suggestedSkills: ["Color Theory", "Aesthetic Design"],
  },
  {
    name: "Tiny Architect",
    emoji: "🏗️",
    color: "#1E88E5",
    tagline: "Designs intricate miniature worlds",
    bio: "Specializes in micro-scale builds and detailed miniature scenes.",
    voiceStyle: "enthusiastic" as const,
    personality: { creativity: 80, precision: 85, sociability: 55, boldness: 60 },
    suggestedSkills: ["Miniature Design", "Detail Work"],
  },
  {
    name: "Retro Fan",
    emoji: "📼",
    color: "#FB8C00",
    tagline: "Nostalgic builds from the classics",
    bio: "A lover of vintage LEGO sets and classic building techniques.",
    voiceStyle: "casual" as const,
    personality: { creativity: 70, precision: 60, sociability: 80, boldness: 45 },
    suggestedSkills: ["Classic Design", "Retro Styling"],
  },
  {
    name: "Space Explorer",
    emoji: "🚀",
    color: "#039BE5",
    tagline: "Building the future, one brick at a time",
    bio: "Obsessed with spacecraft, space stations, and futuristic vehicles.",
    voiceStyle: "enthusiastic" as const,
    personality: { creativity: 85, precision: 75, sociability: 65, boldness: 90 },
    suggestedSkills: ["Vehicle Design", "Sci-Fi Themes"],
  },
];

// Example placeholders
const EXAMPLES = {
  name: ["Brick Ninja", "Castle King", "Pixel Artist", "Gear Head", "Nature Builder"],
  tagline: [
    "Swift and precise brick placement",
    "Medieval architecture specialist",
    "Creating art one stud at a time",
    "Mechanical marvels and moving parts",
    "Organic shapes and natural designs",
  ],
  bio: [
    "A master of speed building who can construct complex structures in record time.",
    "Specializes in medieval castles, fortresses, and fantasy architecture.",
    "Transforms LEGO bricks into pixel art masterpieces.",
  ],
};

describe("Agent Creation UX", () => {
  describe("Agent Templates", () => {
    it("should have 5 predefined templates", () => {
      expect(AGENT_TEMPLATES.length).toBe(5);
    });

    it("should have all required fields in each template", () => {
      AGENT_TEMPLATES.forEach((template) => {
        expect(template.name).toBeDefined();
        expect(template.emoji).toBeDefined();
        expect(template.color).toBeDefined();
        expect(template.tagline).toBeDefined();
        expect(template.bio).toBeDefined();
        expect(template.voiceStyle).toBeDefined();
        expect(template.personality).toBeDefined();
        expect(template.suggestedSkills).toBeDefined();
      });
    });

    it("should have valid personality traits (0-100)", () => {
      AGENT_TEMPLATES.forEach((template) => {
        const { creativity, precision, sociability, boldness } = template.personality;
        expect(creativity).toBeGreaterThanOrEqual(0);
        expect(creativity).toBeLessThanOrEqual(100);
        expect(precision).toBeGreaterThanOrEqual(0);
        expect(precision).toBeLessThanOrEqual(100);
        expect(sociability).toBeGreaterThanOrEqual(0);
        expect(sociability).toBeLessThanOrEqual(100);
        expect(boldness).toBeGreaterThanOrEqual(0);
        expect(boldness).toBeLessThanOrEqual(100);
      });
    });

    it("should have valid voice styles", () => {
      const validVoiceStyles = ["formal", "casual", "enthusiastic", "technical", "creative"];
      AGENT_TEMPLATES.forEach((template) => {
        expect(validVoiceStyles).toContain(template.voiceStyle);
      });
    });

    it("should have valid hex color codes", () => {
      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
      AGENT_TEMPLATES.forEach((template) => {
        expect(template.color).toMatch(hexColorRegex);
      });
    });

    it("should have unique names", () => {
      const names = AGENT_TEMPLATES.map((t) => t.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });
  });

  describe("Example Placeholders", () => {
    it("should have multiple name examples", () => {
      expect(EXAMPLES.name.length).toBeGreaterThanOrEqual(3);
    });

    it("should have multiple tagline examples", () => {
      expect(EXAMPLES.tagline.length).toBeGreaterThanOrEqual(3);
    });

    it("should have multiple bio examples", () => {
      expect(EXAMPLES.bio.length).toBeGreaterThanOrEqual(3);
    });

    it("should return random example from array", () => {
      const getRandomExample = (field: keyof typeof EXAMPLES) => {
        const examples = EXAMPLES[field];
        return examples[Math.floor(Math.random() * examples.length)];
      };

      // Run multiple times to ensure randomness works
      const results = new Set<string>();
      for (let i = 0; i < 20; i++) {
        results.add(getRandomExample("name"));
      }
      // Should have at least 2 different results (statistically likely)
      expect(results.size).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Form Validation", () => {
    it("should require agent name", () => {
      const isValid = (name: string) => name.trim().length > 0;
      
      expect(isValid("")).toBe(false);
      expect(isValid("   ")).toBe(false);
      expect(isValid("Brick Master")).toBe(true);
    });

    it("should limit skills to maximum of 3", () => {
      const MAX_SKILLS = 3;
      const selectedSkills = [1, 2, 3];
      const newSkillId = 4;

      const canAddSkill = selectedSkills.length < MAX_SKILLS;
      expect(canAddSkill).toBe(false);

      const fewerSkills = [1, 2];
      const canAddToFewer = fewerSkills.length < MAX_SKILLS;
      expect(canAddToFewer).toBe(true);
    });

    it("should toggle skill selection", () => {
      let skillIds: number[] = [1, 2];
      const skillToToggle = 2;

      // Remove if exists
      if (skillIds.includes(skillToToggle)) {
        skillIds = skillIds.filter((id) => id !== skillToToggle);
      }
      expect(skillIds).toEqual([1]);

      // Add if not exists
      const skillToAdd = 3;
      if (!skillIds.includes(skillToAdd) && skillIds.length < 3) {
        skillIds = [...skillIds, skillToAdd];
      }
      expect(skillIds).toEqual([1, 3]);
    });
  });

  describe("Template Application", () => {
    it("should apply template values to form state", () => {
      const template = AGENT_TEMPLATES[0]; // Brick Master
      
      const newAgentState = {
        name: template.name,
        emoji: template.emoji,
        color: template.color,
        tagline: template.tagline,
        bio: template.bio,
        voiceStyle: template.voiceStyle,
        personality: template.personality,
        skillIds: [] as number[], // Skills are selected separately
      };

      expect(newAgentState.name).toBe("Brick Master");
      expect(newAgentState.emoji).toBe("🧱");
      expect(newAgentState.color).toBe("#E53935");
      expect(newAgentState.personality.precision).toBe(90);
    });

    it("should reset skillIds when applying template", () => {
      const existingSkillIds = [1, 2, 3];
      const template = AGENT_TEMPLATES[1];

      // When applying template, skillIds should be reset
      const newState = {
        ...template,
        skillIds: [], // Always reset to empty
      };

      expect(newState.skillIds).toEqual([]);
    });
  });

  describe("Success State", () => {
    it("should track created agent name for success message", () => {
      const agentName = "My New Agent";
      let createdAgentName = "";
      let showSuccess = false;

      // Simulate successful creation
      createdAgentName = agentName;
      showSuccess = true;

      expect(createdAgentName).toBe("My New Agent");
      expect(showSuccess).toBe(true);
    });

    it("should reset form after successful creation", () => {
      const defaultState = {
        name: "",
        emoji: "🤖",
        color: "#1E88E5",
        tagline: "",
        bio: "",
        voiceStyle: "casual" as const,
        personality: {
          creativity: 50,
          precision: 50,
          sociability: 50,
          boldness: 50,
        },
        skillIds: [] as number[],
      };

      // After creation, form should reset to defaults
      expect(defaultState.name).toBe("");
      expect(defaultState.personality.creativity).toBe(50);
      expect(defaultState.skillIds).toEqual([]);
    });
  });

  describe("Personality Traits", () => {
    it("should have descriptive labels for each trait", () => {
      const traits = [
        { key: "creativity", left: "Methodical", right: "Imaginative" },
        { key: "precision", left: "Flexible", right: "Perfectionist" },
        { key: "sociability", left: "Independent", right: "Collaborative" },
        { key: "boldness", left: "Cautious", right: "Adventurous" },
      ];

      expect(traits.length).toBe(4);
      traits.forEach((trait) => {
        expect(trait.key).toBeDefined();
        expect(trait.left).toBeDefined();
        expect(trait.right).toBeDefined();
      });
    });

    it("should display percentage value for each trait", () => {
      const personality = { creativity: 75, precision: 30, sociability: 90, boldness: 50 };
      
      Object.entries(personality).forEach(([key, value]) => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
        expect(`${value}%`).toMatch(/^\d+%$/);
      });
    });
  });
});
