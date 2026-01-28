/**
 * Base Agent Abstract Class for Family HQ
 * 
 * Foundation for all agents in the Family HQ system.
 * Similar to Focus Hub but with family-friendly adaptations.
 */

import {
  AgentContext,
  AgentResult,
  AgentCapability,
  UserInput,
  Tool,
  ToolResult,
} from './types';

export abstract class BaseAgent {
  abstract name: string;
  abstract description: string;
  abstract capabilities: AgentCapability[];

  protected subAgents: Map<string, BaseAgent> = new Map();
  protected tools: Map<string, Tool> = new Map();

  /**
   * Determines if this agent can handle the given input.
   */
  async canHandle(input: UserInput, context: AgentContext): Promise<boolean> {
    const text = input.text.toLowerCase();
    
    for (const capability of this.capabilities) {
      for (const trigger of capability.triggers) {
        if (text.includes(trigger.toLowerCase())) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Main processing method. Override in subclasses.
   */
  abstract process(input: UserInput, context: AgentContext): Promise<AgentResult>;

  protected registerSubAgent(agent: BaseAgent): void {
    this.subAgents.set(agent.name, agent);
  }

  protected registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  protected async delegateToSubAgent(
    subAgentName: string,
    input: UserInput,
    context: AgentContext
  ): Promise<AgentResult | null> {
    const subAgent = this.subAgents.get(subAgentName);
    if (!subAgent) return null;

    const result = await subAgent.process(input, {
      ...context,
      parentAgent: this.name,
    });

    result.agentPath = [this.name, ...result.agentPath];
    return result;
  }

  protected async delegateToMatchingSubAgent(
    input: UserInput,
    context: AgentContext
  ): Promise<AgentResult | null> {
    for (const [name, subAgent] of this.subAgents) {
      if (await subAgent.canHandle(input, context)) {
        return this.delegateToSubAgent(name, input, context);
      }
    }
    return null;
  }

  protected async executeTool(
    toolName: string,
    params: Record<string, unknown>,
    context: AgentContext
  ): Promise<ToolResult> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      return { success: false, error: `Tool not found: ${toolName}` };
    }

    try {
      return await tool.execute(params, context);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  protected success<T>(
    data: T,
    message?: string,
    options?: { confidence?: number; suggestedFollowUp?: string }
  ): AgentResult<T> {
    return {
      success: true,
      data,
      message,
      confidence: options?.confidence ?? 0.9,
      suggestedFollowUp: options?.suggestedFollowUp,
      agentPath: [this.name],
    };
  }

  protected failure(message: string, options?: { confidence?: number }): AgentResult {
    return {
      success: false,
      message,
      confidence: options?.confidence ?? 0.5,
      agentPath: [this.name],
    };
  }

  protected needsClarification(question: string, options?: { confidence?: number }): AgentResult {
    return {
      success: false,
      message: question,
      confidence: options?.confidence ?? 0.3,
      suggestedFollowUp: question,
      agentPath: [this.name],
    };
  }

  /**
   * Adapt response for kids vs adults
   */
  protected adaptForAudience(
    message: string,
    context: AgentContext
  ): string {
    const isKid = context.familyMember?.role === 'kid';
    
    if (isKid) {
      // Simpler language, more encouraging
      return message
        .replace(/utilize/gi, 'use')
        .replace(/accomplish/gi, 'do')
        .replace(/\./g, '! ');
    }
    
    return message;
  }
}
