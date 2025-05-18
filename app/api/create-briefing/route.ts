import { NextResponse } from "next/server"
import { createBriefing } from "@/lib/briefings"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()

    const incidentId = formData.get("incidentId") as string
    if (!incidentId) {
      return NextResponse.json({ error: "Incident ID is required" }, { status: 400 })
    }

    // Extract briefing reference as the shift
    const shift = formData.get("briefing_reference") as string
    if (!shift) {
      return NextResponse.json({ error: "Briefing reference is required" }, { status: 400 })
    }

    // Determine the type based on area team
    const areaTeam = formData.get("area_team") as string
    const incidentName = (formData.get("incident_name") as string) || "Incident"

    // Get current date and time for "last updated" field
    const now = new Date()
    const lastUpdated =
      now.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }) +
      " at " +
      now.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      })

    // Common fields for both briefings
    const commonFields = {
      overview: {
        content: (formData.get("response_summary") as string) || "",
      },
      response_location: {
        address: [
          (formData.get("building_and_street") as string) || "",
          (formData.get("town_or_city") as string) || "",
          (formData.get("postcode") as string) || "",
        ]
          .filter(Boolean)
          .join("\n"),
        what3words: (formData.get("what3words") as string) || "",
        meeting_point: (formData.get("meeting_point") as string) || "",
        getting_there: (formData.get("getting_there") as string) || "",
        hazards: (formData.get("hazards") as string) || "",
      },
      deployment_details: {
        estimated_demand: (formData.get("estimated_demand") as string) || "",
        risks_and_escalation: (formData.get("risks_and_escalation") as string) || "",
        equipment_and_supplies: (formData.get("equipment_and_supplies") as string) || "",
        anticipated_needs: (formData.get("anticipated_needs") as string) || "",
        special_assistance: (formData.get("special_assistance") as string) || "",
      },
      instructions: {
        sensitivities: (formData.get("sensitivities") as string) || "",
        what_to_bring: (formData.get("what_to_bring") as string) || "",
      },
      shift_information: {
        start_date: (formData.get("start_date") as string) || "",
        start_time: (formData.get("start_time") as string) || "",
        end_date: (formData.get("end_date") as string) || "",
        end_time: (formData.get("end_time") as string) || "",
        otl_name: (formData.get("otl_name") as string) || "",
        otl_contact: (formData.get("otl_contact") as string) || "",
      },
      additional_info: (formData.get("additional_info") as string) || "",
      last_updated: lastUpdated,
    }

    // Format the shift times
    const shiftTimes = `${commonFields.shift_information.start_date}, ${commonFields.shift_information.start_time} – ${commonFields.shift_information.end_date}, ${commonFields.shift_information.end_time}`

    // 1. Create Volunteer Briefing
    const volunteerBriefingContent = {
      document: {
        title: `${incidentName}: volunteer briefing`,
        last_updated: lastUpdated,
        audience: "volunteers",
        intro:
          "The information in this volunteer briefing is specific to this deployment. For broader advice on responding effectively, use the Volunteer Playbook.",
      },
      sections: [
        {
          heading: "Overview",
          content: commonFields.overview.content,
        },
        {
          heading: "Response location",
          fields: [
            {
              label: "Address",
              value: commonFields.response_location.address,
            },
            {
              label: "What3words",
              value: commonFields.response_location.what3words,
            },
            {
              label: "Meeting point",
              value: commonFields.response_location.meeting_point,
            },
            {
              label: "Getting there",
              value: commonFields.response_location.getting_there,
            },
            {
              label: "Hazards",
              value: commonFields.response_location.hazards,
            },
            {
              label: "Lead partner organisation",
              value: (formData.get("lead_partner_organisation") as string) || "",
            },
          ],
        },
        {
          heading: "Deployment details",
          fields: [
            {
              label: "Estimated demand",
              value: commonFields.deployment_details.estimated_demand,
            },
            {
              label: "Risks and escalation",
              value: commonFields.deployment_details.risks_and_escalation,
            },
            {
              label: "Equipment and supplies",
              value: commonFields.deployment_details.equipment_and_supplies,
            },
            {
              label: "Anticipated needs",
              value: commonFields.deployment_details.anticipated_needs,
            },
            {
              label: "Special assistance",
              value: commonFields.deployment_details.special_assistance,
            },
          ],
        },
        {
          heading: "Instructions and notes",
          fields: [
            {
              label: "Sensitivities",
              value: commonFields.instructions.sensitivities,
            },
            {
              label: "What to bring",
              value: commonFields.instructions.what_to_bring,
            },
          ],
        },
        {
          heading: "Your shift and team",
          fields: [
            {
              label: "Start and end date and time",
              value: shiftTimes,
            },
            {
              label: "OTL name and number",
              value: `${commonFields.shift_information.otl_name}\n${commonFields.shift_information.otl_contact}`,
            },
          ],
        },
      ],
      format: "volunteer_briefing_v1",
    }

    // Add additional information section if it exists
    if (commonFields.additional_info) {
      volunteerBriefingContent.sections.push({
        heading: "Additional information",
        content: commonFields.additional_info,
      })
    }

    // 2. Create OTL Briefing
    const otlBriefingContent = {
      page: {
        title: `${incidentName}: OTL briefing`,
        metadata: {
          last_updated: lastUpdated,
        },
        description:
          "The information in this OTL briefing is specific to this deployment. For broader advice, use the Volunteer Playbook.",
      },
      sections: [
        {
          heading: "Overview",
          content: commonFields.overview.content,
        },
        {
          heading: "Response location",
          fields: [
            {
              label: "Address",
              content: commonFields.response_location.address,
            },
            {
              label: "What3words",
              content: commonFields.response_location.what3words,
            },
            {
              label: "Meeting point",
              content: commonFields.response_location.meeting_point,
            },
            {
              label: "Getting there",
              content: commonFields.response_location.getting_there,
            },
            {
              label: "Hazards",
              content: commonFields.response_location.hazards,
            },
          ],
        },
        {
          heading: "Partner information",
          fields: [
            {
              label: "Lead partner organisation",
              content: (formData.get("lead_partner_organisation") as string) || "",
            },
            {
              label: "Partner liaison name",
              content: (formData.get("key_partner_name") as string) || "",
            },
            {
              label: "Partner liaison number",
              content: (formData.get("key_partner_contact") as string) || "",
            },
          ],
        },
        {
          heading: "Deployment details",
          fields: [
            {
              label: "Estimated demand",
              content: commonFields.deployment_details.estimated_demand,
            },
            {
              label: "Risks and escalation",
              content: commonFields.deployment_details.risks_and_escalation,
            },
            {
              label: "Equipment and supplies",
              content: commonFields.deployment_details.equipment_and_supplies,
            },
            {
              label: "Anticipated needs",
              content: commonFields.deployment_details.anticipated_needs,
            },
            {
              label: "Special assistance",
              content: commonFields.deployment_details.special_assistance,
            },
          ],
        },
        {
          heading: "Instructions and notes",
          fields: [
            {
              label: "Sensitivities",
              content: commonFields.instructions.sensitivities,
            },
            {
              label: "What to bring",
              content: commonFields.instructions.what_to_bring,
            },
          ],
        },
        {
          heading: "Your shift and team",
          fields: [
            {
              label: "Start and end date and time",
              content: shiftTimes,
            },
          ],
        },
      ],
      format: "otl_briefing_v1",
    }

    // Add additional information section if it exists
    if (commonFields.additional_info) {
      otlBriefingContent.sections.push({
        heading: "Additional information",
        content: commonFields.additional_info,
      })
    }

    // Extract volunteer information
    const volunteerEntries = []
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("volunteer_name_")) {
        const id = key.replace("volunteer_name_", "")
        const name = value as string
        const contact = (formData.get(`volunteer_contact_${id}`) as string) || ""
        const information = (formData.get(`volunteer_information_${id}`) as string) || ""

        if (name) {
          volunteerEntries.push({
            name,
            contact,
            information,
          })

          // Add volunteer to OTL briefing
          otlBriefingContent.sections[5].fields.push({
            label: `Volunteer ${volunteerEntries.length} name and number`,
            content: `${name}\n${contact}`,
          })
        }
      }
    }

    // Add additional OTL information if provided
    if (formData.get("otl_additional_details")) {
      otlBriefingContent.sections[5].fields.push({
        label: "Additional information",
        content: formData.get("otl_additional_details") as string,
      })
    }

    // Get the separate passwords for each briefing type
    const volunteerPassword = (formData.get("volunteer_password") as string) || undefined
    const otlPassword = (formData.get("otl_password") as string) || undefined

    // Create the volunteer briefing
    const volunteerBriefing = await createBriefing(
      incidentId,
      "Volunteer Briefing",
      shift,
      volunteerBriefingContent,
      volunteerPassword,
    )

    // Create the OTL briefing
    const otlBriefing = await createBriefing(incidentId, "OTL Briefing", shift, otlBriefingContent, otlPassword)

    if (!volunteerBriefing || !volunteerBriefing.id) {
      return NextResponse.json({ error: "Failed to create volunteer briefing. Please try again." }, { status: 500 })
    }

    // Return the volunteer briefing ID for client-side redirection
    return NextResponse.json({
      success: true,
      id: volunteerBriefing.id,
      type: volunteerBriefing.type,
      shift: volunteerBriefing.shift,
      otlBriefingId: otlBriefing?.id,
    })
  } catch (error) {
    console.error("Error creating briefing:", error)
    return NextResponse.json(
      {
        error: "Failed to create briefing",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
