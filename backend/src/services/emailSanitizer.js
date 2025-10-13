/**
 * Email Sanitizer Service
 *
 * Removes signatures, disclaimers, and quoted replies from email bodies
 * before AI processing to reduce token costs and improve summary quality.
 *
 * Expected token reduction: 30-50% for typical business emails
 */

/**
 * Counts words in text for token approximation
 * @param {string} text - Text to count words in
 * @returns {number} Word count
 */
function countWords(text) {
  if (!text || text.trim().length === 0) {
    return 0;
  }
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Sanitizes email body by removing signatures, disclaimers, and quoted replies
 *
 * @param {string} emailBody - Raw email body text (may contain signatures, footers, quoted text)
 * @returns {{sanitized: string, tokensRemoved: number}} Sanitized email and token savings
 */
export function sanitizeEmail(emailBody) {
  // Handle empty or null input
  if (!emailBody || emailBody.trim().length === 0) {
    return { sanitized: '', tokensRemoved: 0 };
  }

  const originalWordCount = countWords(emailBody);
  const lines = emailBody.split('\n');
  const sanitizedLines = [];

  let inSignature = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Skip empty lines but track them (don't start signature detection on blank lines)
    if (trimmedLine.length === 0) {
      if (!inSignature) {
        sanitizedLines.push(line);
      }
      continue;
    }

    // Check for quoted replies (always remove, regardless of signature state)
    if (/^[>|]/.test(trimmedLine)) {
      continue; // Skip quoted lines
    }

    // Check for Outlook-style quote headers
    if (/^From:.*Sent:/i.test(line)) {
      continue; // Skip Outlook quote headers
    }

    // Once we're in a signature, remove everything after
    if (inSignature) {
      continue;
    }

    // Check for signature delimiters (must be at start of line and match exactly)
    if (/^--\s*$/.test(trimmedLine) || /^___+$/.test(trimmedLine) || /^---+$/.test(trimmedLine)) {
      inSignature = true;
      continue; // Don't include the delimiter itself
    }

    // Check for mobile signatures - these mark the START of signature block
    if (/^sent from my (iphone|android)/i.test(trimmedLine) || /^get outlook for (ios|android)/i.test(trimmedLine)) {
      inSignature = true;
      continue; // Don't include the signature line itself
    }

    // Check for email confidentiality disclaimers
    if (/confidential|intended only|not the intended recipient/i.test(line)) {
      inSignature = true;
      continue;
    }

    // Not in signature and not quoted - keep the line
    sanitizedLines.push(line);
  }

  const sanitized = sanitizedLines.join('\n').trim();
  const sanitizedWordCount = countWords(sanitized);

  // Calculate approximate token savings (1 token ≈ 0.75 words)
  const tokensRemoved = Math.round((originalWordCount - sanitizedWordCount) * 0.75);

  // Log sanitization metrics (but never log email content for privacy)
  console.log('[EmailSanitizer] Sanitized email:', {
    originalLength: emailBody.length,
    sanitizedLength: sanitized.length,
    tokensRemoved: tokensRemoved,
    reductionPercent: emailBody.length > 0
      ? Math.round((1 - sanitized.length / emailBody.length) * 100)
      : 0
  });

  // Log warning for signature-only emails
  if (sanitized.length === 0 && emailBody.length > 0) {
    console.warn('[EmailSanitizer] Email contained only signatures/boilerplate - no content remaining');
  }

  return { sanitized, tokensRemoved };
}
