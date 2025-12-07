require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function checkSkills() {
  const prisma = new PrismaClient();

  try {
    const skills = await prisma.skill.findMany();
    console.log('Skills in DB:', JSON.stringify(skills, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSkills();
