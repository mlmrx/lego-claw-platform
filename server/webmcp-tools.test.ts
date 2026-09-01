/// <reference types="webmcp-types" />

import { describe, expect, it, vi } from "vitest";
import {
  createAssemblyTools,
  type AssemblyToolActions,
} from "../client/src/lib/webmcp/assemblyTools";

function createActions(): AssemblyToolActions {
  return {
    listScenarios: vi.fn(() => ({ scenarios: [{ id: "bridge-engineering" }] })),
    listAgentPresets: vi.fn(() => ({ agents: [{ id: "architect" }] })),
    configureMission: vi.fn(input => ({ ok: true, input })),
    previewMission: vi.fn(() => ({ configured: true })),
    runNextTurn: vi.fn(async () => ({ ok: true, turn: { number: 1 } })),
    runSimulation: vi.fn(async input => ({ ok: true, totalTurns: input.total_turns })),
    inspectCollaboration: vi.fn(() => ({ completed_turns: 1 })),
    analyzeCollaboration: vi.fn(async () => ({ grade: "A", pattern: "cooperative" })),
    resetMission: vi.fn(() => ({ ok: true })),
  };
}

function executionOptions(): WebMCP.ToolExecuteCallbackOptions {
  return { signal: new AbortController().signal };
}

describe("Assembly Lab WebMCP tools", () => {
  it("registers a unique, non-trivial tool suite", () => {
    const tools = createAssemblyTools(createActions());
    const names = tools.map(tool => tool.name);

    expect(tools).toHaveLength(9);
    expect(new Set(names).size).toBe(names.length);
    expect(names).toEqual([
      "list_scenarios",
      "list_agent_presets",
      "configure_mission",
      "preview_mission",
      "run_next_turn",
      "run_simulation",
      "inspect_collaboration",
      "analyze_collaboration",
      "reset_mission",
    ]);
    for (const tool of tools) {
      expect(tool.name.length).toBeLessThanOrEqual(30);
      expect(tool.description.length).toBeLessThanOrEqual(500);
      expect(tool.inputSchema).toBeDefined();
    }
  });

  it("labels read-only and untrusted tool behavior accurately", () => {
    const tools = createAssemblyTools(createActions());
    const byName = new Map(tools.map(tool => [tool.name, tool]));

    expect(byName.get("list_scenarios")?.annotations).toEqual({
      readOnlyHint: true,
      untrustedContentHint: false,
    });
    expect(byName.get("configure_mission")?.annotations?.readOnlyHint).toBe(false);
    expect(byName.get("run_next_turn")?.annotations).toEqual({
      readOnlyHint: false,
      untrustedContentHint: true,
    });
    expect(byName.get("inspect_collaboration")?.annotations).toEqual({
      readOnlyHint: true,
      untrustedContentHint: true,
    });
    expect(byName.get("analyze_collaboration")?.annotations).toEqual({
      readOnlyHint: false,
      untrustedContentHint: true,
    });
  });

  it("provides bounded mission configuration schemas", () => {
    const configure = createAssemblyTools(createActions()).find(
      tool => tool.name === "configure_mission",
    );
    const schema = configure?.inputSchema as {
      properties: Record<string, Record<string, unknown>>;
      required: string[];
      additionalProperties: boolean;
    };

    expect(schema.required).toEqual(["scenario_id", "agent_ids", "total_turns"]);
    expect(schema.additionalProperties).toBe(false);
    expect(schema.properties.agent_ids).toMatchObject({ minItems: 2, maxItems: 4 });
    expect(schema.properties.total_turns).toMatchObject({ minimum: 4, maximum: 12 });
    expect(schema.properties.mode.enum).toEqual(["step_by_step", "full_run"]);
  });

  it("forwards structured inputs and cancellation signals to action handlers", async () => {
    const actions = createActions();
    const tools = createAssemblyTools(actions);
    const configure = tools.find(tool => tool.name === "configure_mission")!;
    const nextTurn = tools.find(tool => tool.name === "run_next_turn")!;
    const options = executionOptions();
    const mission = {
      scenario_id: "bridge-engineering",
      agent_ids: ["architect", "diplomat"],
      total_turns: 4,
      mode: "step_by_step" as const,
    };

    await configure.execute(mission, options);
    await nextTurn.execute({}, options);

    expect(actions.configureMission).toHaveBeenCalledWith(mission);
    expect(actions.runNextTurn).toHaveBeenCalledWith(options.signal);
  });

  it("supports the intended discover-configure-execute-inspect-analyze journey", async () => {
    const actions = createActions();
    const tools = new Map(
      createAssemblyTools(actions).map(tool => [tool.name, tool]),
    );
    const options = executionOptions();

    await tools.get("list_scenarios")!.execute({}, options);
    await tools.get("list_agent_presets")!.execute({}, options);
    await tools.get("configure_mission")!.execute(
      {
        scenario_id: "bridge-engineering",
        agent_ids: ["architect", "diplomat"],
        total_turns: 4,
        mode: "step_by_step",
      },
      options,
    );
    await tools.get("run_next_turn")!.execute({}, options);
    await tools.get("inspect_collaboration")!.execute({}, options);
    const result = await tools.get("analyze_collaboration")!.execute({}, options);

    expect(actions.listScenarios).toHaveBeenCalledOnce();
    expect(actions.listAgentPresets).toHaveBeenCalledOnce();
    expect(actions.configureMission).toHaveBeenCalledOnce();
    expect(actions.runNextTurn).toHaveBeenCalledOnce();
    expect(actions.inspectCollaboration).toHaveBeenCalledOnce();
    expect(actions.analyzeCollaboration).toHaveBeenCalledOnce();
    expect(result).toEqual({ grade: "A", pattern: "cooperative" });
  });
});
