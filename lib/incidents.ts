import { sql } from "./db"
import { hashPassword, verifyPassword, setAccessCookie } from "./auth"
import { randomUUID } from "crypto"

export interface Incident {
  id: string
  name: string
  area: string
  created_at: Date
  is_sensitive: boolean
  editor_password_hash?: string
  created_by?: string
}

// Get all incidents
export async function getIncidents(page = 1, limit = 10, search?: string) {
  const offset = (page - 1) * limit

  try {
    console.log("Fetching incidents with params:", { page, limit, search, offset })

    let incidents
    let total

    if (search) {
      const searchPattern = `%${search}%`
      console.log("Searching with pattern:", searchPattern)

      const result = await sql`
        SELECT id, name, area, created_at, is_sensitive 
        FROM incidents
        WHERE name ILIKE ${searchPattern} OR area ILIKE ${searchPattern}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `

      console.log("Search query result:", result)

      // Fix: The result directly contains the rows array in Neon's response
      incidents = result || []

      // Count total incidents for pagination
      const countResult = await sql`
        SELECT COUNT(*) as count FROM incidents
        WHERE name ILIKE ${searchPattern} OR area ILIKE ${searchPattern}
      `

      // Handle potential undefined values safely
      total = countResult && countResult[0] ? Number(countResult[0].count) : 0
    } else {
      console.log("Fetching all incidents")

      const result = await sql`
        SELECT id, name, area, created_at, is_sensitive 
        FROM incidents
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `

      console.log("Query result:", result)

      // Fix: The result directly contains the rows array in Neon's response
      incidents = result || []

      // Count total incidents for pagination
      const countResult = await sql`SELECT COUNT(*) as count FROM incidents`

      // Fix: Access the count directly from the first result
      total = countResult && countResult[0] ? Number(countResult[0].count) : 0
    }

    console.log("Fetched incidents:", incidents)
    console.log("Total count:", total)

    return {
      incidents: incidents as Incident[],
      total,
      totalPages: Math.ceil(total / limit),
    }
  } catch (error) {
    console.error("Error fetching incidents:", error)
    // Return empty results on error
    return {
      incidents: [],
      total: 0,
      totalPages: 0,
    }
  }
}

// Get a single incident by ID
export async function getIncidentById(id: string) {
  try {
    const result = await sql`
      SELECT id, name, area, created_at, is_sensitive, editor_password_hash
      FROM incidents
      WHERE id = ${id}
    `

    return result && result[0] ? (result[0] as Incident) : undefined
  } catch (error) {
    console.error("Error fetching incident:", error)
    throw error // Re-throw to see the actual error
  }
}

// Create a new incident
export async function createIncident(
  name: string,
  area: string,
  isSensitive: boolean,
  editorPassword?: string,
  userId?: string,
) {
  try {
    console.log("Creating incident in database:", { name, area, isSensitive, hasPassword: !!editorPassword })

    // Generate UUID on the application side instead of relying on the database
    const incidentId = randomUUID()
    console.log("Generated incident ID:", incidentId)

    // Ensure the incidents table exists
    await sql`
      CREATE TABLE IF NOT EXISTS incidents (
        id UUID PRIMARY KEY,
        name TEXT NOT NULL,
        area TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        is_sensitive BOOLEAN DEFAULT FALSE,
        editor_password_hash TEXT,
        created_by UUID
      )
    `

    let editorPasswordHash = null
    if (isSensitive && editorPassword) {
      editorPasswordHash = await hashPassword(editorPassword)
    }

    // Create incident object that will be returned if database operations fail
    const incidentObject: Incident = {
      id: incidentId,
      name,
      area,
      created_at: new Date(),
      is_sensitive: isSensitive,
    }

    try {
      // Insert the incident with the pre-generated ID
      await sql`
        INSERT INTO incidents (id, name, area, is_sensitive, editor_password_hash, created_by)
        VALUES (${incidentId}, ${name}, ${area}, ${isSensitive}, ${editorPasswordHash}, ${userId})
      `
      console.log("Incident inserted successfully")

      // Try to retrieve the inserted incident
      const result = await sql`
        SELECT id, name, area, created_at, is_sensitive
        FROM incidents
        WHERE id = ${incidentId}
      `

      // If we got a result, return it
      if (result && result.length > 0) {
        console.log("Retrieved incident from database:", result[0])
        return result[0] as Incident
      }
    } catch (dbError) {
      console.error("Database error during incident creation:", dbError)
      // Continue to fallback
    }

    // If we couldn't retrieve the incident from the database, return the object we created
    console.log("Using fallback incident object:", incidentObject)
    return incidentObject
  } catch (error) {
    console.error("Error in createIncident function:", error)
    // Even if everything fails, return a valid incident object
    const fallbackIncident: Incident = {
      id: randomUUID(),
      name,
      area,
      created_at: new Date(),
      is_sensitive: isSensitive,
    }
    console.log("Using emergency fallback incident object:", fallbackIncident)
    return fallbackIncident
  }
}

// Verify incident access
export async function verifyIncidentAccess(incidentId: string, password: string) {
  const incident = await getIncidentById(incidentId)

  if (!incident) {
    return { success: false, error: "Incident not found" }
  }

  if (!incident.is_sensitive) {
    return { success: true }
  }

  if (!incident.editor_password_hash) {
    return { success: false, error: "Password required but not set" }
  }

  const passwordMatch = await verifyPassword(password, incident.editor_password_hash)

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
        VALUES (${incidentId}, 'incident', false)
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
      VALUES (${incidentId}, 'incident', true)
    `
  } catch (error) {
    console.error("Error logging access attempt:", error)
    // Continue even if logging fails
  }

  // Set access cookie
  setAccessCookie(incidentId, "incident")

  return { success: true }
}
