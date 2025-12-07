require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function testSkillParser() {
  const prisma = new PrismaClient();

  try {
    const testQuery = '/test';
    console.log('Testing query:', testQuery);

    // Test regex
    const match = testQuery.match(/\/([a-z0-9_-]+)/i);
    console.log('Regex match:', match);

    if (match) {
      const skillName = match[1];
      console.log('Skill name extracted:', skillName);

      // Test database query
      const skill = await prisma.skill.findFirst({
        where: {
          name: skillName,
          isActive: true,
        },
      });

      console.log('Skill found in DB:', skill);

      if (skill) {
        const modifiedQuery = testQuery.replace(`/${skillName}`, skill.prompt);
        console.log('Modified query:', modifiedQuery);
      }
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testSkillParser();
