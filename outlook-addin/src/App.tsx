import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [officeReady, setOfficeReady] = useState(false)

  useEffect(() => {
    // Initialize Office.js
    if (typeof Office !== 'undefined') {
      Office.onReady(() => {
        setOfficeReady(true)
      })
    }
  }, [])

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Outlook Add-in</h1>
      <p className="mb-2">
        Office.js Status: {officeReady ? '✅ Ready' : '⏳ Loading...'}
      </p>
      <p className="text-sm text-gray-600">
        This is the Outlook Add-in for the Ticketing System.
      </p>
    </div>
  )
}

export default App
