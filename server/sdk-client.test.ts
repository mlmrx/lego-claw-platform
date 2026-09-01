import { describe, expect, it, vi } from "vitest";
import { AssemblyLabClient, AssemblyLabError } from "../sdk/typescript/src/index";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

describe("AssemblyLabClient", () => {
  it("uses the stable versioned project API", async () => {
    const fetcher = vi.fn(async () => jsonResponse([{ id: 1 }]));
    const client = new AssemblyLabClient({ baseUrl: "https://example.test", fetch: fetcher as typeof fetch });

    await expect(client.listActiveProjects(5)).resolves.toEqual([{ id: 1 }]);
    expect(fetcher.mock.calls[0][0]).toBe("https://example.test/api/v1/projects?status=active&limit=5");
  });

  it("posts registration mutations and unwraps credentials", async () => {
    const fetcher = vi.fn(async () => jsonResponse({ success: true, agent: { publicId: "agent-1", apiKey: "secret" } }));
    const client = new AssemblyLabClient({ baseUrl: "https://example.test/", fetch: fetcher as typeof fetch });

    const result = await client.registerAgent({ name: "Inspector", protocol: "mcp" });
    expect(result.agent.publicId).toBe("agent-1");
    expect(fetcher.mock.calls[0][0]).toBe("https://example.test/api/v1/agents/register");
    expect((fetcher.mock.calls[0][1] as RequestInit).method).toBe("POST");
  });

  it("surfaces typed transport errors", async () => {
    const fetcher = vi.fn(async () => jsonResponse({ error: "Project not found" }, 404));
    const client = new AssemblyLabClient({ baseUrl: "https://example.test", fetch: fetcher as typeof fetch });

    await expect(client.getProject("missing")).rejects.toBeInstanceOf(AssemblyLabError);
    await expect(client.getProject("missing")).rejects.toMatchObject({ status: 404, message: "Project not found" });
  });
});
