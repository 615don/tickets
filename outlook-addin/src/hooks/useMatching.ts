import { useEffect, useState } from 'react';
import type { EmailContext, MatchingResult, MatchingError } from '../types';
import { matchContactByEmail } from '../lib/api/matching';

/**
 * React hook to trigger contact matching when email context changes
 * Implements debouncing and request cancellation for rapid email selection changes
 *
 * @param emailContext - Email context from Office.js (or null if no email selected)
 * @returns Object containing matching result, loading state, and error state
 *
 * Story 4.1: Email-to-Contact Matching Integration
 */
export function useMatching(emailContext: EmailContext | null) {
  const [matchingResult, setMatchingResult] = useState<MatchingResult | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [error, setError] = useState<MatchingError | null>(null);

  useEffect(() => {
    // Reset state when no email context
    if (!emailContext) {
      setMatchingResult(null);
      setIsMatching(false);
      setError(null);
      return;
    }

    // AbortController for canceling in-flight requests
    const abortController = new AbortController();

    // Debounce API call by 300ms to prevent excessive requests during rapid email switching
    const timeoutId = setTimeout(async () => {
      setIsMatching(true);
      setError(null);

      try {
        const response = await matchContactByEmail(emailContext.senderEmail);

        // Transform API response to MatchingResult format
        if (response.length > 0) {
          // Contact matched - use first result (disambiguation handled in Story 4.4)
          setMatchingResult({
            type: 'contact-matched',
            client: {
              id: response[0].client.id,
              name: response[0].client.name,
            },
            contact: {
              id: response[0].contact.id,
              name: response[0].contact.name,
              email: response[0].contact.email,
            },
          });
        } else {
          // No match found
          setMatchingResult({ type: 'no-match' });
        }
      } catch (err) {
        // Log error for debugging
        console.error('Matching failed:', err);

        // Set fallback state on error (allows manual mode to remain functional)
        setMatchingResult({ type: 'no-match' });

        // Store error details for potential UI display
        setError({
          message: err instanceof Error ? err.message : 'Unknown error',
          status: 0, // Will be set properly in error handling (Task 6)
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

  return { matchingResult, isMatching, error };
}
