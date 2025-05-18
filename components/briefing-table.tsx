"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import Pagination from "@/components/pagination"
import PasswordModal from "@/components/password-modal"

interface Briefing {
  id: string
  incident_id: string
  type: string
  shift: string
  created_at: string
  viewer_password_hash?: string
}

interface BriefingTableProps {
  page: number
  itemsPerPage: number
  incidentId: string
  searchQuery: string
}

export default function BriefingTable({ page, itemsPerPage, incidentId, searchQuery }: BriefingTableProps) {
  const router = useRouter()
  const [briefings, setBriefings] = useState<Briefing[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBriefingId, setSelectedBriefingId] = useState<string | null>(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch briefings from API
  useEffect(() => {
    async function fetchBriefings() {
      try {
        setLoading(true)
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: itemsPerPage.toString(),
        })

        if (searchQuery) {
          queryParams.set("search", searchQuery)
        }

        const response = await fetch(`/api/incidents/${incidentId}/briefings?${queryParams}`)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to fetch briefings")
        }

        const data = await response.json()
        setBriefings(data.briefings || [])
        setTotalItems(data.total || 0)
      } catch (err) {
        console.error("Error fetching briefings:", err)
        setError(err instanceof Error ? err.message : "Failed to load briefings")
      } finally {
        setLoading(false)
      }
    }

    fetchBriefings()
  }, [incidentId, page, itemsPerPage, searchQuery])

  const handleViewBriefing = (briefing: Briefing) => {
    if (briefing.viewer_password_hash) {
      setSelectedBriefingId(briefing.id)
      setShowPasswordModal(true)
      setPasswordError(null)
    } else {
      router.push(`/incident/${incidentId}/briefing/${briefing.id}`)
    }
  }

  const handleUpdateBriefing = (briefing: Briefing) => {
    // Changed from edit to create-version with source briefing ID
    router.push(`/incident/${incidentId}/create-version?sourceBriefingId=${briefing.id}`)
  }

  const handlePasswordSubmit = async (password: string) => {
    if (!selectedBriefingId) return

    setIsSubmitting(true)
    setPasswordError(null)

    try {
      const response = await fetch("/api/verify-briefing-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          briefingId: selectedBriefingId,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setPasswordError(data.error || "Invalid password")
        setIsSubmitting(false)
        return
      }

      router.push(`/incident/${incidentId}/briefing/${selectedBriefingId}`)
      setShowPasswordModal(false)
    } catch (err) {
      setPasswordError("An error occurred. Please try again.")
      setIsSubmitting(false)
    }
  }

  const handlePasswordCancel = () => {
    setShowPasswordModal(false)
    setSelectedBriefingId(null)
    setPasswordError(null)
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      return dateString || "Invalid date"
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-full mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-full mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-full mb-4"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <p className="font-medium">{error}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-2 px-2 text-left font-medium text-gray-700">Created date & time</th>
              <th className="py-2 px-2 text-left font-medium text-gray-700">Type</th>
              <th className="py-2 px-2 text-left font-medium text-gray-700">Date and shift</th>
              <th className="py-2 px-2 text-left font-medium text-gray-700">URL</th>
              <th className="py-2 px-2 text-left font-medium text-gray-700">Password protected</th>
              <th className="py-2 px-2 text-left font-medium text-gray-700"></th>
            </tr>
          </thead>
          <tbody>
            {briefings.length > 0 ? (
              briefings.map((briefing) => (
                <tr key={briefing.id} className="border-b border-gray-200">
                  <td className="py-3 px-2">{formatDate(briefing.created_at)}</td>
                  <td className="py-3 px-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        briefing.type === "Volunteer" ? "bg-green-100 text-green-800" : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {briefing.type}
                    </span>
                  </td>
                  <td className="py-3 px-2">{briefing.shift}</td>
                  <td className="py-3 px-2">
                    <button
                      onClick={() => handleViewBriefing(briefing)}
                      className="text-blue-600 hover:underline truncate block max-w-[200px] text-left"
                    >
                      /incident/{briefing.incident_id}/briefing/{briefing.id}
                    </button>
                  </td>
                  <td className="py-3 px-2">{briefing.viewer_password_hash ? "Yes" : "No"}</td>
                  <td className="py-3 px-2">
                    <Button className="bg-red-600 hover:bg-red-700" onClick={() => handleUpdateBriefing(briefing)}>
                      Update
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500">
                  No briefings found matching your search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalItems > 0 && (
        <div className="mt-8">
          <Pagination totalItems={totalItems} itemsPerPage={itemsPerPage} currentPage={page} />
        </div>
      )}

      {showPasswordModal && (
        <PasswordModal
          onSubmit={handlePasswordSubmit}
          onCancel={handlePasswordCancel}
          error={passwordError}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  )
}
