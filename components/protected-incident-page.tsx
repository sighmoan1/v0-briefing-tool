"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import PasswordModal from "@/components/password-modal"
import { Loader2 } from "lucide-react"

interface ProtectedIncidentPageProps {
  incidentId: string
  renderContent: () => React.ReactNode
}

export default function ProtectedIncidentPage({ incidentId, renderContent }: ProtectedIncidentPageProps) {
  const router = useRouter()
  const { isAuthorizedForIncident, authorizeIncident } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isProtected, setIsProtected] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Check if the incident is protected and if the user is authorized
  useEffect(() => {
    async function checkIncidentProtection() {
      try {
        // Check if already authorized
        if (isAuthorizedForIncident(incidentId)) {
          setIsAuthorized(true)
          setIsLoading(false)
          return
        }

        // Check if the incident is protected
        const response = await fetch(`/api/incidents/${incidentId}/protection-status`)

        if (!response.ok) {
          // If incident doesn't exist or there's an error, redirect to home
          router.push("/")
          return
        }

        const data = await response.json()
        setIsProtected(data.isProtected)

        // If not protected, authorize immediately
        if (!data.isProtected) {
          setIsAuthorized(true)
        }

        setIsLoading(false)
      } catch (error) {
        console.error("Error checking incident protection:", error)
        router.push("/")
      }
    }

    checkIncidentProtection()
  }, [incidentId, isAuthorizedForIncident, router])

  const handlePasswordSubmit = async (password: string) => {
    setIsSubmitting(true)
    setPasswordError(null)

    try {
      const response = await fetch("/api/verify-incident-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          incidentId,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setPasswordError(data.error || "Invalid password")
        setIsSubmitting(false)
        return
      }

      // Password is correct, authorize access
      authorizeIncident(incidentId)
      setIsAuthorized(true)
    } catch (error) {
      console.error("Error verifying password:", error)
      setPasswordError("An error occurred. Please try again.")
      setIsSubmitting(false)
    }
  }

  const handlePasswordCancel = () => {
    // Redirect to home if user cancels password entry
    router.push("/")
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    )
  }

  // If protected and not authorized, show only the password modal
  if (isProtected && !isAuthorized) {
    return (
      <div className="fixed inset-0 bg-gray-50 flex items-center justify-center z-50">
        <div className="max-w-md w-full">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">Protected Incident</h1>
            <p className="text-gray-600">This incident requires a password to view.</p>
          </div>
          <PasswordModal
            onSubmit={handlePasswordSubmit}
            onCancel={handlePasswordCancel}
            error={passwordError}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    )
  }

  // Only render content if authorized
  return <>{isAuthorized && renderContent()}</>
}
