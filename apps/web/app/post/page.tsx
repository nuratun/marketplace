"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { PostFormData, EMPTY_POST_FORM } from "@/types/post"
import StepIndicator from "@/components/post/step-indicator"
import StepCategory from "@/components/post/step-category"
import StepDetails from "@/components/post/step-details"
import StepPhotos from "@/components/post/step-photos"
import StepReview from "@/components/post/step-review"

const STEPS = [
  "الفئة", 
  "التفاصيل", 
  "الصور", 
  "المراجعة"
]

export default function PostPage() {
  const router = useRouter()
  const { accessToken, refreshToken } = useAuth()
  const [step, setStep] = useState(0)
  const [photos, setPhotos] = useState<File[]>([])
  const [form, setForm] = useState<PostFormData>(EMPTY_POST_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  function updateForm(patch: Partial<PostFormData>) {
    setForm((prev) => ({ ...prev, ...patch }))
  }

  function nextStep() {
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  function prevStep() {
    setStep((s) => Math.max(s - 1, 0))
  }

  async function handleSubmit() {
    setIsSubmitting(true)
    setSubmitError(null)

    // When making the API call, use accessToken directly.
    // If you want to be safe against expiry mid-form, call refreshToken() first:
    const token = accessToken ?? await refreshToken()

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/listings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            title: form.title,
            description: form.description,
            price: parseFloat(form.price) || 0,
            currency: form.currency,
            category: form.category,
            condition: form.condition,
            city: form.city,
            attrs: form.attrs,
            image_urls: form.image_urls
          })
        }
      )

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.detail || "حدث خطأ أثناء نشر الإعلان")
      }

      const listing = await res.json()
      router.push(`/listing/${listing.id}`)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "حدث خطأ غير متوقع"
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <StepIndicator steps={STEPS} current={step} />

      {step === 0 && (
        <StepCategory
          value={form.category}
          onChange={(category) => updateForm({ category })}
          onNext={nextStep}
        />
      )}
      {step === 1 && (
        <StepDetails
          value={form}
          onChange={updateForm}
          onNext={nextStep}
          onBack={prevStep}
        />
      )}
      {step === 2 && (
        <StepPhotos
          images={photos}
          onChange={setPhotos}
          onNext={(uploadedUrls) => {
            updateForm({ image_urls: uploadedUrls })
            nextStep()
          }}          
          onBack={prevStep}
        />
      )}
      {step === 3 && (
        <StepReview
          form={form}
          onBack={prevStep}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          error={submitError}
        />
      )}
    </main>
  )
}