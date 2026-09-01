export interface ReplayEvent {
  id: string;
  sequence: number;
  position: [number, number, number];
  color: string;
  width: number;
  depth: number;
  height: number;
  agentName: string;
  agentEmoji: string;
  message: string | null;
  timestamp: number;
  recordedAt: string | null;
  source: "message" | "snapshot";
}

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;

const finiteNumber = (value: unknown, fallback = 0) => {
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

function normalizePosition(brick: UnknownRecord): [number, number, number] {
  if (Array.isArray(brick.position)) {
    return [
      finiteNumber(brick.position[0]),
      finiteNumber(brick.position[1]),
      finiteNumber(brick.position[2]),
    ];
  }
  const position = asRecord(brick.position);
  if (position) {
    return [
      finiteNumber(position.x),
      finiteNumber(position.y),
      finiteNumber(position.z),
    ];
  }
  return [finiteNumber(brick.x), finiteNumber(brick.y), finiteNumber(brick.z)];
}

function extractBricks(value: unknown): UnknownRecord[] {
  if (Array.isArray(value)) {
    return value.map(asRecord).filter((item): item is UnknownRecord => Boolean(item));
  }
  const record = asRecord(value);
  if (!record) return [];
  if (Array.isArray(record.bricks)) return extractBricks(record.bricks);
  if (record.brick) return extractBricks(record.brick);
  if (record.position || "x" in record) return [record];
  return [];
}

function normalizeBrick(
  brick: UnknownRecord,
  fallbackColor: string,
): Pick<ReplayEvent, "position" | "color" | "width" | "depth" | "height"> {
  return {
    position: normalizePosition(brick),
    color: typeof brick.color === "string" ? brick.color : fallbackColor,
    width: Math.max(1, finiteNumber(brick.width, 2)),
    depth: Math.max(1, finiteNumber(brick.depth, 2)),
    height: Math.max(1, finiteNumber(brick.height, 1)),
  };
}

export function buildReplayEvents(
  project: { brickData: unknown; createdAt: Date | string | number },
  rows: Array<{
    message: {
      id: number;
      publicId: string;
      content: string;
      brickAction: unknown;
      createdAt: Date | string | number;
    };
    agent: { name: string; emoji: string; color: string };
  }>,
): ReplayEvent[] {
  const chronological = [...rows].sort(
    (a, b) => new Date(a.message.createdAt).getTime() - new Date(b.message.createdAt).getTime(),
  );
  const baseTime = chronological.length
    ? new Date(chronological[0].message.createdAt).getTime()
    : new Date(project.createdAt).getTime();

  const messageEvents: ReplayEvent[] = [];
  for (const row of chronological) {
    const bricks = extractBricks(row.message.brickAction);
    bricks.forEach((brick, brickIndex) => {
      const recordedAt = new Date(row.message.createdAt);
      messageEvents.push({
        id: `${row.message.publicId}-${brickIndex}`,
        sequence: messageEvents.length,
        ...normalizeBrick(brick, row.agent.color || "#E53935"),
        agentName: row.agent.name,
        agentEmoji: row.agent.emoji,
        message: row.message.content,
        timestamp: Math.max(0, recordedAt.getTime() - baseTime) + brickIndex * 80,
        recordedAt: recordedAt.toISOString(),
        source: "message",
      });
    });
  }
  if (messageEvents.length > 0) return messageEvents;

  return extractBricks(project.brickData).map((brick, index) => ({
    id: `snapshot-${index}`,
    sequence: index,
    ...normalizeBrick(brick, "#E53935"),
    agentName: typeof brick.placedBy === "string" && brick.placedBy.trim()
      ? brick.placedBy
      : "Contributor unavailable",
    agentEmoji: "🧩",
    message: null,
    timestamp: index * 220,
    recordedAt: null,
    source: "snapshot" as const,
  }));
}
