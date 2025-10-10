import { useState, useEffect } from 'react'
import './App.css'
import { Sidebar } from './components/Sidebar'
import { HelloWorld } from './components/HelloWorld'
import { EmailContext } from './types'

// Office.js initialization states
type OfficeState = 'loading' | 'ready' | 'error'

interface HostInfo {
  hostName: string
  hostVersion: string
  permissions: string | number
}

function App() {
  const [officeState, setOfficeState] = useState<OfficeState>('loading')
  const [hostInfo, setHostInfo] = useState<HostInfo | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [emailContext, setEmailContext] = useState<EmailContext | null>(null)

  // Event handler for ItemChanged
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleItemChanged = (eventArgs: Office.EventArgs): void => {
    const item = Office.context.mailbox.item

    if (item != null) {
      const senderEmail = item.from.emailAddress
      const senderName = item.from.displayName
      const subject = item.subject

      console.log(`Email changed: ${senderEmail} - ${subject}`)

      setEmailContext({ senderEmail, senderName, subject })
    } else {
      console.log('No email selected')
      setEmailContext(null)
    }
  }

  useEffect(() => {
    // Initialize Office.js
    if (typeof Office !== 'undefined') {
      Office.onReady((info) => {
        try {
          // Verify Outlook host
          if (info.host === Office.HostType.Outlook) {
            // Extract host information
            const diagnostics = Office.context.mailbox.diagnostics
            const item = Office.context.mailbox.item

            // Get permissions if an item is selected, otherwise use 0
            const permissions = item ? item.itemType : 0

            setHostInfo({
              hostName: diagnostics.hostName,
              hostVersion: diagnostics.hostVersion,
              permissions: permissions
            })

            // Register ItemChanged event handler
            try {
              Office.context.mailbox.addHandlerAsync(
                Office.EventType.ItemChanged,
                handleItemChanged,
                (asyncResult) => {
                  if (asyncResult.status === Office.AsyncResultStatus.Succeeded) {
                    console.log('ItemChanged event registered')
                  } else {
                    console.error('Failed to register ItemChanged event:', asyncResult.error)
                  }
                }
              )
            } catch (error) {
              console.error('Error registering ItemChanged event:', error)
            }

            // Initialize email context with current item
            handleItemChanged({} as Office.EventArgs)

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

    // Cleanup function to remove event handler on component unmount
    return () => {
      if (typeof Office !== 'undefined' && Office.context?.mailbox) {
        try {
          Office.context.mailbox.removeHandlerAsync(
            Office.EventType.ItemChanged,
            { handler: handleItemChanged },
            (asyncResult) => {
              if (asyncResult.status === Office.AsyncResultStatus.Succeeded) {
                console.log('ItemChanged event handler removed')
              }
            }
          )
        } catch (error) {
          console.error('Error removing ItemChanged event handler:', error)
        }
      }
    }
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

  // Ready state - render HelloWorld component
  return (
    <Sidebar emailContext={emailContext}>
      {hostInfo && (
        <HelloWorld
          hostName={hostInfo.hostName}
          hostVersion={hostInfo.hostVersion}
          permissions={hostInfo.permissions}
        />
      )}
    </Sidebar>
  )
}

export default App
