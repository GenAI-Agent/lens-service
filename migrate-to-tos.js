const { PrismaClient } = require('@prisma/client');

// Source database (local lens_service)
const sourcePrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://lens_admin:lens_secret_2025@localhost:8888/lens_service?schema=public'
    }
  }
});

// Target database (remote TOS)
const targetPrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:1234@52.197.143.70:5433/TOS?schema=public'
    }
  }
});

async function migrateData() {
  try {
    console.log('Starting migration from lens_service to TOS...\n');

    // 1. Migrate Sessions
    console.log('Migrating Sessions...');
    const sessions = await sourcePrisma.session.findMany();
    for (const session of sessions) {
      await targetPrisma.session.upsert({
        where: { id: session.id },
        update: session,
        create: session
      });
    }
    console.log(`✓ Migrated ${sessions.length} sessions\n`);

    // 2. Migrate Messages (need to handle relations carefully)
    console.log('Migrating Messages...');
    const messages = await sourcePrisma.message.findMany({
      orderBy: { id: 'asc' }
    });
    for (const message of messages) {
      await targetPrisma.message.upsert({
        where: { id: message.id },
        update: message,
        create: message
      });
    }
    console.log(`✓ Migrated ${messages.length} messages\n`);

    // 3. Migrate Site Prompts
    console.log('Migrating Site Prompts...');
    const sitePrompts = await sourcePrisma.sitePrompt.findMany();
    for (const prompt of sitePrompts) {
      await targetPrisma.sitePrompt.upsert({
        where: { id: prompt.id },
        update: prompt,
        create: prompt
      });
    }
    console.log(`✓ Migrated ${sitePrompts.length} site prompts\n`);

    // 4. Migrate Knowledge Base
    console.log('Migrating Knowledge Base...');
    const knowledge = await sourcePrisma.knowledgeBase.findMany();
    for (const kb of knowledge) {
      await targetPrisma.knowledgeBase.upsert({
        where: { id: kb.id },
        update: kb,
        create: kb
      });
    }
    console.log(`✓ Migrated ${knowledge.length} knowledge base entries\n`);

    // 5. Migrate Skills
    console.log('Migrating Skills...');
    const skills = await sourcePrisma.skill.findMany();
    for (const skill of skills) {
      await targetPrisma.skill.upsert({
        where: { id: skill.id },
        update: skill,
        create: skill
      });
    }
    console.log(`✓ Migrated ${skills.length} skills\n`);

    // 6. Migrate LLM Traces
    console.log('Migrating LLM Traces...');
    const traces = await sourcePrisma.lLMTrace.findMany();
    for (const trace of traces) {
      await targetPrisma.lLMTrace.upsert({
        where: { id: trace.id },
        update: trace,
        create: trace
      });
    }
    console.log(`✓ Migrated ${traces.length} LLM traces\n`);

    // 7. Migrate Contact Form Fields
    console.log('Migrating Contact Form Fields...');
    const formFields = await sourcePrisma.contactFormField.findMany();
    for (const field of formFields) {
      await targetPrisma.contactFormField.upsert({
        where: { id: field.id },
        update: field,
        create: field
      });
    }
    console.log(`✓ Migrated ${formFields.length} contact form fields\n`);

    // 8. Migrate Contact Form Settings
    console.log('Migrating Contact Form Settings...');
    const formSettings = await sourcePrisma.contactFormSettings.findMany();
    for (const setting of formSettings) {
      await targetPrisma.contactFormSettings.upsert({
        where: { id: setting.id },
        update: setting,
        create: setting
      });
    }
    console.log(`✓ Migrated ${formSettings.length} contact form settings\n`);

    // 9. Migrate Contact Form Submissions
    console.log('Migrating Contact Form Submissions...');
    const submissions = await sourcePrisma.contactFormSubmission.findMany();
    for (const submission of submissions) {
      await targetPrisma.contactFormSubmission.upsert({
        where: { id: submission.id },
        update: submission,
        create: submission
      });
    }
    console.log(`✓ Migrated ${submissions.length} contact form submissions\n`);

    // 10. Migrate AI Pages
    console.log('Migrating AI Pages...');
    const aiPages = await sourcePrisma.aIPage.findMany();
    for (const page of aiPages) {
      await targetPrisma.aIPage.upsert({
        where: { id: page.id },
        update: page,
        create: page
      });
    }
    console.log(`✓ Migrated ${aiPages.length} AI pages\n`);

    console.log('✓ Migration completed successfully!');
    console.log('\nSummary:');
    console.log(`- Sessions: ${sessions.length}`);
    console.log(`- Messages: ${messages.length}`);
    console.log(`- Site Prompts: ${sitePrompts.length}`);
    console.log(`- Knowledge Base: ${knowledge.length}`);
    console.log(`- Skills: ${skills.length}`);
    console.log(`- LLM Traces: ${traces.length}`);
    console.log(`- Form Fields: ${formFields.length}`);
    console.log(`- Form Settings: ${formSettings.length}`);
    console.log(`- Form Submissions: ${submissions.length}`);
    console.log(`- AI Pages: ${aiPages.length}`);

  } catch (error) {
    console.error('✗ Migration error:', error);
    throw error;
  } finally {
    await sourcePrisma.$disconnect();
    await targetPrisma.$disconnect();
  }
}

migrateData();
