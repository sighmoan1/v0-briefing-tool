interface ChangedFieldIndicatorProps {
  hasChanged: boolean
  hasPreviousVersion: boolean
}

export default function ChangedFieldIndicator({ hasChanged, hasPreviousVersion }: ChangedFieldIndicatorProps) {
  if (!hasChanged || !hasPreviousVersion) return null

  return (
    <div className="px-2 py-1 bg-yellow-50 text-yellow-700 text-xs rounded mb-1 flex items-center">
      <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>
      Changed from previous version
    </div>
  )
}
