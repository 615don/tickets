import { useState, useEffect, useCallback } from 'react'
import { EmailContext } from '../types'

/**
 * Custom React hook to extract email metadata from Office.js and manage ItemChanged events.
 *
 * Extracts sender email, sender name, and subject from the currently selected email in Outlook.
 * Automatically registers ItemChanged event listener to update context when user switches emails.
 *
 * @returns {EmailContext | null} Email metadata or null if no email is selected or data is unavailable
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const emailContext = useEmailContext();
 *
 *   if (!emailContext) {
 *     return <p>Select an email to view details</p>;
 *   }
 *
 *   return <p>From: {emailContext.senderEmail}</p>;
 * }
 * ```
 */
export function useEmailContext(): EmailContext | null {
  const [emailContext, setEmailContext] = useState<EmailContext | null>(null)

  // Note: item.from and item.subject are synchronous properties (no async handling needed)
  // useCallback ensures stable function reference for Office.js event handler registration/removal
  const updateEmailContext = useCallback((): void => {
    try {
      const item = Office.context.mailbox.item

      // Edge case handling: Check if item exists and has sender data
      if (item != null && item.from) {
        const senderEmail = item.from.emailAddress || ''
        const senderName = item.from.displayName || ''
        const subject = item.subject || ''

        console.log(`Email context updated: ${senderEmail}`)
        setEmailContext({ senderEmail, senderName, subject })
      } else {
        console.log('No email selected or sender data missing')
        setEmailContext(null)
      }
    } catch (error) {
      console.error('Error extracting email metadata:', error)
      setEmailContext(null)
    }
  }, []) // Empty deps: function doesn't depend on any props or state

  useEffect(() => {

    // Initialize Office.js and register ItemChanged event
    if (typeof Office !== 'undefined') {
      Office.onReady(() => {
        try {
          // Initialize with current item
          updateEmailContext()

          // Register ItemChanged event handler
          Office.context.mailbox.addHandlerAsync(
            Office.EventType.ItemChanged,
            updateEmailContext,
            (asyncResult) => {
              if (asyncResult.status === Office.AsyncResultStatus.Succeeded) {
                console.log('ItemChanged event registered in useEmailContext hook')
              } else {
                console.error('Failed to register ItemChanged event:', asyncResult.error)
              }
            }
          )
        } catch (error) {
          console.error('Error initializing useEmailContext hook:', error)
          setEmailContext(null)
        }
      }).catch((error) => {
        console.error('Office.onReady error in useEmailContext:', error)
        setEmailContext(null)
      })
    }

    // Cleanup: Remove event handler on unmount
    return () => {
      if (typeof Office !== 'undefined' && Office.context?.mailbox) {
        try {
          Office.context.mailbox.removeHandlerAsync(
            Office.EventType.ItemChanged,
            updateEmailContext,
            (asyncResult) => {
              if (asyncResult.status === Office.AsyncResultStatus.Succeeded) {
                console.log('ItemChanged event handler removed from useEmailContext hook')
              }
            }
          )
        } catch (error) {
          console.error('Error removing ItemChanged event handler:', error)
        }
      }
    }
  }, [updateEmailContext]) // Include updateEmailContext for exhaustive-deps compliance

  return emailContext
}
