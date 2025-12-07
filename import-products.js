require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Path to JSONL files
const DATA_DIR = path.join(__dirname, '..', 'TzAI_web', 'data');

// JSONL files to process
const JSONL_FILES = [
  'books_bestsellers.jsonl',
  'books_79_discount.jsonl',
  'books_buyout.jsonl',
  'books_new.jsonl',
];

/**
 * Generate embedding for text using OpenAI
 */
async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return JSON.stringify(response.data[0].embedding);
  } catch (error) {
    console.error('Error generating embedding:', error.message);
    return null;
  }
}

/**
 * Parse JSONL file and return array of objects
 */
function parseJSONL(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');
  return lines.map(line => JSON.parse(line));
}

/**
 * Import products from JSONL files with deduplication
 */
async function importProducts() {
  console.log('Starting product import...\n');

  // Map to store deduplicated products
  // Key: org_prod_id, Value: product data
  const productsMap = new Map();

  // Read and process all JSONL files
  for (const fileName of JSONL_FILES) {
    const filePath = path.join(DATA_DIR, fileName);
    console.log(`Reading ${fileName}...`);

    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}`);
      continue;
    }

    const items = parseJSONL(filePath);
    console.log(`Found ${items.length} items in ${fileName}`);

    for (const item of items) {
      const productId = item.org_prod_id;

      if (productsMap.has(productId)) {
        // Product already exists, add book_type to the list
        const existing = productsMap.get(productId);
        if (!existing.data.book_type.includes(item.book_type)) {
          existing.data.book_type.push(item.book_type);
        }
      } else {
        // New product
        productsMap.set(productId, {
          productId: item.org_prod_id,
          productName: item.title,
          description: item.title,
          content: `${item.author} | ${item.publisher} | ${item.category_name} | NT$${item.sale_price}`,
          data: {
            list_price: item.list_price,
            sale_price: item.sale_price,
            category_name: item.category_name,
            book_type: [item.book_type],
          },
          createdAt: new Date(item.publish_date),
        });
      }
    }
  }

  console.log(`\nTotal unique products: ${productsMap.size}`);
  console.log('Clearing existing products in database...');

  // Clear existing products
  await prisma.product.deleteMany({});
  console.log('Database cleared.\n');

  // Insert products with embeddings
  let count = 0;
  const total = productsMap.size;

  for (const [productId, product] of productsMap) {
    count++;
    console.log(`[${count}/${total}] Processing: ${product.productName.substring(0, 50)}...`);

    // Generate embedding for description
    const embedding = await generateEmbedding(product.description);

    // Insert product
    await prisma.product.create({
      data: {
        productId: product.productId,
        productName: product.productName,
        description: product.description,
        content: product.content,
        data: product.data,
        embedding: embedding,
        createdAt: product.createdAt,
      },
    });

    // Rate limit: delay between requests to avoid hitting API limits
    if (count % 10 === 0) {
      console.log('  Pausing for rate limit...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`\n✅ Import completed! Imported ${count} products.`);
}

async function main() {
  try {
    await importProducts();
  } catch (error) {
    console.error('Import error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
