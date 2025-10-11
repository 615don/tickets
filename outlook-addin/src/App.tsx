import { useState, useEffect } from 'react'
import './App.css'
import { Sidebar } from './components/Sidebar'
import { EmailContext } from './components/EmailContext'
import { TicketForm } from './components/TicketForm'
import { useEmailContext } from './hooks/useEmailContext'
import { useMatching } from './hooks/useMatching'
import type { MatchStatus, TicketFormData } from './types'

// Office.js initialization states
type OfficeState = 'loading' | 'ready' | 'error'

function App() {
  const [officeState, setOfficeState] = useState<OfficeState>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')

  // Use custom hook for email context management
  const emailContext = useEmailContext()

  // Use matching hook for automatic contact matching (Story 4.1)
  const { matchingResult, isMatching } = useMatching(emailContext)

  // Client selection state (Story 4.4)
  const [selectedClient, setSelectedClient] = useState<{ id: number; name: string } | null>(null)

  // Contact name state for new contact creation (Story 5.1)
  const [contactName, setContactName] = useState<string>('')

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

  // Auto-populate client from matching result (Story 4.4)
  useEffect(() => {
    if (matchingResult?.client) {
      setSelectedClient(matchingResult.client)
    } else {
      setSelectedClient(null)
    }
  }, [matchingResult])

  // Reset client selection when email changes (Story 4.4)
  useEffect(() => {
    if (emailContext?.senderEmail) {
      setSelectedClient(null)
    }
  }, [emailContext?.senderEmail])

  // Auto-populate contact name from sender (Story 5.1)
  useEffect(() => {
    if (emailContext?.senderName) {
      setContactName(emailContext.senderName)
    }
  }, [emailContext?.senderName])

  // Reset contact name when email changes (Story 5.1)
  useEffect(() => {
    if (emailContext?.senderEmail) {
      setContactName(emailContext?.senderName || '')
    }
  }, [emailContext?.senderEmail, emailContext?.senderName])

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

  // Ticket submission handler (Story 5.1)
  const handleTicketSubmit = async (data: TicketFormData) => {
    try {
      // TODO: Implement ticket submission API call in Story 5.4
      console.log('Ticket submission data:', data)
      // Temporary mock - will be replaced with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error('Ticket submission failed:', error)
      throw error
    }
  }

  // Ready state - render EmailContext component
  return (
    <Sidebar emailContext={emailContext}>
      {emailContext && (
        <div className="px-3 py-4 space-y-4">
          <EmailContext
            senderName={contactName}
            senderEmail={emailContext.senderEmail}
            matchStatus={getMatchStatus()}
            clientName={matchingResult?.client?.name}
            contactName={matchingResult?.contact?.name}
            onNameChange={setContactName}
          />
          <TicketForm
            selectedClient={selectedClient}
            onClientChange={setSelectedClient}
            matchingResult={matchingResult}
            contactName={contactName}
            contactEmail={emailContext.senderEmail}
            onSubmit={handleTicketSubmit}
          />
        </div>
      )}
    </Sidebar>
  )
}

export default App
