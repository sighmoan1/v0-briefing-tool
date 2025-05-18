"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface SearchFormProps {
  initialQuery: string
}

export default function SearchForm({ initialQuery }: SearchFormProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(initialQuery)

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
    setSearchQuery(initialQuery)
  }, [initialQuery])

  return (
    <form onSubmit={handleSearch} className="flex gap-2 mb-6">
      <div className="flex-grow">
        <label htmlFor="search" className="block text-sm mb-1">
          Search incident name
        </label>
        <Input
          id="search"
          className="border-gray-300"
          value={searchQuery}
          onChange={handleSearchInputChange}
          placeholder="Enter incident name, area, or type"
        />
      </div>
      <div className="flex items-end">
        <Button type="submit" className="bg-red-600 hover:bg-red-700 h-10">
          Search
        </Button>
      </div>
    </form>
  )
}
