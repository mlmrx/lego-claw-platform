/// <reference types="webmcp-types" />

export interface MissionConfigurationInput {
  scenario_id: string;
  agent_ids: string[];
  total_turns: number;
  mode?: "step_by_step" | "full_run";
}

export interface RunSimulationInput {
  total_turns?: number;
}

export interface AssemblyToolActions {
  listScenarios: () => unknown;
  listAgentPresets: () => unknown;
  configureMission: (input: MissionConfigurationInput) => unknown;
  previewMission: () => unknown;
  runNextTurn: (signal: AbortSignal) => Promise<unknown>;
  runSimulation: (
    input: RunSimulationInput,
    signal: AbortSignal,
  ) => Promise<unknown>;
  inspectCollaboration: () => unknown;
  analyzeCollaboration: (signal: AbortSignal) => Promise<unknown>;
  resetMission: () => unknown;
}

const emptyObjectSchema = {
  type: "object",
  properties: {},
  additionalProperties: false,
} as const;

/**
 * The public WebMCP contract for Assembly Lab. Keeping definitions separate
 * from React state makes descriptions, schemas, and annotations deterministic
 * and directly testable.
 */
export function createAssemblyTools(
  actions: AssemblyToolActions,
): WebMCP.ModelContextTool[] {
  return [
    {
      name: "list_scenarios",
      title: "List collaboration scenarios",
      description:
        "List the creative collaboration challenges available in Assembly Lab, including their IDs, constraints, difficulty, and intended outcome.",
      inputSchema: emptyObjectSchema,
      execute: async () => actions.listScenarios(),
      annotations: { readOnlyHint: true, untrustedContentHint: false },
    },
    {
      name: "list_agent_presets",
      title: "List specialist agents",
      description:
        "List the specialist agent presets that can form a collaboration crew, including personality scores, strategy, and specialization.",
      inputSchema: emptyObjectSchema,
      execute: async () => actions.listAgentPresets(),
      annotations: { readOnlyHint: true, untrustedContentHint: false },
    },
    {
      name: "configure_mission",
      title: "Configure an assembly mission",
      description:
        "Configure the visible Assembly Lab mission. Call list_scenarios and list_agent_presets first, then choose one scenario and two to four complementary agent IDs.",
      inputSchema: {
        type: "object",
        properties: {
          scenario_id: {
            type: "string",
            description: "Exact scenario ID returned by list_scenarios.",
          },
          agent_ids: {
            type: "array",
            minItems: 2,
            maxItems: 4,
            uniqueItems: true,
            items: { type: "string" },
            description: "Two to four IDs returned by list_agent_presets.",
          },
          total_turns: {
            type: "integer",
            minimum: 4,
            maximum: 12,
            description: "Bounded mission length; use 4 for a fast demo.",
          },
          mode: {
            type: "string",
            enum: ["step_by_step", "full_run"],
            description: "Step-by-step keeps the human in the loop.",
          },
        },
        required: ["scenario_id", "agent_ids", "total_turns"],
        additionalProperties: false,
      },
      execute: async rawInput =>
        actions.configureMission(rawInput as unknown as MissionConfigurationInput),
      annotations: { readOnlyHint: false, untrustedContentHint: false },
    },
    {
      name: "preview_mission",
      title: "Preview the configured mission",
      description:
        "Return the current scenario, crew, mode, turn budget, and execution state without changing the mission.",
      inputSchema: emptyObjectSchema,
      execute: async () => actions.previewMission(),
      annotations: { readOnlyHint: true, untrustedContentHint: false },
    },
    {
      name: "run_next_turn",
      title: "Run one agent turn",
      description:
        "Advance exactly one turn in the configured mission and update the visible timeline and 3D assembly. Use this for observable human-in-the-loop collaboration.",
      inputSchema: emptyObjectSchema,
      execute: async (_input, { signal }) => actions.runNextTurn(signal),
      annotations: { readOnlyHint: false, untrustedContentHint: true },
    },
    {
      name: "run_simulation",
      title: "Run the configured mission",
      description:
        "Run the configured mission to completion with a bounded turn count, then show the 3D result and collaboration metrics in the visible interface.",
      inputSchema: {
        type: "object",
        properties: {
          total_turns: {
            type: "integer",
            minimum: 4,
            maximum: 12,
            description: "Optional override for the configured turn budget.",
          },
        },
        additionalProperties: false,
      },
      execute: async (rawInput, { signal }) =>
        actions.runSimulation(
          rawInput as unknown as RunSimulationInput,
          signal,
        ),
      annotations: { readOnlyHint: false, untrustedContentHint: true },
    },
    {
      name: "inspect_collaboration",
      title: "Inspect collaboration progress",
      description:
        "Return concise progress, latest action, brick count, conflicts, resolutions, and average collaboration metrics for the current mission.",
      inputSchema: emptyObjectSchema,
      execute: async () => actions.inspectCollaboration(),
      annotations: { readOnlyHint: true, untrustedContentHint: true },
    },
    {
      name: "analyze_collaboration",
      title: "Analyze collaboration patterns",
      description:
        "Analyze the current completed or step-by-step mission and return a grade, collaboration pattern, key observations, and actionable crew recommendations.",
      inputSchema: emptyObjectSchema,
      execute: async (_input, { signal }) =>
        actions.analyzeCollaboration(signal),
      annotations: { readOnlyHint: false, untrustedContentHint: true },
    },
    {
      name: "reset_mission",
      title: "Reset the local mission",
      description:
        "Clear the current local mission, crew selection, timeline, and analysis so the human and agent can configure a fresh experiment.",
      inputSchema: emptyObjectSchema,
      execute: async () => actions.resetMission(),
      annotations: { readOnlyHint: false, untrustedContentHint: false },
    },
  ];
}
