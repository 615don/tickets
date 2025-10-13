/**
 * Manual Integration Test for OpenAI Service
 *
 * This script tests the OpenAI service with real API calls.
 *
 * Prerequisites:
 * - Story 7.1 completed (ai_settings table exists)
 * - AI settings configured in database (API key, model, system prompt)
 * - AI_ENCRYPTION_KEY environment variable set
 *
 * Usage:
 *   node backend/src/services/__tests__/openaiService.manual.js
 *
 * Note: This script costs real tokens (~$0.0001-0.0005 per run)
 */

import { summarizeEmail } from '../openaiService.js';
import { AiSettings } from '../../models/AiSettings.js';

async function runManualTest() {
  console.log('========================================');
  console.log('OpenAI Service Manual Integration Test');
  console.log('========================================\n');

  try {
    // Step 1: Fetch AI settings from database
    console.log('Step 1: Fetching AI settings from database...');
    const settings = await AiSettings.getSettings();

    if (!settings.configured) {
      console.error('\n❌ ERROR: AI not configured.');
      console.error('Please configure AI settings:');
      console.error('  1. Add OpenAI API key in settings page');
      console.error('  2. Ensure AI_ENCRYPTION_KEY environment variable is set');
      process.exit(1);
    }

    console.log('✅ AI settings loaded successfully');
    console.log(`   Model: ${settings.openaiModel}`);
    console.log(`   API Key: ${settings.openaiApiKey.substring(0, 10)}...`);
    console.log('');

    // Step 2: Define test email thread
    console.log('Step 2: Preparing test email thread...');
    const testThread = [
      {
        from: 'john@example.com',
        subject: 'Server Issue',
        body: 'Our production server is down since 2pm. Need urgent help. We tried rebooting with no success.'
      }
    ];
    console.log('✅ Test email prepared');
    console.log(`   Emails: ${testThread.length}`);
    console.log(`   Subject: ${testThread[0].subject}`);
    console.log('');

    // Step 3: Test with short lengthClass
    console.log('Step 3: Testing summarization (lengthClass: short)...');
    const startTime = Date.now();
    const result = await summarizeEmail(testThread, settings, 'short');
    const elapsedTime = Date.now() - startTime;

    // Step 4: Display results
    console.log('');
    console.log('========================================');
    console.log('Results');
    console.log('========================================\n');

    if (result.success) {
      console.log('✅ Summarization successful!\n');
      console.log('Description (invoice line item):');
      console.log(`  "${result.description}"\n`);
      console.log('Notes (detailed summary):');
      console.log(`  "${result.notes}"\n`);
      console.log('Metrics:');
      console.log(`  Tokens Used: ${result.tokensUsed}`);
      console.log(`  Response Time: ${result.responseTimeMs}ms (elapsed: ${elapsedTime}ms)`);
      console.log(`  Model: ${settings.openaiModel}`);
      console.log('');

      // Estimate cost (assuming gpt-4o-mini pricing: ~$0.00001 per token)
      const estimatedCost = (result.tokensUsed * 0.00001).toFixed(6);
      console.log(`  Estimated Cost: $${estimatedCost} USD`);
    } else {
      console.error('❌ Summarization failed!\n');
      console.error('Error Type:', result.error);
      console.error('Error Message:', result.message);
      console.error('');
      console.error('Troubleshooting:');
      if (result.error === 'AuthenticationError') {
        console.error('  - Check that your OpenAI API key is valid');
        console.error('  - Verify the API key in the settings page');
      } else if (result.error === 'RateLimitError') {
        console.error('  - Wait a few moments and try again');
        console.error('  - Check your OpenAI account rate limits');
      } else if (result.error === 'TimeoutError') {
        console.error('  - Check your network connection');
        console.error('  - Try again (may be temporary OpenAI slowness)');
      }
      process.exit(1);
    }

    console.log('========================================');
    console.log('Test Complete');
    console.log('========================================');

  } catch (error) {
    console.error('\n❌ Unexpected error during test:');
    console.error(error);
    process.exit(1);
  }
}

// Run the test
runManualTest();
