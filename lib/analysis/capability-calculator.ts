/**
 * Capability Calculator
 *
 * Calculates "how well can we help you?" scores for each person/app
 * by inventorying actual data in Supabase and mapping presence → capability.
 *
 * Scores are 0-100 representing current capability percentage.
 * Each area has data contributions that add up to the max.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// --- Output types ---

export interface CapabilityArea {
  name: string;
  icon: string;
  description: string;
  currentCapability: number; // 0-100
  maxCapability: number; // always 100
  gap: number;
  dataContributions: DataContribution[];
  dataGaps: DataGap[];
}

export interface DataContribution {
  dataType: string;
  currentContribution: number;
  maxContribution: number;
  detail: string;
}

export interface DataGap {
  dataType: string;
  impact: number; // how much would this help (%)
  action: string; // what user should do
  timeEstimate: string; // "2 minutes", "1 minute per day"
}

export interface PersonCapabilityProfile {
  personId: string;
  personName: string;
  areas: CapabilityArea[];
  overallCapability: number;
  strengths: string[];
  opportunities: string[];
  nextHighValueAction: {
    action: string;
    impact: number;
    reason: string;
    timeEstimate: string;
  } | null;
}

export interface FamilyCapabilityProfile {
  members: PersonCapabilityProfile[];
  overallCapability: number;
  strongestAreas: string[];
  biggestOpportunities: string[];
  topRecommendations: {
    personName: string;
    action: string;
    impact: number;
  }[];
  dataQuality: {
    area: string;
    level: 'excellent' | 'good' | 'partial' | 'limited' | 'sparse';
    coverage: number;
  }[];
}

// --- Data inventory types ---

export interface DataInventory {
  calendar: { eventsLastMonth: number; calendarsTracked: string[] };
  mentalLoad: { itemsLogged: number; categoriesUsed: string[]; recentActivity: boolean };
  wellness: { energyNotes: number; stressSignals: number };
  tasks: { activeTasks: number; completedLast30: number; goalsSet: number };
  email: { itemsTracked: number; childrenCovered: string[] };
  habits: { habitsTracked: number; logsLast7: number; longestStreak: number };
  focus: { sessionsLast30: number; hoursLast30: number };
  priorities: { currentWeekSet: boolean; count: number };
  notes: { notesCreated: number };
  jobs: { listingsTracked: number; activeCount: number };
  checklists: { itemsConfigured: number; completionRate7d: number };
  classifications: { classified: number; total: number };
}

// --- Constants ---

const STRENGTH_THRESHOLD = 70;
const OPPORTUNITY_THRESHOLD = 50;

// --- Main entry points ---

/**
 * Calculate capability profile for Focus Hub (Max).
 */
export async function calculateFocusHubCapability(
  supabase: SupabaseClient,
  userId: string = 'max'
): Promise<PersonCapabilityProfile> {
  const inventory = await getDataInventory(supabase, userId);

  const areas: CapabilityArea[] = [
    buildProductivityArea(inventory),
    buildTimeManagementArea(inventory),
    buildGoalTrackingArea(inventory),
    buildEmailIntelligenceArea(inventory),
    buildJobSearchArea(inventory),
    buildHabitTrackingArea(inventory),
  ];

  return buildProfile('max', 'Max', areas);
}

/**
 * Calculate capability profile for Unloader (Alex).
 */
export async function calculateUnloaderCapability(
  supabase: SupabaseClient,
  userId: string = 'alex'
): Promise<PersonCapabilityProfile> {
  const inventory = await getDataInventory(supabase, userId);

  const areas: CapabilityArea[] = [
    buildMentalLoadArea(inventory),
    buildSchoolSupportArea(inventory),
    buildStressManagementArea(inventory),
    buildFamilyCoordinationArea(inventory),
  ];

  return buildProfile('alex', 'Alex', areas);
}

/**
 * Calculate capability profile for Family HQ.
 */
export async function calculateFamilyCapability(
  supabase: SupabaseClient
): Promise<FamilyCapabilityProfile> {
  // Get all family members
  const { data: members } = await supabase
    .from('family_members')
    .select('id, name, role')
    .order('name');

  const familyMembers = members || [];

  // Build profiles for key members
  const profiles: PersonCapabilityProfile[] = [];

  for (const member of familyMembers) {
    const inventory = await getDataInventory(supabase, member.name.toLowerCase());

    let areas: CapabilityArea[];
    if (member.role === 'kid') {
      areas = [
        buildSchoolSupportArea(inventory),
        buildRoutineTrackingArea(inventory, member.name),
        buildActivityTrackingArea(inventory, member.name),
      ];
    } else if (member.role === 'adult' || member.role === 'admin') {
      areas = [
        buildFamilyCoordinationArea(inventory),
        buildSchoolSupportArea(inventory),
        buildTimeManagementArea(inventory),
      ];
    } else {
      // pet — minimal
      areas = [
        buildActivityTrackingArea(inventory, member.name),
      ];
    }

    profiles.push(buildProfile(member.id, member.name, areas));
  }

  // Overall family capability
  const overallCapability = profiles.length > 0
    ? Math.round(profiles.reduce((sum, p) => sum + p.overallCapability, 0) / profiles.length)
    : 0;

  // Aggregate strengths/opportunities
  const allStrengths = profiles.flatMap(p => p.strengths);
  const allOpportunities = profiles.flatMap(p => p.opportunities);

  // Top recommendations (highest impact actions across family)
  const topRecommendations = profiles
    .filter(p => p.nextHighValueAction)
    .map(p => ({
      personName: p.personName,
      action: p.nextHighValueAction!.action,
      impact: p.nextHighValueAction!.impact,
    }))
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 3);

  // Data quality summary
  const dataQuality = buildDataQualitySummary(profiles);

  return {
    members: profiles,
    overallCapability,
    strongestAreas: [...new Set(allStrengths)].slice(0, 3),
    biggestOpportunities: [...new Set(allOpportunities)].slice(0, 3),
    topRecommendations,
    dataQuality,
  };
}

// --- Data Inventory ---

async function getDataInventory(
  supabase: SupabaseClient,
  userId: string
): Promise<DataInventory> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const weekStart = getWeekStart().toISOString().split('T')[0];

  // Run all queries in parallel
  const [
    calendarResult,
    loadsResult,
    tasksActiveResult,
    tasksCompletedResult,
    emailResult,
    habitsResult,
    habitLogsResult,
    focusResult,
    prioritiesResult,
    notesResult,
    jobsResult,
    checklistItemsResult,
    checklistCompletionsResult,
    classificationsResult,
    totalItemsResult,
  ] = await Promise.all([
    // Calendar events last 30 days
    supabase
      .from('cached_calendar_events')
      .select('id, calendar_name', { count: 'exact', head: false })
      .gte('start_time', thirtyDaysAgo)
      .limit(200),

    // Mental load items (active)
    supabase
      .from('loads')
      .select('id, category, updated_at', { count: 'exact', head: false })
      .eq('user_id', userId === 'max' ? 'alex' : userId)
      .neq('status', 'done')
      .limit(200),

    // Active unified tasks
    supabase
      .from('unified_tasks')
      .select('id', { count: 'exact', head: true })
      .neq('status', 'completed')
      .limit(1),

    // Completed tasks last 30 days
    supabase
      .from('unified_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('updated_at', thirtyDaysAgo)
      .limit(1),

    // Email intelligence items
    supabase
      .from('radar_family_feed')
      .select('id, children', { count: 'exact', head: false })
      .eq('dismissed', false)
      .gte('created_at', thirtyDaysAgo)
      .limit(200),

    // Habits configured
    supabase
      .from('daily_habits')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId === 'alex' ? 'max' : userId)
      .eq('active', true)
      .limit(1),

    // Habit logs last 7 days
    supabase
      .from('habit_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId === 'alex' ? 'max' : userId)
      .gte('log_date', sevenDaysAgo.split('T')[0])
      .limit(1),

    // Focus sessions last 30 days
    supabase
      .from('focus_sessions')
      .select('id, actual_duration_minutes', { count: 'exact', head: false })
      .eq('user_id', userId === 'alex' ? 'max' : userId)
      .eq('status', 'completed')
      .gte('actual_start', thirtyDaysAgo)
      .limit(200),

    // Weekly priorities
    supabase
      .from('weekly_priorities')
      .select('id', { count: 'exact', head: true })
      .eq('week_start', weekStart)
      .limit(1),

    // Notes
    supabase
      .from('scratchpad_notes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId === 'alex' ? 'max' : userId)
      .limit(1),

    // Job listings
    supabase
      .from('job_listings')
      .select('id, status', { count: 'exact', head: false })
      .eq('user_id', userId === 'alex' ? 'max' : userId)
      .limit(200),

    // Checklist items configured (for kids)
    supabase
      .from('checklist_items')
      .select('id, member_id', { count: 'exact', head: false })
      .eq('is_active', true)
      .limit(200),

    // Checklist completions last 7 days
    supabase
      .from('checklist_completions')
      .select('item_id, completion_date', { count: 'exact', head: false })
      .gte('completion_date', sevenDaysAgo.split('T')[0])
      .limit(500),

    // Item classifications
    supabase
      .from('item_classifications')
      .select('item_id', { count: 'exact', head: true })
      .eq('user_id', userId === 'max' ? 'alex' : userId)
      .limit(1),

    // Total feed items for classification ratio (just count loads + unified for alex)
    supabase
      .from('loads')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId === 'max' ? 'alex' : userId)
      .limit(1),
  ]);

  // Extract calendar names
  const calendarNames = new Set<string>();
  (calendarResult.data || []).forEach((e: { calendar_name: string | null }) => {
    if (e.calendar_name) calendarNames.add(e.calendar_name);
  });

  // Extract load categories
  const loadCategories = new Set<string>();
  const recentLoadActivity = (loadsResult.data || []).some((l: { updated_at: string }) =>
    new Date(l.updated_at) > new Date(sevenDaysAgo)
  );
  (loadsResult.data || []).forEach((l: { category: string }) => {
    loadCategories.add(l.category);
  });

  // Extract children covered by email
  const childrenCovered = new Set<string>();
  (emailResult.data || []).forEach((e: { children: string[] }) => {
    (e.children || []).forEach((c: string) => childrenCovered.add(c));
  });

  // Focus hours
  const focusHours = (focusResult.data || []).reduce(
    (sum: number, s: { actual_duration_minutes: number | null }) =>
      sum + (s.actual_duration_minutes || 0) / 60,
    0
  );

  // Job counts
  const jobs = jobsResult.data || [];
  const activeJobs = jobs.filter((j: { status: string }) =>
    ['new', 'reviewing', 'applied', 'interviewing'].includes(j.status)
  );

  // Checklist completion rate
  const checklistItems = checklistItemsResult.data || [];
  const checklistCompletions = checklistCompletionsResult.data || [];
  const totalChecklistSlots = checklistItems.length * 7; // 7 days
  const completionRate = totalChecklistSlots > 0
    ? Math.round((checklistCompletions.length / totalChecklistSlots) * 100)
    : 0;

  return {
    calendar: {
      eventsLastMonth: calendarResult.count || 0,
      calendarsTracked: Array.from(calendarNames),
    },
    mentalLoad: {
      itemsLogged: loadsResult.count || 0,
      categoriesUsed: Array.from(loadCategories),
      recentActivity: recentLoadActivity,
    },
    wellness: {
      energyNotes: 0, // No explicit wellness table yet
      stressSignals: 0,
    },
    tasks: {
      activeTasks: tasksActiveResult.count || 0,
      completedLast30: tasksCompletedResult.count || 0,
      goalsSet: prioritiesResult.count || 0,
    },
    email: {
      itemsTracked: emailResult.count || 0,
      childrenCovered: Array.from(childrenCovered),
    },
    habits: {
      habitsTracked: habitsResult.count || 0,
      logsLast7: habitLogsResult.count || 0,
      longestStreak: 0, // Would need more complex query; simplified
    },
    focus: {
      sessionsLast30: focusResult.count || 0,
      hoursLast30: Math.round(focusHours * 10) / 10,
    },
    priorities: {
      currentWeekSet: (prioritiesResult.count || 0) > 0,
      count: prioritiesResult.count || 0,
    },
    notes: {
      notesCreated: notesResult.count || 0,
    },
    jobs: {
      listingsTracked: jobsResult.count || 0,
      activeCount: activeJobs.length,
    },
    checklists: {
      itemsConfigured: checklistItems.length,
      completionRate7d: completionRate,
    },
    classifications: {
      classified: classificationsResult.count || 0,
      total: (totalItemsResult.count || 0) + (emailResult.count || 0),
    },
  };
}

// --- Area builders ---

function buildProductivityArea(inv: DataInventory): CapabilityArea {
  const taskScore = Math.min(100, (inv.tasks.activeTasks + inv.tasks.completedLast30) * 3);
  const focusScore = Math.min(100, inv.focus.sessionsLast30 * 8);
  const notesScore = Math.min(100, inv.notes.notesCreated * 10);

  const contributions: DataContribution[] = [
    { dataType: 'Tasks tracked', currentContribution: scale(taskScore, 35), maxContribution: 35, detail: `${inv.tasks.activeTasks} active, ${inv.tasks.completedLast30} completed` },
    { dataType: 'Focus sessions', currentContribution: scale(focusScore, 35), maxContribution: 35, detail: `${inv.focus.sessionsLast30} sessions, ${inv.focus.hoursLast30}h` },
    { dataType: 'Notes & captures', currentContribution: scale(notesScore, 15), maxContribution: 15, detail: `${inv.notes.notesCreated} notes` },
    { dataType: 'Weekly priorities', currentContribution: inv.priorities.currentWeekSet ? 15 : 0, maxContribution: 15, detail: inv.priorities.currentWeekSet ? `${inv.priorities.count} set` : 'Not set' },
  ];

  const current = contributions.reduce((s, c) => s + c.currentContribution, 0);
  const gaps = buildGaps(contributions, [
    { dataType: 'Focus sessions', action: 'Start a focus session for deep work', timeEstimate: '1 minute to start' },
    { dataType: 'Weekly priorities', action: 'Set your weekly priorities', timeEstimate: '3 minutes' },
    { dataType: 'Notes & captures', action: 'Capture ideas and notes during the day', timeEstimate: '30 seconds each' },
  ]);

  return { name: 'Productivity', icon: '⚡', description: 'Task management, focus sessions, and execution', currentCapability: Math.round(current), maxCapability: 100, gap: Math.round(100 - current), dataContributions: contributions, dataGaps: gaps };
}

function buildTimeManagementArea(inv: DataInventory): CapabilityArea {
  const calScore = Math.min(100, inv.calendar.eventsLastMonth * 2);
  const focusScore = Math.min(100, inv.focus.sessionsLast30 * 8);

  const contributions: DataContribution[] = [
    { dataType: 'Calendar events', currentContribution: scale(calScore, 50), maxContribution: 50, detail: `${inv.calendar.eventsLastMonth} events, ${inv.calendar.calendarsTracked.length} calendars` },
    { dataType: 'Focus time logged', currentContribution: scale(focusScore, 30), maxContribution: 30, detail: `${inv.focus.hoursLast30}h logged` },
    { dataType: 'Priorities set', currentContribution: inv.priorities.currentWeekSet ? 20 : 0, maxContribution: 20, detail: inv.priorities.currentWeekSet ? 'Active' : 'Not set' },
  ];

  const current = contributions.reduce((s, c) => s + c.currentContribution, 0);
  const gaps = buildGaps(contributions, [
    { dataType: 'Focus time logged', action: 'Track focus sessions to see your patterns', timeEstimate: '1 minute to start' },
    { dataType: 'Priorities set', action: 'Set weekly priorities to guide time allocation', timeEstimate: '3 minutes' },
  ]);

  return { name: 'Time Management', icon: '📅', description: 'Calendar awareness, scheduling, and focus blocks', currentCapability: Math.round(current), maxCapability: 100, gap: Math.round(100 - current), dataContributions: contributions, dataGaps: gaps };
}

function buildGoalTrackingArea(inv: DataInventory): CapabilityArea {
  const priorityScore = inv.priorities.currentWeekSet ? 80 : 0;
  const habitScore = Math.min(100, inv.habits.habitsTracked * 15);

  const contributions: DataContribution[] = [
    { dataType: 'Weekly priorities', currentContribution: scale(priorityScore, 50), maxContribution: 50, detail: inv.priorities.currentWeekSet ? `${inv.priorities.count} priorities` : 'None set' },
    { dataType: 'Habits configured', currentContribution: scale(habitScore, 30), maxContribution: 30, detail: `${inv.habits.habitsTracked} habits, ${inv.habits.logsLast7} logs this week` },
    { dataType: 'Big 3 practice', currentContribution: scale(Math.min(100, inv.focus.sessionsLast30 * 5), 20), maxContribution: 20, detail: `${inv.focus.sessionsLast30} focus sessions` },
  ];

  const current = contributions.reduce((s, c) => s + c.currentContribution, 0);
  const gaps = buildGaps(contributions, [
    { dataType: 'Weekly priorities', action: 'Set 3-5 weekly priorities', timeEstimate: '3 minutes' },
    { dataType: 'Habits configured', action: 'Add daily habits to track', timeEstimate: '2 minutes' },
  ]);

  return { name: 'Goal Tracking', icon: '🎯', description: 'Priorities, habits, and accountability', currentCapability: Math.round(current), maxCapability: 100, gap: Math.round(100 - current), dataContributions: contributions, dataGaps: gaps };
}

function buildEmailIntelligenceArea(inv: DataInventory): CapabilityArea {
  const emailScore = Math.min(100, inv.email.itemsTracked * 5);
  const childCoverage = Math.min(100, inv.email.childrenCovered.length * 33);

  const contributions: DataContribution[] = [
    { dataType: 'Email items tracked', currentContribution: scale(emailScore, 50), maxContribution: 50, detail: `${inv.email.itemsTracked} items from school/family emails` },
    { dataType: 'Children covered', currentContribution: scale(childCoverage, 30), maxContribution: 30, detail: inv.email.childrenCovered.length > 0 ? inv.email.childrenCovered.join(', ') : 'None' },
    { dataType: 'Calendar integration', currentContribution: scale(Math.min(100, inv.calendar.eventsLastMonth * 2), 20), maxContribution: 20, detail: `${inv.calendar.eventsLastMonth} events synced` },
  ];

  const current = contributions.reduce((s, c) => s + c.currentContribution, 0);
  const gaps = buildGaps(contributions, [
    { dataType: 'Email items tracked', action: 'Radar processes school emails automatically', timeEstimate: 'Automatic' },
    { dataType: 'Children covered', action: 'Ensure school contacts use known email addresses', timeEstimate: '5 minutes' },
  ]);

  return { name: 'Email Intelligence', icon: '📧', description: 'School email tracking, deadlines, and action items', currentCapability: Math.round(current), maxCapability: 100, gap: Math.round(100 - current), dataContributions: contributions, dataGaps: gaps };
}

function buildJobSearchArea(inv: DataInventory): CapabilityArea {
  const jobScore = Math.min(100, inv.jobs.listingsTracked * 5);
  const activeScore = Math.min(100, inv.jobs.activeCount * 10);

  const contributions: DataContribution[] = [
    { dataType: 'Jobs tracked', currentContribution: scale(jobScore, 50), maxContribution: 50, detail: `${inv.jobs.listingsTracked} total listings` },
    { dataType: 'Active pipeline', currentContribution: scale(activeScore, 30), maxContribution: 30, detail: `${inv.jobs.activeCount} active` },
    { dataType: 'Profile completeness', currentContribution: inv.jobs.listingsTracked > 0 ? 20 : 0, maxContribution: 20, detail: inv.jobs.listingsTracked > 0 ? 'Profile created' : 'No profile' },
  ];

  const current = contributions.reduce((s, c) => s + c.currentContribution, 0);
  const gaps = buildGaps(contributions, [
    { dataType: 'Jobs tracked', action: 'Paste job URLs to build your pipeline', timeEstimate: '1 minute each' },
    { dataType: 'Active pipeline', action: 'Review and update job statuses', timeEstimate: '5 minutes' },
  ]);

  return { name: 'Job Search', icon: '💼', description: 'Job tracking, research, and application management', currentCapability: Math.round(current), maxCapability: 100, gap: Math.round(100 - current), dataContributions: contributions, dataGaps: gaps };
}

function buildHabitTrackingArea(inv: DataInventory): CapabilityArea {
  const configScore = Math.min(100, inv.habits.habitsTracked * 15);
  const logsScore = Math.min(100, inv.habits.logsLast7 * 5);

  const contributions: DataContribution[] = [
    { dataType: 'Habits configured', currentContribution: scale(configScore, 50), maxContribution: 50, detail: `${inv.habits.habitsTracked} habits active` },
    { dataType: 'Recent logging', currentContribution: scale(logsScore, 50), maxContribution: 50, detail: `${inv.habits.logsLast7} logs this week` },
  ];

  const current = contributions.reduce((s, c) => s + c.currentContribution, 0);
  const gaps = buildGaps(contributions, [
    { dataType: 'Habits configured', action: 'Add habits like push-ups, reading, or meditation', timeEstimate: '2 minutes' },
    { dataType: 'Recent logging', action: 'Log your habits daily', timeEstimate: '30 seconds' },
  ]);

  return { name: 'Habit Tracking', icon: '🔥', description: 'Daily habits, streaks, and consistency', currentCapability: Math.round(current), maxCapability: 100, gap: Math.round(100 - current), dataContributions: contributions, dataGaps: gaps };
}

function buildMentalLoadArea(inv: DataInventory): CapabilityArea {
  const loadScore = Math.min(100, inv.mentalLoad.itemsLogged * 8);
  const categoryScore = Math.min(100, inv.mentalLoad.categoriesUsed.length * 20);
  const classifyScore = inv.classifications.total > 0
    ? Math.min(100, (inv.classifications.classified / inv.classifications.total) * 100)
    : 0;

  const contributions: DataContribution[] = [
    { dataType: 'Items logged', currentContribution: scale(loadScore, 40), maxContribution: 40, detail: `${inv.mentalLoad.itemsLogged} active items` },
    { dataType: 'Categories used', currentContribution: scale(categoryScore, 25), maxContribution: 25, detail: inv.mentalLoad.categoriesUsed.join(', ') || 'None' },
    { dataType: 'Items organized', currentContribution: scale(classifyScore, 20), maxContribution: 20, detail: `${inv.classifications.classified}/${inv.classifications.total} classified` },
    { dataType: 'Recent activity', currentContribution: inv.mentalLoad.recentActivity ? 15 : 0, maxContribution: 15, detail: inv.mentalLoad.recentActivity ? 'Active this week' : 'No recent activity' },
  ];

  const current = contributions.reduce((s, c) => s + c.currentContribution, 0);
  const gaps = buildGaps(contributions, [
    { dataType: 'Items logged', action: 'Talk to a persona about what\'s on your mind', timeEstimate: '2 minutes' },
    { dataType: 'Items organized', action: 'Triage your inbox items into buckets', timeEstimate: '5 minutes' },
    { dataType: 'Recent activity', action: 'Check in regularly to externalize mental load', timeEstimate: '2 minutes' },
  ]);

  return { name: 'Mental Load Tracking', icon: '🧠', description: 'Externalizing and organizing what you\'re carrying', currentCapability: Math.round(current), maxCapability: 100, gap: Math.round(100 - current), dataContributions: contributions, dataGaps: gaps };
}

function buildSchoolSupportArea(inv: DataInventory): CapabilityArea {
  const emailScore = Math.min(100, inv.email.itemsTracked * 5);
  const calScore = Math.min(100, inv.calendar.eventsLastMonth * 2);
  const childCoverage = Math.min(100, inv.email.childrenCovered.length * 33);

  const contributions: DataContribution[] = [
    { dataType: 'School emails tracked', currentContribution: scale(emailScore, 40), maxContribution: 40, detail: `${inv.email.itemsTracked} items from emails` },
    { dataType: 'Calendar events', currentContribution: scale(calScore, 30), maxContribution: 30, detail: `${inv.calendar.eventsLastMonth} events` },
    { dataType: 'Children covered', currentContribution: scale(childCoverage, 30), maxContribution: 30, detail: inv.email.childrenCovered.length > 0 ? inv.email.childrenCovered.join(', ') : 'None detected' },
  ];

  const current = contributions.reduce((s, c) => s + c.currentContribution, 0);
  const gaps = buildGaps(contributions, [
    { dataType: 'School emails tracked', action: 'Ensure school emails go to tracked inbox', timeEstimate: 'Automatic' },
    { dataType: 'Children covered', action: 'Verify all kids\' school contacts are sending to Gmail', timeEstimate: '5 minutes' },
  ]);

  return { name: 'School Support', icon: '📚', description: 'School emails, deadlines, events, and per-child tracking', currentCapability: Math.round(current), maxCapability: 100, gap: Math.round(100 - current), dataContributions: contributions, dataGaps: gaps };
}

function buildStressManagementArea(inv: DataInventory): CapabilityArea {
  const calScore = Math.min(100, inv.calendar.eventsLastMonth * 2);
  const loadScore = Math.min(100, inv.mentalLoad.itemsLogged * 5);

  const contributions: DataContribution[] = [
    { dataType: 'Calendar busy signals', currentContribution: scale(calScore, 30), maxContribution: 30, detail: `${inv.calendar.eventsLastMonth} events tracked` },
    { dataType: 'Mental load visibility', currentContribution: scale(loadScore, 30), maxContribution: 30, detail: `${inv.mentalLoad.itemsLogged} items externalized` },
    { dataType: 'Wellness data', currentContribution: scale(0, 20), maxContribution: 20, detail: 'Not yet tracked' },
    { dataType: 'Stress triggers', currentContribution: scale(0, 20), maxContribution: 20, detail: 'Not yet identified' },
  ];

  const current = contributions.reduce((s, c) => s + c.currentContribution, 0);
  const gaps = buildGaps(contributions, [
    { dataType: 'Wellness data', action: 'Share how your energy levels feel', timeEstimate: '1 minute' },
    { dataType: 'Stress triggers', action: 'Tell a persona what stresses you most', timeEstimate: '2 minutes' },
  ]);

  return { name: 'Stress Management', icon: '💆', description: 'Understanding stress patterns and energy levels', currentCapability: Math.round(current), maxCapability: 100, gap: Math.round(100 - current), dataContributions: contributions, dataGaps: gaps };
}

function buildFamilyCoordinationArea(inv: DataInventory): CapabilityArea {
  const calScore = Math.min(100, inv.calendar.eventsLastMonth * 2);
  const emailScore = Math.min(100, inv.email.itemsTracked * 5);
  const childCoverage = Math.min(100, inv.email.childrenCovered.length * 33);

  const contributions: DataContribution[] = [
    { dataType: 'Calendar events', currentContribution: scale(calScore, 35), maxContribution: 35, detail: `${inv.calendar.eventsLastMonth} events, ${inv.calendar.calendarsTracked.length} calendars` },
    { dataType: 'Email intelligence', currentContribution: scale(emailScore, 30), maxContribution: 30, detail: `${inv.email.itemsTracked} family items tracked` },
    { dataType: 'Family member coverage', currentContribution: scale(childCoverage, 20), maxContribution: 20, detail: inv.email.childrenCovered.join(', ') || 'None' },
    { dataType: 'Tasks & priorities', currentContribution: inv.priorities.currentWeekSet ? 15 : scale(Math.min(100, inv.tasks.activeTasks * 5), 15), maxContribution: 15, detail: inv.priorities.currentWeekSet ? 'Priorities set' : `${inv.tasks.activeTasks} tasks` },
  ];

  const current = contributions.reduce((s, c) => s + c.currentContribution, 0);
  const gaps = buildGaps(contributions, [
    { dataType: 'Family member coverage', action: 'Add notes about each family member\'s needs', timeEstimate: '5 minutes' },
    { dataType: 'Tasks & priorities', action: 'Set weekly family priorities', timeEstimate: '3 minutes' },
  ]);

  return { name: 'Family Coordination', icon: '👨‍👩‍👧‍👦', description: 'Calendar, communication, and family scheduling', currentCapability: Math.round(current), maxCapability: 100, gap: Math.round(100 - current), dataContributions: contributions, dataGaps: gaps };
}

function buildRoutineTrackingArea(inv: DataInventory, childName: string): CapabilityArea {
  const checklistScore = Math.min(100, inv.checklists.itemsConfigured * 10);
  const completionScore = inv.checklists.completionRate7d;

  const contributions: DataContribution[] = [
    { dataType: 'Checklist items', currentContribution: scale(checklistScore, 50), maxContribution: 50, detail: `${inv.checklists.itemsConfigured} items configured` },
    { dataType: 'Completion rate', currentContribution: scale(completionScore, 50), maxContribution: 50, detail: `${completionScore}% this week` },
  ];

  const current = contributions.reduce((s, c) => s + c.currentContribution, 0);
  const gaps = buildGaps(contributions, [
    { dataType: 'Checklist items', action: `Add morning/evening routine items for ${childName}`, timeEstimate: '3 minutes' },
    { dataType: 'Completion rate', action: `Help ${childName} check off items daily`, timeEstimate: '1 minute' },
  ]);

  return { name: 'Routine Tracking', icon: '✅', description: `${childName}'s daily routines and checklists`, currentCapability: Math.round(current), maxCapability: 100, gap: Math.round(100 - current), dataContributions: contributions, dataGaps: gaps };
}

function buildActivityTrackingArea(inv: DataInventory, personName: string): CapabilityArea {
  const calScore = Math.min(100, inv.calendar.eventsLastMonth * 3);
  const emailScore = Math.min(100, inv.email.itemsTracked * 10);

  const contributions: DataContribution[] = [
    { dataType: 'Calendar events', currentContribution: scale(calScore, 50), maxContribution: 50, detail: `${inv.calendar.eventsLastMonth} events visible` },
    { dataType: 'Email mentions', currentContribution: scale(emailScore, 50), maxContribution: 50, detail: `${inv.email.itemsTracked} items mentioning ${personName}` },
  ];

  const current = contributions.reduce((s, c) => s + c.currentContribution, 0);
  const gaps = buildGaps(contributions, [
    { dataType: 'Calendar events', action: `Add ${personName}'s activities to the calendar`, timeEstimate: '2 minutes' },
    { dataType: 'Email mentions', action: 'Processed automatically from school emails', timeEstimate: 'Automatic' },
  ]);

  return { name: 'Activity Tracking', icon: '🏃', description: `Visibility into ${personName}'s activities and events`, currentCapability: Math.round(current), maxCapability: 100, gap: Math.round(100 - current), dataContributions: contributions, dataGaps: gaps };
}

// --- Helpers ---

function scale(score: number, maxWeight: number): number {
  return Math.round((Math.min(score, 100) / 100) * maxWeight);
}

function buildGaps(contributions: DataContribution[], gapTemplates: Omit<DataGap, 'impact'>[]): DataGap[] {
  return gapTemplates
    .map(template => {
      const contribution = contributions.find(c => c.dataType === template.dataType);
      if (!contribution) return null;
      const impact = contribution.maxContribution - contribution.currentContribution;
      if (impact <= 2) return null; // Skip tiny gaps
      return { ...template, impact };
    })
    .filter((g): g is DataGap => g !== null)
    .sort((a, b) => b.impact - a.impact);
}

function buildProfile(id: string, name: string, areas: CapabilityArea[]): PersonCapabilityProfile {
  const overallCapability = areas.length > 0
    ? Math.round(areas.reduce((s, a) => s + a.currentCapability, 0) / areas.length)
    : 0;

  const strengths = areas
    .filter(a => a.currentCapability >= STRENGTH_THRESHOLD)
    .map(a => `${a.name} (${a.currentCapability}%)`);

  const opportunities = areas
    .filter(a => a.currentCapability < OPPORTUNITY_THRESHOLD)
    .map(a => `${a.name} (${a.currentCapability}%)`);

  // Find highest-impact gap across all areas
  const allGaps = areas.flatMap(a => a.dataGaps.map(g => ({ ...g, areaName: a.name })));
  const topGap = allGaps.sort((a, b) => b.impact - a.impact)[0];

  const nextHighValueAction = topGap
    ? {
        action: topGap.action,
        impact: topGap.impact,
        reason: `${topGap.areaName} would improve by ${topGap.impact}%`,
        timeEstimate: topGap.timeEstimate,
      }
    : null;

  return { personId: id, personName: name, areas, overallCapability, strengths, opportunities, nextHighValueAction };
}

function buildDataQualitySummary(profiles: PersonCapabilityProfile[]): FamilyCapabilityProfile['dataQuality'] {
  // Aggregate across all profiles to rate data quality by area type
  const areaScores = new Map<string, number[]>();
  for (const profile of profiles) {
    for (const area of profile.areas) {
      const scores = areaScores.get(area.name) || [];
      scores.push(area.currentCapability);
      areaScores.set(area.name, scores);
    }
  }

  return Array.from(areaScores.entries()).map(([area, scores]) => {
    const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
    const level: 'excellent' | 'good' | 'partial' | 'limited' | 'sparse' =
      avg >= 80 ? 'excellent' :
      avg >= 60 ? 'good' :
      avg >= 40 ? 'partial' :
      avg >= 20 ? 'limited' : 'sparse';
    return { area, level, coverage: Math.round(avg) };
  });
}

function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(now);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}
