"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationProps {
  totalItems: number
  itemsPerPage: number
  currentPage: number
  siblingsCount?: number
}

export default function Pagination({ totalItems, itemsPerPage, currentPage, siblingsCount = 1 }: PaginationProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Calculate total pages
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  // Function to create URL for a specific page
  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", pageNumber.toString())
    return `${pathname}?${params.toString()}`
  }

  // Generate the range of pages to display
  const generatePagination = () => {
    // If there are fewer pages than the siblings count * 2 + 5, show all pages
    if (totalPages <= siblingsCount * 2 + 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    // Calculate start and end of sibling pages
    const leftSiblingIndex = Math.max(currentPage - siblingsCount, 1)
    const rightSiblingIndex = Math.min(currentPage + siblingsCount, totalPages)

    // Determine whether to show ellipsis
    const shouldShowLeftDots = leftSiblingIndex > 2
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1

    // Always show first and last page
    const firstPageIndex = 1
    const lastPageIndex = totalPages

    // No left dots, but right dots
    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingsCount
      const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1)
      return [...leftRange, "...", lastPageIndex]
    }

    // No right dots, but left dots
    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingsCount
      const rightRange = Array.from({ length: rightItemCount }, (_, i) => totalPages - rightItemCount + i + 1)
      return [firstPageIndex, "...", ...rightRange]
    }

    // Both left and right dots
    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = Array.from(
        { length: rightSiblingIndex - leftSiblingIndex + 1 },
        (_, i) => leftSiblingIndex + i,
      )
      return [firstPageIndex, "...", ...middleRange, "...", lastPageIndex]
    }

    // Fallback
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages = generatePagination()

  // If there's only one page, don't show pagination
  if (totalPages <= 1) {
    return null
  }

  return (
    <div className="flex justify-center">
      <div className="flex items-center gap-1">
        <Link
          href={currentPage === 1 ? "#" : createPageURL(currentPage - 1)}
          aria-disabled={currentPage === 1}
          tabIndex={currentPage === 1 ? -1 : undefined}
        >
          <Button variant="outline" className="border-gray-200 px-3" disabled={currentPage === 1}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
        </Link>

        {pages.map((page, index) => {
          if (page === "...") {
            return (
              <Button key={`ellipsis-${index}`} variant="outline" className="border-gray-200" disabled>
                ...
              </Button>
            )
          }

          return (
            <Link key={index} href={createPageURL(page)}>
              <Button
                variant={currentPage === page ? "default" : "outline"}
                className={currentPage === page ? "bg-red-600 hover:bg-red-700" : "border-gray-200"}
              >
                {page}
              </Button>
            </Link>
          )
        })}

        <Link
          href={currentPage === totalPages ? "#" : createPageURL(currentPage + 1)}
          aria-disabled={currentPage === totalPages}
          tabIndex={currentPage === totalPages ? -1 : undefined}
        >
          <Button variant="outline" className="border-gray-200 px-3" disabled={currentPage === totalPages}>
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
