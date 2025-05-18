import { NextResponse } from "next/server"
import { createIncident } from "@/lib/incidents"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()

    const name = formData.get("name") as string
    const area = formData.get("area") as string
    const isSensitive = formData.get("is_sensitive") === "yes"
    const editorPassword = isSensitive ? (formData.get("editor_password") as string) : undefined

    if (!name || !area) {
      return NextResponse.json({ error: "Name and area are required" }, { status: 400 })
    }

    if (isSensitive && !editorPassword) {
      return NextResponse.json({ error: "Password is required for sensitive incidents" }, { status: 400 })
    }

    console.log("Creating incident with:", { name, area, isSensitive, hasPassword: !!editorPassword })

    // Create the incident
    const incident = await createIncident(name, area, isSensitive, editorPassword)

    // Check if incident is defined
    if (!incident) {
      console.error("Failed to create incident: Incident is undefined")
      return NextResponse.json({ error: "Failed to create incident. Please try again." }, { status: 500 })
    }

    // Check if incident has an id
    if (!incident.id) {
      console.error("Failed to create incident: Incident ID is missing", incident)
      return NextResponse.json({ error: "Failed to create incident. Please try again." }, { status: 500 })
    }

    console.log("Incident created successfully:", incident)

    // Return the incident ID for client-side redirection
    return NextResponse.json({
      success: true,
      id: incident.id,
      name: incident.name,
      area: incident.area,
    })
  } catch (error) {
    console.error("Error creating incident:", error)
    return NextResponse.json(
      {
        error: "Failed to create incident. Please try again.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
