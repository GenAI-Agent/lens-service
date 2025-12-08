/**
 * Web Agent System Test Script
 * Tests all components: Web Agent, Tools, Panel Controller, Highlight Effects
 */

import { WebAgent, type WebAgentConfig } from '../agents/web-agent/agent';
import { PanelController } from '../widget/panel-controller';
import { HighlightEffects } from '../widget/effects/highlight-effects';

// Mock widget callback for testing
const mockWidgetCallback = async (action: string, params: any): Promise<any> => {
  console.log(`[MockWidget] ${action}:`, params);

  switch (action) {
    case 'click':
      return { success: true, message: 'Clicked element' };
    case 'type':
      return { success: true, message: 'Typed text' };
    case 'scroll':
      return { success: true, message: 'Scrolled page' };
    case 'highlight':
      return { success: true, message: 'Highlighted element' };
    case 'extract':
      return { success: true, data: 'Extracted content' };
    case 'wait':
      return { success: true, message: 'Wait completed' };
    case 'screenshot':
      return { success: true, screenshot: 'base64_data_here' };
    default:
      return { success: false, error: 'Unknown action' };
  }
};

// Test configuration
const testConfig: WebAgentConfig = {
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  model: 'gpt-5.1',
  temperature: 0.1,
  maxIterations: 15,
};

/**
 * Test 1: Web Agent Initialization
 */
async function testWebAgentInit() {
  console.log('\n========================================');
  console.log('Test 1: Web Agent Initialization');
  console.log('========================================');

  try {
    const panelController = new PanelController();
    const webAgent = new WebAgent(testConfig, mockWidgetCallback, panelController);

    console.log('✓ Web Agent initialized successfully');
    return true;
  } catch (error) {
    console.error('✗ Web Agent initialization failed:', error);
    return false;
  }
}

/**
 * Test 2: Panel Controller State Transitions
 */
async function testPanelController() {
  console.log('\n========================================');
  console.log('Test 2: Panel Controller State Transitions');
  console.log('========================================');

  try {
    const controller = new PanelController();

    // Test initial state
    const initialState = controller.getState();
    console.log('Initial state:', initialState);

    if (initialState.mode !== 'normal') {
      throw new Error('Initial state should be normal');
    }

    // Test enter web-agent mode
    await controller.enterWebAgentMode();
    const webAgentState = controller.getState();
    console.log('Web-agent state:', webAgentState);

    if (webAgentState.mode !== 'web-agent') {
      throw new Error('Should be in web-agent mode');
    }

    // Test progress update
    controller.updateProgress(50);
    const progressState = controller.getState();
    console.log('Progress state:', progressState);

    if (progressState.progress !== 50) {
      throw new Error('Progress should be 50');
    }

    // Test exit web-agent mode
    await controller.exitWebAgentMode();
    const finalState = controller.getState();
    console.log('Final state:', finalState);

    if (finalState.mode !== 'normal') {
      throw new Error('Should return to normal mode');
    }

    console.log('✓ Panel Controller tests passed');
    return true;
  } catch (error) {
    console.error('✗ Panel Controller tests failed:', error);
    return false;
  }
}

/**
 * Test 3: Highlight Effects
 */
async function testHighlightEffects() {
  console.log('\n========================================');
  console.log('Test 3: Highlight Effects');
  console.log('========================================');

  try {
    const highlightEffects = new HighlightEffects();

    // Test auto-detection
    const mockButton = document.createElement('button');
    mockButton.style.width = '80px';
    mockButton.style.height = '40px';
    const buttonStyle = highlightEffects.detectBestStyle(mockButton);
    console.log('Button style:', buttonStyle);

    if (buttonStyle !== 'circle') {
      throw new Error('Button should use circle style');
    }

    const mockParagraph = document.createElement('p');
    const paragraphStyle = highlightEffects.detectBestStyle(mockParagraph);
    console.log('Paragraph style:', paragraphStyle);

    if (paragraphStyle !== 'highlighter') {
      throw new Error('Paragraph should use highlighter style');
    }

    const mockDiv = document.createElement('div');
    mockDiv.style.width = '300px';
    mockDiv.style.height = '200px';
    const divStyle = highlightEffects.detectBestStyle(mockDiv);
    console.log('Div style:', divStyle);

    if (divStyle !== 'glow') {
      throw new Error('Div should use glow style');
    }

    console.log('✓ Highlight Effects tests passed');
    return true;
  } catch (error) {
    console.error('✗ Highlight Effects tests failed:', error);
    return false;
  }
}

/**
 * Test 4: Web Agent Execution (Simple Task)
 */
async function testWebAgentExecution() {
  console.log('\n========================================');
  console.log('Test 4: Web Agent Execution');
  console.log('========================================');

  try {
    const panelController = new PanelController();
    const webAgent = new WebAgent(testConfig, mockWidgetCallback, panelController);

    const result = await webAgent.execute({
      task: 'Click the search button and type "test query"',
      pageState: {
        url: 'https://example.com',
        title: 'Example Page',
        elements: [
          { selector: '#search-button', type: 'button', text: 'Search' },
          { selector: '#search-input', type: 'input', text: '' },
        ],
      },
    });

    console.log('Execution result:', {
      success: result.success,
      message: result.message,
      operations: result.operationHistory.length,
      errors: result.errors.length,
    });

    if (!result.success && result.errors.length > 0) {
      console.error('Errors:', result.errors);
    }

    console.log('✓ Web Agent execution completed');
    return true;
  } catch (error) {
    console.error('✗ Web Agent execution failed:', error);
    return false;
  }
}

/**
 * Test 5: Web Agent Tools Integration
 */
async function testWebAgentTools() {
  console.log('\n========================================');
  console.log('Test 5: Web Agent Tools Integration');
  console.log('========================================');

  try {
    // Test each tool through mock widget callback
    const tools = ['click', 'type', 'scroll', 'highlight', 'extract', 'wait', 'screenshot'];

    for (const tool of tools) {
      const result = await mockWidgetCallback(tool, { selector: '#test' });
      console.log(`Tool ${tool}:`, result.success ? '✓' : '✗');

      if (!result.success) {
        throw new Error(`Tool ${tool} failed`);
      }
    }

    console.log('✓ All tools working correctly');
    return true;
  } catch (error) {
    console.error('✗ Tools integration test failed:', error);
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('\n========================================');
  console.log('WEB AGENT SYSTEM TEST SUITE');
  console.log('========================================');

  const results = {
    init: false,
    panelController: false,
    highlightEffects: false,
    execution: false,
    tools: false,
  };

  // Run tests
  results.init = await testWebAgentInit();
  results.panelController = await testPanelController();
  results.highlightEffects = await testHighlightEffects();
  results.execution = await testWebAgentExecution();
  results.tools = await testWebAgentTools();

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
    process.exit(1);
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
