/// <reference types="webmcp-types" />

export interface WebMCPExecutionFailure {
  success: false;
  tool: string;
  code: "INVALID_INPUT" | "ABORTED" | "EXECUTION_FAILED" | "UNSERIALIZABLE_RESULT";
  error: string;
  retryable: boolean;
  aborted?: true;
}

export interface WebMCPEmptySuccess {
  success: true;
  tool: string;
}

const INPUT_ERROR =
  "Input must be a JSON object. Use {} for tools with no parameters; do not use blank input, JavaScript syntax, Markdown fences, or double-encoded JSON.";

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function safeErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  const redacted = raw.replace(
    /\b(api[_-]?key|token|secret|password)\s*[=:]\s*[^\s,;&]+/gi,
    "$1=[redacted]",
  );
  return redacted.slice(0, 360) || "Tool execution failed.";
}

function failure(
  tool: string,
  code: WebMCPExecutionFailure["code"],
  error: string,
  retryable: boolean,
  aborted = false,
): WebMCPExecutionFailure {
  return {
    success: false,
    tool,
    code,
    error,
    retryable,
    ...(aborted ? { aborted: true as const } : {}),
  };
}

/**
 * Round-trips through JSON so Chrome receives the same plain value an agent
 * receives. This rejects undefined, BigInt, circular references, DOM nodes,
 * functions, symbols, and objects with unsafe toJSON implementations.
 */
export function toSerializableWebMCPResult(
  tool: string,
  result: unknown,
): unknown | WebMCPEmptySuccess | WebMCPExecutionFailure {
  if (result === undefined) {
    return { success: true, tool } satisfies WebMCPEmptySuccess;
  }

  try {
    const serialized = JSON.stringify(result);
    if (serialized === undefined) {
      return failure(
        tool,
        "UNSERIALIZABLE_RESULT",
        "The tool completed, but its result was not JSON-serializable.",
        false,
      );
    }
    return JSON.parse(serialized) as unknown;
  } catch (error) {
    console.error(`[WebMCP] ${tool} returned an unserializable result`, error);
    return failure(
      tool,
      "UNSERIALIZABLE_RESULT",
      "The tool completed, but its result contained a value that cannot be sent to the browser agent.",
      false,
    );
  }
}

export function createSafeWebMCPExecutor(
  tool: string,
  execute: WebMCP.ToolExecuteCallback,
): WebMCP.ToolExecuteCallback {
  return async (rawInput, options) => {
    if (!isPlainRecord(rawInput)) {
      return failure(tool, "INVALID_INPUT", INPUT_ERROR, true);
    }

    try {
      // Validate the input itself before application code sees it. Browser
      // agents should already obey inputSchema, while the inspector may not.
      JSON.stringify(rawInput);

      if (options?.signal?.aborted) {
        return failure(
          tool,
          "ABORTED",
          "Tool execution was cancelled before it started.",
          true,
          true,
        );
      }

      console.debug(`[WebMCP] ${tool} invoked`, rawInput);
      const result = await execute(rawInput, options);

      if (options?.signal?.aborted) {
        return failure(
          tool,
          "ABORTED",
          "Tool execution was cancelled.",
          true,
          true,
        );
      }

      return toSerializableWebMCPResult(tool, result);
    } catch (error) {
      const aborted =
        options?.signal?.aborted ||
        (error instanceof DOMException && error.name === "AbortError") ||
        (error instanceof Error && error.name === "AbortError");

      if (aborted) {
        console.info(`[WebMCP] ${tool} cancelled`);
        return failure(
          tool,
          "ABORTED",
          "Tool execution was cancelled.",
          true,
          true,
        );
      }

      console.error(`[WebMCP] ${tool} execution failed`, error);
      return failure(
        tool,
        "EXECUTION_FAILED",
        safeErrorMessage(error),
        true,
      );
    }
  };
}
