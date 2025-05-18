"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import BriefingTable from "@/components/briefing-table"
import Breadcrumbs from "@/components/breadcrumbs"
import ProtectedIncidentPage from "@/components/protected-incident-page"
import { Loader2 } from "lucide-react"

interface IncidentPageProps {
  params: {
    id: string
  }
}

export default function IncidentPage({ params }: IncidentPageProps) {
  return (
    <ProtectedIncidentPage incidentId={params.id} renderContent={() => <IncidentContent incidentId={params.id} />} />
  )
}

// Separate component that only renders after authorization
function IncidentContent({ incidentId }: { incidentId: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [incident, setIncident] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get current page from URL or default to 1
  const currentPage = Number(searchParams.get("page")) || 1

  // Get search query from URL
  const initialSearchQuery = searchParams.get("search") || ""

  // State for search input
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery)

  // Items per page
  const itemsPerPage = 4

  // Fetch incident data from API - only happens after authorization
  useEffect(() => {
    async function loadIncident() {
      try {
        setLoading(true)
        const response = await fetch(`/api/incidents/${incidentId}`)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to fetch incident")
        }

        const incidentData = await response.json()
        setIncident(incidentData)
      } catch (err) {
        console.error("Error loading incident:", err)
        setError(err instanceof Error ? err.message : "Failed to load incident details")
      } finally {
        setLoading(false)
      }
    }

    loadIncident()
  }, [incidentId])

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    // Create new URLSearchParams
    const params = new URLSearchParams(searchParams)

    // Update search parameter
    if (searchQuery) {
      params.set("search", searchQuery)
    } else {
      params.delete("search")
    }

    // Reset to page 1 when searching
    params.set("page", "1")

    // Update URL with search parameters
    router.push(`${pathname}?${params.toString()}`)
  }

  // Handle input change
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  // Update search input when URL changes
  useEffect(() => {
    setSearchQuery(initialSearchQuery)
  }, [initialSearchQuery])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    )
  }

  if (error || !incident) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
        <p className="font-medium">{error || "Failed to load incident details"}</p>
      </div>
    )
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: incident.name || "Incident Details", href: `/incident/${incidentId}` }]} />

      <h1 className="text-3xl font-bold mb-6">{incident.name}</h1>

      <div className="mb-6">
        <p>
          <span className="font-medium">Area:</span> {incident.area}
        </p>
        <p>
          <span className="font-medium">First created:</span>{" "}
          {incident.created_at
            ? new Date(incident.created_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            : "Unknown date"}
        </p>
        {incident.is_sensitive && (
          <p>
            <span className="font-medium">Password protected:</span> Yes
          </p>
        )}
      </div>

      <Link href={`/incident/${incidentId}/create-version`}>
        <Button className="bg-red-600 hover:bg-red-700 mb-8">Create new briefing</Button>
      </Link>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Volunteer and OTL briefing notes</h2>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <div className="flex-grow">
          <Input
            className="border-gray-300"
            value={searchQuery}
            onChange={handleSearchInputChange}
            placeholder="Search by type, date, or shift"
          />
        </div>
        <div>
          <Button type="submit" className="bg-red-600 hover:bg-red-700 h-10">
            Search
          </Button>
        </div>
      </form>

      <BriefingTable page={currentPage} itemsPerPage={itemsPerPage} incidentId={incidentId} searchQuery={searchQuery} />
    </div>
  )
}
