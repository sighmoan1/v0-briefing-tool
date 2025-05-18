import { sql } from "./db"
import { hashPassword, verifyPassword, setAccessCookie } from "./auth"
import { randomUUID } from "crypto"

export interface Briefing {
  id: string
  incident_id: string
  type: string
  shift: string
  content: any
  viewer_password_hash?: string
  created_at: Date
  created_by?: string
}

// Get briefings for an incident
export async function getBriefings(incidentId: string, page = 1, limit = 10, search?: string) {
  const offset = (page - 1) * limit

  try {
    let briefings
    let total

    if (search) {
      const searchPattern = `%${search}%`
      const result = await sql`
        SELECT id, incident_id, type, shift, created_at, viewer_password_hash
        FROM briefings
        WHERE incident_id = ${incidentId} AND (type ILIKE ${searchPattern} OR shift ILIKE ${searchPattern})
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      briefings = result || []

      // Count total briefings for pagination
      const countResult = await sql`
        SELECT COUNT(*) as count FROM briefings 
        WHERE incident_id = ${incidentId} AND (type ILIKE ${searchPattern} OR shift ILIKE ${searchPattern})
      `
      // Handle potential undefined values safely
      total = countResult && countResult[0] ? Number(countResult[0].count) : 0
    } else {
      const result = await sql`
        SELECT id, incident_id, type, shift, created_at, viewer_password_hash
        FROM briefings
        WHERE incident_id = ${incidentId}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      briefings = result || []

      // Count total briefings for pagination
      const countResult = await sql`
        SELECT COUNT(*) as count FROM briefings 
        WHERE incident_id = ${incidentId}
      `
      // Handle potential undefined values safely
      total = countResult && countResult[0] ? Number(countResult[0].count) : 0
    }

    return {
      briefings: briefings as Briefing[],
      total,
      totalPages: Math.ceil(total / limit),
    }
  } catch (error) {
    console.error("Error fetching briefings:", error)
    // Return empty results on error
    return {
      briefings: [],
      total: 0,
      totalPages: 0,
    }
  }
}

// Get a single briefing by ID
export async function getBriefingById(id: string) {
  try {
    const result = await sql`
      SELECT id, incident_id, type, shift, content, created_at, viewer_password_hash
      FROM briefings
      WHERE id = ${id}
    `

    return result && result[0] ? (result[0] as Briefing) : undefined
  } catch (error) {
    console.error("Error fetching briefing:", error)
    return undefined
  }
}

// Create a new briefing
export async function createBriefing(
  incidentId: string,
  type: string,
  shift: string,
  content: any,
  viewerPassword?: string,
  userId?: string,
) {
  try {
    // Generate a UUID for the briefing
    const briefingId = randomUUID()
    console.log("Generated briefing ID:", briefingId)

    // Ensure the briefings table exists
    await sql`
      CREATE TABLE IF NOT EXISTS briefings (
        id UUID PRIMARY KEY,
        incident_id UUID NOT NULL,
        type TEXT NOT NULL,
        shift TEXT NOT NULL,
        content JSONB,
        viewer_password_hash TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by UUID
      )
    `

    let viewerPasswordHash = null
    if (viewerPassword) {
      viewerPasswordHash = await hashPassword(viewerPassword)
    }

    // Create briefing object that will be returned if database operations fail
    const briefingObject: Briefing = {
      id: briefingId,
      incident_id: incidentId,
      type,
      shift,
      content,
      created_at: new Date(),
    }

    try {
      // Insert the briefing with the pre-generated ID
      await sql`
        INSERT INTO briefings (id, incident_id, type, shift, content, viewer_password_hash, created_by)
        VALUES (${briefingId}, ${incidentId}, ${type}, ${shift}, ${content}, ${viewerPasswordHash}, ${userId})
      `
      console.log("Briefing inserted successfully")

      // Try to retrieve the inserted briefing
      const result = await sql`
        SELECT id, incident_id, type, shift, created_at
        FROM briefings
        WHERE id = ${briefingId}
      `

      // If we got a result, return it
      if (result && result.length > 0) {
        console.log("Retrieved briefing from database:", result[0])
        return result[0] as Briefing
      }
    } catch (dbError) {
      console.error("Database error during briefing creation:", dbError)
      // Continue to fallback
    }

    // If we couldn't retrieve the briefing from the database, return the object we created
    console.log("Using fallback briefing object:", briefingObject)
    return briefingObject
  } catch (error) {
    console.error("Error creating briefing:", error)
    throw error
  }
}

// Verify briefing access
export async function verifyBriefingAccess(briefingId: string, password: string) {
  const briefing = await getBriefingById(briefingId)

  if (!briefing) {
    return { success: false, error: "Briefing not found" }
  }

  if (!briefing.viewer_password_hash) {
    return { success: true }
  }

  const passwordMatch = await verifyPassword(password, briefing.viewer_password_hash)

  if (!passwordMatch) {
    try {
      // Ensure the access_logs table exists
      await sql`
        CREATE TABLE IF NOT EXISTS access_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          resource_id UUID NOT NULL,
          resource_type TEXT NOT NULL,
          user_id UUID,
          accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          access_granted BOOLEAN NOT NULL
        )
      `

      // Log failed access attempt
      await sql`
        INSERT INTO access_logs (resource_id, resource_type, access_granted)
        VALUES (${briefingId}, 'briefing', false)
      `
    } catch (error) {
      console.error("Error logging access attempt:", error)
      // Continue even if logging fails
    }

    return { success: false, error: "Invalid password" }
  }

  try {
    // Ensure the access_logs table exists
    await sql`
      CREATE TABLE IF NOT EXISTS access_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        resource_id UUID NOT NULL,
        resource_type TEXT NOT NULL,
        user_id UUID,
        accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        access_granted BOOLEAN NOT NULL
      )
    `

    // Log successful access
    await sql`
      INSERT INTO access_logs (resource_id, resource_type, access_granted)
      VALUES (${briefingId}, 'briefing', true)
    `
  } catch (error) {
    console.error("Error logging access attempt:", error)
    // Continue even if logging fails
  }

  // Set access cookie
  setAccessCookie(briefingId, "briefing")

  return { success: true }
}
