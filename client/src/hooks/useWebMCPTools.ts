/// <reference types="webmcp-types" />

import { useEffect, useState } from "react";

export type WebMCPRegistrationStatus =
  | "registering"
  | "ready"
  | "unsupported"
  | "error";

export interface WebMCPRegistrationState {
  status: WebMCPRegistrationStatus;
  registeredToolCount: number;
  error?: string;
}

/**
 * Registers a stable set of WebMCP tools for the lifetime of a page.
 * Aborting the controller unregisters the tools when the page unmounts.
 */
export function useWebMCPTools(
  tools: WebMCP.ModelContextTool[],
  enabled = true,
): WebMCPRegistrationState {
  const [state, setState] = useState<WebMCPRegistrationState>(() => ({
    status: "registering",
    registeredToolCount: 0,
  }));

  useEffect(() => {
    if (!enabled) {
      setState({ status: "registering", registeredToolCount: 0 });
      return;
    }

    const modelContext = document.modelContext;
    if (!modelContext) {
      setState({ status: "unsupported", registeredToolCount: 0 });
      return;
    }

    const controller = new AbortController();
    let active = true;

    setState({ status: "registering", registeredToolCount: 0 });

    Promise.all(
      tools.map(tool =>
        modelContext.registerTool(tool, { signal: controller.signal }),
      ),
    )
      .then(() => {
        if (!active) return;
        setState({ status: "ready", registeredToolCount: tools.length });
      })
      .catch(error => {
        if (!active || controller.signal.aborted) return;
        const message =
          error instanceof Error ? error.message : "Tool registration failed";
        console.error("[WebMCP] Failed to register Assembly Lab tools", error);
        setState({ status: "error", registeredToolCount: 0, error: message });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [enabled, tools]);

  return state;
}
