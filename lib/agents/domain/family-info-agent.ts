/**
 * Family Info Agent
 * 
 * Handles family information queries:
 * - Health/medical info
 * - Contacts
 * - Insurance
 * - Birthdays
 */

import { BaseAgent } from '../base-agent';
import { AgentContext, AgentResult, AgentCapability, UserInput } from '../types';

export class FamilyInfoAgent extends BaseAgent {
  name = 'FamilyInfoAgent';
  description = 'Handles family information queries';

  capabilities: AgentCapability[] = [
    {
      name: 'health_info',
      description: 'Medical and health information',
      triggers: ['doctor', 'health', 'medical', 'allergy', 'medicine'],
      examples: ['Who is our pediatrician?', "What are Parker's allergies?"],
    },
    {
      name: 'contacts',
      description: 'Family contacts',
      triggers: ['contact', 'phone', 'number', 'email', 'reach'],
      examples: ['Emergency contacts', 'Grandma\'s phone number'],
    },
    {
      name: 'insurance',
      description: 'Insurance information',
      triggers: ['insurance', 'policy', 'coverage'],
      examples: ['What insurance do we have?', 'Insurance card info'],
    },
  ];

  async process(input: UserInput, context: AgentContext): Promise<AgentResult> {
    // TODO: Integrate with Notion family data
    return this.success(
      null,
      'Family information agent ready. This will pull from Notion when integrated.',
      { confidence: 0.6 }
    );
  }
}
