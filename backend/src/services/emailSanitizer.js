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
 * Strategy for email chains:
 * 1. Split email into reply segments (based on "From:...Sent:" headers)
 * 2. For each segment, only remove signatures at the END (trailing signatures)
 * 3. This preserves real content that comes after embedded signatures in chains
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

  // First pass: Split into reply segments by detecting Outlook-style headers
  // Each segment is processed independently to preserve content after embedded signatures
  // NOTE: Only multi-line "From:\nSent:" patterns are boundaries. Single-line patterns are quoted replies.
  const segments = [];
  let currentSegment = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Check for single-line Outlook quote headers (these are quoted replies, not boundaries)
    // Example: "From: John Smith <john@example.com> Sent: Tuesday, January 14, 2025"
    if (/^From:.*Sent:/i.test(trimmedLine)) {
      // This is a quoted reply header - skip it (don't add to segment, don't start new segment)
      continue;
    }

    // Detect multi-line reply boundaries (From: on one line, Sent: on next)
    // These indicate a new email in the chain
    if (/^From:.*<.*@.*>/.test(trimmedLine) &&
        i + 1 < lines.length && /^Sent:/.test(lines[i + 1].trim())) {
      // Save current segment and start new one
      if (currentSegment.length > 0) {
        segments.push(currentSegment);
        currentSegment = [];
      }
      // Skip the From: and Sent: headers themselves
      i++; // Skip the Sent: line too
      continue;
    }

    currentSegment.push(line);
  }

  // Add final segment
  if (currentSegment.length > 0) {
    segments.push(currentSegment);
  }

  // Second pass: Process each segment to remove trailing signatures only
  const sanitizedSegments = segments.map(segmentLines => {
    const output = [];
    let inSignature = false;

    for (let i = 0; i < segmentLines.length; i++) {
      const line = segmentLines[i];
      const trimmedLine = line.trim();

      // Skip empty lines but keep them if not in signature
      if (trimmedLine.length === 0) {
        if (!inSignature) {
          output.push(line);
        }
        continue;
      }

      // If already in signature, skip all remaining lines
      if (inSignature) {
        continue;
      }

      // Check for signature delimiters (must be at start of line and match exactly)
      if (/^--\s*$/.test(trimmedLine) || /^___+$/.test(trimmedLine) || /^---+$/.test(trimmedLine)) {
        inSignature = true;
        continue;
      }

      // Check for mobile signatures
      if (/^sent from my (iphone|android)/i.test(trimmedLine) || /^get outlook for (ios|android)/i.test(trimmedLine)) {
        inSignature = true;
        continue;
      }

      // Check for email confidentiality disclaimers
      if (/confidential|intended only|not the intended recipient|notice:/i.test(trimmedLine)) {
        inSignature = true;
        continue;
      }

      // Not in signature yet - keep the line
      output.push(line);
    }

    return output;
  });

  // Third pass: Remove quoted replies (lines starting with > or |)
  const finalLines = [];
  for (const segment of sanitizedSegments) {
    for (const line of segment) {
      const trimmedLine = line.trim();

      // Skip quoted lines
      if (/^[>|]/.test(trimmedLine)) {
        continue;
      }

      finalLines.push(line);
    }
  }

  const sanitized = finalLines.join('\n').trim();
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
