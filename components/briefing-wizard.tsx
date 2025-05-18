"use client"

import React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, ChevronRight, Eye, Save, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

interface BriefingWizardProps {
  formData: any
  originalData: any
  setFormData: (data: any) => void
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  handleSelectChange: (name: string, value: string) => void
  volunteers: any[]
  setVolunteers: (volunteers: any[]) => void
  addVolunteer: () => void
  isSubmitting: boolean
  showNoChangesWarning: boolean
  hasChanges: boolean
  sourceBriefingType?: string
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  children: React.ReactNode
}

export default function BriefingWizard({
  formData,
  originalData,
  setFormData,
  handleInputChange,
  handleSelectChange,
  volunteers,
  setVolunteers,
  addVolunteer,
  isSubmitting,
  showNoChangesWarning,
  hasChanges,
  sourceBriefingType,
  onSubmit,
  onCancel,
  children,
}: BriefingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [showPreview, setShowPreview] = useState(false)
  const [previewType, setPreviewType] = useState<"volunteer" | "otl">("volunteer")

  // Define the steps
  const steps = [
    { id: 1, title: "Overview", description: "Basic information about the incident" },
    { id: 2, title: "Response Location", description: "Where the response is taking place" },
    { id: 3, title: "Deployment Details", description: "Information about the deployment" },
    { id: 4, title: "Shift Information", description: "Timing and contact details" },
    { id: 5, title: "OTL-Specific Information", description: "Information only for OTLs" },
  ]

  // Extract the children into step content
  const childrenArray = React.Children.toArray(children)

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

  // Function to get all changed fields
  const getChangedFields = useCallback(() => {
    return Object.keys(formData).filter((key) => hasFieldChanged(key))
  }, [formData, hasFieldChanged])

  // Count of changed fields
  const changedFieldsCount = getChangedFields().length

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Source briefing and update information */}
      {sourceBriefingType ? (
        <Alert className="bg-blue-50 border-blue-200 text-blue-800">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>You're updating both briefing types</AlertTitle>
          <AlertDescription>
            You're creating a new version based on the {sourceBriefingType} briefing. Changes you make will create new
            versions of both the Volunteer and OTL briefings.
            {changedFieldsCount > 0 && (
              <div className="mt-2">
                <span className="font-medium">Changes detected: </span>
                {changedFieldsCount} field{changedFieldsCount !== 1 ? "s" : ""}
              </div>
            )}
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="bg-blue-50 border-blue-200 text-blue-800">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Creating new briefings</AlertTitle>
          <AlertDescription>
            You're creating new Volunteer and OTL briefings. Fill out the form and use the preview to see how they'll
            appear.
          </AlertDescription>
        </Alert>
      )}

      {/* No changes warning */}
      {showNoChangesWarning && (
        <Alert variant="warning" className="bg-amber-50 border-amber-200 text-amber-800">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No changes detected</AlertTitle>
          <AlertDescription>
            You haven't made any changes to the briefing. Please modify at least one field before saving to create a new
            version.
          </AlertDescription>
        </Alert>
      )}

      {/* Main content area */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form panel */}
        <div className={cn("lg:col-span-3", showPreview ? "lg:col-span-3" : "lg:col-span-5")}>
          {/* Progress indicator */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span>
                Step {currentStep} of {steps.length}
              </span>
              <span>{steps[currentStep - 1].title}</span>
            </div>
            <Progress value={(currentStep / steps.length) * 100} className="h-2" />
          </div>

          {/* Step content */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
            <h2 className="text-xl font-semibold text-red-600 mb-4 pb-2 border-b border-gray-200 flex items-center">
              {steps[currentStep - 1].title}
              {currentStep < 5 ? (
                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">Shared content</span>
              ) : (
                <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs">
                  OTL briefing only
                </span>
              )}
            </h2>
            <p className="text-gray-600 mb-6">{steps[currentStep - 1].description}</p>

            {/* Dynamic step content */}
            {childrenArray[currentStep - 1]}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between">
            <div>
              <Button
                type="button"
                variant="outline"
                className="border-gray-300 mr-2"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Cancel
              </Button>

              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  className="border-gray-300"
                  onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                  disabled={isSubmitting}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
              )}
            </div>

            <div>
              <Button
                type="button"
                variant="outline"
                className="mr-2"
                onClick={() => setShowPreview(!showPreview)}
                disabled={isSubmitting}
              >
                <Eye className="h-4 w-4 mr-1" />
                {showPreview ? "Hide Preview" : "Show Preview"}
              </Button>

              {currentStep < steps.length ? (
                <Button
                  type="button"
                  onClick={() => setCurrentStep((prev) => Math.min(steps.length, prev + 1))}
                  disabled={isSubmitting}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  className={`${hasChanges ? "bg-red-600 hover:bg-red-700" : "bg-gray-400"}`}
                  disabled={isSubmitting || !hasChanges}
                >
                  <Save className="h-4 w-4 mr-1" />
                  {isSubmitting ? "Saving..." : "Save Briefings"}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Preview panel */}
        {showPreview && (
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-lg border border-gray-200 sticky top-4">
              <h2 className="text-xl font-semibold mb-4">Preview</h2>

              <Tabs defaultValue="volunteer" className="mb-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="volunteer" onClick={() => setPreviewType("volunteer")}>
                    Volunteer Briefing
                  </TabsTrigger>
                  <TabsTrigger value="otl" onClick={() => setPreviewType("otl")}>
                    OTL Briefing
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="volunteer" className="mt-4">
                  <BriefingPreview type="volunteer" formData={formData} />
                </TabsContent>

                <TabsContent value="otl" className="mt-4">
                  <BriefingPreview type="otl" formData={formData} volunteers={volunteers} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </div>
    </form>
  )
}

// Preview component for briefings
function BriefingPreview({
  type,
  formData,
  volunteers = [],
}: {
  type: "volunteer" | "otl"
  formData: any
  volunteers?: any[]
}) {
  const title = formData.incident_name || "Incident"

  // Construct what3words URL if all three words are provided
  const word1 = formData.what3words_word1 || ""
  const word2 = formData.what3words_word2 || ""
  const word3 = formData.what3words_word3 || ""
  const hasAllWords = word1 && word2 && word3
  const what3wordsUrl = hasAllWords ? `https://what3words.com/${word1}.${word2}.${word3}` : ""

  return (
    <div className="prose prose-sm max-h-[600px] overflow-y-auto p-4 border border-gray-100 rounded bg-gray-50">
      <h1>
        {title}: {type === "volunteer" ? "volunteer" : "OTL"} briefing
      </h1>

      {/* Overview section */}
      {formData.response_summary && (
        <section>
          <h2>Overview</h2>
          <p>{formData.response_summary}</p>
        </section>
      )}

      {/* Response location section */}
      <section>
        <h2>Response location</h2>
        {(formData.building_and_street || formData.town_or_city || formData.postcode) && (
          <div>
            <h3>Address</h3>
            <p>
              {formData.building_and_street && (
                <>
                  {formData.building_and_street}
                  <br />
                </>
              )}
              {formData.town_or_city && (
                <>
                  {formData.town_or_city}
                  <br />
                </>
              )}
              {formData.postcode && <>{formData.postcode}</>}
            </p>
          </div>
        )}

        {hasAllWords && (
          <div>
            <h3>What3words</h3>
            <p>
              <a
                href={what3wordsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {word1}.{word2}.{word3}
              </a>
            </p>
          </div>
        )}

        {formData.meeting_point && (
          <div>
            <h3>Meeting point</h3>
            <p>{formData.meeting_point}</p>
          </div>
        )}

        {formData.getting_there && (
          <div>
            <h3>Getting there</h3>
            <p>{formData.getting_there}</p>
          </div>
        )}

        {formData.hazards && (
          <div>
            <h3>Hazards</h3>
            <p>{formData.hazards}</p>
          </div>
        )}

        {formData.lead_partner_organisation && (
          <div>
            <h3>Lead partner organisation</h3>
            <p>{formData.lead_partner_organisation}</p>
          </div>
        )}
      </section>

      {/* Deployment details section */}
      {(formData.estimated_demand ||
        formData.risks_and_escalation ||
        formData.equipment_and_supplies ||
        formData.anticipated_needs ||
        formData.special_assistance) && (
        <section>
          <h2>Deployment details</h2>

          {formData.estimated_demand && (
            <div>
              <h3>Estimated demand</h3>
              <p>{formData.estimated_demand}</p>
            </div>
          )}

          {formData.risks_and_escalation && (
            <div>
              <h3>Risks and escalation</h3>
              <p>{formData.risks_and_escalation}</p>
            </div>
          )}

          {formData.equipment_and_supplies && (
            <div>
              <h3>Equipment and supplies</h3>
              <p>{formData.equipment_and_supplies}</p>
            </div>
          )}

          {formData.anticipated_needs && (
            <div>
              <h3>Anticipated needs</h3>
              <p>{formData.anticipated_needs}</p>
            </div>
          )}

          {formData.special_assistance && (
            <div>
              <h3>Special assistance</h3>
              <p>{formData.special_assistance}</p>
            </div>
          )}
        </section>
      )}

      {/* Instructions section */}
      {(formData.sensitivities || formData.what_to_bring) && (
        <section>
          <h2>Instructions and notes</h2>

          {formData.sensitivities && (
            <div>
              <h3>Sensitivities</h3>
              <p>{formData.sensitivities}</p>
            </div>
          )}

          {formData.what_to_bring && (
            <div>
              <h3>What to bring</h3>
              <p>{formData.what_to_bring}</p>
            </div>
          )}
        </section>
      )}

      {/* Additional information section */}
      {formData.additional_info && (
        <section>
          <h2>Additional information</h2>
          <p>{formData.additional_info}</p>
        </section>
      )}

      {/* Shift information */}
      <section>
        <h2>Your shift and team</h2>

        {((formData.start_date && formData.start_time) || (formData.end_date && formData.end_time)) && (
          <div>
            <h3>Start and end date and time</h3>
            <p>
              {formData.start_date && formData.start_time && (
                <>
                  {formData.start_date}, {formData.start_time} –{" "}
                </>
              )}
              {formData.end_date && formData.end_time && (
                <>
                  {formData.end_date}, {formData.end_time}
                </>
              )}
            </p>
          </div>
        )}

        {formData.otl_name && (
          <div>
            <h3>OTL name and number</h3>
            <p>
              {formData.otl_name}
              <br />
              {formData.otl_contact}
            </p>
          </div>
        )}
      </section>

      {/* OTL-specific sections */}
      {type === "otl" && (
        <>
          {/* Volunteer details */}
          {volunteers.length > 0 && (
            <section>
              <h2>Volunteer details</h2>
              {volunteers.map((volunteer, index) => (
                <div key={volunteer.id}>
                  <h3>Volunteer {index + 1}</h3>
                  <p>
                    {volunteer.name}
                    <br />
                    {volunteer.contact}
                  </p>
                  {volunteer.information && <p>{volunteer.information}</p>}
                </div>
              ))}
            </section>
          )}

          {/* Partner details */}
          {(formData.partner_organisation ||
            formData.key_partner_name ||
            formData.key_partner_contact ||
            formData.otl_additional_details) && (
            <section>
              <h2>Partner details</h2>

              {/* Only show partner_organisation if it's different from lead_partner_organisation to avoid duplication */}
              {formData.partner_organisation &&
                formData.partner_organisation !== formData.lead_partner_organisation && (
                  <div>
                    <h3>Partner organisation</h3>
                    <p>{formData.partner_organisation}</p>
                  </div>
                )}

              {formData.key_partner_name && (
                <div>
                  <h3>Key partner name</h3>
                  <p>{formData.key_partner_name}</p>
                </div>
              )}

              {formData.key_partner_contact && (
                <div>
                  <h3>Key partner contact</h3>
                  <p>{formData.key_partner_contact}</p>
                </div>
              )}

              {formData.otl_additional_details && (
                <div>
                  <h3>Additional details (OTL only)</h3>
                  <p>{formData.otl_additional_details}</p>
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  )
}
