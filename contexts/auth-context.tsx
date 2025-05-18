"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type AuthState = {
  authorizedIncidents: Record<string, boolean>
}

interface AuthContextType {
  isAuthorizedForIncident: (incidentId: string) => boolean
  authorizeIncident: (incidentId: string) => void
  clearAuthorization: (incidentId: string) => void
  clearAllAuthorizations: () => void
  reset: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({ authorizedIncidents: {} })

  // Load auth state from localStorage on mount
  useEffect(() => {
    try {
      const storedState = localStorage.getItem("brc_auth_state")
      if (storedState) {
        setAuthState(JSON.parse(storedState))
      }
    } catch (error) {
      console.error("Failed to load auth state from localStorage:", error)
    }
  }, [])

  // Save auth state to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem("brc_auth_state", JSON.stringify(authState))
    } catch (error) {
      console.error("Failed to save auth state to localStorage:", error)
    }
  }, [authState])

  const isAuthorizedForIncident = (incidentId: string): boolean => {
    return !!authState.authorizedIncidents[incidentId]
  }

  const authorizeIncident = (incidentId: string) => {
    setAuthState((prev) => ({
      ...prev,
      authorizedIncidents: {
        ...prev.authorizedIncidents,
        [incidentId]: true,
      },
    }))
  }

  const clearAuthorization = (incidentId: string) => {
    setAuthState((prev) => {
      const newAuthorizedIncidents = { ...prev.authorizedIncidents }
      delete newAuthorizedIncidents[incidentId]
      return {
        ...prev,
        authorizedIncidents: newAuthorizedIncidents,
      }
    })
  }

  const clearAllAuthorizations = () => {
    setAuthState({ authorizedIncidents: {} })
  }

  const reset = () => {
    setAuthState({ authorizedIncidents: {} })
    try {
      localStorage.removeItem("brc_auth_state")
    } catch (error) {
      console.error("Failed to clear auth state from localStorage:", error)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthorizedForIncident,
        authorizeIncident,
        clearAuthorization,
        clearAllAuthorizations,
        reset,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
