const FEISHU_BASE_URL = "https://open.feishu.cn/open-apis";

import { prisma } from "@/lib/prisma";

// In-memory cache for token
let cachedToken: { access_token: string; refresh_token: string } | null = null;

async function loadToken(): Promise<{ access_token: string; refresh_token: string } | null> {
  if (cachedToken) return cachedToken;
  try {
    const record = await prisma.feishuToken.findUnique({ where: { id: "singleton" } });
    if (record) {
      cachedToken = { access_token: record.accessToken, refresh_token: record.refreshToken };
      return cachedToken;
    }
  } catch {}
  return null;
}

export async function setUserAccessToken(accessToken: string, refreshToken: string) {
  cachedToken = { access_token: accessToken, refresh_token: refreshToken };
  await prisma.feishuToken.upsert({
    where: { id: "singleton" },
    update: { accessToken, refreshToken },
    create: { id: "singleton", accessToken, refreshToken },
  });
}

export async function isFeishuConnected(): Promise<boolean> {
  const token = await loadToken();
  return token !== null;
}

async function getAccessToken(): Promise<string> {
  const token = await loadToken();
  if (!token) {
    throw new Error("飞书尚未连接，请先在左侧栏点击「连接飞书日历」完成授权");
  }
  return token.access_token;
}

async function feishuRequest<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`${FEISHU_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (data.code !== 0) {
    throw new Error(`飞书API错误: ${data.msg} (code: ${data.code})`);
  }

  return data.data as T;
}

// ---- Calendar API Types ----

export interface FeishuCalendarEvent {
  event_id: string;
  organizer_calendar_id: string;
  summary: string;
  description?: string;
  start_time: { timestamp: string };
  end_time: { timestamp: string };
  location?: { name: string };
}

export interface CreateEventParams {
  summary: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
}

export interface ListEventsParams {
  startTime: string;
  endTime: string;
}

// ---- Calendar API Functions ----

export async function getPrimaryCalendarId(): Promise<string> {
  const data = await feishuRequest<{ calendar_list: { calendar_id: string; type: string; is_primary: boolean; summary?: string; role?: string }[] }>(
    "GET",
    "/calendar/v4/calendars"
  );
  const primary = data.calendar_list.find((c) => c.is_primary || c.type === "primary")
    || data.calendar_list.find((c) => c.role === "owner")
    || data.calendar_list[0];
  if (!primary) {
    throw new Error("未找到飞书主日历");
  }
  return primary.calendar_id;
}

export async function createFeishuEvent(
  calendarId: string,
  params: CreateEventParams
): Promise<FeishuCalendarEvent> {
  const body = {
    summary: params.summary,
    description: params.description,
    start_time: { timestamp: toFeishuTimestamp(params.startTime) },
    end_time: { timestamp: toFeishuTimestamp(params.endTime) },
    location: params.location ? { name: params.location } : undefined,
  };
  const result = await feishuRequest<{ event: FeishuCalendarEvent }>(
    "POST",
    `/calendar/v4/calendars/${calendarId}/events`,
    body
  );
  return result.event;
}

export async function listFeishuEvents(
  calendarId: string,
  params: ListEventsParams
): Promise<FeishuCalendarEvent[]> {
  const data = await feishuRequest<{ items: FeishuCalendarEvent[] }>(
    "GET",
    `/calendar/v4/calendars/${calendarId}/events?start_time=${toFeishuTimestamp(params.startTime)}&end_time=${toFeishuTimestamp(params.endTime)}`
  );
  return data.items || [];
}

export async function updateFeishuEvent(
  calendarId: string,
  eventId: string,
  params: Partial<CreateEventParams>
): Promise<FeishuCalendarEvent> {
  const body: Record<string, unknown> = {};
  if (params.summary) body.summary = params.summary;
  if (params.description) body.description = params.description;
  if (params.startTime) body.start_time = { timestamp: toFeishuTimestamp(params.startTime) };
  if (params.endTime) body.end_time = { timestamp: toFeishuTimestamp(params.endTime) };
  if (params.location) body.location = { name: params.location };

  return feishuRequest<FeishuCalendarEvent>(
    "PATCH",
    `/calendar/v4/calendars/${calendarId}/events/${eventId}`,
    body
  );
}

export async function deleteFeishuEvent(
  calendarId: string,
  eventId: string
): Promise<void> {
  await feishuRequest<void>(
    "DELETE",
    `/calendar/v4/calendars/${calendarId}/events/${eventId}`
  );
}

// ---- Helpers ----

function toFeishuTimestamp(isoString: string): string {
  return Math.floor(new Date(isoString).getTime() / 1000).toString();
}

export function fromFeishuTimestamp(timestamp: string): string {
  return new Date(parseInt(timestamp) * 1000).toISOString();
}
