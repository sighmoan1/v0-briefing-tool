import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import IncidentTable from "@/components/incident-table"
import SearchForm from "@/components/search-form"
import { getIncidents } from "@/lib/incidents"

interface HomePageProps {
  searchParams: {
    page?: string
    search?: string
  }
}

export default async function Home({ searchParams }: HomePageProps) {
  const currentPage = Number(searchParams.page) || 1
  const searchQuery = searchParams.search || ""
  const itemsPerPage = 10

  try {
    console.log("Home page rendering with params:", { currentPage, searchQuery, itemsPerPage })

    // Fetch incidents from the database
    const { incidents = [], total = 0, totalPages = 0 } = await getIncidents(currentPage, itemsPerPage, searchQuery)

    console.log("Home page received incidents:", incidents.length)
    console.log("Sample incident data:", incidents[0])

    return (
      <div>
        <h1 className="text-3xl font-bold mb-4">Create briefing notes</h1>
        <p className="mb-6">
          Write a new briefing document for volunteers and OTLs, or select from the list to make a new version of an
          existing one.
        </p>

        <Link href="/create-briefing">
          <Button className="bg-red-600 hover:bg-red-700 mb-8">Create new incident</Button>
        </Link>

        <h2 className="text-2xl font-bold mb-4">List of incidents</h2>

        <Suspense fallback={<div>Loading search...</div>}>
          <SearchForm initialQuery={searchQuery} />
        </Suspense>

        <Suspense fallback={<div>Loading incidents...</div>}>
          <IncidentTable incidents={incidents} page={currentPage} totalItems={total} itemsPerPage={itemsPerPage} />
        </Suspense>
      </div>
    )
  } catch (error) {
    console.error("Error in Home page:", error)

    return (
      <div>
        <h1 className="text-3xl font-bold mb-4">Create briefing notes</h1>
        <p className="mb-6">
          Write a new briefing document for volunteers and OTLs, or select from the list to make a new version of an
          existing one.
        </p>

        <Link href="/create-briefing">
          <Button className="bg-red-600 hover:bg-red-700 mb-8">Create new incident</Button>
        </Link>

        <h2 className="text-2xl font-bold mb-4">List of incidents</h2>

        <div className="p-4 border border-red-300 bg-red-50 text-red-700 rounded-md">
          There was an error loading incidents. Please try again later.
        </div>
      </div>
    )
  }
}
