"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function EnterPassword() {
  const router = useRouter()

  const handleCancel = () => {
    router.back()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    router.push("/incident/1")
  }

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded border border-gray-300 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Enter editor password</h2>

        <form onSubmit={handleSubmit}>
          <Input type="password" className="border-gray-300 mb-6 w-full" required />

          <div className="flex gap-4">
            <Button type="button" variant="outline" className="border-gray-300" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" className="bg-red-600 hover:bg-red-700">
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
