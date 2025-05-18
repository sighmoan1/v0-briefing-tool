"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import Pagination from "@/components/pagination"
import PasswordModal from "@/components/password-modal"
import { useAuth } from "@/contexts/auth-context"
import type { Incident } from "@/lib/incidents"

interface IncidentTableProps {
  incidents: Incident[] | undefined
  page: number
  totalItems: number
  itemsPerPage: number
}

export default function IncidentTable({ incidents = [], page, totalItems, itemsPerPage }: IncidentTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthorizedForIncident, authorizeIncident } = useAuth()
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Ensure incidents is always an array
  const safeIncidents = Array.isArray(incidents) ? incidents : []

  useEffect(() => {
    // If we're not on the homepage, don't show any password modals
    if (pathname !== "/") {
      setShowPasswordModal(false)
    }
  }, [pathname])

  const handleViewIncident = (incident: Incident) => {
    if (incident.is_sensitive && !isAuthorizedForIncident(incident.id)) {
      setSelectedIncidentId(incident.id)
      setShowPasswordModal(true)
      setError(null)
    } else {
      router.push(`/incident/${incident.id}`)
    }
  }

  const handlePasswordSubmit = async (password: string) => {
    if (!selectedIncidentId) return

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch("/api/verify-incident-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          incidentId: selectedIncidentId,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.error || "Invalid password")
        setIsSubmitting(false)
        return
      }

      // Password is correct, authorize access
      authorizeIncident(selectedIncidentId)
      router.push(`/incident/${selectedIncidentId}`)
      setShowPasswordModal(false)
    } catch (err) {
      setError("An error occurred. Please try again.")
      setIsSubmitting(false)
    }
  }

  const handlePasswordCancel = () => {
    setShowPasswordModal(false)
    setSelectedIncidentId(null)
    setError(null)
  }

  const formatDate = (dateString: string | Date) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    } catch (error) {
      return "Invalid date"
    }
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-2 px-4 text-left font-medium text-gray-700">Created date</th>
              <th className="py-2 px-4 text-left font-medium text-gray-700">Incident name</th>
              <th className="py-2 px-4 text-left font-medium text-gray-700">Area</th>
              <th className="py-2 px-4 text-left font-medium text-gray-700">Access</th>
              <th className="py-2 px-4 text-left font-medium text-gray-700"></th>
            </tr>
          </thead>
          <tbody>
            {safeIncidents.length > 0 ? (
              safeIncidents.map((incident) => (
                <tr key={incident.id} className="border-b border-gray-200">
                  <td className="py-4 px-4">{formatDate(incident.created_at)}</td>
                  <td className="py-4 px-4">{incident.name}</td>
                  <td className="py-4 px-4">{incident.area}</td>
                  <td className="py-4 px-4">
                    {incident.is_sensitive ? (
                      <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                        Password required
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        Open access
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <Button className="bg-red-600 hover:bg-red-700" onClick={() => handleViewIncident(incident)}>
                      View
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-500">
                  No incidents found matching your search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {safeIncidents.length > 0 && (
        <div className="mt-8">
          <Pagination totalItems={totalItems} itemsPerPage={itemsPerPage} currentPage={page} />
        </div>
      )}

      {/* Only show password modal if we're on the homepage and it's explicitly triggered */}
      {pathname === "/" && showPasswordModal && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <PasswordModal
            onSubmit={handlePasswordSubmit}
            onCancel={handlePasswordCancel}
            error={error}
            isSubmitting={isSubmitting}
          />
        </div>
      )}
    </div>
  )
}
