interface HelloWorldProps {
  hostName: string
  hostVersion: string
  permissions: string | number
}

export const HelloWorld = ({ hostName, hostVersion, permissions }: HelloWorldProps) => {
  // Map host name to user-friendly display name
  const displayHostName = hostName === 'OutlookWebApp' ? 'Outlook Web' : hostName

  // Determine permission status display
  const permissionStatus = permissions ? 'Active' : 'None'

  return (
    <div className="p-6 space-y-4">
      {/* Main heading */}
      <div className="border-b border-gray-700 pb-4">
        <h1 className="text-2xl font-bold text-gray-100">
          Hello from Outlook Add-in
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Ticketing System Integration
        </p>
      </div>

      {/* Office.js host information */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-200">
          Add-in Information
        </h2>

        <div className="bg-gray-800 rounded-md p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-300">Host:</span>
            <span className="text-sm text-gray-100">{displayHostName}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-300">Version:</span>
            <span className="text-sm text-gray-100">{hostVersion}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-300">Permissions:</span>
            <span className="text-sm text-gray-100">
              {permissionStatus}
              {permissions === 'message' && ' (Mail.Read)'}
            </span>
          </div>
        </div>
      </div>

      {/* Success indicator */}
      <div className="bg-green-900/30 border border-green-700 rounded-md p-4">
        <div className="flex items-center space-x-2">
          <svg
            className="w-5 h-5 text-green-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm font-medium text-green-300">
            Add-in loaded successfully!
          </span>
        </div>
        <p className="text-xs text-green-400 mt-2">
          Office.js initialization complete. The add-in is ready to use.
        </p>
      </div>
    </div>
  )
}
