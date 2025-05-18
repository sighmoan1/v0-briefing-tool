"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Breadcrumbs from "@/components/breadcrumbs"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"

interface EditBriefingPageProps {
  params: {
    id: string
    briefingId: string
  }
}

export default function EditBriefingPage({ params }: EditBriefingPageProps) {
  const router = useRouter()
  const [content, setContent] = useState(`# Briefing for Carrickfergus flood rest centre
      
## Key information
- Location: Carrickfergus Community Centre
- Address: 123 Main Street, Carrickfergus
- Contact: John Smith (07700 900123)

## Situation update
Heavy rainfall has caused significant flooding in the Carrickfergus area. The rest centre has been established to provide temporary shelter and support for affected residents.

## Resources
- 5 volunteers on site
- 3 first aid kits
- 50 blankets
- Food and water supplies for 72 hours

## Instructions
1. Register all arrivals using the standard form
2. Provide immediate needs assessment
3. Allocate sleeping areas as required
4. Report any medical concerns to the on-site healthcare team`)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(`/incident/${params.id}/briefing/${params.briefingId}`)
  }

  // This would normally fetch data based on the ID and briefingId
  const incident = {
    name: "Carrickfergus flood rest centre",
    area: "Northern Ireland",
  }

  const briefing = {
    id: params.briefingId,
    type: "Volunteer",
    date: "20 June 2025",
    shift: "Day 2 shift 2",
  }

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: incident.name, href: `/incident/${params.id}` },
          {
            label: `${briefing.type} Briefing - ${briefing.date}`,
            href: `/incident/${params.id}/briefing/${params.briefingId}`,
          },
          { label: "Edit", href: `/incident/${params.id}/briefing/${params.briefingId}/edit` },
        ]}
      />

      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
        <h1 className="text-2xl font-bold mb-6">Edit Briefing</h1>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="title" className="block font-medium mb-1">
              Title
            </label>
            <Input
              id="title"
              defaultValue={`${incident.name} - ${briefing.type} Briefing`}
              className="border-gray-300"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="content" className="block font-medium mb-1">
              Content (Markdown supported)
            </label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[400px] border-gray-300 font-mono"
            />
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" className="border-gray-300" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" className="bg-red-600 hover:bg-red-700">
              Save changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
