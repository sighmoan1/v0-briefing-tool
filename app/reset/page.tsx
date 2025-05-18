"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { resetAppState } from "@/lib/reset-app-state"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle2 } from "lucide-react"

export default function ResetPage() {
  const router = useRouter()
  const [isResetting, setIsResetting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleReset = async () => {
    try {
      setIsResetting(true)
      setError(null)

      // Reset the application state
      resetAppState()

      // Set complete state
      setIsComplete(true)

      // Redirect to home page after a short delay
      setTimeout(() => {
        router.push("/")
      }, 2000)
    } catch (err) {
      console.error("Error resetting application state:", err)
      setError("Failed to reset application state. Please try again.")
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="flex justify-center items-center min-h-[70vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Reset Application State</CardTitle>
          <CardDescription>
            This will clear all stored data, invalidate authentication tokens, and log you out.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Use this option to reset the application to a fresh state for testing password-protected links without
            interference from prior sessions.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {isComplete && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4 flex items-start">
              <CheckCircle2 className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <p>Application state has been reset successfully. Redirecting to home page...</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleReset} disabled={isResetting || isComplete} className="bg-red-600 hover:bg-red-700">
            {isResetting ? "Resetting..." : "Reset Application State"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
