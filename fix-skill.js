require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function addSkill() {
  const prisma = new PrismaClient();

  try {
    // Delete existing test skill if any
    await prisma.skill.deleteMany({
      where: { name: 'test' }
    });

    // Create test skill
    const skill = await prisma.skill.create({
      data: {
        name: 'test',
        prompt: '你先幫進到"編輯精選"，並且幫我找到適合我的主題推薦適合我的書籍，並且生成 ai page 給我，然後為我進行導覽，接著重新回到首頁',
        isActive: true,
      },
    });

    console.log('Skill created successfully:', skill);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

addSkill();
