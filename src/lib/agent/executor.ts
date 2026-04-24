import { ExecutionPlan, ExecutionResult } from "@/types/agent";
import { TOOL_REGISTRY } from "./tools";

export async function execute(plan: ExecutionPlan): Promise<ExecutionResult> {
  const tool = TOOL_REGISTRY[plan.toolName];
  if (!tool) {
    return {
      planId: plan.id,
      success: false,
      data: null,
      error: `未知工具: ${plan.toolName}`,
    };
  }

  try {
    const result = await tool(plan.parameters);
    return {
      planId: plan.id,
      success: true,
      data: result,
    };
  } catch (error) {
    return {
      planId: plan.id,
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "执行失败",
    };
  }
}
