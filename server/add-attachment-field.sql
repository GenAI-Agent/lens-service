-- Add attachments field to contact_form_fields
INSERT INTO contact_form_fields (field_key, field_type, label, placeholder, is_required, "order", created_at, updated_at)
VALUES (
  'attachments',
  'file',
  '{"zh-TW": "檔案上傳", "en-US": "File Attachments"}',
  '{"zh-TW": "點擊或拖曳檔案上傳", "en-US": "Click or drag files to upload"}',
  false,
  6,
  NOW(),
  NOW()
) ON CONFLICT (field_key) DO NOTHING;
