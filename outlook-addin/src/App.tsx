import { useState, useEffect } from 'react'
import './App.css'
import { Sidebar } from './components/Sidebar'
import { EmailContext } from './components/EmailContext'
import { useEmailContext } from './hooks/useEmailContext'
import { useMatching } from './hooks/useMatching'
import type { MatchStatus } from './types'

// Office.js initialization states
type OfficeState = 'loading' | 'ready' | 'error'

function App() {
  const [officeState, setOfficeState] = useState<OfficeState>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')

  // Use custom hook for email context management
  const emailContext = useEmailContext()

  // Use matching hook for automatic contact matching (Story 4.1)
  const { matchingResult, isMatching } = useMatching(emailContext)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isSubmitting, setIsSubmitting] = useState(false) // Will be used in Epic 5+

  /**
   * Derive matchStatus for EmailContext component based on matching state
   * @returns {MatchStatus} Badge variant to display
   */
  const getMatchStatus = (): MatchStatus => {
    if (isMatching) return 'loading'
    if (!matchingResult) return 'loading' // Default before matching runs
    if (matchingResult.type === 'contact-matched') return 'matched'
    if (matchingResult.type === 'domain-matched') return 'warning'
    return 'neutral' // no-match
  }

  useEffect(() => {
    // Initialize Office.js
    if (typeof Office !== 'undefined') {
      Office.onReady((info) => {
        try {
          // Verify Outlook host
          if (info.host === Office.HostType.Outlook) {
            setOfficeState('ready')
          } else {
            throw new Error('Add-in must be loaded in Outlook')
          }
        } catch (error) {
          console.error('Office.js initialization error:', error)
          setErrorMessage(error instanceof Error ? error.message : 'Unknown initialization error')
          setOfficeState('error')
        }
      }).catch((error) => {
        console.error('Office.onReady error:', error)
        setErrorMessage('Failed to initialize Office.js')
        setOfficeState('error')
      })
    } else {
      setErrorMessage('Office.js not available')
      setOfficeState('error')
    }

    // No cleanup needed - useEmailContext hook handles event registration/cleanup
  }, [])

  // Loading state
  if (officeState === 'loading') {
    return (
      <div className="p-4">
        <div className="flex items-center space-x-2">
          <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <p className="text-gray-700">Initializing Office.js...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (officeState === 'error') {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold mb-2">Initialization Error</h2>
          <p className="text-red-700 text-sm">{errorMessage}</p>
          <p className="text-red-600 text-xs mt-2">
            Please reload the add-in or contact support if the issue persists.
          </p>
        </div>
      </div>
    )
  }

  // Ready state - render EmailContext component
  return (
    <Sidebar emailContext={emailContext}>
      {emailContext && (
        <div className="p-4">
          <EmailContext
            senderName={emailContext.senderName}
            senderEmail={emailContext.senderEmail}
            matchStatus={getMatchStatus()}
            clientName={matchingResult?.client?.name}
            contactName={matchingResult?.contact?.name}
          />
        </div>
      )}
    </Sidebar>
  )
}

export default App
