/**
 * Seed script for Contact Form Fields
 * Run with: npx tsx prisma/seed-form-fields.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding contact form fields...');

  const fields = [
    {
      fieldKey: 'name',
      fieldType: 'text',
      label: { 'zh-TW': '姓名', 'en-US': 'Name' },
      placeholder: { 'zh-TW': '請輸入您的姓名', 'en-US': 'Please enter your name' },
      isRequired: true,
      order: 1,
    },
    {
      fieldKey: 'email',
      fieldType: 'email',
      label: { 'zh-TW': '電子郵件', 'en-US': 'Email' },
      placeholder: { 'zh-TW': 'example@email.com', 'en-US': 'example@email.com' },
      isRequired: true,
      order: 2,
    },
    {
      fieldKey: 'phone',
      fieldType: 'text',
      label: { 'zh-TW': '電話號碼', 'en-US': 'Phone Number' },
      placeholder: { 'zh-TW': '請輸入您的電話號碼', 'en-US': 'Please enter your phone number' },
      isRequired: false,
      order: 3,
    },
    {
      fieldKey: 'subject',
      fieldType: 'text',
      label: { 'zh-TW': '問題主旨', 'en-US': 'Subject' },
      placeholder: { 'zh-TW': '請輸入問題主旨', 'en-US': 'Please enter subject' },
      isRequired: false,
      order: 4,
    },
    {
      fieldKey: 'problemType',
      fieldType: 'select',
      label: { 'zh-TW': '問題類型', 'en-US': 'Problem Type' },
      placeholder: { 'zh-TW': '請選擇問題類型', 'en-US': 'Please select a problem type' },
      isRequired: true,
      options: [
        { key: 'accountIssue', label: { 'zh-TW': '帳戶問題', 'en-US': 'Account Issue' } },
        { key: 'paymentIssue', label: { 'zh-TW': '付款問題', 'en-US': 'Payment Issue' } },
        { key: 'techSupport', label: { 'zh-TW': '技術支援', 'en-US': 'Technical Support' } },
        { key: 'feedback', label: { 'zh-TW': '建議與回饋', 'en-US': 'Feedback' } },
        { key: 'other', label: { 'zh-TW': '其他', 'en-US': 'Other' } },
      ],
      order: 5,
    },
    {
      fieldKey: 'message',
      fieldType: 'textarea',
      label: { 'zh-TW': '問題描述', 'en-US': 'Message' },
      placeholder: { 'zh-TW': '請詳細描述您遇到的問題...', 'en-US': 'Please describe your issue...' },
      isRequired: true,
      order: 6,
    },
    {
      fieldKey: 'attachments',
      fieldType: 'file',
      label: { 'zh-TW': '檔案上傳', 'en-US': 'File Upload' },
      placeholder: { 'zh-TW': '上傳相關檔案', 'en-US': 'Upload files' },
      isRequired: false,
      order: 7,
    },
  ];

  for (const field of fields) {
    await prisma.contactFormField.upsert({
      where: { fieldKey: field.fieldKey },
      update: field,
      create: field,
    });
    console.log(`Created/Updated field: ${field.fieldKey}`);
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
