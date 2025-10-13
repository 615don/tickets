/// <reference types="office-js" />

import type { EmailForSummarization } from '../api/ai';

/**
 * Extract email body as plain text using Office.js async API
 * Handles Office.js errors gracefully to prevent add-in crashes
 *
 * @param mailItem - Office.js MessageRead item
 * @returns Promise resolving to email body text, or empty string on error
 */
async function getEmailBodyAsync(mailItem: Office.MessageRead): Promise<string> {
  return new Promise((resolve) => {
    try {
      mailItem.body.getAsync(Office.CoercionType.Text, (result) => {
        if (result.status === Office.AsyncResultStatus.Succeeded) {
          resolve(result.value);
        } else {
          console.error('Office.js body error:', result.error);
          resolve(''); // Graceful fallback - empty body
        }
      });
    } catch (error) {
      // Office.js API not available or other error
      console.error('Failed to get email body:', error);
      resolve('');
    }
  });
}

/**
 * Build email thread for AI summarization from Office.js mail item
 * Converts Office.js email properties to backend API format
 *
 * **Office.js Integration:**
 * - Uses async APIs: `mailItem.body.getAsync()` requires callback pattern
 * - Handles missing fields with fallback values (unknown sender, no subject)
 * - Gracefully handles Office.js errors without crashing add-in
 *
 * **MVP Scope:**
 * - Returns single email only (current email being viewed)
 * - Future: Expand to full conversation thread if Story 7.4 backend supports it
 *
 * @param mailItem - Office.js MessageRead item from Office.context.mailbox.item
 * @returns Promise resolving to array of email objects (currently single-element array)
 *
 * **Usage:**
 * ```typescript
 * const mailItem = Office.context.mailbox.item as Office.MessageRead;
 * const emailThread = await buildEmailThread(mailItem);
 * const summary = await summarizeEmail(emailThread);
 * ```
 *
 * Story 7.8: AI Summarization Integration (New Tickets)
 */
export async function buildEmailThread(
  mailItem: Office.MessageRead
): Promise<EmailForSummarization[]> {
  // Extract sender email (try multiple Office.js properties)
  const from =
    mailItem.from?.emailAddress ||
    mailItem.sender?.emailAddress ||
    'unknown';

  // Extract subject with fallback
  const subject = mailItem.subject || '(no subject)';

  // Extract body asynchronously
  const body = await getEmailBodyAsync(mailItem);

  // Return single-email array (MVP scope)
  return [
    {
      from,
      subject,
      body,
    },
  ];
}
