"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import Breadcrumbs from "@/components/breadcrumbs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import BriefingWizard from "@/components/briefing-wizard"
import ChangedFieldIndicator from "@/components/changed-field-indicator"

interface CreateVersionProps {
  params: {
    id: string
  }
}

export default function CreateVersion({ params }: CreateVersionProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sourceBriefingId = searchParams.get("sourceBriefingId")

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [volunteers, setVolunteers] = useState([{ id: 1 }])
  const [incident, setIncident] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState<any>({})
  const [originalData, setOriginalData] = useState<any>({})
  const [hasChanges, setHasChanges] = useState(false)
  const [showNoChangesWarning, setShowNoChangesWarning] = useState(false)
  const [sourceBriefingType, setSourceBriefingType] = useState<string | undefined>()

  // Fetch incident data
  useEffect(() => {
    async function fetchIncident() {
      try {
        setLoading(true)
        const response = await fetch(`/api/incidents/${params.id}`)

        if (!response.ok) {
          throw new Error("Failed to fetch incident details")
        }

        const data = await response.json()
        setIncident(data)
      } catch (error) {
        console.error("Error fetching incident:", error)
        setError("Failed to load incident details")
      } finally {
        if (!sourceBriefingId) {
          setLoading(false)
        }
      }
    }

    fetchIncident()
  }, [params.id, sourceBriefingId])

  // Fetch source briefing data if provided
  useEffect(() => {
    if (!sourceBriefingId) return

    async function fetchSourceBriefing() {
      try {
        const response = await fetch(`/api/briefings/${sourceBriefingId}/source`)

        if (!response.ok) {
          throw new Error("Failed to fetch source briefing")
        }

        const { briefing } = await response.json()

        // Set the source briefing type
        setSourceBriefingType(briefing.type)

        // Extract data from the briefing content based on format
        const extractedData: any = {}

        if (briefing.content?.format === "volunteer_briefing_v1" || briefing.content?.format === "otl_briefing_v1") {
          // Handle new format
          const content = briefing.content

          // Extract common fields
          if (content.document?.title) {
            const titleParts = content.document.title.split(":")
            if (titleParts.length > 1) {
              extractedData.incident_name = titleParts[0].trim()
            }
          }

          // Extract sections data
          if (content.sections) {
            content.sections.forEach((section: any) => {
              if (section.heading === "Overview" && section.content) {
                extractedData.response_summary = section.content
              }

              if (section.fields) {
                section.fields.forEach((field: any) => {
                  // Map fields based on their labels
                  const fieldValue = field.value || field.content

                  if (field.label === "Address" && fieldValue) {
                    const addressLines = fieldValue.split("\n")
                    if (addressLines.length >= 3) {
                      extractedData.building_and_street = addressLines[0]
                      extractedData.town_or_city = addressLines[1]
                      extractedData.postcode = addressLines[2]
                    } else if (addressLines.length === 2) {
                      extractedData.building_and_street = addressLines[0]
                      extractedData.town_or_city = addressLines[1]
                    } else {
                      extractedData.building_and_street = fieldValue
                    }
                  }

                  // Handle what3words - split into separate words if it exists
                  if (field.label === "What3words" && fieldValue) {
                    const words = fieldValue.split(".")
                    if (words.length === 3) {
                      extractedData.what3words_word1 = words[0]
                      extractedData.what3words_word2 = words[1]
                      extractedData.what3words_word3 = words[2]
                    }
                  }

                  // Map other fields
                  const fieldMappings: Record<string, string> = {
                    "Meeting point": "meeting_point",
                    "Getting there": "getting_there",
                    Hazards: "hazards",
                    "Lead partner organisation": "lead_partner_organisation",
                    "Estimated demand": "estimated_demand",
                    "Risks and escalation": "risks_and_escalation",
                    "Equipment and supplies": "equipment_and_supplies",
                    "Anticipated needs": "anticipated_needs",
                    "Special assistance": "special_assistance",
                    Sensitivities: "sensitivities",
                    "What to bring": "what_to_bring",
                    "OTL name and number": "otl_name",
                    "Partner Organisation": "partner_organisation",
                    "Key Partner Name": "key_partner_name",
                    "Key Partner Contact": "key_partner_contact",
                    "Additional Details (OTL Only)": "otl_additional_details",
                  }

                  if (fieldMappings[field.label]) {
                    extractedData[fieldMappings[field.label]] = fieldValue
                  }

                  // Handle OTL contact info which might be combined with name
                  if (field.label === "OTL name and number" && fieldValue) {
                    const parts = fieldValue.split("\n")
                    if (parts.length >= 2) {
                      extractedData.otl_name = parts[0]
                      extractedData.otl_contact = parts[1]
                    }
                  }

                  // Handle shift times
                  if (field.label === "Start and end date and time" && fieldValue) {
                    const timeParts = fieldValue.split("–")
                    if (timeParts.length >= 2) {
                      const startParts = timeParts[0].trim().split(",")
                      const endParts = timeParts[1].trim().split(",")

                      if (startParts.length >= 2) {
                        extractedData.start_date = startParts[0].trim()
                        extractedData.start_time = startParts[1].trim()
                      }

                      if (endParts.length >= 2) {
                        extractedData.end_date = endParts[0].trim()
                        extractedData.end_time = endParts[1].trim()
                      }
                    }
                  }
                })
              }
            })
          }

          // Extract briefing reference from shift
          extractedData.briefing_reference = briefing.shift

          // Extract volunteer information
          const volunteerData: any[] = []
          if (content.sections) {
            content.sections.forEach((section: any) => {
              if (section.heading === "Your shift and team" && section.fields) {
                section.fields.forEach((field: any) => {
                  if (field.label.includes("Volunteer") && field.label.includes("name and number")) {
                    const value = field.value || field.content
                    if (value) {
                      const parts = value.split("\n")
                      if (parts.length >= 2) {
                        volunteerData.push({
                          name: parts[0],
                          contact: parts[1],
                          information: "",
                        })
                      } else {
                        volunteerData.push({
                          name: value,
                          contact: "",
                          information: "",
                        })
                      }
                    }
                  }
                })
              }
            })
          }

          if (volunteerData.length > 0) {
            setVolunteers(
              volunteerData.map((v, index) => ({
                id: index + 1,
                ...v,
              })),
            )
          }
        } else if (briefing.content?.format === "structured_v2") {
          // Handle structured_v2 format
          const content = briefing.content

          // Map direct fields
          const directMappings: Record<string, string> = {
            response_summary: "response_summary",
            additional_info: "additional_info",
          }

          Object.entries(directMappings).forEach(([source, target]) => {
            if (content[source]) {
              extractedData[target] = content[source]
            }
          })

          // Map nested fields
          if (content.response_location) {
            const locationMappings: Record<string, string> = {
              building_and_street: "building_and_street",
              town_or_city: "town_or_city",
              postcode: "postcode",
              meeting_point: "meeting_point",
              getting_there: "getting_there",
              hazards: "hazards",
              lead_partner_organisation: "lead_partner_organisation",
            }

            Object.entries(locationMappings).forEach(([source, target]) => {
              if (content.response_location[source]) {
                extractedData[target] = content.response_location[source]
              }
            })

            // Handle what3words - split into separate words if it exists
            if (content.response_location.what3words) {
              const words = content.response_location.what3words.split(".")
              if (words.length === 3) {
                extractedData.what3words_word1 = words[0]
                extractedData.what3words_word2 = words[1]
                extractedData.what3words_word3 = words[2]
              }
            }
          }

          if (content.deployment_details) {
            const deploymentMappings: Record<string, string> = {
              estimated_demand: "estimated_demand",
              risks_and_escalation: "risks_and_escalation",
              equipment_and_supplies: "equipment_and_supplies",
              anticipated_needs: "anticipated_needs",
              special_assistance: "special_assistance",
              sensitivities: "sensitivities",
              what_to_bring: "what_to_bring",
            }

            Object.entries(deploymentMappings).forEach(([source, target]) => {
              if (content.deployment_details[source]) {
                extractedData[target] = content.deployment_details[source]
              }
            })
          }

          if (content.shift_information) {
            const shiftMappings: Record<string, string> = {
              start_date: "start_date",
              start_time: "start_time",
              end_date: "end_date",
              end_time: "end_time",
              otl_name: "otl_name",
              otl_contact: "otl_contact",
            }

            Object.entries(shiftMappings).forEach(([source, target]) => {
              if (content.shift_information[source]) {
                extractedData[target] = content.shift_information[source]
              }
            })
          }

          if (content.partner_details) {
            const partnerMappings: Record<string, string> = {
              partner_organisation: "partner_organisation",
              key_partner_name: "key_partner_name",
              key_partner_contact: "key_partner_contact",
              otl_additional_details: "otl_additional_details",
            }

            Object.entries(partnerMappings).forEach(([source, target]) => {
              if (content.partner_details[source]) {
                extractedData[target] = content.partner_details[source]
              }
            })
          }

          // Extract volunteer information
          if (content.volunteers && content.volunteers.length > 0) {
            setVolunteers(
              content.volunteers.map((v: any, index: number) => ({
                id: index + 1,
                name: v.name || "",
                contact: v.contact || "",
                information: v.information || "",
              })),
            )
          }

          // Extract briefing reference from shift
          extractedData.briefing_reference = briefing.shift
        }

        // Set the form data with extracted values
        setFormData(extractedData)
        setOriginalData(extractedData)

        console.log("Pre-populated form with data:", extractedData)
      } catch (error) {
        console.error("Error fetching source briefing:", error)
        setError("Failed to pre-populate form with source briefing data")
      } finally {
        setLoading(false)
      }
    }

    fetchSourceBriefing()
  }, [sourceBriefingId])

  const addVolunteer = () => {
    setVolunteers([...volunteers, { id: volunteers.length + 1 }])
  }

  // Track form changes
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev: any) => ({
      ...prev,
      [name]: value,
    }))
  }, [])

  const handleSelectChange = useCallback((name: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [name]: value,
    }))
  }, [])

  // Check for changes whenever formData updates
  useEffect(() => {
    if (Object.keys(originalData).length === 0) return

    // Compare current form data with original data
    let changed = false

    // Check each field in the form data
    Object.entries(formData).forEach(([key, value]) => {
      // If the field exists in original data and has changed
      if (originalData[key] !== undefined && originalData[key] !== value) {
        changed = true
      }
      // If it's a new field with a value
      else if (originalData[key] === undefined && value) {
        changed = true
      }
    })

    // Also check if any original fields were removed
    Object.keys(originalData).forEach((key) => {
      if (formData[key] === undefined && originalData[key]) {
        changed = true
      }
    })

    setHasChanges(changed)
  }, [formData, originalData])

  // Function to check if a field has changed
  const hasFieldChanged = useCallback(
    (fieldName: string) => {
      return (
        originalData[fieldName] !== formData[fieldName] &&
        (originalData[fieldName] !== undefined || formData[fieldName] !== "")
      )
    },
    [originalData, formData],
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check if there are any changes
    if (!hasChanges) {
      setShowNoChangesWarning(true)
      return
    }

    setIsSubmitting(true)
    setError(null)

    const formDataObj = new FormData(e.target as HTMLFormElement)

    // Add the incident ID from the URL params
    formDataObj.set("incidentId", params.id)

    // Add the incident name
    if (incident && incident.name) {
      formDataObj.set("incident_name", incident.name)
    }

    // Combine what3words fields into a single value for submission
    const word1 = formData.what3words_word1 || ""
    const word2 = formData.what3words_word2 || ""
    const word3 = formData.what3words_word3 || ""
    if (word1 && word2 && word3) {
      formDataObj.set("what3words", `${word1}.${word2}.${word3}`)
    }

    try {
      // Use fetch API instead of direct server action call
      const response = await fetch("/api/create-briefing", {
        method: "POST",
        body: formDataObj,
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "An error occurred")
        setIsSubmitting(false)
        return
      }

      // If successful, redirect to the briefing page
      router.push(`/incident/${params.id}/briefing/${result.id}`)
    } catch (err) {
      console.error("Client-side form submission error:", err)
      setError("An error occurred. Please try again.")
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push(`/incident/${params.id}`)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    )
  }

  if (!incident) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
        <p className="font-medium">{error || "Failed to load incident details"}</p>
        <Link href="/">
          <Button variant="outline" className="mt-4">
            Return to Home
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: incident.name, href: `/incident/${params.id}` },
          { label: "Create new version", href: `/incident/${params.id}/create-version` },
        ]}
      />

      {/* Header Section */}
      <section className="mb-8">
        <div className="flex items-center mb-4">
          <h1 className="text-2xl font-bold">{incident.name}</h1>
        </div>
        <div className="text-sm text-gray-500 mb-4">
          <p>
            Last updated: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}{" "}
            at {new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          </p>
          <p>Updated by: Current User</p>
        </div>
        <div className="bg-gray-50 p-4 border-l-4 border-red-600 mb-6">
          <p className="mb-2">
            Add the information volunteers and the Operational Team Leader (OTL) need so they can prepare for their
            shift.
          </p>
          <p>This form will generate 2 versions of the briefing, 1 for volunteers and 1 for the OTL.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            <p className="font-medium">{error}</p>
          </div>
        )}
      </section>

      {/* Wizard Form */}
      <BriefingWizard
        formData={formData}
        originalData={originalData}
        setFormData={setFormData}
        handleInputChange={handleInputChange}
        handleSelectChange={handleSelectChange}
        volunteers={volunteers}
        setVolunteers={setVolunteers}
        addVolunteer={addVolunteer}
        isSubmitting={isSubmitting}
        showNoChangesWarning={showNoChangesWarning}
        hasChanges={hasChanges}
        sourceBriefingType={sourceBriefingType}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      >
        {/* Step 1: Overview */}
        <div className="space-y-6">
          <div>
            <ChangedFieldIndicator
              hasChanged={hasFieldChanged("briefing_reference")}
              hasPreviousVersion={!!sourceBriefingId}
            />
            <Label htmlFor="briefing_reference" className="font-medium">
              Briefing reference
            </Label>
            <p className="text-gray-500 text-sm mb-2">Enter the day and shift, for example "Day 1 shift 2"</p>
            <Input
              id="briefing_reference"
              name="briefing_reference"
              className="border-gray-300 max-w-md"
              required
              disabled={isSubmitting}
              value={formData.briefing_reference || ""}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <ChangedFieldIndicator hasChanged={hasFieldChanged("area_team")} hasPreviousVersion={!!sourceBriefingId} />
            <Label htmlFor="area_team" className="font-medium">
              Select area team
            </Label>
            <Select
              name="area_team"
              required
              disabled={isSubmitting}
              value={formData.area_team || ""}
              onValueChange={(value) => handleSelectChange("area_team", value)}
            >
              <SelectTrigger className="max-w-md">
                <SelectValue placeholder="Select an area team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="Scotland">Scotland</SelectItem>
                <SelectItem value="Northern Ireland">Northern Ireland</SelectItem>
                <SelectItem value="Wales">Wales</SelectItem>
                <SelectItem value="North">North</SelectItem>
                <SelectItem value="Central">Central</SelectItem>
                <SelectItem value="London">London</SelectItem>
                <SelectItem value="South East">South East</SelectItem>
                <SelectItem value="South and Channel Islands">South and Channel Islands</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <ChangedFieldIndicator
              hasChanged={hasFieldChanged("response_summary")}
              hasPreviousVersion={!!sourceBriefingId}
            />
            <Label htmlFor="response_summary" className="font-medium">
              Response summary
            </Label>
            <p className="text-gray-500 text-sm mb-2">
              Give more details of the situation so volunteers know what to expect. Maximum 140 characters.
            </p>
            <Textarea
              id="response_summary"
              name="response_summary"
              className="border-gray-300"
              maxLength={140}
              disabled={isSubmitting}
              value={formData.response_summary || ""}
              onChange={handleInputChange}
            />
          </div>
        </div>

        {/* Step 2: Response Location */}
        <div className="space-y-6">
          <p className="text-gray-500 mb-6">Take account of the shift start time when including travel information.</p>

          <div>
            <ChangedFieldIndicator
              hasChanged={hasFieldChanged("building_and_street")}
              hasPreviousVersion={!!sourceBriefingId}
            />
            <Label htmlFor="building_and_street" className="font-medium">
              Building and street
            </Label>
            <Input
              id="building_and_street"
              name="building_and_street"
              className="border-gray-300"
              required
              disabled={isSubmitting}
              value={formData.building_and_street || ""}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <ChangedFieldIndicator
              hasChanged={hasFieldChanged("town_or_city")}
              hasPreviousVersion={!!sourceBriefingId}
            />
            <Label htmlFor="town_or_city" className="font-medium">
              Town or city
            </Label>
            <Input
              id="town_or_city"
              name="town_or_city"
              className="border-gray-300 max-w-md"
              required
              disabled={isSubmitting}
              value={formData.town_or_city || ""}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <ChangedFieldIndicator hasChanged={hasFieldChanged("postcode")} hasPreviousVersion={!!sourceBriefingId} />
            <Label htmlFor="postcode" className="font-medium">
              Postcode
            </Label>
            <Input
              id="postcode"
              name="postcode"
              className="border-gray-300 max-w-xs"
              required
              disabled={isSubmitting}
              value={formData.postcode || ""}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <ChangedFieldIndicator
              hasChanged={
                hasFieldChanged("what3words_word1") ||
                hasFieldChanged("what3words_word2") ||
                hasFieldChanged("what3words_word3")
              }
              hasPreviousVersion={!!sourceBriefingId}
            />
            <Label className="font-medium">What3words</Label>
            <p className="text-gray-500 text-sm mb-2">Enter the three words that identify the precise location</p>
            <div className="flex gap-2 max-w-md">
              <Input
                id="what3words_word1"
                name="what3words_word1"
                className="border-gray-300"
                placeholder="First word"
                disabled={isSubmitting}
                value={formData.what3words_word1 || ""}
                onChange={handleInputChange}
              />
              <span className="flex items-center">.</span>
              <Input
                id="what3words_word2"
                name="what3words_word2"
                className="border-gray-300"
                placeholder="Second word"
                disabled={isSubmitting}
                value={formData.what3words_word2 || ""}
                onChange={handleInputChange}
              />
              <span className="flex items-center">.</span>
              <Input
                id="what3words_word3"
                name="what3words_word3"
                className="border-gray-300"
                placeholder="Third word"
                disabled={isSubmitting}
                value={formData.what3words_word3 || ""}
                onChange={handleInputChange}
              />
            </div>
            {formData.what3words_word1 && formData.what3words_word2 && formData.what3words_word3 && (
              <p className="text-sm text-blue-600 mt-2">
                <a
                  href={`https://what3words.com/${formData.what3words_word1}.${formData.what3words_word2}.${formData.what3words_word3}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  View on what3words.com
                </a>
              </p>
            )}
          </div>

          <div>
            <ChangedFieldIndicator
              hasChanged={hasFieldChanged("meeting_point")}
              hasPreviousVersion={!!sourceBriefingId}
            />
            <Label htmlFor="meeting_point" className="font-medium">
              Meeting point
            </Label>
            <Input
              id="meeting_point"
              name="meeting_point"
              className="border-gray-300 max-w-md"
              disabled={isSubmitting}
              value={formData.meeting_point || ""}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <ChangedFieldIndicator
              hasChanged={hasFieldChanged("getting_there")}
              hasPreviousVersion={!!sourceBriefingId}
            />
            <Label htmlFor="getting_there" className="font-medium">
              Getting there
            </Label>
            <p className="text-gray-500 text-sm mb-2">
              Add information for drivers and volunteers using public transport.
            </p>
            <Textarea
              id="getting_there"
              name="getting_there"
              className="border-gray-300"
              disabled={isSubmitting}
              value={formData.getting_there || ""}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <ChangedFieldIndicator hasChanged={hasFieldChanged("hazards")} hasPreviousVersion={!!sourceBriefingId} />
            <Label htmlFor="hazards" className="font-medium">
              Hazards
            </Label>
            <Textarea
              id="hazards"
              name="hazards"
              className="border-gray-300"
              disabled={isSubmitting}
              value={formData.hazards || ""}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <ChangedFieldIndicator
              hasChanged={hasFieldChanged("lead_partner_organisation")}
              hasPreviousVersion={!!sourceBriefingId}
            />
            <Label htmlFor="lead_partner_organisation" className="font-medium">
              Lead partner organisation
            </Label>
            <Input
              id="lead_partner_organisation"
              name="lead_partner_organisation"
              className="border-gray-300 max-w-md"
              disabled={isSubmitting}
              value={formData.lead_partner_organisation || ""}
              onChange={handleInputChange}
            />
          </div>
        </div>

        {/* Step 3: Deployment Details */}
        <div className="space-y-6">
          <p className="text-gray-500 mb-6">
            Provide information to help volunteers get ready for the size, severity and any special requirements of the
            response
          </p>

          <div>
            <ChangedFieldIndicator
              hasChanged={hasFieldChanged("estimated_demand")}
              hasPreviousVersion={!!sourceBriefingId}
            />
            <Label htmlFor="estimated_demand" className="font-medium">
              Estimated demand
            </Label>
            <p className="text-gray-500 text-sm mb-2">
              How many people are affected? What's the estimated number of service users?
            </p>
            <Textarea
              id="estimated_demand"
              name="estimated_demand"
              className="border-gray-300"
              disabled={isSubmitting}
              value={formData.estimated_demand || ""}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <ChangedFieldIndicator
              hasChanged={hasFieldChanged("risks_and_escalation")}
              hasPreviousVersion={!!sourceBriefingId}
            />
            <Label htmlFor="risks_and_escalation" className="font-medium">
              Risks and escalation
            </Label>
            <p className="text-gray-500 text-sm mb-2">
              Give details of risks or potential problems. What should volunteers do?
            </p>
            <Textarea
              id="risks_and_escalation"
              name="risks_and_escalation"
              className="border-gray-300"
              disabled={isSubmitting}
              value={formData.risks_and_escalation || ""}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <ChangedFieldIndicator
              hasChanged={hasFieldChanged("equipment_and_supplies")}
              hasPreviousVersion={!!sourceBriefingId}
            />
            <Label htmlFor="equipment_and_supplies" className="font-medium">
              Equipment and supplies
            </Label>
            <p className="text-gray-500 text-sm mb-2">
              Describe unusual or additional supplies, who is providing them, and how they will be sourced and
              transported
            </p>
            <Textarea
              id="equipment_and_supplies"
              name="equipment_and_supplies"
              className="border-gray-300"
              disabled={isSubmitting}
              value={formData.equipment_and_supplies || ""}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <ChangedFieldIndicator
              hasChanged={hasFieldChanged("anticipated_needs")}
              hasPreviousVersion={!!sourceBriefingId}
            />
            <Label htmlFor="anticipated_needs" className="font-medium">
              Anticipated needs
            </Label>
            <p className="text-gray-500 text-sm mb-2">
              Give details of how volunteers have been asked to support service users
            </p>
            <Textarea
              id="anticipated_needs"
              name="anticipated_needs"
              className="border-gray-300"
              disabled={isSubmitting}
              value={formData.anticipated_needs || ""}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <ChangedFieldIndicator
              hasChanged={hasFieldChanged("special_assistance")}
              hasPreviousVersion={!!sourceBriefingId}
            />
            <Label htmlFor="special_assistance" className="font-medium">
              Special assistance
            </Label>
            <p className="text-gray-500 text-sm mb-2">
              Note any service users with vulnerabilities, or who might need to be prioritised
            </p>
            <Textarea
              id="special_assistance"
              name="special_assistance"
              className="border-gray-300"
              disabled={isSubmitting}
              value={formData.special_assistance || ""}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <ChangedFieldIndicator
              hasChanged={hasFieldChanged("sensitivities")}
              hasPreviousVersion={!!sourceBriefingId}
            />
            <Label htmlFor="sensitivities" className="font-medium">
              Sensitivities
            </Label>
            <p className="text-gray-500 text-sm mb-2">
              What should volunteers know to avoid creating barriers with service users or partners?
            </p>
            <Textarea
              id="sensitivities"
              name="sensitivities"
              className="border-gray-300"
              disabled={isSubmitting}
              value={formData.sensitivities || ""}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <ChangedFieldIndicator
              hasChanged={hasFieldChanged("what_to_bring")}
              hasPreviousVersion={!!sourceBriefingId}
            />
            <Label htmlFor="what_to_bring" className="font-medium">
              What to bring
            </Label>
            <p className="text-gray-500 text-sm mb-2">
              Items which are not ordinary grab-bag or vehicle stock. Often location- or situation-specific
            </p>
            <Textarea
              id="what_to_bring"
              name="what_to_bring"
              className="border-gray-300"
              disabled={isSubmitting}
              value={formData.what_to_bring || ""}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <ChangedFieldIndicator
              hasChanged={hasFieldChanged("additional_info")}
              hasPreviousVersion={!!sourceBriefingId}
            />
            <Label htmlFor="additional_info" className="font-medium">
              Additional information
            </Label>
            <p className="text-gray-500 text-sm mb-2">
              Use this space to add any important extra details that will help volunteers and OTLs prepare for their
              shift.
            </p>
            <Textarea
              id="additional_info"
              name="additional_info"
              className="border-gray-300 min-h-[150px]"
              disabled={isSubmitting}
              value={formData.additional_info || ""}
              onChange={handleInputChange}
            />
          </div>
        </div>

        {/* Step 4: Shift Information */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <ChangedFieldIndicator
                hasChanged={hasFieldChanged("start_date")}
                hasPreviousVersion={!!sourceBriefingId}
              />
              <Label htmlFor="start_date" className="font-medium">
                Start date
              </Label>
              <p className="text-gray-500 text-sm mb-2">Provide the day, month and year the shift starts</p>
              <Input
                id="start_date"
                name="start_date"
                type="date"
                className="border-gray-300"
                required
                disabled={isSubmitting}
                value={formData.start_date || ""}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <ChangedFieldIndicator
                hasChanged={hasFieldChanged("start_time")}
                hasPreviousVersion={!!sourceBriefingId}
              />
              <Label htmlFor="start_time" className="font-medium">
                Start time
              </Label>
              <p className="text-gray-500 text-sm mb-2">Use 24-hour format (e.g. 14:00)</p>
              <Input
                id="start_time"
                name="start_time"
                className="border-gray-300 max-w-xs"
                required
                disabled={isSubmitting}
                value={formData.start_time || ""}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <ChangedFieldIndicator hasChanged={hasFieldChanged("end_date")} hasPreviousVersion={!!sourceBriefingId} />
              <Label htmlFor="end_date" className="font-medium">
                End date
              </Label>
              <p className="text-gray-500 text-sm mb-2">Provide the day, month and year the shift ends</p>
              <Input
                id="end_date"
                name="end_date"
                type="date"
                className="border-gray-300"
                required
                disabled={isSubmitting}
                value={formData.end_date || ""}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <ChangedFieldIndicator hasChanged={hasFieldChanged("end_time")} hasPreviousVersion={!!sourceBriefingId} />
              <Label htmlFor="end_time" className="font-medium">
                End time
              </Label>
              <p className="text-gray-500 text-sm mb-2">Use 24-hour format (e.g. 18:00)</p>
              <Input
                id="end_time"
                name="end_time"
                className="border-gray-300 max-w-xs"
                required
                disabled={isSubmitting}
                value={formData.end_time || ""}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div>
            <ChangedFieldIndicator hasChanged={hasFieldChanged("otl_name")} hasPreviousVersion={!!sourceBriefingId} />
            <Label htmlFor="otl_name" className="font-medium">
              OTL name
            </Label>
            <Input
              id="otl_name"
              name="otl_name"
              className="border-gray-300 max-w-md"
              required
              disabled={isSubmitting}
              value={formData.otl_name || ""}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <ChangedFieldIndicator
              hasChanged={hasFieldChanged("otl_contact")}
              hasPreviousVersion={!!sourceBriefingId}
            />
            <Label htmlFor="otl_contact" className="font-medium">
              OTL contact number
            </Label>
            <Input
              id="otl_contact"
              name="otl_contact"
              type="tel"
              className="border-gray-300 max-w-md"
              required
              disabled={isSubmitting}
              value={formData.otl_contact || ""}
              onChange={handleInputChange}
            />
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium mb-4">Volunteer Briefing Access</h3>
            <div>
              <ChangedFieldIndicator
                hasChanged={hasFieldChanged("volunteer_password")}
                hasPreviousVersion={!!sourceBriefingId}
              />
              <Label htmlFor="volunteer_password" className="font-medium">
                Volunteer briefing password
              </Label>
              <Input
                id="volunteer_password"
                name="volunteer_password"
                type="password"
                className="border-gray-300 max-w-md"
                placeholder="Create a password for volunteer briefing (optional)"
                disabled={isSubmitting}
              />
              <p className="text-sm text-gray-500 mt-1">Leave blank for no password protection</p>
            </div>
          </div>
        </div>

        {/* Step 5: OTL-Specific Information */}
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-medium mb-4">Volunteer details</h3>

            {volunteers.map((volunteer, index) => (
              <div key={volunteer.id} className="mb-8 p-4 border border-gray-200 rounded-md">
                <h4 className="font-medium mb-4">Volunteer {index + 1}</h4>
                <div className="space-y-6">
                  <div>
                    <Label htmlFor={`volunteer_name_${volunteer.id}`} className="font-medium">
                      Volunteer name
                    </Label>
                    <Input
                      id={`volunteer_name_${volunteer.id}`}
                      name={`volunteer_name_${volunteer.id}`}
                      className="border-gray-300 max-w-md"
                      required
                      disabled={isSubmitting}
                      defaultValue={(volunteer as any).name || ""}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`volunteer_contact_${volunteer.id}`} className="font-medium">
                      Volunteer contact number
                    </Label>
                    <Input
                      id={`volunteer_contact_${volunteer.id}`}
                      name={`volunteer_contact_${volunteer.id}`}
                      type="tel"
                      className="border-gray-300 max-w-md"
                      required
                      disabled={isSubmitting}
                      defaultValue={(volunteer as any).contact || ""}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`volunteer_information_${volunteer.id}`} className="font-medium">
                      Volunteer information
                    </Label>
                    <Textarea
                      id={`volunteer_information_${volunteer.id}`}
                      name={`volunteer_information_${volunteer.id}`}
                      className="border-gray-300"
                      disabled={isSubmitting}
                      defaultValue={(volunteer as any).information || ""}
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              className="flex items-center gap-2 mt-4"
              onClick={addVolunteer}
              disabled={isSubmitting}
            >
              <Plus className="h-4 w-4" />
              Add another volunteer
            </Button>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">Partner details</h3>
            <div className="space-y-6">
              <div>
                <ChangedFieldIndicator
                  hasChanged={hasFieldChanged("partner_organisation")}
                  hasPreviousVersion={!!sourceBriefingId}
                />
                <Label htmlFor="partner_organisation" className="font-medium">
                  Partner organisation
                </Label>
                <Input
                  id="partner_organisation"
                  name="partner_organisation"
                  className="border-gray-300 max-w-md"
                  disabled={isSubmitting}
                  value={formData.partner_organisation || ""}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <ChangedFieldIndicator
                  hasChanged={hasFieldChanged("key_partner_name")}
                  hasPreviousVersion={!!sourceBriefingId}
                />
                <Label htmlFor="key_partner_name" className="font-medium">
                  Key partner name
                </Label>
                <Input
                  id="key_partner_name"
                  name="key_partner_name"
                  className="border-gray-300 max-w-md"
                  disabled={isSubmitting}
                  value={formData.key_partner_name || ""}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <ChangedFieldIndicator
                  hasChanged={hasFieldChanged("key_partner_contact")}
                  hasPreviousVersion={!!sourceBriefingId}
                />
                <Label htmlFor="key_partner_contact" className="font-medium">
                  Key partner contact number
                </Label>
                <Input
                  id="key_partner_contact"
                  name="key_partner_contact"
                  type="tel"
                  className="border-gray-300 max-w-md"
                  disabled={isSubmitting}
                  value={formData.key_partner_contact || ""}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <ChangedFieldIndicator
                  hasChanged={hasFieldChanged("otl_additional_details")}
                  hasPreviousVersion={!!sourceBriefingId}
                />
                <Label htmlFor="otl_additional_details" className="font-medium">
                  Additional details (OTL only)
                </Label>
                <p className="text-gray-500 text-sm mb-2">Include any additional information only the OTL needs</p>
                <Textarea
                  id="otl_additional_details"
                  name="otl_additional_details"
                  className="border-gray-300"
                  disabled={isSubmitting}
                  value={formData.otl_additional_details || ""}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium mb-4">OTL Briefing Access</h3>
            <div>
              <ChangedFieldIndicator
                hasChanged={hasFieldChanged("otl_password")}
                hasPreviousVersion={!!sourceBriefingId}
              />
              <Label htmlFor="otl_password" className="font-medium">
                OTL briefing password
              </Label>
              <Input
                id="otl_password"
                name="otl_password"
                type="password"
                className="border-gray-300 max-w-md"
                placeholder="Create a password for OTL briefing (optional)"
                disabled={isSubmitting}
              />
              <p className="text-sm text-gray-500 mt-1">Leave blank for no password protection</p>
            </div>
          </div>
        </div>
      </BriefingWizard>
    </div>
  )
}
