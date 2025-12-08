/**
 * Web Use Tool Test Script
 * Tests all web interaction capabilities using real browser automation
 *
 * This test opens http://localhost:8080/test-page.html and performs:
 * - Click operations
 * - Type/input operations
 * - Scroll operations
 * - Highlight effects
 * - Extract data
 * - Screenshot capture
 */

import puppeteer, { Browser, Page } from 'puppeteer';

const TEST_URL = 'http://localhost:8080/test-page.html';
const SCREENSHOT_DIR = './test-screenshots';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  screenshot?: string;
}

/**
 * Test Suite for Web Use Tool
 */
class WebUseTestSuite {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private results: TestResult[] = [];

  async setup() {
    console.log('Setting up browser...');
    this.browser = await puppeteer.launch({
      headless: false, // Show browser for visual verification
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1280, height: 720 });

    console.log(`Navigating to ${TEST_URL}...`);
    await this.page.goto(TEST_URL, { waitUntil: 'networkidle0' });
    await this.sleep(1000);
  }

  async teardown() {
    if (this.browser) {
      console.log('Closing browser...');
      await this.browser.close();
    }
  }

  /**
   * Test 1: Click Button
   */
  async testClick() {
    const testName = 'Click Button Test';
    console.log(`\n========================================`);
    console.log(`Test: ${testName}`);
    console.log(`========================================`);

    try {
      // Click primary button
      console.log('Clicking primary button...');
      await this.page!.click('#click-test-btn');
      await this.sleep(500);

      // Verify click result
      const clickResult = await this.page!.$eval('#click-result', el => el.textContent);
      console.log('Click result:', clickResult);

      if (clickResult && clickResult.includes('Primary button clicked')) {
        console.log('✓ Click test passed');
        this.results.push({ name: testName, passed: true });
      } else {
        throw new Error('Click result not found');
      }
    } catch (error) {
      console.error('✗ Click test failed:', error);
      this.results.push({
        name: testName,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Test 2: Type into Input Fields
   */
  async testType() {
    const testName = 'Type Input Test';
    console.log(`\n========================================`);
    console.log(`Test: ${testName}`);
    console.log(`========================================`);

    try {
      // Type into name field
      console.log('Typing into name field...');
      await this.page!.click('#name-input');
      await this.page!.type('#name-input', 'John Doe');
      await this.sleep(300);

      // Type into email field
      console.log('Typing into email field...');
      await this.page!.click('#email-input');
      await this.page!.type('#email-input', 'john@example.com');
      await this.sleep(300);

      // Type into message field
      console.log('Typing into message field...');
      await this.page!.click('#message-input');
      await this.page!.type('#message-input', 'This is a test message');
      await this.sleep(300);

      // Click show button
      await this.page!.evaluate(() => {
        (document.querySelector('button[onclick="showInputs()"]') as HTMLElement).click();
      });
      await this.sleep(500);

      // Verify input was captured
      const inputResult = await this.page!.$eval('#input-result', el => el.textContent);
      console.log('Input result:', inputResult);

      if (inputResult && inputResult.includes('John Doe') && inputResult.includes('john@example.com')) {
        console.log('✓ Type test passed');
        this.results.push({ name: testName, passed: true });
      } else {
        throw new Error('Input not captured correctly');
      }
    } catch (error) {
      console.error('✗ Type test failed:', error);
      this.results.push({
        name: testName,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Test 3: Scroll
   */
  async testScroll() {
    const testName = 'Scroll Test';
    console.log(`\n========================================`);
    console.log(`Test: ${testName}`);
    console.log(`========================================`);

    try {
      console.log('Scrolling to scroll section...');
      await this.page!.evaluate(() => {
        const section = document.querySelector('#scroll-section');
        section?.scrollIntoView({ behavior: 'smooth' });
      });
      await this.sleep(1000);

      console.log('Scrolling within scroll container...');
      await this.page!.evaluate(() => {
        const scrollContainer = document.querySelector('.scroll-content');
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      });
      await this.sleep(1000);

      // Check if scroll target is visible
      const targetVisible = await this.page!.evaluate(() => {
        const target = document.querySelector('#scroll-target');
        return target !== null;
      });

      if (targetVisible) {
        console.log('✓ Scroll test passed');
        this.results.push({ name: testName, passed: true });
      } else {
        throw new Error('Scroll target not found');
      }
    } catch (error) {
      console.error('✗ Scroll test failed:', error);
      this.results.push({
        name: testName,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Test 4: Extract Data
   */
  async testExtract() {
    const testName = 'Extract Data Test';
    console.log(`\n========================================`);
    console.log(`Test: ${testName}`);
    console.log(`========================================`);

    try {
      console.log('Extracting product list...');
      const products = await this.page!.evaluate(() => {
        const items = document.querySelectorAll('.extract-item');
        return Array.from(items).map(item => ({
          text: item.textContent?.trim(),
          id: item.getAttribute('data-id'),
        }));
      });

      console.log('Extracted products:', products);

      if (products.length === 3 && products[0].text?.includes('Product A')) {
        console.log('✓ Extract test passed');
        this.results.push({ name: testName, passed: true });
      } else {
        throw new Error('Failed to extract products');
      }

      // Extract hidden data
      console.log('Extracting hidden data attribute...');
      const secretData = await this.page!.evaluate(() => {
        const hidden = document.querySelector('#hidden-data');
        return hidden?.getAttribute('data-secret');
      });

      console.log('Secret data:', secretData);
    } catch (error) {
      console.error('✗ Extract test failed:', error);
      this.results.push({
        name: testName,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Test 5: Screenshot
   */
  async testScreenshot() {
    const testName = 'Screenshot Test';
    console.log(`\n========================================`);
    console.log(`Test: ${testName}`);
    console.log(`========================================`);

    try {
      console.log('Taking full page screenshot...');
      const screenshot = await this.page!.screenshot({
        path: `${SCREENSHOT_DIR}/test-page-full.png`,
        fullPage: true,
      });

      console.log('Taking element screenshot...');
      const button = await this.page!.$('#click-test-btn');
      await button?.screenshot({
        path: `${SCREENSHOT_DIR}/button-element.png`,
      });

      if (screenshot) {
        console.log('✓ Screenshot test passed');
        this.results.push({ name: testName, passed: true });
      } else {
        throw new Error('Screenshot failed');
      }
    } catch (error) {
      console.error('✗ Screenshot test failed:', error);
      this.results.push({
        name: testName,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Test 6: Toggle Visibility
   */
  async testToggle() {
    const testName = 'Toggle Visibility Test';
    console.log(`\n========================================`);
    console.log(`Test: ${testName}`);
    console.log(`========================================`);

    try {
      console.log('Checking initial visibility...');
      const initialVisible = await this.page!.evaluate(() => {
        const section = document.querySelector('#hidden-section') as HTMLElement;
        const computed = window.getComputedStyle(section);
        return computed.display !== 'none';
      });

      console.log('Initially visible:', initialVisible);

      console.log('Clicking toggle button...');
      await this.page!.evaluate(() => {
        const button = document.querySelector('button[onclick="toggleHidden()"]') as HTMLElement;
        button.click();
      });
      await this.sleep(500);

      const newVisible = await this.page!.evaluate(() => {
        const section = document.querySelector('#hidden-section') as HTMLElement;
        const computed = window.getComputedStyle(section);
        return computed.display !== 'none';
      });

      console.log('Now visible:', newVisible);

      // Should toggle from hidden to visible
      if (!initialVisible && newVisible) {
        console.log('✓ Toggle test passed');
        this.results.push({ name: testName, passed: true });
      } else {
        throw new Error(`Toggle did not work (initial: ${initialVisible}, new: ${newVisible})`);
      }
    } catch (error) {
      console.error('✗ Toggle test failed:', error);
      this.results.push({
        name: testName,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('\n========================================');
    console.log('WEB USE TOOL TEST SUITE');
    console.log('========================================');

    try {
      await this.setup();

      await this.testClick();
      await this.testType();
      await this.testScroll();
      await this.testExtract();
      await this.testScreenshot();
      await this.testToggle();

      // Keep browser open for visual inspection
      console.log('\nBrowser will remain open for 5 seconds for visual inspection...');
      await this.sleep(5000);

    } finally {
      await this.teardown();
      this.printSummary();
    }
  }

  /**
   * Print test summary
   */
  printSummary() {
    console.log('\n========================================');
    console.log('TEST SUMMARY');
    console.log('========================================');

    const total = this.results.length;
    const passed = this.results.filter(r => r.passed).length;
    const failed = total - passed;

    console.log(`Total tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log('\nDetailed results:');

    this.results.forEach(result => {
      const status = result.passed ? '✓ PASS' : '✗ FAIL';
      console.log(`  ${result.name}: ${status}`);
      if (result.error) {
        console.log(`    Error: ${result.error}`);
      }
    });

    console.log('\n========================================');

    if (failed === 0) {
      console.log('✓ All tests passed!');
    } else {
      console.error(`✗ ${failed} test(s) failed`);
      process.exit(1);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run tests
if (require.main === module) {
  const testSuite = new WebUseTestSuite();
  testSuite.runAllTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { WebUseTestSuite };
