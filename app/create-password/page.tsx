"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronLeft } from "lucide-react"
import Breadcrumbs from "@/components/breadcrumbs"

export default function CreatePassword() {
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    router.push("/incident/new")
  }

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Create new briefing", href: "/create-briefing" },
          { label: "Create editor password", href: "/create-password" },
        ]}
      />

      <h1 className="text-3xl font-bold mb-2">Create editor password</h1>
      <p className="text-gray-600 mb-6">
        Create a secure password. You'll need to share it with other editors before they can view or update briefings
        for this incident.
      </p>

      <form onSubmit={handleSubmit} className="max-w-xl">
        <Input type="password" className="border-gray-300 mb-6" required />

        <div className="flex gap-4">
          <Link href="/create-briefing">
            <Button type="button" variant="outline" className="border-gray-300">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <Button type="submit" className="bg-red-600 hover:bg-red-700">
            Save and continue
          </Button>
        </div>
      </form>
    </div>
  )
}
