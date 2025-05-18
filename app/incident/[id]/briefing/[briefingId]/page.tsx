"use client"

import { useState, useEffect } from "react"
import Breadcrumbs from "@/components/breadcrumbs"
import ProtectedBriefingPage from "@/components/protected-briefing-page"
import { Loader2 } from "lucide-react"

interface BriefingPageProps {
  params: {
    id: string
    briefingId: string
  }
}

export default function BriefingPage({ params }: BriefingPageProps) {
  return (
    <ProtectedBriefingPage
      briefingId={params.briefingId}
      renderContent={() => <BriefingContent incidentId={params.id} briefingId={params.briefingId} />}
    />
  )
}

// Separate component that only renders after authorization
function BriefingContent({ incidentId, briefingId }: { incidentId: string; briefingId: string }) {
  const [incident, setIncident] = useState<any>(null)
  const [briefing, setBriefing] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch data only after authorization
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)

        // Fetch briefing data first
        const briefingResponse = await fetch(`/api/briefings/${briefingId}`)
        if (!briefingResponse.ok) {
          throw new Error("Failed to fetch briefing details")
        }
        const briefingData = await briefingResponse.json()

        console.log("Briefing data loaded:", {
          id: briefingData.id,
          type: briefingData.type,
          contentFormat: briefingData.content?.format,
          hasContent: !!briefingData.content,
        })

        // Try to fetch incident data, but don't fail if it's not accessible
        let incidentData = null
        try {
          const incidentResponse = await fetch(`/api/incidents/${incidentId}`)
          if (incidentResponse.ok) {
            incidentData = await incidentResponse.json()
          } else {
            console.log("Incident data not accessible, using limited information")
            // Create a minimal incident object with just the ID
            incidentData = {
              id: incidentId,
              name: "Protected Incident", // Default name when incident is protected
            }
          }
        } catch (incidentErr) {
          console.log("Error fetching incident, using limited information:", incidentErr)
          // Create a minimal incident object with just the ID
          incidentData = {
            id: incidentId,
            name: "Protected Incident", // Default name when incident is protected
          }
        }

        setBriefing(briefingData)
        setIncident(incidentData)
      } catch (err) {
        console.error("Error loading data:", err)
        setError(err instanceof Error ? err.message : "Failed to load content")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [incidentId, briefingId])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    )
  }

  if (error || !incident || !briefing) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
        <p className="font-medium">{error || "Failed to load content"}</p>
      </div>
    )
  }

  // Determine which format to render
  const format = briefing.content?.format || "unknown"

  // Check if we have limited incident information
  const hasLimitedIncidentInfo = !incident.area && incident.name === "Protected Incident"

  return (
    <div>
      <Breadcrumbs
        items={[
          {
            label: incident.name || "Protected Incident",
            href: hasLimitedIncidentInfo ? "#" : `/incident/${incidentId}`,
          },
          {
            label: `${briefing.type} - ${briefing.shift}`,
            href: `/incident/${incidentId}/briefing/${briefingId}`,
          },
        ]}
      />

      {hasLimitedIncidentInfo && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded mb-6">
          <p className="font-medium">
            You have access to this briefing, but the incident details are protected. Contact the incident manager for
            full access.
          </p>
        </div>
      )}

      <h1 className="text-2xl font-bold mb-4">{briefing.type} Briefing</h1>

      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
        {format === "volunteer_briefing_v1" ? (
          <VolunteerBriefingView briefing={briefing} />
        ) : format === "otl_briefing_v1" ? (
          <OTLBriefingView briefing={briefing} />
        ) : (
          <LegacyBriefingView briefing={briefing} incident={incident} />
        )}
      </div>
    </div>
  )
}

// Component to render the new Volunteer Briefing format
function VolunteerBriefingView({ briefing }: { briefing: any }) {
  const document = briefing.content?.document || {}
  const sections = briefing.content?.sections || []

  return (
    <div className="max-w-4xl mx-auto">
      {/* Document Header */}
      <header className="mb-8 border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold mb-2">{document.title || "Volunteer Briefing"}</h1>
        {document.last_updated && <p className="text-gray-600 text-sm">Last updated: {document.last_updated}</p>}
        {document.audience && <p className="text-gray-600 text-sm">Audience: {document.audience}</p>}
        {document.intro && (
          <div className="mt-4 bg-gray-50 p-4 border-l-4 border-red-600 text-sm">
            <p
              dangerouslySetInnerHTML={{
                __html: document.intro
                  ? document.intro.replace(
                      /Volunteer Playbook/g,
                      '<a href="https://cerplaybook.com" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">Volunteer Playbook</a>',
                    )
                  : "",
              }}
            />
          </div>
        )}
      </header>

      {/* Sections */}
      <div className="space-y-8">
        {sections.map((section: any, index: number) => (
          <section key={index} className="border-b border-gray-100 pb-6 last:border-0">
            <h2 className="text-xl font-bold text-red-600 mb-4">{section.heading}</h2>

            {section.content && <div className="mb-4 whitespace-pre-line">{section.content}</div>}

            {section.fields && section.fields.length > 0 && (
              <div className="space-y-4">
                {section.fields.map((field: any, fieldIndex: number) => (
                  <div key={fieldIndex} className={field.value ? "mb-4" : "hidden"}>
                    <h3 className="font-semibold text-gray-800">{field.label}</h3>
                    <div className="mt-1 whitespace-pre-line">{field.value}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}

// Component to render the new OTL Briefing format
function OTLBriefingView({ briefing }: { briefing: any }) {
  const page = briefing.content?.page || {}
  const sections = briefing.content?.sections || []

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Header */}
      <header className="mb-8 border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold mb-2">{page.title || "OTL Briefing"}</h1>
        {page.metadata?.last_updated && (
          <p className="text-gray-600 text-sm">Last updated: {page.metadata.last_updated}</p>
        )}
        {page.description && (
          <div className="mt-4 bg-gray-50 p-4 border-l-4 border-red-600 text-sm">
            <p
              dangerouslySetInnerHTML={{
                __html: page.description
                  ? page.description.replace(
                      /Volunteer Playbook/g,
                      '<a href="https://cerplaybook.com" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">Volunteer Playbook</a>',
                    )
                  : "",
              }}
            />
          </div>
        )}
      </header>

      {/* Sections */}
      <div className="space-y-8">
        {sections.map((section: any, index: number) => (
          <section key={index} className="border-b border-gray-100 pb-6 last:border-0">
            <h2 className="text-xl font-bold text-red-600 mb-4">{section.heading}</h2>

            {section.content && <div className="mb-4 whitespace-pre-line">{section.content}</div>}

            {section.fields && section.fields.length > 0 && (
              <div className="space-y-4">
                {section.fields.map((field: any, fieldIndex: number) => (
                  <div key={fieldIndex} className={field.content ? "mb-4" : "hidden"}>
                    <h3 className="font-semibold text-gray-800">{field.label}</h3>
                    <div className="mt-1 whitespace-pre-line">{field.content}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}

// Component to render legacy briefing formats
function LegacyBriefingView({ briefing, incident }: { briefing: any; incident: any }) {
  // Check if content is in structured format
  const isStructuredContent = briefing.content?.format === "structured" || briefing.content?.format === "structured_v2"

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{incident.name}</h1>
          <p className="text-gray-600">
            {briefing.type} - {briefing.shift}
          </p>
        </div>
      </div>

      {isStructuredContent ? (
        <div className="space-y-8">
          {/* Structured content rendering logic */}
          {/* Overview Section */}
          {briefing.content.overview && (
            <section>
              <h2 className="text-xl font-bold text-red-600 mb-3">Overview</h2>
              <div className="space-y-3">
                {briefing.content.overview?.briefing_reference && (
                  <div>
                    <h3 className="font-semibold">Briefing Reference</h3>
                    <p>{briefing.content.overview.briefing_reference}</p>
                  </div>
                )}
                {briefing.content.overview?.area_team && (
                  <div>
                    <h3 className="font-semibold">Area Team</h3>
                    <p>{briefing.content.overview.area_team}</p>
                  </div>
                )}
                {briefing.content.overview?.response_summary && (
                  <div>
                    <h3 className="font-semibold">Response Summary</h3>
                    <p className="whitespace-pre-line">{briefing.content.overview.response_summary}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Other structured sections */}
          {briefing.content.situation_update && (
            <section>
              <h2 className="text-xl font-bold text-red-600 mb-3">Situation Update</h2>
              <p className="whitespace-pre-line">{briefing.content.situation_update}</p>
            </section>
          )}

          {/* Check for structured_v2 format */}
          {briefing.content.format === "structured_v2" && (
            <>
              {/* Response Location Section */}
              <section>
                <h2 className="text-xl font-bold text-red-600 mb-3">Response Location</h2>
                <div className="space-y-3">
                  {briefing.content.response_location?.building_and_street && (
                    <div>
                      <h3 className="font-semibold">Address</h3>
                      <p>{briefing.content.response_location.building_and_street}</p>
                      <p>{briefing.content.response_location.town_or_city || ""}</p>
                      <p>{briefing.content.response_location.postcode || ""}</p>
                    </div>
                  )}
                  {briefing.content.response_location?.what3words && (
                    <div>
                      <h3 className="font-semibold">What3words</h3>
                      <p>{briefing.content.response_location.what3words}</p>
                    </div>
                  )}
                  {briefing.content.response_location?.meeting_point && (
                    <div>
                      <h3 className="font-semibold">Meeting Point</h3>
                      <p>{briefing.content.response_location.meeting_point}</p>
                    </div>
                  )}
                  {briefing.content.response_location?.getting_there && (
                    <div>
                      <h3 className="font-semibold">Getting There</h3>
                      <p className="whitespace-pre-line">{briefing.content.response_location.getting_there}</p>
                    </div>
                  )}
                  {briefing.content.response_location?.hazards && (
                    <div>
                      <h3 className="font-semibold">Hazards</h3>
                      <p className="whitespace-pre-line">{briefing.content.response_location.hazards}</p>
                    </div>
                  )}
                  {briefing.content.response_location?.lead_partner_organisation && (
                    <div>
                      <h3 className="font-semibold">Lead Partner Organisation</h3>
                      <p>{briefing.content.response_location.lead_partner_organisation}</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Deployment Details Section */}
              <section>
                <h2 className="text-xl font-bold text-red-600 mb-3">Deployment Details</h2>
                <div className="space-y-3">
                  {briefing.content.deployment_details?.estimated_demand && (
                    <div>
                      <h3 className="font-semibold">Estimated Demand</h3>
                      <p className="whitespace-pre-line">{briefing.content.deployment_details.estimated_demand}</p>
                    </div>
                  )}
                  {briefing.content.deployment_details?.risks_and_escalation && (
                    <div>
                      <h3 className="font-semibold">Risks and Escalation</h3>
                      <p className="whitespace-pre-line">{briefing.content.deployment_details.risks_and_escalation}</p>
                    </div>
                  )}
                  {briefing.content.deployment_details?.equipment_and_supplies && (
                    <div>
                      <h3 className="font-semibold">Equipment and Supplies</h3>
                      <p className="whitespace-pre-line">
                        {briefing.content.deployment_details.equipment_and_supplies}
                      </p>
                    </div>
                  )}
                  {briefing.content.deployment_details?.anticipated_needs && (
                    <div>
                      <h3 className="font-semibold">Anticipated Needs</h3>
                      <p className="whitespace-pre-line">{briefing.content.deployment_details.anticipated_needs}</p>
                    </div>
                  )}
                  {briefing.content.deployment_details?.special_assistance && (
                    <div>
                      <h3 className="font-semibold">Special Assistance</h3>
                      <p className="whitespace-pre-line">{briefing.content.deployment_details.special_assistance}</p>
                    </div>
                  )}
                  {briefing.content.deployment_details?.sensitivities && (
                    <div>
                      <h3 className="font-semibold">Sensitivities</h3>
                      <p className="whitespace-pre-line">{briefing.content.deployment_details.sensitivities}</p>
                    </div>
                  )}
                  {briefing.content.deployment_details?.what_to_bring && (
                    <div>
                      <h3 className="font-semibold">What to Bring</h3>
                      <p className="whitespace-pre-line">{briefing.content.deployment_details.what_to_bring}</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Additional Information Section */}
              {briefing.content.additional_info && (
                <section>
                  <h2 className="text-xl font-bold text-red-600 mb-3">Additional Information</h2>
                  <p className="whitespace-pre-line">{briefing.content.additional_info}</p>
                </section>
              )}

              {/* Shift Information Section */}
              <section>
                <h2 className="text-xl font-bold text-red-600 mb-3">Shift Information</h2>
                <div className="space-y-3">
                  {(briefing.content.shift_information?.start_date ||
                    briefing.content.shift_information?.start_time) && (
                    <div>
                      <h3 className="font-semibold">Start</h3>
                      <p>
                        {briefing.content.shift_information?.start_date || ""}{" "}
                        {briefing.content.shift_information?.start_time || ""}
                      </p>
                    </div>
                  )}
                  {(briefing.content.shift_information?.end_date || briefing.content.shift_information?.end_time) && (
                    <div>
                      <h3 className="font-semibold">End</h3>
                      <p>
                        {briefing.content.shift_information?.end_date || ""}{" "}
                        {briefing.content.shift_information?.end_time || ""}
                      </p>
                    </div>
                  )}
                  {briefing.content.shift_information?.otl_name && (
                    <div>
                      <h3 className="font-semibold">OTL Name</h3>
                      <p>{briefing.content.shift_information.otl_name}</p>
                    </div>
                  )}
                  {briefing.content.shift_information?.otl_contact && (
                    <div>
                      <h3 className="font-semibold">OTL Contact</h3>
                      <p>{briefing.content.shift_information.otl_contact}</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Volunteer Details Section */}
              {briefing.content.volunteers && briefing.content.volunteers.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold text-red-600 mb-3">Volunteer Details</h2>
                  {briefing.content.volunteers.map((volunteer, index) => (
                    <div key={index} className="mb-4 p-3 border border-gray-200 rounded-md">
                      <h3 className="font-semibold">{volunteer.name}</h3>
                      {volunteer.contact && <p>Contact: {volunteer.contact}</p>}
                      {volunteer.information && <p className="whitespace-pre-line mt-2">{volunteer.information}</p>}
                    </div>
                  ))}
                </section>
              )}

              {/* Partner Details Section */}
              {(briefing.content.partner_details?.partner_organisation ||
                briefing.content.partner_details?.key_partner_name ||
                briefing.content.partner_details?.key_partner_contact ||
                briefing.content.partner_details?.otl_additional_details) && (
                <section>
                  <h2 className="text-xl font-bold text-red-600 mb-3">Partner Details</h2>
                  <div className="space-y-3">
                    {briefing.content.partner_details?.partner_organisation && (
                      <div>
                        <h3 className="font-semibold">Partner Organisation</h3>
                        <p>{briefing.content.partner_details.partner_organisation}</p>
                      </div>
                    )}
                    {briefing.content.partner_details?.key_partner_name && (
                      <div>
                        <h3 className="font-semibold">Key Partner Name</h3>
                        <p>{briefing.content.partner_details.key_partner_name}</p>
                      </div>
                    )}
                    {briefing.content.partner_details?.key_partner_contact && (
                      <div>
                        <h3 className="font-semibold">Key Partner Contact</h3>
                        <p>{briefing.content.partner_details.key_partner_contact}</p>
                      </div>
                    )}
                    {briefing.content.partner_details?.otl_additional_details && (
                      <div>
                        <h3 className="font-semibold">Additional Details (OTL Only)</h3>
                        <p className="whitespace-pre-line">{briefing.content.partner_details.otl_additional_details}</p>
                      </div>
                    )}
                  </div>
                </section>
              )}
            </>
          )}

          {/* Resources - for older structured format */}
          {briefing.content.resources && (
            <section>
              <h2 className="text-xl font-bold text-red-600 mb-3">Resources</h2>
              <div className="space-y-3">
                {briefing.content.resources?.beds && (
                  <div>
                    <h3 className="font-semibold">Beds</h3>
                    <p>{briefing.content.resources.beds}</p>
                  </div>
                )}
                {briefing.content.resources?.response_vehicles && (
                  <div>
                    <h3 className="font-semibold">Response Vehicles</h3>
                    <p className="whitespace-pre-line">{briefing.content.resources.response_vehicles}</p>
                  </div>
                )}
                {briefing.content.resources?.food && (
                  <div>
                    <h3 className="font-semibold">Food</h3>
                    <p>{briefing.content.resources.food}</p>
                  </div>
                )}
                {briefing.content.resources?.water && (
                  <div>
                    <h3 className="font-semibold">Water</h3>
                    <p>{briefing.content.resources.water}</p>
                  </div>
                )}
                {briefing.content.resources?.blankets && (
                  <div>
                    <h3 className="font-semibold">Blankets</h3>
                    <p>{briefing.content.resources.blankets}</p>
                  </div>
                )}
                {briefing.content.resources?.medication && (
                  <div>
                    <h3 className="font-semibold">Medication</h3>
                    <p>{briefing.content.resources.medication}</p>
                  </div>
                )}
                {briefing.content.resources?.toiletries && (
                  <div>
                    <h3 className="font-semibold">Toiletries</h3>
                    <p>{briefing.content.resources.toiletries}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Deployment Details - for older structured format */}
          {briefing.content.deployment_details && !briefing.content.format === "structured_v2" && (
            <section>
              <h2 className="text-xl font-bold text-red-600 mb-3">Deployment Details</h2>
              <div className="space-y-3">
                {briefing.content.deployment_details?.requested_support && (
                  <div>
                    <h3 className="font-semibold">Requested Support</h3>
                    <p className="whitespace-pre-line">{briefing.content.deployment_details.requested_support}</p>
                  </div>
                )}
                {briefing.content.deployment_details?.rest_centre_location && (
                  <div>
                    <h3 className="font-semibold">Rest Centre Location</h3>
                    <p className="whitespace-pre-line">{briefing.content.deployment_details.rest_centre_location}</p>
                  </div>
                )}
                {briefing.content.deployment_details?.communication_details && (
                  <div>
                    <h3 className="font-semibold">Communication Details</h3>
                    <p className="whitespace-pre-line">{briefing.content.deployment_details.communication_details}</p>
                  </div>
                )}
                {briefing.content.deployment_details?.incident_scale && (
                  <div>
                    <h3 className="font-semibold">Incident Scale</h3>
                    <p className="whitespace-pre-line">{briefing.content.deployment_details.incident_scale}</p>
                  </div>
                )}
                {briefing.content.deployment_details?.team_composition && (
                  <div>
                    <h3 className="font-semibold">Team Composition</h3>
                    <p className="whitespace-pre-line">{briefing.content.deployment_details.team_composition}</p>
                  </div>
                )}
                {briefing.content.deployment_details?.procedures && (
                  <div>
                    <h3 className="font-semibold">Procedures</h3>
                    <p className="whitespace-pre-line">{briefing.content.deployment_details.procedures}</p>
                  </div>
                )}
                {briefing.content.deployment_details?.key_messaging && (
                  <div>
                    <h3 className="font-semibold">Key Messaging</h3>
                    <p className="whitespace-pre-line">{briefing.content.deployment_details.key_messaging}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Contacts - for older structured format */}
          {(briefing.content.contacts?.incident_officer ||
            briefing.content.contacts?.otl_contact ||
            briefing.content.contacts?.volunteer_contact) && (
            <section>
              <h2 className="text-xl font-bold text-red-600 mb-3">Contact Information</h2>
              <div className="space-y-3">
                {briefing.content.contacts?.incident_officer && (
                  <div>
                    <h3 className="font-semibold">Incident Officer</h3>
                    <p>{briefing.content.contacts.incident_officer}</p>
                  </div>
                )}
                {briefing.content.contacts?.otl_contact && (
                  <div>
                    <h3 className="font-semibold">OTL Contact</h3>
                    <p>{briefing.content.contacts.otl_contact}</p>
                  </div>
                )}
                {briefing.content.contacts?.volunteer_contact && (
                  <div>
                    <h3 className="font-semibold">Volunteer Contact</h3>
                    <p>{briefing.content.contacts.volunteer_contact}</p>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      ) : (
        // Fallback for legacy content format
        <div className="prose max-w-none">
          {briefing.content?.text ? (
            <div
              dangerouslySetInnerHTML={{
                __html: briefing.content.text
                  .replace(/\n/g, "<br>")
                  .replace(/^## (.*$)/gm, "<h2>$1</h2>")
                  .replace(/^# (.*$)/gm, "<h1>$1</h1>")
                  .replace(/^- (.*$)/gm, "<li>$1</li>")
                  .replace(/^\d\. (.*$)/gm, "<ol><li>$1</li></ol>"),
              }}
            />
          ) : (
            <p>No content available. This briefing may be empty or in an unsupported format.</p>
          )}
        </div>
      )}
    </div>
  )
}
