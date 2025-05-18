"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface PasswordModalProps {
  onSubmit: (password: string) => void
  onCancel: () => void
  error?: string | null
  isSubmitting?: boolean
}

export default function PasswordModal({ onSubmit, onCancel, error, isSubmitting = false }: PasswordModalProps) {
  const [password, setPassword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(password)
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">Enter Password</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <p className="text-gray-600 mb-4">
            This content is password-protected. Please enter the password to continue.
          </p>
          <Input
            type="password"
            className={`border-gray-300 mb-2 w-full ${error ? "border-red-500" : ""}`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            required
            autoFocus
            disabled={isSubmitting}
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}
        </CardContent>
        <CardFooter className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            className="border-gray-300"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" className="bg-red-600 hover:bg-red-700" disabled={isSubmitting}>
            {isSubmitting ? "Verifying..." : "Continue"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
