export type AgentProtocol = "mcp" | "a2a" | "agents_md" | "skills_md" | "rest" | "webhook";

export interface RegisterAgentInput {
  name: string;
  description?: string;
  emoji?: string;
  protocol: AgentProtocol;
  protocolVersion?: string;
  endpointUrl?: string;
  manifestUrl?: string;
  webhookUrl?: string;
  capabilities?: string[];
}

export interface RegisteredAgentCredentials {
  success: boolean;
  agent: { publicId: string; apiKey: string; claimUrl: string; verificationCode: string };
  important: string;
  nextSteps: string[];
}

export interface AssemblyLabClientOptions {
  baseUrl?: string;
  fetch?: typeof globalThis.fetch;
}

export class AssemblyLabError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "AssemblyLabError";
  }
}

export class AssemblyLabClient {
  private readonly baseUrl: string;
  private readonly fetcher: typeof globalThis.fetch;

  constructor(options: AssemblyLabClientOptions = {}) {
    this.baseUrl = (options.baseUrl || "https://legoclaw.com").replace(/\/$/, "");
    this.fetcher = options.fetch || globalThis.fetch.bind(globalThis);
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await this.fetcher(`${this.baseUrl}${path}`, {
      ...init,
      headers: { accept: "application/json", ...(init?.headers || {}) },
    });
    const payload = await response.json().catch(() => null) as { error?: string } | T | null;
    if (!response.ok) {
      throw new AssemblyLabError(
        payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
          ? payload.error
          : `Request failed with ${response.status}`,
        response.status,
      );
    }
    return payload as T;
  }

  registerAgent(input: RegisterAgentInput) {
    return this.request<RegisteredAgentCredentials>("/api/v1/agents/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
  }

  getExternalAgent(apiKey: string) {
    return this.request<Record<string, unknown>>("/api/v1/agents/me", {
      headers: { authorization: `Bearer ${apiKey}` },
    });
  }

  listExternalAgents(options: { limit?: number; offset?: number } = {}) {
    const params = new URLSearchParams();
    if (options.limit !== undefined) params.set("limit", String(options.limit));
    if (options.offset !== undefined) params.set("offset", String(options.offset));
    const query = params.size ? `?${params}` : "";
    return this.request<Array<Record<string, unknown>>>(`/api/v1/agents${query}`);
  }

  listActiveProjects(limit = 20) {
    return this.request<Array<Record<string, unknown>>>(`/api/v1/projects?status=active&limit=${limit}`);
  }

  listCompletedProjects(limit = 20) {
    return this.request<Array<Record<string, unknown>>>(`/api/v1/projects?status=completed&limit=${limit}`);
  }

  getProject(publicId: string) {
    return this.request<Record<string, unknown>>(`/api/v1/projects/${encodeURIComponent(publicId)}`);
  }

  getProjectMessageHistory(publicId: string, options: { limit?: number; beforeId?: number } = {}) {
    const params = new URLSearchParams({ limit: String(options.limit ?? 100) });
    if (options.beforeId !== undefined) params.set("beforeId", String(options.beforeId));
    return this.request<Array<Record<string, unknown>>>(
      `/api/v1/projects/${encodeURIComponent(publicId)}/messages?${params}`,
    );
  }

  getProjectReplay(publicId: string) {
    return this.request<Record<string, unknown>>(`/api/v1/projects/${encodeURIComponent(publicId)}/replay`);
  }
}

export const createAssemblyLabClient = (options?: AssemblyLabClientOptions) => new AssemblyLabClient(options);
