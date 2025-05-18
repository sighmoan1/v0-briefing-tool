"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import PasswordModal from "@/components/password-modal"
import { Loader2 } from "lucide-react"

interface ProtectedBriefingPageProps {
  briefingId: string
  renderContent: () => React.ReactNode
}

/**
 * ProtectedBriefingPage
 *
 * This component handles access control for briefings.
 * It only checks if the user has access to the briefing itself,
 * not the parent incident. This allows users to view briefings
 * if they have the briefing password, even if they don't have
 * access to the incident.
 */
export default function ProtectedBriefingPage({ briefingId, renderContent }: ProtectedBriefingPageProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isProtected, setIsProtected] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    async function checkBriefingProtection() {
      try {
        // Check if we have a session cookie for this briefing
        const hasCookie = document.cookie.includes(`briefing_access_${briefingId}=`)

        if (hasCookie) {
          setIsAuthorized(true)
          setIsLoading(false)
          return
        }

        const response = await fetch(`/api/briefings/${briefingId}/protection-status`)

        if (!response.ok) {
          // If briefing doesn't exist, redirect to home
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
        console.error("Error checking briefing protection:", error)
        router.push("/")
      }
    }

    checkBriefingProtection()
  }, [briefingId, router])

  const handlePasswordSubmit = async (password: string) => {
    setIsSubmitting(true)
    setPasswordError(null)

    try {
      const response = await fetch("/api/verify-briefing-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          briefingId,
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
            <h1 className="text-2xl font-bold">Protected Briefing</h1>
            <p className="text-gray-600">This briefing requires a password to view.</p>
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
