"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronLeft } from "lucide-react"
import Breadcrumbs from "@/components/breadcrumbs"

export default function CreateBriefing() {
  const router = useRouter()
  const [isSensitive, setIsSensitive] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detailedError, setDetailedError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setDetailedError(null)

    const formData = new FormData(e.currentTarget)

    // Ensure the is_sensitive field is set
    formData.set("is_sensitive", isSensitive === "yes" ? "yes" : "no")

    console.log("Form data:", {
      name: formData.get("name"),
      area: formData.get("area"),
      is_sensitive: formData.get("is_sensitive"),
      editor_password: formData.get("editor_password") ? "***" : undefined,
    })

    try {
      // Use fetch API instead of direct server action call
      const response = await fetch("/api/create-incident", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "An error occurred")
        if (result.details) {
          setDetailedError(result.details)
        }
        setIsSubmitting(false)
        return
      }

      // If successful, redirect to the incident page
      router.push(`/incident/${result.id}`)
    } catch (err) {
      console.error("Client-side form submission error:", err)
      setError("An error occurred. Please try again.")
      if (err instanceof Error) {
        setDetailedError(err.message)
      }
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: "Create new briefing", href: "/create-briefing" }]} />

      <h1 className="text-3xl font-bold mb-6">Create new briefing</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-medium">{error}</p>
          {detailedError && (
            <p className="mt-2 text-sm">
              <strong>Details:</strong> {detailedError}
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label htmlFor="name" className="block font-medium mb-2">
            Incident name
          </label>
          <p className="text-gray-600 mb-2">
            Provide the location, incident and response type, eg Nottingham flood rest centre
          </p>
          <Input id="name" name="name" className="border-gray-300 w-full max-w-xl" required disabled={isSubmitting} />
        </div>

        <div className="mb-6">
          <label htmlFor="area" className="block font-medium mb-2">
            Area
          </label>
          <Input id="area" name="area" className="border-gray-300 w-full max-w-xl" required disabled={isSubmitting} />
        </div>

        <div className="mb-8">
          <p className="font-medium mb-4">Is this sensitive, for example it's an anti human trafficking response?</p>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="sensitive-yes"
                name="is_sensitive"
                value="yes"
                checked={isSensitive === "yes"}
                onChange={() => setIsSensitive("yes")}
                className="h-4 w-4 border-gray-300 text-red-600 focus:ring-red-600"
                disabled={isSubmitting}
              />
              <Label htmlFor="sensitive-yes">Yes, create editor password</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="sensitive-no"
                name="is_sensitive"
                value="no"
                checked={isSensitive === "no"}
                onChange={() => setIsSensitive("no")}
                className="h-4 w-4 border-gray-300 text-red-600 focus:ring-red-600"
                disabled={isSubmitting}
              />
              <Label htmlFor="sensitive-no">No, all editors can see the briefing</Label>
            </div>
          </div>
        </div>

        {isSensitive === "yes" && (
          <div className="mb-8">
            <label htmlFor="editor_password" className="block font-medium mb-2">
              Editor Password
            </label>
            <p className="text-gray-600 mb-2">
              Create a secure password. You'll need to share it with other editors before they can view or update
              briefings for this incident.
            </p>
            <Input
              id="editor_password"
              name="editor_password"
              type="password"
              className="border-gray-300 w-full max-w-xl"
              required
              disabled={isSubmitting}
            />
          </div>
        )}

        <div className="flex gap-4">
          <Link href="/">
            <Button type="button" variant="outline" className="border-gray-300" disabled={isSubmitting}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <Button type="submit" className="bg-red-600 hover:bg-red-700" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Save and continue"}
          </Button>
        </div>
      </form>
    </div>
  )
}
