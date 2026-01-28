/**
 * Agent Framework Types for Family HQ
 * 
 * Shared type definitions for the hierarchical agent system.
 */

// ============================================================================
// Core Agent Types
// ============================================================================

export interface AgentContext {
  userId: string;
  sessionId: string;
  timestamp: Date;
  persona?: AgentPersona;
  parentAgent?: string;
  familyMember?: FamilyMember;
  metadata?: Record<string, unknown>;
}

export interface AgentPersona {
  name: string;
  style: 'warm' | 'direct' | 'neutral' | 'playful';
  traits: string[];
}

export interface AgentResult<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  suggestedFollowUp?: string;
  confidence: number;
  agentPath: string[];
  processingTimeMs?: number;
}

export interface AgentCapability {
  name: string;
  description: string;
  triggers: string[];
  examples: string[];
}

// ============================================================================
// Family HQ Specific Types
// ============================================================================

export interface FamilyMember {
  id: string;
  name: string;
  displayName: string;
  role: 'admin' | 'adult' | 'kid' | 'pet';
  grade?: number;
  schoolLevel?: 'elementary' | 'middle' | 'high';
  teachers?: TeacherInfo[];
  activities?: ActivityInfo[];
  avatarUrl?: string;
  aliases?: string[];
  birthday?: Date;
}

export interface TeacherInfo {
  name: string;
  subject?: string;
  email?: string;
  school?: string;
}

export interface ActivityInfo {
  name: string;
  type: string;
  schedule?: string;
  location?: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  personId?: string;
  dayOfWeek?: number[];
  order: number;
  isCompleted: boolean;
  completedAt?: Date;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime?: Date;
  allDay: boolean;
  location?: string;
  calendar: string;
  color?: string;
  participants?: string[];
}

export interface HouseTask {
  id: string;
  title: string;
  assignedTo?: string[];
  dueDate?: Date;
  recurring?: RecurringPattern;
  status: 'pending' | 'completed';
  completedAt?: Date;
}

export interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  daysOfWeek?: number[];
}

// ============================================================================
// Radar Feed Types (consumed from Radar)
// ============================================================================

export interface RadarFeedItem {
  id: string;
  emailId: string;
  sourceType: 'district' | 'pta' | 'teacher' | 'athletics' | 'extracurricular';
  sourceName?: string;
  itemType: 'event' | 'action' | 'announcement';
  title: string;
  description?: string;
  eventDate?: Date;
  deadline?: Date;
  expiresAt?: Date;
  scope: 'family' | 'shared' | 'individual';
  children: string[];
  urgency: 1 | 2 | 3 | 4 | 5;
  dismissed: boolean;
  createdAt: Date;
}

// ============================================================================
// Game Types
// ============================================================================

export interface GameState {
  gameType: string;
  score: number;
  level: number;
  currentQuestion?: unknown;
  history: unknown[];
}

export interface QuizQuestion {
  question: string;
  options?: string[];
  answer: string;
  hint?: string;
  category: string;
}

// ============================================================================
// Tool Types
// ============================================================================

export interface Tool {
  name: string;
  description: string;
  parameters: ToolParameter[];
  execute: (params: Record<string, unknown>, context: AgentContext) => Promise<ToolResult>;
}

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  default?: unknown;
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

// ============================================================================
// Input Processing Types
// ============================================================================

export interface UserInput {
  text: string;
  intent?: DetectedIntent;
  entities?: ExtractedEntity[];
  attachments?: Attachment[];
  fromPerson?: FamilyMember;
}

export interface DetectedIntent {
  primary: string;
  confidence: number;
  alternatives?: Array<{ intent: string; confidence: number }>;
}

export interface ExtractedEntity {
  type: string;
  value: string;
  confidence: number;
}

export interface Attachment {
  type: 'image' | 'file' | 'link';
  url?: string;
  data?: string;
  mimeType?: string;
  filename?: string;
}
