import { useState, useEffect } from 'react'
import './App.css'
import { Sidebar } from './components/Sidebar'
import { EmailContext } from './components/EmailContext'
import { TicketForm } from './components/TicketForm'
import { SuccessBanner } from './components/SuccessBanner'
import { useEmailContext } from './hooks/useEmailContext'
import { useMatching } from './hooks/useMatching'
import type { MatchStatus } from './types'
import type { CreateTicketResponse } from './lib/api/tickets'

// Office.js initialization states
type OfficeState = 'loading' | 'ready' | 'error'

function App() {
  const [officeState, setOfficeState] = useState<OfficeState>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')

  // Use custom hook for email context management
  const emailContext = useEmailContext()

  // Use matching hook for automatic contact matching (Story 4.1, Story 7.8)
  const { matchingResult, isMatching, aiSummary, isGeneratingAi } = useMatching(emailContext)

  // Client selection state (Story 4.4)
  const [selectedClient, setSelectedClient] = useState<{ id: number; name: string } | null>(null)

  // Contact name and email state for new contact creation (Story 5.1, 5.3)
  const [contactName, setContactName] = useState<string>('')
  const [contactEmail, setContactEmail] = useState<string>('')

  // Contact validation error state (Story 5.6)
  const [contactNameError, setContactNameError] = useState<string>('')
  const [contactEmailError, setContactEmailError] = useState<string>('')

  // Success state for showing success banner (Story 5.4, Story 6.3)
  const [createdTicketId, setCreatedTicketId] = useState<number | null>(null)
  const [successMessage, setSuccessMessage] = useState<string>('')

  /**
   * Derive matchStatus for EmailContext component based on matching state
   * @returns {MatchStatus} Badge variant to display
   */
  const getMatchStatus = (): MatchStatus => {
    // Story 7.8: Include AI generation in loading state
    if (isMatching || isGeneratingAi) return 'loading'
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

  // Auto-populate contact name and email from sender (Story 5.1, 5.3)
  useEffect(() => {
    if (emailContext?.senderName) {
      setContactName(emailContext.senderName)
    }
    if (emailContext?.senderEmail) {
      setContactEmail(emailContext.senderEmail)
    }
  }, [emailContext?.senderName, emailContext?.senderEmail])

  // Override contact state from matching results (Story 5.3)
  useEffect(() => {
    if (matchingResult?.type === 'contact-matched' && matchingResult.contact) {
      setContactName(matchingResult.contact.name)
      setContactEmail(matchingResult.contact.email)
    }
    // For domain-matched or no-match, keep contactName/contactEmail from sender metadata (editable)
  }, [matchingResult])

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

  // Ticket submission handler (Story 5.4, 5.5, Story 6.3)
  const handleTicketSubmit = (response: CreateTicketResponse, mode?: 'create-ticket' | 'add-time-entry') => {
    // Set ticket ID for success banner (AC 3, 4)
    setCreatedTicketId(response.id)

    // Set success message based on mode (Story 6.3 AC 8)
    const message = mode === 'add-time-entry'
      ? `Time entry added to Ticket #${response.id}`
      : `Ticket #${response.id} created successfully`
    setSuccessMessage(message)

    // Preserve matching state to allow creating multiple tickets for same email (AC 6)
    // Do NOT clear: selectedClient, contactName, contactEmail, matchingResult
    // User can create another ticket for same email/client without re-matching

    // Note: TicketForm handles its own internal state reset (time, description, notes, closeImmediately) (AC 5)
  }

  // Success banner dismiss handler
  const handleDismissSuccess = () => {
    setCreatedTicketId(null)
  }

  // Contact name change handler with error clearing (Story 5.6 AC 7)
  const handleContactNameChange = (newName: string) => {
    setContactName(newName)
    if (contactNameError) {
      setContactNameError('')
    }
  }

  // Ready state - render EmailContext component
  return (
    <Sidebar emailContext={emailContext}>
      {emailContext && (
        <div className="px-2 py-4 space-y-4">
          {/* Success Banner - displayed at top when ticket is created */}
          {createdTicketId && (
            <SuccessBanner
              ticketId={createdTicketId}
              showLink={false}
              message={successMessage}
              onDismiss={handleDismissSuccess}
            />
          )}

          <EmailContext
            senderName={contactName}
            senderEmail={contactEmail}
            matchStatus={getMatchStatus()}
            clientName={matchingResult?.client?.name}
            contactName={matchingResult?.contact?.name}
            onNameChange={handleContactNameChange}
            nameError={contactNameError}
            emailError={contactEmailError}
          />
          <TicketForm
            selectedClient={selectedClient}
            onClientChange={setSelectedClient}
            matchingResult={matchingResult}
            contactName={contactName}
            contactEmail={contactEmail}
            onSubmit={handleTicketSubmit}
            contactNameError={contactNameError}
            contactEmailError={contactEmailError}
            onContactNameErrorChange={setContactNameError}
            onContactEmailErrorChange={setContactEmailError}
            aiSummary={aiSummary}
          />
        </div>
      )}
    </Sidebar>
  )
}

export default App
