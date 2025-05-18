"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createIncident, verifyIncidentAccess } from "@/lib/incidents"
import { createBriefing, verifyBriefingAccess } from "@/lib/briefings"

// Create a new incident
export async function createIncidentAction(formData: FormData) {
  const name = formData.get("name") as string
  const area = formData.get("area") as string
  const isSensitive = formData.get("is_sensitive") === "yes"
  const editorPassword = isSensitive ? (formData.get("editor_password") as string) : undefined

  if (!name || !area) {
    return { error: "Name and area are required" }
  }

  if (isSensitive && !editorPassword) {
    return { error: "Password is required for sensitive incidents" }
  }

  let incidentId: string | undefined
  let error: { error: string; details?: string } | undefined

  try {
    console.log("Creating incident with:", { name, area, isSensitive, hasPassword: !!editorPassword })

    // Create the incident
    const incident = await createIncident(name, area, isSensitive, editorPassword)

    // Check if incident is defined
    if (!incident) {
      console.error("Failed to create incident: Incident is undefined")
      error = { error: "Failed to create incident. Please try again." }
      return error
    }

    // Check if incident has an id
    if (!incident.id) {
      console.error("Failed to create incident: Incident ID is missing", incident)
      error = { error: "Failed to create incident. Please try again." }
      return error
    }

    console.log("Incident created successfully:", incident)

    // Store the incident ID for redirection
    incidentId = incident.id

    // Revalidate the path
    revalidatePath("/")
  } catch (err) {
    console.error("Error creating incident:", err)
    error = {
      error: "Failed to create incident. Please try again.",
      details: err instanceof Error ? err.message : String(err),
    }
    return error
  }

  // Only redirect if we have an incident ID and no errors
  if (incidentId && !error) {
    // This will throw a REDIRECT error that should not be caught
    redirect(`/incident/${incidentId}`)
  }

  // If we get here, something went wrong but we didn't catch it
  return { error: "An unexpected error occurred. Please try again." }
}

// Verify incident access
export async function verifyIncidentAccessAction(formData: FormData) {
  const incidentId = formData.get("incidentId") as string
  const password = formData.get("password") as string

  if (!incidentId || !password) {
    return { error: "Incident ID and password are required" }
  }

  try {
    const result = await verifyIncidentAccess(incidentId, password)

    if (!result.success) {
      return { error: result.error }
    }

    return { success: true }
  } catch (error) {
    console.error("Error verifying incident access:", error)
    return { error: "Failed to verify access" }
  }
}

// Create a new briefing
export async function createBriefingAction(formData: FormData) {
  const incidentId = formData.get("incidentId") as string
  const type = formData.get("type") as string
  const shift = formData.get("shift") as string
  const content = formData.get("content") as string
  const requirePassword = formData.get("require_password") === "yes"
  const viewerPassword = requirePassword ? (formData.get("viewer_password") as string) : undefined

  if (!incidentId || !type || !shift || !content) {
    return { error: "All fields are required" }
  }

  if (requirePassword && !viewerPassword) {
    return { error: "Password is required when password protection is enabled" }
  }

  let briefingId: string | undefined
  let error: { error: string; details?: string } | undefined

  try {
    const contentObj = {
      text: content,
      format: "markdown",
    }

    const briefing = await createBriefing(incidentId, type, shift, contentObj, viewerPassword)

    if (!briefing || !briefing.id) {
      error = { error: "Failed to create briefing. Please try again." }
      return error
    }

    // Store the briefing ID for redirection
    briefingId = briefing.id

    // Revalidate the path
    revalidatePath(`/incident/${incidentId}`)
  } catch (err) {
    console.error("Error creating briefing:", err)
    error = { error: "Failed to create briefing" }
    return error
  }

  // Only redirect if we have a briefing ID and no errors
  if (briefingId && !error) {
    // This will throw a REDIRECT error that should not be caught
    redirect(`/incident/${incidentId}/briefing/${briefingId}`)
  }

  // If we get here, something went wrong but we didn't catch it
  return { error: "An unexpected error occurred. Please try again." }
}

// Verify briefing access
export async function verifyBriefingAccessAction(formData: FormData) {
  const briefingId = formData.get("briefingId") as string
  const password = formData.get("password") as string

  if (!briefingId || !password) {
    return { error: "Briefing ID and password are required" }
  }

  try {
    const result = await verifyBriefingAccess(briefingId, password)

    if (!result.success) {
      return { error: result.error }
    }

    return { success: true }
  } catch (error) {
    console.error("Error verifying briefing access:", error)
    return { error: "Failed to verify access" }
  }
}
