/**
 * Email Thread Processor Service
 *
 * Intelligently selects and formats emails from thread for AI summarization,
 * balancing context quality with token costs (max 5 emails or configurable word limit).
 *
 * Selection Priority:
 * 1. Most recent email (ALWAYS included, even if exceeds word limit - truncate if needed)
 * 2. Older emails in chronological order until limits reached
 *
 * Limits:
 * - Max 5 emails (prevents excessive context)
 * - Max words configurable (default 4,000 words ~5,333 tokens, cost optimization)
 *
 * Note: Email sanitization (signature removal) is handled by the AI via system prompt
 * instead of pre-processing. The emailSanitizer module is deprecated but kept for reference.
 */

// import { sanitizeEmail } from './emailSanitizer.js'; // DEPRECATED: AI handles sanitization

const MAX_EMAILS = 5;
const DEFAULT_MAX_WORDS = 4000;

/**
 * Counts words in text for limit enforcement
 * @param {string} text - Text to count words in
 * @returns {number} Word count
 */
function countWords(text) {
  if (!text || text.trim().length === 0) return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Truncates text to specified word limit
 * @param {string} text - Text to truncate
 * @param {number} maxWords - Maximum number of words
 * @returns {string} Truncated text with "..." suffix
 */
function truncateToWordLimit(text, maxWords) {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ') + '...';
}

/**
 * Validates and normalizes email object structure
 * @param {Object} email - Raw email object
 * @returns {Object} Validated email object with guaranteed fields
 */
function validateEmailObject(email) {
  return {
    from: email.from || '',
    subject: email.subject || '',
    body: email.body || ''
  };
}

/**
 * Processes email thread for AI summarization
 * Selects most relevant emails within token/count limits
 *
 * @param {Array<Object>} emails - Array of raw email objects { from, subject, body }
 * @param {number} maxWords - Maximum word count limit (default: 4000)
 * @returns {Promise<Object>} Processed thread with selected emails and metadata
 * @returns {Array<Object>} result.selectedEmails - Sanitized email objects (chronological)
 * @returns {boolean} result.truncated - True if limits exceeded
 * @returns {number} result.emailCount - Number of emails selected (1-5)
 * @returns {number} result.wordCount - Total word count across selected emails
 * @returns {string} result.lengthClass - 'short' | 'medium' | 'long' for smart summarization
 */
export function processEmailThread(emails, maxWords = DEFAULT_MAX_WORDS) {
  // Validate input
  if (!emails || emails.length === 0) {
    throw new Error('Email thread is empty - no emails to process');
  }

  // Normalize email objects (handle missing/null fields)
  const normalizedEmails = emails.map(validateEmailObject);

  // Assume emails are already in chronological order (oldest to newest)
  const sortedEmails = [...normalizedEmails];

  const selectedEmails = [];
  let totalWordCount = 0;
  let truncated = false;

  // Separate most recent email from older emails
  const mostRecentEmail = sortedEmails[sortedEmails.length - 1];
  const olderEmails = sortedEmails.slice(0, -1);

  // Process most recent email FIRST (it's always included - AC6)
  // BYPASSING SANITIZER: Let AI handle signature removal via system prompt instead
  // const recentSanitized = sanitizeEmail(mostRecentEmail.body);
  // let recentBody = recentSanitized.sanitized;
  let recentBody = mostRecentEmail.body; // Pass through unsanitized
  let recentWordCount = countWords(recentBody);

  // Truncate most recent email if it alone exceeds maxWords
  if (recentWordCount > maxWords) {
    recentBody = truncateToWordLimit(recentBody, maxWords);
    recentWordCount = maxWords;
    truncated = true;
  }

  // Calculate how much word budget remains for older emails
  const remainingWords = maxWords - recentWordCount;

  // Add older emails until limits reached
  for (const email of olderEmails) {
    // Reserve 1 slot for most recent email (already processed above)
    if (selectedEmails.length >= MAX_EMAILS - 1) {
      truncated = true;
      break;
    }

    // BYPASSING SANITIZER: Let AI handle signature removal via system prompt instead
    // const sanitized = sanitizeEmail(email.body);
    // const emailWordCount = countWords(sanitized.sanitized);
    const emailBody = email.body; // Pass through unsanitized
    const emailWordCount = countWords(emailBody);

    // Check if adding this email would exceed word limit
    if (totalWordCount + emailWordCount > remainingWords) {
      truncated = true;
      break;
    }

    selectedEmails.push({
      from: email.from,
      subject: email.subject,
      body: emailBody
    });
    totalWordCount += emailWordCount;
  }

  // Add most recent email at the end (to maintain chronological order)
  selectedEmails.push({
    from: mostRecentEmail.from,
    subject: mostRecentEmail.subject,
    body: recentBody
  });
  totalWordCount += recentWordCount;

  // Classify email thread length for smart minification (Story 7.10 integration)
  let lengthClass = 'medium'; // default
  if (totalWordCount < 200) {
    lengthClass = 'short';
  } else if (totalWordCount > 1000) {
    lengthClass = 'long';
  }

  // Log thread processing metrics (never log email content for privacy)
  console.log('[EmailThreadProcessor] Processed email thread:', {
    totalInputEmails: emails.length,
    selectedEmailCount: selectedEmails.length,
    totalWordCount: totalWordCount,
    lengthClass: lengthClass,
    truncated: truncated
  });

  // Log warning if thread was truncated
  if (truncated) {
    console.warn('[EmailThreadProcessor] Thread truncated:', {
      reason: selectedEmails.length >= MAX_EMAILS ? '5-email limit' : `${maxWords}-word limit`,
      inputEmails: emails.length,
      selectedEmails: selectedEmails.length,
      maxWordsLimit: maxWords
    });
  }

  return {
    selectedEmails,           // Array of sanitized email objects
    truncated,                // Boolean: true if emails/words exceeded limits
    emailCount: selectedEmails.length,
    wordCount: totalWordCount,
    lengthClass               // 'short' | 'medium' | 'long'
  };
}
