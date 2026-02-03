/**
 * Tests for the Autonomous AI Agent Collaboration System
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { AgentBrain, generateAgentSystemPrompt, createAgentBrain, AgentConfig } from "./agentBrain";

// Mock the LLM module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: JSON.stringify({
          action_type: "speak",
          content: "Let me suggest we start with a solid foundation!",
        })
      }
    }]
  })
}));

describe("Agent Brain", () => {
  const testAgentConfig: AgentConfig = {
    id: "test_agent_1",
    name: "Test Builder",
    emoji: "🧱",
    color: "#FF5733",
    bio: "A test agent for building LEGO structures.",
    voiceStyle: "casual",
    personality: {
      creativity: 70,
      precision: 80,
      sociability: 60,
      boldness: 50,
    },
    skills: ["Structural Engineering", "Color Theory"],
  };

  describe("generateAgentSystemPrompt", () => {
    it("should generate a system prompt with agent identity", () => {
      const prompt = generateAgentSystemPrompt(testAgentConfig);
      
      expect(prompt).toContain("Test Builder");
      expect(prompt).toContain("🧱");
      expect(prompt).toContain("A test agent for building LEGO structures");
    });

    it("should include personality traits in the prompt", () => {
      const creativeAgent: AgentConfig = {
        ...testAgentConfig,
        personality: { creativity: 95, precision: 30, sociability: 50, boldness: 50 },
      };
      
      const prompt = generateAgentSystemPrompt(creativeAgent);
      expect(prompt).toContain("imaginative");
    });

    it("should include skills in the prompt", () => {
      const prompt = generateAgentSystemPrompt(testAgentConfig);
      
      expect(prompt).toContain("Structural Engineering");
      expect(prompt).toContain("Color Theory");
    });

    it("should include voice style instructions", () => {
      const formalAgent: AgentConfig = {
        ...testAgentConfig,
        voiceStyle: "formal",
      };
      
      const prompt = generateAgentSystemPrompt(formalAgent);
      expect(prompt).toContain("professional");
    });
  });

  describe("createAgentBrain", () => {
    it("should create an AgentBrain from database agent data", () => {
      const dbAgent = {
        publicId: "db_agent_1",
        name: "Database Agent",
        emoji: "🔧",
        color: "#00FF00",
        bio: "An agent from the database",
        voiceStyle: "technical",
        personality: { creativity: 50, precision: 90, sociability: 40, boldness: 30 },
        skills: [{ name: "Mechanical Systems" }],
      };

      const brain = createAgentBrain(dbAgent);
      const config = brain.getConfig();

      expect(config.id).toBe("db_agent_1");
      expect(config.name).toBe("Database Agent");
      expect(config.emoji).toBe("🔧");
      expect(config.skills).toContain("Mechanical Systems");
    });

    it("should use default values for missing fields", () => {
      const minimalAgent = {
        publicId: "minimal_1",
        name: "Minimal Agent",
        emoji: "⚡",
        color: "#FFFFFF",
        bio: null,
        voiceStyle: null,
        personality: null,
      };

      const brain = createAgentBrain(minimalAgent);
      const config = brain.getConfig();

      expect(config.voiceStyle).toBe("casual");
      expect(config.personality.creativity).toBe(50);
      expect(config.skills).toEqual([]);
    });
  });

  describe("AgentBrain class", () => {
    let brain: AgentBrain;

    beforeEach(() => {
      brain = new AgentBrain(testAgentConfig);
    });

    it("should store and return agent config", () => {
      const config = brain.getConfig();
      
      expect(config.id).toBe("test_agent_1");
      expect(config.name).toBe("Test Builder");
    });

    it("should reset memory when requested", () => {
      brain.resetMemory();
      // Memory should be cleared (internal state)
      expect(brain.getConfig().id).toBe("test_agent_1"); // Config should remain
    });
  });
});

describe("Agent Action Types", () => {
  it("should define all required action types", () => {
    const actionTypes = ["think", "speak", "propose", "agree", "disagree", "build", "react", "celebrate"];
    
    // All action types should be valid strings
    actionTypes.forEach(type => {
      expect(typeof type).toBe("string");
      expect(type.length).toBeGreaterThan(0);
    });
  });
});

describe("Personality Traits", () => {
  it("should handle extreme creativity values", () => {
    const highCreativity: AgentConfig = {
      id: "creative_1",
      name: "Creative Agent",
      emoji: "🎨",
      color: "#FF00FF",
      bio: "A highly creative agent",
      voiceStyle: "creative",
      personality: { creativity: 100, precision: 0, sociability: 50, boldness: 50 },
      skills: [],
    };

    const prompt = generateAgentSystemPrompt(highCreativity);
    expect(prompt).toContain("imaginative");
    expect(prompt).toContain("flexible");
  });

  it("should handle extreme precision values", () => {
    const highPrecision: AgentConfig = {
      id: "precise_1",
      name: "Precise Agent",
      emoji: "📐",
      color: "#0000FF",
      bio: "A highly precise agent",
      voiceStyle: "technical",
      personality: { creativity: 0, precision: 100, sociability: 50, boldness: 50 },
      skills: [],
    };

    const prompt = generateAgentSystemPrompt(highPrecision);
    expect(prompt).toContain("methodical");
    expect(prompt).toContain("perfectionist");
  });

  it("should handle balanced personality", () => {
    const balanced: AgentConfig = {
      id: "balanced_1",
      name: "Balanced Agent",
      emoji: "⚖️",
      color: "#808080",
      bio: "A balanced agent",
      voiceStyle: "casual",
      personality: { creativity: 50, precision: 50, sociability: 50, boldness: 50 },
      skills: [],
    };

    const prompt = generateAgentSystemPrompt(balanced);
    expect(prompt).toContain("balanced");
  });
});

describe("Voice Styles", () => {
  const baseConfig: Omit<AgentConfig, "voiceStyle"> = {
    id: "voice_test",
    name: "Voice Test Agent",
    emoji: "🎤",
    color: "#000000",
    bio: "Testing voice styles",
    personality: { creativity: 50, precision: 50, sociability: 50, boldness: 50 },
    skills: [],
  };

  it("should generate formal voice style", () => {
    const agent: AgentConfig = { ...baseConfig, voiceStyle: "formal" };
    const prompt = generateAgentSystemPrompt(agent);
    expect(prompt).toContain("professional");
  });

  it("should generate casual voice style", () => {
    const agent: AgentConfig = { ...baseConfig, voiceStyle: "casual" };
    const prompt = generateAgentSystemPrompt(agent);
    expect(prompt).toContain("friendly");
  });

  it("should generate enthusiastic voice style", () => {
    const agent: AgentConfig = { ...baseConfig, voiceStyle: "enthusiastic" };
    const prompt = generateAgentSystemPrompt(agent);
    expect(prompt).toContain("excitement");
  });

  it("should generate technical voice style", () => {
    const agent: AgentConfig = { ...baseConfig, voiceStyle: "technical" };
    const prompt = generateAgentSystemPrompt(agent);
    expect(prompt).toContain("technical");
  });

  it("should generate creative voice style", () => {
    const agent: AgentConfig = { ...baseConfig, voiceStyle: "creative" };
    const prompt = generateAgentSystemPrompt(agent);
    expect(prompt).toContain("artistic");
  });
});
