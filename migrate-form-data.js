require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function migrateFormData() {
  // Old database
  const oldPrisma = new PrismaClient({
    datasources: {
      db: {
        url: 'postgresql://lens_admin:lens_secret_2025@localhost:8888/lens_service?schema=public'
      }
    }
  });

  // New database (TOS)
  const newPrisma = new PrismaClient();

  try {
    console.log('Fetching data from old database...');

    // Fetch ContactFormField
    const formFields = await oldPrisma.contactFormField.findMany();
    console.log(`Found ${formFields.length} form fields`);

    // Fetch ContactFormSettings
    const formSettings = await oldPrisma.contactFormSettings.findMany();
    console.log(`Found ${formSettings.length} form settings`);

    // Fetch ContactFormSubmissions (optional, may have a lot of data)
    const submissions = await oldPrisma.contactFormSubmission.findMany({
      take: 100, // Only take latest 100 submissions
      orderBy: { createdAt: 'desc' }
    });
    console.log(`Found ${submissions.length} form submissions`);

    console.log('\n--- Form Fields ---');
    console.log(JSON.stringify(formFields, null, 2));

    console.log('\n--- Form Settings ---');
    console.log(JSON.stringify(formSettings, null, 2));

    console.log('\n\nMigrating to TOS database...');

    // Delete existing data in new DB
    await newPrisma.contactFormField.deleteMany({});
    await newPrisma.contactFormSettings.deleteMany({});
    console.log('Cleared existing form data in TOS database');

    // Migrate ContactFormField
    for (const field of formFields) {
      await newPrisma.contactFormField.create({
        data: {
          fieldKey: field.fieldKey,
          fieldType: field.fieldType,
          label: field.label,
          placeholder: field.placeholder,
          isRequired: field.isRequired,
          options: field.options,
          validation: field.validation,
          order: field.order,
        }
      });
    }
    console.log(`Migrated ${formFields.length} form fields`);

    // Migrate ContactFormSettings
    for (const setting of formSettings) {
      await newPrisma.contactFormSettings.create({
        data: {
          tenantId: setting.tenantId,
          enabledFields: setting.enabledFields,
          problemTypes: setting.problemTypes,
          notificationChannels: setting.notificationChannels,
          messageLanguage: setting.messageLanguage,
          allowFileUpload: setting.allowFileUpload,
          maxFileSize: setting.maxFileSize,
          allowedFileTypes: setting.allowedFileTypes,
          isActive: setting.isActive,
        }
      });
    }
    console.log(`Migrated ${formSettings.length} form settings`);

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await oldPrisma.$disconnect();
    await newPrisma.$disconnect();
  }
}

migrateFormData();
