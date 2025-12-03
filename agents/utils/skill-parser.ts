/**
 * Skill Parser
 * Parses user query for skill invocation (/skill_name query)
 * Loads skill prompts from database
 */

import { PrismaClient } from '@prisma/client';
import { Skill } from '../config/types';

export class SkillParser {
  constructor(private prisma: PrismaClient) {}

  /**
   * Parse user query for skill invocation
   * Format: /skill_name user query
   * Returns: { skillPrompt: string, modifiedQuery: string } or null
   */
  async parseSkill(
    query: string
  ): Promise<{ skillPrompt: string; modifiedQuery: string } | null> {
    const match = query.match(/^\/([a-z0-9_-]+)\s+(.+)$/i);

    if (!match) {
      return null;
    }

    const skillName = match[1];
    const userQuery = match[2];

    // Load skill from database
    const skill = await this.loadSkill(skillName);

    if (!skill) {
      console.warn(`Skill not found: ${skillName}`);
      return null;
    }

    // Construct modified query with skill prompt
    const modifiedQuery = `${skill.prompt}\n\nUser Query:\n${userQuery}`;

    return {
      skillPrompt: skill.prompt,
      modifiedQuery,
    };
  }

  /**
   * Load skill from database
   */
  private async loadSkill(skillName: string): Promise<Skill | null> {
    try {
      const skillRecord = await this.prisma.skill.findFirst({
        where: {
          name: skillName,
          isActive: true,
        },
      });

      if (!skillRecord) {
        return null;
      }

      return {
        name: skillRecord.name,
        prompt: skillRecord.prompt,
      };
    } catch (error) {
      console.error('Failed to load skill:', error);
      return null;
    }
  }

  /**
   * List all available skills
   */
  async listSkills(): Promise<Skill[]> {
    try {
      const skills = await this.prisma.skill.findMany({
        where: {
          isActive: true,
        },
        select: {
          name: true,
          prompt: true,
        },
      });

      return skills.map((s) => ({
        name: s.name,
        prompt: s.prompt,
      }));
    } catch (error) {
      console.error('Failed to list skills:', error);
      return [];
    }
  }
}
