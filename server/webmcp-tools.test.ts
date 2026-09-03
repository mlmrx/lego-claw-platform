/// <reference types="webmcp-types" />

import { describe, expect, it, vi } from "vitest";
import {
  createAssemblyTools,
  type AssemblyToolActions,
} from "../client/src/lib/webmcp/assemblyTools";
import { createSafeWebMCPExecutor } from "../client/src/lib/webmcp/safeExecution";

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

  it("turns an undefined action result into an explicit serializable success", async () => {
    const actions = createActions();
    actions.listScenarios = vi.fn(() => undefined);
    const tool = createAssemblyTools(actions).find(
      candidate => candidate.name === "list_scenarios",
    )!;

    const result = await tool.execute({}, executionOptions());

    expect(result).toEqual({ success: true, tool: "list_scenarios" });
    expect(() => JSON.stringify(result)).not.toThrow();
  });

  it("returns a structured failure when an action throws or rejects", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const actions = createActions();
    actions.configureMission = vi.fn(() => {
      throw new Error("Unknown scenario_id; api_key=should-not-leak");
    });
    actions.runNextTurn = vi.fn(async () => {
      throw new Error("Network unavailable");
    });
    const tools = new Map(
      createAssemblyTools(actions).map(tool => [tool.name, tool]),
    );

    const thrown = await tools.get("configure_mission")!.execute(
      {
        scenario_id: "missing",
        agent_ids: ["architect", "diplomat"],
        total_turns: 4,
      },
      executionOptions(),
    );
    const rejected = await tools
      .get("run_next_turn")!
      .execute({}, executionOptions());

    expect(thrown).toMatchObject({
      success: false,
      tool: "configure_mission",
      code: "EXECUTION_FAILED",
      retryable: true,
    });
    expect(JSON.stringify(thrown)).not.toContain("should-not-leak");
    expect(rejected).toMatchObject({
      success: false,
      tool: "run_next_turn",
      code: "EXECUTION_FAILED",
      error: "Network unavailable",
    });
    errorSpy.mockRestore();
  });

  it("returns a structured aborted result without invoking application work", async () => {
    const actions = createActions();
    const controller = new AbortController();
    controller.abort();
    const tool = createAssemblyTools(actions).find(
      candidate => candidate.name === "run_next_turn",
    )!;

    const result = await tool.execute({}, { signal: controller.signal });

    expect(result).toEqual({
      success: false,
      tool: "run_next_turn",
      code: "ABORTED",
      error: "Tool execution was cancelled before it started.",
      retryable: true,
      aborted: true,
    });
    expect(actions.runNextTurn).not.toHaveBeenCalled();
  });

  it("rejects blank-style and double-encoded inspector payloads safely", async () => {
    const execute = vi.fn(() => ({ ok: true }));
    const safeExecute = createSafeWebMCPExecutor("input_probe", execute);

    const missing = await safeExecute(
      undefined as unknown as Record<string, unknown>,
      executionOptions(),
    );
    const encoded = await safeExecute(
      '{"query":"test"}' as unknown as Record<string, unknown>,
      executionOptions(),
    );

    for (const result of [missing, encoded]) {
      expect(result).toMatchObject({
        success: false,
        tool: "input_probe",
        code: "INVALID_INPUT",
        retryable: true,
      });
      expect(JSON.stringify(result)).toContain("Use {} for tools with no parameters");
    }
    expect(execute).not.toHaveBeenCalled();
  });

  it("converts BigInt and circular action results into serializable failures", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    const bigintExecute = createSafeWebMCPExecutor(
      "bigint_probe",
      async () => ({ count: BigInt(1) }),
    );
    const circularExecute = createSafeWebMCPExecutor(
      "circular_probe",
      async () => circular,
    );

    const bigintResult = await bigintExecute({}, executionOptions());
    const circularResult = await circularExecute({}, executionOptions());

    expect(bigintResult).toMatchObject({
      success: false,
      tool: "bigint_probe",
      code: "UNSERIALIZABLE_RESULT",
    });
    expect(circularResult).toMatchObject({
      success: false,
      tool: "circular_probe",
      code: "UNSERIALIZABLE_RESULT",
    });
    expect(() => JSON.stringify(bigintResult)).not.toThrow();
    expect(() => JSON.stringify(circularResult)).not.toThrow();
    errorSpy.mockRestore();
  });

  it("keeps the result of every registered Assembly Lab tool JSON-serializable", async () => {
    const tools = createAssemblyTools(createActions());
    const inputs: Record<string, Record<string, unknown>> = {
      configure_mission: {
        scenario_id: "bridge-engineering",
        agent_ids: ["architect", "diplomat"],
        total_turns: 4,
        mode: "step_by_step",
      },
      run_simulation: { total_turns: 4 },
    };

    for (const tool of tools) {
      const result = await tool.execute(
        inputs[tool.name] ?? {},
        executionOptions(),
      );
      const serialized = JSON.stringify(result);

      expect(serialized, `${tool.name} must return JSON`).toBeTypeOf("string");
      expect(
        JSON.parse(serialized) as unknown,
        `${tool.name} must survive a JSON round trip`,
      ).toEqual(result);
    }
  });
});
