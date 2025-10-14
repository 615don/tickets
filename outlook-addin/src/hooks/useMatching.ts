import { useEffect, useState } from 'react';
import type { EmailContext, MatchingResult, MatchingError } from '../types';
import { matchContactByEmail, matchClientByDomain } from '../lib/api/matching';
import { extractDomain } from '../lib/utils/domainExtractor';
import { summarizeEmail } from '../lib/api/ai';
import { buildEmailThread } from '../lib/utils/emailThreadBuilder';

/**
 * React hook to trigger contact/domain matching when email context changes
 * Implements sequential fallback logic: contact match first, then domain match if no contact found
 * Implements debouncing and request cancellation for rapid email selection changes
 *
 * @param emailContext - Email context from Office.js (or null if no email selected)
 * @returns Object containing matching result, loading state, and error state
 *
 * Story 4.1: Email-to-Contact Matching Integration
 * Story 4.2: Domain-to-Client Fallback Matching
 */
export function useMatching(emailContext: EmailContext | null) {
  const [matchingResult, setMatchingResult] = useState<MatchingResult | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [error, setError] = useState<MatchingError | null>(null);
  const [aiSummary, setAiSummary] = useState<{ description: string; notes: string } | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    // Reset state when no email context
    if (!emailContext) {
      setMatchingResult(null);
      setIsMatching(false);
      setError(null);
      setAiSummary(null);
      setIsGeneratingAi(false);
      setAiError(null);
      return;
    }

    // AbortController for canceling in-flight requests
    const abortController = new AbortController();

    // Debounce API call by 300ms to prevent excessive requests during rapid email switching
    const timeoutId = setTimeout(async () => {
      setIsMatching(true);
      setError(null);
      setAiSummary(null); // Clear previous AI summary when switching emails
      setAiError(null);

      try {
        // STEP 1: Try contact matching first (Story 4.1)
        const contactMatches = await matchContactByEmail(emailContext.senderEmail, abortController.signal);

        if (contactMatches.length > 0) {
          // Contact match found - use it (highest priority)
          setMatchingResult({
            type: 'contact-matched',
            client: {
              id: contactMatches[0].client.id,
              name: contactMatches[0].client.name,
            },
            contact: {
              id: contactMatches[0].contact.id,
              name: contactMatches[0].contact.name,
              email: contactMatches[0].contact.email,
            },
          });

          // Clear matching state before starting AI generation
          setIsMatching(false);

          // Story 7.8: Trigger AI summarization after contact match
          setIsGeneratingAi(true);
          setAiError(null);

          try {
            // Validate mailItem exists and is a message type
            const mailItem = Office.context.mailbox.item;
            if (!mailItem || mailItem.itemType !== Office.MailboxEnums.ItemType.Message) {
              throw new Error('AI summarization only available for email messages');
            }

            // Build email thread from Office.js
            const emailThread = await buildEmailThread(mailItem as Office.MessageRead);

            // Call AI API
            const summary = await summarizeEmail(emailThread);

            if (summary.success !== false) {
              // AI success - store summary for form auto-population
              setAiSummary({
                description: summary.description,
                notes: summary.notes,
              });
              console.info('[AI] Summarization completed successfully');
            } else {
              // AI returned error - log and leave fields empty
              console.error('AI summarization failed:', summary.error);
              setAiError(summary.error || 'AI summarization unavailable');
              setAiSummary(null);
            }
          } catch (aiErr) {
            // Network or API error - log and degrade gracefully
            console.error('AI summarization error:', aiErr);
            setAiError(aiErr instanceof Error ? aiErr.message : 'AI summarization failed');
            setAiSummary(null);
          } finally {
            setIsGeneratingAi(false);
          }
        } else {
          // STEP 2: No contact match - try domain matching (Story 4.2)
          const domain = extractDomain(emailContext.senderEmail);

          if (domain) {
            try {
              const client = await matchClientByDomain(domain, abortController.signal);

              if (client) {
                // Domain match found - use it (second priority)
                setMatchingResult({
                  type: 'domain-matched',
                  client: { id: client.id, name: client.name },
                });
              } else {
                // No domain match either
                setMatchingResult({ type: 'no-match' });
              }
            } catch (domainError) {
              // Domain matching API failed - log and fall back to no-match
              console.error('Domain matching failed:', domainError);
              setMatchingResult({ type: 'no-match' });
              setError({
                message: domainError instanceof Error ? domainError.message : 'Domain matching failed',
                status: 0,
              });
            }
          } else {
            // Domain extraction failed (invalid email)
            setMatchingResult({ type: 'no-match' });
          }
        }
      } catch (err) {
        // Contact matching API failed - log and fall back to no-match
        console.error('Contact matching failed:', err);

        // Set fallback state on error (allows manual mode to remain functional)
        setMatchingResult({ type: 'no-match' });

        // Store error details for potential UI display
        setError({
          message: err instanceof Error ? err.message : 'Unknown error',
          status: 0,
        });
      } finally {
        // Only update isMatching if request wasn't aborted
        if (!abortController.signal.aborted) {
          setIsMatching(false);
        }
      }
    }, 300); // 300ms debounce delay

    // Cleanup function: cancel pending timeout and abort in-flight request
    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
      setIsMatching(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailContext?.senderEmail]);

  return { matchingResult, isMatching, error, aiSummary, isGeneratingAi, aiError };
}
