import { afterEach, describe, expect, it } from "vitest";
import {
  PLATFORM_CONFIGS,
  cleanupSession,
  createMultiStreamSession,
  getMultiStreamSession,
  getOverlayUrls,
  startMultiStream,
  stopMultiStream,
  type StreamDestination,
  type StreamingPlatform,
} from "./multiStreamService";

const createdSessions: string[] = [];

afterEach(() => {
  createdSessions.splice(0).forEach(cleanupSession);
});

describe("multi-platform broadcast configuration", () => {
  it("configures every supported platform while reporting that a video relay is still required", async () => {
    const platforms = Object.keys(PLATFORM_CONFIGS) as StreamingPlatform[];
    const destinations: StreamDestination[] = platforms.map(platform => ({
      id: `${platform}-destination`,
      platform,
      streamKey: `${platform}-test-key`,
      customRtmpUrl: platform === "custom" ? "rtmps://relay.example.test/live" : undefined,
      enabled: true,
    }));

    const session = createMultiStreamSession("build-test", "owner-1", destinations);
    createdSessions.push(session.id);
    const result = await startMultiStream(session.id);

    expect(result.success).toBe(true);
    expect(Object.keys(result.streamUrls)).toHaveLength(platforms.length);
    for (const platform of platforms) {
      const destinationId = `${platform}-destination`;
      expect(result.streamUrls[destinationId]).toContain(`${platform}-test-key`);
    }
    expect(result.warnings.join(" ")).toContain("RTMP video relay is not yet configured");
    expect(getMultiStreamSession(session.id)?.capabilities).toEqual({
      videoStreaming: false,
      chatRelay: true,
      viewerTracking: false,
    });
  });

  it("generates horizontal and vertical overlay URLs from the same session", () => {
    const session = createMultiStreamSession("build-42", "owner-1", [
      { id: "youtube-1", platform: "youtube", streamKey: "one", enabled: true },
      { id: "tiktok-1", platform: "tiktok", streamKey: "two", enabled: true },
    ]);
    createdSessions.push(session.id);

    const urls = getOverlayUrls(session.id, "https://app.example.test");
    expect(urls["youtube-1"]).toContain("layout=horizontal");
    expect(urls["tiktok-1"]).toContain("layout=vertical");
  });

  it("completes the configured session lifecycle", async () => {
    const session = createMultiStreamSession("build-42", "owner-1", [
      { id: "youtube-1", platform: "youtube", streamKey: "one", enabled: true },
    ]);
    createdSessions.push(session.id);

    await startMultiStream(session.id);
    await expect(stopMultiStream(session.id)).resolves.toBe(true);
    expect(getMultiStreamSession(session.id)?.status).toBe("idle");
  });
});
