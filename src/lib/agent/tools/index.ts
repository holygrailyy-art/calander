import * as scheduleTools from "./schedule-tools";
import * as expenseTools from "./expense-tools";
import * as feishuTools from "./feishu-tools";

type ToolFn = (params: Record<string, unknown>) => Promise<unknown>;

export const TOOL_REGISTRY: Record<string, ToolFn> = {
  // 本地日程工具
  createSchedule: scheduleTools.createSchedule as ToolFn,
  querySchedules: scheduleTools.querySchedules as ToolFn,
  updateSchedule: scheduleTools.updateSchedule as ToolFn,
  deleteSchedule: scheduleTools.deleteSchedule as ToolFn,
  deleteSchedulesByDateRange: scheduleTools.deleteSchedulesByDateRange as ToolFn,
  // 费用工具
  createExpense: expenseTools.createExpense as ToolFn,
  queryExpenses: expenseTools.queryExpenses as ToolFn,
  updateExpense: expenseTools.updateExpense as ToolFn,
  deleteExpense: expenseTools.deleteExpense as ToolFn,
  // 飞书日历工具
  createFeishuSchedule: feishuTools.createFeishuSchedule as ToolFn,
  queryFeishuSchedules: feishuTools.queryFeishuSchedules as ToolFn,
  updateFeishuSchedule: feishuTools.updateFeishuSchedule as ToolFn,
  deleteFeishuSchedule: feishuTools.deleteFeishuSchedule as ToolFn,
};

export const TOOL_DESCRIPTIONS = `
## 可用工具

### 本地日程工具（存储在本应用数据库中）
- createSchedule: 创建日程
  参数: { title: string, description?: string, startTime: string (ISO格式), endTime?: string (ISO格式), location?: string }
- querySchedules: 查询日程
  参数: { from?: string (ISO格式), to?: string (ISO格式) }
- updateSchedule: 更新日程
  参数: { id: string, title?: string, description?: string, startTime?: string, endTime?: string, location?: string }
- deleteSchedule: 删除单个日程
  参数: { id: string }
- deleteSchedulesByDateRange: 按日期范围批量删除日程
  参数: { from: string, to: string }

### 飞书日程工具（同步到飞书日历）
- createFeishuSchedule: 创建飞书日程（同步到飞书日历）
  参数: { title: string, description?: string, startTime: string (ISO格式), endTime: string (ISO格式, 必填), location?: string }
- queryFeishuSchedules: 查询飞书日程
  参数: { from: string (ISO格式), to: string (ISO格式) }
- updateFeishuSchedule: 更新飞书日程
  参数: { eventId: string, title?: string, description?: string, startTime?: string, endTime?: string, location?: string }
- deleteFeishuSchedule: 删除飞书日程
  参数: { eventId: string }

### 飞书日程使用规则
- 当用户明确提到"飞书"、"同步到飞书"、"飞书日历"时，使用飞书工具
- 当用户未指定平台时，默认使用本地日程工具
- 飞日程的 endTime 是必填的（飞书要求），如果用户未提供，默认设为 startTime 后1小时

### 费用工具
- createExpense: 创建费用记录
  参数: { amount: number, category: string, description?: string, date: string (ISO格式) }
- queryExpenses: 查询费用记录
  参数: { from?: string, to?: string, category?: string }
- updateExpense: 更新费用记录
  参数: { id: string, amount?: number, category?: string, description?: string, date?: string }
- deleteExpense: 删除费用记录
  参数: { id: string }

费用分类: food(餐饮), transport(交通), shopping(购物), entertainment(娱乐), bills(账单), other(其他)
`;
