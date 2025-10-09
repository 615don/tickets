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
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      {/* Main heading */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Hello from Outlook Add-in
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Ticketing System Integration
        </p>
      </div>

      {/* Office.js host information */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-800">
          Add-in Information
        </h2>

        <div className="bg-blue-50 rounded-md p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Host:</span>
            <span className="text-sm text-gray-900">{displayHostName}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Version:</span>
            <span className="text-sm text-gray-900">{hostVersion}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Permissions:</span>
            <span className="text-sm text-gray-900">
              {permissionStatus}
              {permissions === 'message' && ' (Mail.Read)'}
            </span>
          </div>
        </div>
      </div>

      {/* Success indicator */}
      <div className="bg-green-50 border border-green-200 rounded-md p-4">
        <div className="flex items-center space-x-2">
          <svg
            className="w-5 h-5 text-green-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm font-medium text-green-800">
            Add-in loaded successfully!
          </span>
        </div>
        <p className="text-xs text-green-700 mt-2">
          Office.js initialization complete. The add-in is ready to use.
        </p>
      </div>
    </div>
  )
}
