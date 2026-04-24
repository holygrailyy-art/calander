import {
  getPrimaryCalendarId,
  createFeishuEvent,
  listFeishuEvents,
  updateFeishuEvent,
  deleteFeishuEvent,
  isFeishuConnected,
} from "@/lib/feishu/client";

async function checkFeishuConnection() {
  if (!(await isFeishuConnected())) {
    throw new Error("飞书尚未连接，请先在左侧栏点击「连接飞书日历」完成授权");
  }
}

export async function createFeishuSchedule(params: {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
}) {
  await checkFeishuConnection();
  const calendarId = await getPrimaryCalendarId();
  return createFeishuEvent(calendarId, {
    summary: params.title,
    description: params.description,
    startTime: params.startTime,
    endTime: params.endTime,
    location: params.location,
  });
}

export async function queryFeishuSchedules(params: {
  from: string;
  to: string;
}) {
  await checkFeishuConnection();
  const calendarId = await getPrimaryCalendarId();
  return listFeishuEvents(calendarId, {
    startTime: params.from,
    endTime: params.to,
  });
}

export async function updateFeishuSchedule(params: {
  eventId: string;
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
}) {
  await checkFeishuConnection();
  const calendarId = await getPrimaryCalendarId();
  return updateFeishuEvent(calendarId, params.eventId, {
    summary: params.title,
    description: params.description,
    startTime: params.startTime,
    endTime: params.endTime,
    location: params.location,
  });
}

export async function deleteFeishuSchedule(params: { eventId: string }) {
  await checkFeishuConnection();
  const calendarId = await getPrimaryCalendarId();
  await deleteFeishuEvent(calendarId, params.eventId);
  return { success: true, eventId: params.eventId };
}
