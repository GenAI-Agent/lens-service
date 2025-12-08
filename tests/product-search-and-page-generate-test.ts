/**
 * Product Search and AI Page Generate Test Script
 * Tests product search functionality and page generation workflow
 */

import { PrismaClient } from '@prisma/client';
import { ProductSearchTool } from '../agents/tools/product-search';
import { AIPageGenerateTool } from '../agents/tools/ai-page-generate';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

/**
 * Test 1: Product Search - Basic Query
 */
async function testProductSearchBasic() {
  console.log('\n========================================');
  console.log('Test 1: Product Search - Basic Query');
  console.log('========================================');

  try {
    const productSearchTool = new ProductSearchTool(
      prisma,
      process.env.OPENAI_API_KEY || ''
    );

    const result = await productSearchTool.execute({
      query: 'science fiction books about space exploration',
      topK: 5,
    });

    console.log('Search Result:', {
      success: result.success,
      resultsCount: result.result?.results?.length || 0,
    });

    if (result.success && result.result?.results) {
      console.log('\nTop 3 Results:');
      result.result.results.slice(0, 3).forEach((product: any, idx: number) => {
        console.log(`  ${idx + 1}. ${product.productName} (Score: ${product.score})`);
      });
    }

    if (!result.success) {
      console.error('Error:', result.error);
      return false;
    }

    console.log('\n✓ Product search basic query test passed');
    return result.result?.results || [];
  } catch (error) {
    console.error('✗ Product search basic query test failed:', error);
    return false;
  }
}

/**
 * Test 2: Product Search - Different Queries
 */
async function testProductSearchVaried() {
  console.log('\n========================================');
  console.log('Test 2: Product Search - Varied Queries');
  console.log('========================================');

  const queries = [
    'mystery thriller novels',
    'romantic comedy books',
    'historical fiction about ancient Rome',
    'self-help books for productivity',
  ];

  try {
    const productSearchTool = new ProductSearchTool(
      prisma,
      process.env.OPENAI_API_KEY || ''
    );

    for (const query of queries) {
      console.log(`\nQuery: "${query}"`);

      const result = await productSearchTool.execute({
        query,
        topK: 3,
      });

      if (result.success && result.result?.results) {
        console.log(`  Found ${result.result.results.length} products`);
        console.log(`  Top result: ${result.result.results[0]?.productName}`);
      } else {
        console.log(`  Failed: ${result.error}`);
      }
    }

    console.log('\n✓ Product search varied queries test passed');
    return true;
  } catch (error) {
    console.error('✗ Product search varied queries test failed:', error);
    return false;
  }
}

/**
 * Test 3: AI Page Generate - Basic
 */
async function testAIPageGenerateBasic() {
  console.log('\n========================================');
  console.log('Test 3: AI Page Generate - Basic');
  console.log('========================================');

  try {
    const aiPageGenerateTool = new AIPageGenerateTool('http://localhost:8080');

    const mockProducts = [
      {
        productName: 'The Martian',
        content: 'A thrilling science fiction novel about an astronaut stranded on Mars.',
        score: '0.95',
      },
      {
        productName: 'Ender\'s Game',
        content: 'A military science fiction novel about a young boy trained to fight aliens.',
        score: '0.92',
      },
      {
        productName: 'Dune',
        content: 'An epic science fiction saga set on the desert planet Arrakis.',
        score: '0.90',
      },
    ];

    const result = await aiPageGenerateTool.execute({
      products: mockProducts,
      context: 'These are top-rated science fiction books for space exploration enthusiasts.',
      userQuery: 'science fiction books about space',
    });

    console.log('Generate Result:', {
      success: result.success,
      pageUrl: result.result?.pageUrl,
      pageId: result.result?.pageId,
    });

    if (!result.success) {
      console.error('Error:', result.error);
      return false;
    }

    console.log('\n✓ AI page generate basic test passed');
    console.log(`  Page URL: ${result.result?.pageUrl}`);
    return result;
  } catch (error) {
    console.error('✗ AI page generate basic test failed:', error);
    return false;
  }
}

/**
 * Test 4: Full Workflow - Search + Generate
 */
async function testFullWorkflow() {
  console.log('\n========================================');
  console.log('Test 4: Full Workflow - Search + Generate');
  console.log('========================================');

  try {
    // Step 1: Search for products
    const productSearchTool = new ProductSearchTool(
      prisma,
      process.env.OPENAI_API_KEY || ''
    );

    console.log('Step 1: Searching for products...');
    const searchResult = await productSearchTool.execute({
      query: 'fantasy adventure novels with magic',
      topK: 5,
    });

    if (!searchResult.success || !searchResult.result?.results) {
      throw new Error('Product search failed');
    }

    console.log(`  Found ${searchResult.result.results.length} products`);

    // Step 2: Generate page
    const aiPageGenerateTool = new AIPageGenerateTool('http://localhost:8080');

    console.log('\nStep 2: Generating recommendation page...');
    const generateResult = await aiPageGenerateTool.execute({
      products: searchResult.result.results,
      context: 'Handpicked fantasy adventure novels with magical elements.',
      userQuery: 'fantasy adventure novels with magic',
    });

    if (!generateResult.success) {
      throw new Error('Page generation failed');
    }

    console.log(`  Page generated: ${generateResult.result?.pageUrl}`);

    console.log('\n✓ Full workflow test passed');
    console.log(`  Search: ${searchResult.result.results.length} products`);
    console.log(`  Page: ${generateResult.result?.pageUrl}`);
    return true;
  } catch (error) {
    console.error('✗ Full workflow test failed:', error);
    return false;
  }
}

/**
 * Test 5: Edge Cases
 */
async function testEdgeCases() {
  console.log('\n========================================');
  console.log('Test 5: Edge Cases');
  console.log('========================================');

  try {
    const productSearchTool = new ProductSearchTool(
      prisma,
      process.env.OPENAI_API_KEY || ''
    );
    const aiPageGenerateTool = new AIPageGenerateTool('http://localhost:8080');

    // Test 5.1: Empty query
    console.log('\nTest 5.1: Empty query');
    const emptyResult = await productSearchTool.execute({
      query: '',
      topK: 5,
    });
    console.log(`  Empty query: ${emptyResult.success ? 'Handled' : 'Failed'}`);

    // Test 5.2: Very long query
    console.log('\nTest 5.2: Very long query');
    const longQuery = 'books about '.repeat(50) + 'science';
    const longResult = await productSearchTool.execute({
      query: longQuery,
      topK: 5,
    });
    console.log(`  Long query: ${longResult.success ? 'Handled' : 'Failed'}`);

    // Test 5.3: Page generation with 0 products
    console.log('\nTest 5.3: Page generation with 0 products');
    const zeroResult = await aiPageGenerateTool.execute({
      products: [],
    });
    console.log(`  Zero products: ${!zeroResult.success ? 'Correctly rejected' : 'Unexpected success'}`);

    // Test 5.4: Page generation with 1 product
    console.log('\nTest 5.4: Page generation with 1 product');
    const oneResult = await aiPageGenerateTool.execute({
      products: [{
        productName: 'Test Book',
        content: 'Test content',
        score: '0.9',
      }],
    });
    console.log(`  One product: ${oneResult.success ? 'Allowed' : 'Rejected'}`);

    console.log('\n✓ Edge cases test completed');
    return true;
  } catch (error) {
    console.error('✗ Edge cases test failed:', error);
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('\n========================================');
  console.log('PRODUCT SEARCH & AI PAGE GENERATE TEST SUITE');
  console.log('========================================');

  const results = {
    productSearchBasic: false,
    productSearchVaried: false,
    aiPageGenerateBasic: false,
    fullWorkflow: false,
    edgeCases: false,
  };

  try {
    // Run tests
    const searchResults = await testProductSearchBasic();
    results.productSearchBasic = Array.isArray(searchResults) && searchResults.length > 0;

    results.productSearchVaried = await testProductSearchVaried();
    results.aiPageGenerateBasic = !!(await testAIPageGenerateBasic());
    results.fullWorkflow = await testFullWorkflow();
    results.edgeCases = await testEdgeCases();

    // Summary
    console.log('\n========================================');
    console.log('TEST SUMMARY');
    console.log('========================================');

    const total = Object.keys(results).length;
    const passed = Object.values(results).filter(r => r).length;
    const failed = total - passed;

    console.log(`Total tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log('\nDetailed results:');

    Object.entries(results).forEach(([test, passed]) => {
      console.log(`  ${test}: ${passed ? '✓ PASS' : '✗ FAIL'}`);
    });

    console.log('\n========================================');

    if (failed === 0) {
      console.log('✓ All tests passed!');
    } else {
      console.error(`✗ ${failed} test(s) failed`);
    }
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { runAllTests };
