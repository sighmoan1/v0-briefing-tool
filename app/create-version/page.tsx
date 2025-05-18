"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ChevronLeft, Plus } from "lucide-react"
import Breadcrumbs from "@/components/breadcrumbs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function CreateVersion() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [volunteers, setVolunteers] = useState([{ id: 1 }])

  const addVolunteer = () => {
    setVolunteers([...volunteers, { id: volunteers.length + 1 }])
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    // Add the incident ID (in a real app, this would come from the URL or context)
    formData.set("incidentId", "1")

    try {
      // Use fetch API instead of direct server action call
      const response = await fetch("/api/create-briefing", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "An error occurred")
        setIsSubmitting(false)
        return
      }

      // If successful, redirect to the briefing page
      router.push(`/incident/${formData.get("incidentId")}/briefing/${result.id}`)
    } catch (err) {
      console.error("Client-side form submission error:", err)
      setError("An error occurred. Please try again.")
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Carrickfergus flood rest centre", href: "/incident/1" },
          { label: "Create new version", href: "/create-version" },
        ]}
      />

      {/* Header Section */}
      <section className="mb-8">
        <div className="flex items-center mb-4">
          <img src="/british-red-cross-logo.png" alt="British Red Cross" className="h-8 mr-2" />
          <h1 className="text-2xl font-bold">Carrickfergus flood rest centre</h1>
        </div>
        <div className="text-sm text-gray-500 mb-4">
          <p>Last updated: 15 March 2025 at 13:54</p>
          <p>Updated by: Livia Philips</p>
        </div>
        <div className="bg-gray-50 p-4 border-l-4 border-red-600 mb-6">
          <p className="mb-2">
            Add the information volunteers and the Operational Team Leader (OTL) need so they can prepare for their
            shift.
          </p>
          <p>This form will generate 2 versions of the briefing, 1 for volunteers and 1 for the OTL.</p>
        </div>
      </section>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-12">
        {/* Overview Section */}
        <section>
          <h2 className="text-xl font-semibold text-red-600 mb-6 pb-2 border-b border-gray-200">Overview</h2>
          <div className="space-y-6">
            <div>
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
              />
            </div>

            <div>
              <Label htmlFor="area_team" className="font-medium">
                Select area team
              </Label>
              <Select name="area_team" required disabled={isSubmitting}>
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
              />
            </div>
          </div>
        </section>

        {/* Response Location Section */}
        <section>
          <h2 className="text-xl font-semibold text-red-600 mb-2 pb-2 border-b border-gray-200">Response location</h2>
          <p className="text-gray-500 mb-6">Take account of the shift start time when including travel information.</p>
          <div className="space-y-6">
            <div>
              <Label htmlFor="building_and_street" className="font-medium">
                Building and street
              </Label>
              <Input
                id="building_and_street"
                name="building_and_street"
                className="border-gray-300"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="town_or_city" className="font-medium">
                Town or city
              </Label>
              <Input
                id="town_or_city"
                name="town_or_city"
                className="border-gray-300 max-w-md"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="postcode" className="font-medium">
                Postcode
              </Label>
              <Input
                id="postcode"
                name="postcode"
                className="border-gray-300 max-w-xs"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="what3words" className="font-medium">
                What3words
              </Label>
              <p className="text-gray-500 text-sm mb-2">Use format like "word.word.word"</p>
              <Input id="what3words" name="what3words" className="border-gray-300 max-w-md" disabled={isSubmitting} />
            </div>

            <div>
              <Label htmlFor="meeting_point" className="font-medium">
                Meeting point
              </Label>
              <Input
                id="meeting_point"
                name="meeting_point"
                className="border-gray-300 max-w-md"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="getting_there" className="font-medium">
                Getting there
              </Label>
              <p className="text-gray-500 text-sm mb-2">
                Add information for drivers and volunteers using public transport.
              </p>
              <Textarea id="getting_there" name="getting_there" className="border-gray-300" disabled={isSubmitting} />
            </div>

            <div>
              <Label htmlFor="hazards" className="font-medium">
                Hazards
              </Label>
              <Textarea id="hazards" name="hazards" className="border-gray-300" disabled={isSubmitting} />
            </div>

            <div>
              <Label htmlFor="lead_partner_organisation" className="font-medium">
                Lead partner organisation
              </Label>
              <Input
                id="lead_partner_organisation"
                name="lead_partner_organisation"
                className="border-gray-300 max-w-md"
                disabled={isSubmitting}
              />
            </div>
          </div>
        </section>

        {/* Deployment Details Section */}
        <section>
          <h2 className="text-xl font-semibold text-red-600 mb-2 pb-2 border-b border-gray-200">Deployment details</h2>
          <p className="text-gray-500 mb-6">
            Provide information to help volunteers get ready for the size, severity and any special requirements of the
            response
          </p>
          <div className="space-y-6">
            <div>
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
              />
            </div>

            <div>
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
              />
            </div>

            <div>
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
              />
            </div>

            <div>
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
              />
            </div>

            <div>
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
              />
            </div>

            <div>
              <Label htmlFor="sensitivities" className="font-medium">
                Sensitivities
              </Label>
              <p className="text-gray-500 text-sm mb-2">
                What should volunteers know to avoid creating barriers with service users or partners?
              </p>
              <Textarea id="sensitivities" name="sensitivities" className="border-gray-300" disabled={isSubmitting} />
            </div>

            <div>
              <Label htmlFor="what_to_bring" className="font-medium">
                What to bring
              </Label>
              <p className="text-gray-500 text-sm mb-2">
                Items which are not ordinary grab-bag or vehicle stock. Often location- or situation-specific
              </p>
              <Textarea id="what_to_bring" name="what_to_bring" className="border-gray-300" disabled={isSubmitting} />
            </div>
          </div>
        </section>

        {/* Additional Information Section */}
        <section>
          <h2 className="text-xl font-semibold text-red-600 mb-2 pb-2 border-b border-gray-200">
            Additional information for volunteers and OTLs
          </h2>
          <div className="space-y-6">
            <div>
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
              />
            </div>
          </div>
        </section>

        {/* Shift Information Section */}
        <section>
          <h2 className="text-xl font-semibold text-red-600 mb-6 pb-2 border-b border-gray-200">Shift information</h2>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
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
                />
              </div>

              <div>
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
                />
              </div>

              <div>
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
                />
              </div>

              <div>
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
                />
              </div>
            </div>

            <div>
              <Label htmlFor="otl_name" className="font-medium">
                OTL name
              </Label>
              <Input
                id="otl_name"
                name="otl_name"
                className="border-gray-300 max-w-md"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
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
              />
            </div>
          </div>
        </section>

        {/* OTL Briefing Section - Volunteer Details */}
        <section>
          <h2 className="text-xl font-semibold text-red-600 mb-2 pb-2 border-b border-gray-200">
            OTL briefing section
          </h2>
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
        </section>

        {/* Partner Details Section */}
        <section>
          <h3 className="text-lg font-medium mb-4">Partner details</h3>
          <div className="space-y-6">
            <div>
              <Label htmlFor="partner_organisation" className="font-medium">
                Partner organisation
              </Label>
              <Input
                id="partner_organisation"
                name="partner_organisation"
                className="border-gray-300 max-w-md"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="key_partner_name" className="font-medium">
                Key partner name
              </Label>
              <Input
                id="key_partner_name"
                name="key_partner_name"
                className="border-gray-300 max-w-md"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="key_partner_contact" className="font-medium">
                Key partner contact number
              </Label>
              <Input
                id="key_partner_contact"
                name="key_partner_contact"
                type="tel"
                className="border-gray-300 max-w-md"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="otl_additional_details" className="font-medium">
                Additional details (OTL only)
              </Label>
              <p className="text-gray-500 text-sm mb-2">Include any additional information only the OTL needs</p>
              <Textarea
                id="otl_additional_details"
                name="otl_additional_details"
                className="border-gray-300"
                disabled={isSubmitting}
              />
            </div>
          </div>
        </section>

        {/* Password protection */}
        <section>
          <h2 className="text-xl font-semibold text-red-600 mb-2 pb-2 border-b border-gray-200">Password protection</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="viewer_password" className="font-medium">
                Viewer password
              </Label>
              <Input
                id="viewer_password"
                name="viewer_password"
                type="password"
                className="border-gray-300 max-w-md"
                placeholder="Create a password for viewers (optional)"
                disabled={isSubmitting}
              />
              <p className="text-sm text-gray-500 mt-1">Leave blank for no password protection</p>
            </div>
          </div>
        </section>

        {/* Submit buttons */}
        <div className="flex gap-4">
          <Link href="/incident/1">
            <Button type="button" variant="outline" className="border-gray-300" disabled={isSubmitting}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <Button type="submit" className="bg-red-600 hover:bg-red-700" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Save and continue"}
          </Button>
        </div>
      </form>
    </div>
  )
}
