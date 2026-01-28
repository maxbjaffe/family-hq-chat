/**
 * Family Info Agent
 *
 * Handles family information queries:
 * - Health/medical info (allergies, medications, blood type)
 * - Contacts (doctors, teachers, emergency contacts)
 * - Insurance/accounts
 * - Birthdays
 *
 * Connected to: Notion databases (People, Health, Accounts)
 */

import { BaseAgent } from '../base-agent';
import { AgentContext, AgentResult, AgentCapability, UserInput } from '../types';

// Types for Notion data
interface FamilyHealthRecord {
  name: string;
  role: string | null;
  age: string | null;
  birthday: string | null;
  bloodType: string | null;
  allergies: string | null;
  medications: string | null;
  conditions: string | null;
  doctors: string | null;
  portal: string | null;
  emergencyNotes: string | null;
}

interface PersonRecord {
  name: string;
  type: string | null;
  familyMembers: string[];
  organization: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  website: string | null;
  location: string | null;
}

export class FamilyInfoAgent extends BaseAgent {
  name = 'FamilyInfoAgent';
  description = 'Handles family information queries';

  capabilities: AgentCapability[] = [
    {
      name: 'health_info',
      description: 'Medical and health information',
      triggers: ['doctor', 'health', 'medical', 'allergy', 'medicine', 'medication', 'blood type'],
      examples: ['Who is our pediatrician?', "What are Parker's allergies?", "Riley's blood type"],
    },
    {
      name: 'contacts',
      description: 'Family contacts and providers',
      triggers: ['contact', 'phone', 'number', 'email', 'reach', 'teacher'],
      examples: ['Emergency contacts', "Riley's teacher", "Dentist phone number"],
    },
    {
      name: 'birthday',
      description: 'Birthday information',
      triggers: ['birthday', 'born', 'age', 'how old'],
      examples: ["When is Parker's birthday?", "How old is Devin?"],
    },
  ];

  async process(input: UserInput, context: AgentContext): Promise<AgentResult> {
    const text = input.text.toLowerCase();

    // Detect which family member is being asked about
    const targetMember = this.detectFamilyMember(text);

    // Route to appropriate handler
    if (/allerg/i.test(text)) {
      return this.getAllergies(targetMember, context);
    }

    if (/blood\s*type/i.test(text)) {
      return this.getBloodType(targetMember, context);
    }

    if (/medication|medicine/i.test(text)) {
      return this.getMedications(targetMember, context);
    }

    if (/birthday|born|how old|age/i.test(text)) {
      return this.getBirthday(targetMember, context);
    }

    if (/doctor|pediatrician|dentist|provider/i.test(text)) {
      return this.getDoctor(text, targetMember, context);
    }

    if (/teacher/i.test(text)) {
      return this.getTeacher(targetMember, context);
    }

    if (/emergency\s*(contact)?/i.test(text)) {
      return this.getEmergencyContacts(context);
    }

    if (/phone|number|contact|email/i.test(text)) {
      return this.getContact(text, context);
    }

    // General health query for a specific person
    if (targetMember) {
      return this.getHealthSummary(targetMember, context);
    }

    // Fallback
    return this.success(
      null,
      "I can help with family health info, contacts, doctors, allergies, birthdays, and more. Who or what are you looking for?",
      { confidence: 0.6 }
    );
  }

  private detectFamilyMember(text: string): string | null {
    const members = ['riley', 'parker', 'devin', 'max', 'alex', 'jaffe'];
    for (const member of members) {
      if (text.includes(member)) {
        return member.charAt(0).toUpperCase() + member.slice(1);
      }
    }
    // Check for possessive forms
    const possessiveMatch = text.match(/(\w+)'s/);
    if (possessiveMatch) {
      const name = possessiveMatch[1].toLowerCase();
      if (members.includes(name)) {
        return name.charAt(0).toUpperCase() + name.slice(1);
      }
    }
    return null;
  }

  private async getAllergies(member: string | null, context: AgentContext): Promise<AgentResult> {
    const health = await this.fetchHealthData();

    if (member) {
      const person = health.find(h => h.name.toLowerCase() === member.toLowerCase());
      if (person) {
        const allergies = person.allergies || 'No known allergies';
        const isKid = context.familyMember?.role === 'kid';
        const message = isKid
          ? `${person.name}'s allergies: ${allergies}`
          : `**${person.name}'s Allergies**\n${allergies}`;

        return this.success(
          { member: person.name, allergies: person.allergies },
          message,
          { confidence: 0.95 }
        );
      }
    }

    // Show all family allergies
    const allergySummary = health
      .filter(h => h.allergies)
      .map(h => `**${h.name}:** ${h.allergies}`)
      .join('\n');

    return this.success(
      { allergies: health.map(h => ({ name: h.name, allergies: h.allergies })) },
      allergySummary || 'No allergies recorded for family members.',
      { confidence: 0.9 }
    );
  }

  private async getBloodType(member: string | null, context: AgentContext): Promise<AgentResult> {
    const health = await this.fetchHealthData();

    if (member) {
      const person = health.find(h => h.name.toLowerCase() === member.toLowerCase());
      if (person?.bloodType) {
        return this.success(
          { member: person.name, bloodType: person.bloodType },
          `${person.name}'s blood type is **${person.bloodType}**`,
          { confidence: 0.95 }
        );
      }
    }

    const bloodTypes = health
      .filter(h => h.bloodType)
      .map(h => `**${h.name}:** ${h.bloodType}`)
      .join('\n');

    return this.success(
      { bloodTypes: health.map(h => ({ name: h.name, bloodType: h.bloodType })) },
      bloodTypes || 'No blood types recorded.',
      { confidence: 0.9 }
    );
  }

  private async getMedications(member: string | null, context: AgentContext): Promise<AgentResult> {
    const health = await this.fetchHealthData();

    if (member) {
      const person = health.find(h => h.name.toLowerCase() === member.toLowerCase());
      if (person) {
        const meds = person.medications || 'No current medications';
        return this.success(
          { member: person.name, medications: person.medications },
          `**${person.name}'s Medications**\n${meds}`,
          { confidence: 0.95 }
        );
      }
    }

    const medsSummary = health
      .filter(h => h.medications)
      .map(h => `**${h.name}:** ${h.medications}`)
      .join('\n');

    return this.success(
      { medications: health.map(h => ({ name: h.name, medications: h.medications })) },
      medsSummary || 'No medications recorded for family members.',
      { confidence: 0.9 }
    );
  }

  private async getBirthday(member: string | null, context: AgentContext): Promise<AgentResult> {
    const health = await this.fetchHealthData();

    if (member) {
      const person = health.find(h => h.name.toLowerCase() === member.toLowerCase());
      if (person) {
        const parts = [];
        if (person.birthday) parts.push(`Birthday: ${person.birthday}`);
        if (person.age) parts.push(`Age: ${person.age}`);

        const isKid = context.familyMember?.role === 'kid';
        const emoji = isKid ? '🎂 ' : '';

        return this.success(
          { member: person.name, birthday: person.birthday, age: person.age },
          `${emoji}**${person.name}**\n${parts.join('\n') || 'Birthday not recorded'}`,
          { confidence: 0.95 }
        );
      }
    }

    // All birthdays
    const birthdays = health
      .filter(h => h.birthday)
      .map(h => `**${h.name}:** ${h.birthday}${h.age ? ` (${h.age})` : ''}`)
      .join('\n');

    return this.success(
      { birthdays: health.map(h => ({ name: h.name, birthday: h.birthday, age: h.age })) },
      `🎂 **Family Birthdays**\n\n${birthdays || 'No birthdays recorded.'}`,
      { confidence: 0.9 }
    );
  }

  private async getDoctor(text: string, member: string | null, context: AgentContext): Promise<AgentResult> {
    const people = await this.fetchPeopleData();

    // Filter to doctors/medical providers
    const doctors = people.filter(p =>
      p.type?.toLowerCase().includes('doctor') ||
      p.type?.toLowerCase().includes('medical') ||
      p.type?.toLowerCase().includes('dentist') ||
      p.type?.toLowerCase().includes('pediatrician') ||
      p.organization?.toLowerCase().includes('medical') ||
      p.organization?.toLowerCase().includes('hospital')
    );

    // Check for specific type
    let filtered = doctors;
    if (/pediatrician/i.test(text)) {
      filtered = doctors.filter(d => d.type?.toLowerCase().includes('pediatrician'));
    } else if (/dentist/i.test(text)) {
      filtered = doctors.filter(d => d.type?.toLowerCase().includes('dentist'));
    }

    // Filter by family member if specified
    if (member && filtered.length > 0) {
      const memberDoctors = filtered.filter(d =>
        d.familyMembers.some(fm => fm.toLowerCase().includes(member.toLowerCase()))
      );
      if (memberDoctors.length > 0) {
        filtered = memberDoctors;
      }
    }

    if (filtered.length === 0) {
      return this.success(
        { doctors: [] },
        "No matching doctors found in the family contacts.",
        { confidence: 0.7 }
      );
    }

    const formatted = filtered.map(d => {
      const lines = [`**${d.name}**`];
      if (d.type) lines.push(`Type: ${d.type}`);
      if (d.organization) lines.push(`Practice: ${d.organization}`);
      if (d.phone) lines.push(`📞 ${d.phone}`);
      if (d.location) lines.push(`📍 ${d.location}`);
      return lines.join('\n');
    }).join('\n\n');

    return this.success(
      { doctors: filtered },
      `🏥 **Doctors**\n\n${formatted}`,
      { confidence: 0.9 }
    );
  }

  private async getTeacher(member: string | null, context: AgentContext): Promise<AgentResult> {
    const people = await this.fetchPeopleData();

    const teachers = people.filter(p =>
      p.type?.toLowerCase().includes('teacher') ||
      p.organization?.toLowerCase().includes('school')
    );

    if (member) {
      const memberTeachers = teachers.filter(t =>
        t.familyMembers.some(fm => fm.toLowerCase().includes(member.toLowerCase()))
      );

      if (memberTeachers.length > 0) {
        const formatted = memberTeachers.map(t => {
          const lines = [`**${t.name}**`];
          if (t.organization) lines.push(`School: ${t.organization}`);
          if (t.email) lines.push(`📧 ${t.email}`);
          if (t.phone) lines.push(`📞 ${t.phone}`);
          return lines.join('\n');
        }).join('\n\n');

        return this.success(
          { teachers: memberTeachers },
          `🏫 **${member}'s Teacher${memberTeachers.length > 1 ? 's' : ''}**\n\n${formatted}`,
          { confidence: 0.95 }
        );
      }
    }

    if (teachers.length === 0) {
      return this.success(
        { teachers: [] },
        "No teachers found in contacts.",
        { confidence: 0.7 }
      );
    }

    const formatted = teachers.map(t => {
      const lines = [`**${t.name}**`];
      if (t.familyMembers.length > 0) lines.push(`For: ${t.familyMembers.join(', ')}`);
      if (t.organization) lines.push(`School: ${t.organization}`);
      if (t.email) lines.push(`📧 ${t.email}`);
      return lines.join('\n');
    }).join('\n\n');

    return this.success(
      { teachers },
      `🏫 **Teachers**\n\n${formatted}`,
      { confidence: 0.9 }
    );
  }

  private async getEmergencyContacts(context: AgentContext): Promise<AgentResult> {
    const people = await this.fetchPeopleData();

    const emergency = people.filter(p =>
      p.type?.toLowerCase().includes('emergency') ||
      p.type?.toLowerCase().includes('family') ||
      p.notes?.toLowerCase().includes('emergency')
    );

    if (emergency.length === 0) {
      return this.success(
        { contacts: [] },
        "No emergency contacts found. Consider adding them to Notion.",
        { confidence: 0.7 }
      );
    }

    const formatted = emergency.map(c => {
      const lines = [`**${c.name}**`];
      if (c.type) lines.push(`Relationship: ${c.type}`);
      if (c.phone) lines.push(`📞 ${c.phone}`);
      if (c.email) lines.push(`📧 ${c.email}`);
      return lines.join('\n');
    }).join('\n\n');

    return this.success(
      { contacts: emergency },
      `🚨 **Emergency Contacts**\n\n${formatted}`,
      { confidence: 0.9 }
    );
  }

  private async getContact(text: string, context: AgentContext): Promise<AgentResult> {
    const people = await this.fetchPeopleData();

    // Try to find a specific contact by name
    const words = text.split(/\s+/);
    for (const word of words) {
      if (word.length < 3) continue;
      const match = people.find(p =>
        p.name.toLowerCase().includes(word.toLowerCase())
      );
      if (match) {
        const lines = [`**${match.name}**`];
        if (match.type) lines.push(`Type: ${match.type}`);
        if (match.phone) lines.push(`📞 ${match.phone}`);
        if (match.email) lines.push(`📧 ${match.email}`);
        if (match.organization) lines.push(`Organization: ${match.organization}`);

        return this.success(
          { contact: match },
          lines.join('\n'),
          { confidence: 0.9 }
        );
      }
    }

    return this.success(
      null,
      "Who would you like contact info for? I have doctors, teachers, family, and other contacts.",
      { confidence: 0.6 }
    );
  }

  private async getHealthSummary(member: string, context: AgentContext): Promise<AgentResult> {
    const health = await this.fetchHealthData();
    const person = health.find(h => h.name.toLowerCase() === member.toLowerCase());

    if (!person) {
      return this.success(
        null,
        `No health info found for ${member}.`,
        { confidence: 0.7 }
      );
    }

    const lines = [`🏥 **${person.name}'s Health Info**`, ''];
    if (person.age) lines.push(`**Age:** ${person.age}`);
    if (person.birthday) lines.push(`**Birthday:** ${person.birthday}`);
    if (person.bloodType) lines.push(`**Blood Type:** ${person.bloodType}`);
    if (person.allergies) lines.push(`**Allergies:** ${person.allergies}`);
    if (person.medications) lines.push(`**Medications:** ${person.medications}`);
    if (person.conditions) lines.push(`**Conditions:** ${person.conditions}`);
    if (person.doctors) lines.push(`**Doctors:** ${person.doctors}`);
    if (person.emergencyNotes) lines.push(`**Emergency Notes:** ${person.emergencyNotes}`);

    return this.success(
      { healthInfo: person },
      lines.join('\n'),
      { confidence: 0.95 }
    );
  }

  // Data fetching helpers
  private async fetchHealthData(): Promise<FamilyHealthRecord[]> {
    try {
      // Dynamic import to avoid circular dependencies
      const { fetchAllFamilyData } = await import('../../notion');
      const data = await fetchAllFamilyData();

      // Parse health section
      const healthSection = data.split('## FAMILY HEALTH INFO')[1]?.split('##')[0] || '';
      const records: FamilyHealthRecord[] = [];

      const entries = healthSection.split('---').filter(e => e.trim());
      for (const entry of entries) {
        const record: FamilyHealthRecord = {
          name: this.extractField(entry, 'Name') || 'Unknown',
          role: this.extractField(entry, 'Role'),
          age: this.extractField(entry, 'Age'),
          birthday: this.extractField(entry, 'Birthday'),
          bloodType: this.extractField(entry, 'Blood Type'),
          allergies: this.extractField(entry, 'Allergies'),
          medications: this.extractField(entry, 'Medications'),
          conditions: this.extractField(entry, 'Chronic Conditions'),
          doctors: this.extractField(entry, 'Primary Doctors'),
          portal: this.extractField(entry, 'Patient Portal'),
          emergencyNotes: this.extractField(entry, 'Emergency Notes'),
        };
        if (record.name !== 'Unknown') {
          records.push(record);
        }
      }

      return records;
    } catch (error) {
      console.error('Failed to fetch health data:', error);
      return [];
    }
  }

  private async fetchPeopleData(): Promise<PersonRecord[]> {
    try {
      const { fetchPeopleAndProviders } = await import('../../notion');
      return await fetchPeopleAndProviders();
    } catch (error) {
      console.error('Failed to fetch people data:', error);
      return [];
    }
  }

  private extractField(text: string, field: string): string | null {
    const regex = new RegExp(`${field}:\\s*(.+?)(?:\\n|$)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : null;
  }
}
