import { PostFormData } from "@/types/post"

type Props = {
  form: PostFormData
  onBack: () => void
  onSubmit: () => void
  isSubmitting: boolean
  error: string | null
}

export default function StepReview({
  form,
  onBack,
  onSubmit,
  isSubmitting,
  error,
}: Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">مراجعة الإعلان</h2>

      {/* Summary of what they entered */}
      <div className="rounded-xl p-4 space-y-3 text-sm" style={{ border: "1px solid var(--color-border)" }}>
        <Row label="الفئة" value={form.category} />
        <Row label="العنوان" value={form.title} />
        <Row label="الوصف" value={form.description} />
        <Row label="السعر" value={`${form.price} ${form.currency}`} />
        <Row label="الحالة" value={form.condition === "new" ? "جديد" : "مستعمل"} />
        <Row label="المدينة" value={form.city} />
        <Row label="الصور" value={`${form.image_urls.length} صورة`} />
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      <div className="flex gap-3 justify-between">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="px-5 py-2 rounded-lg border border-border text-sm hover:bg-surface disabled:opacity-50"
        >
          رجوع
        </button>
        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="px-6 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--color-brand)" }}
        >
          {isSubmitting ? "جاري النشر..." : "نشر الإعلان"}
        </button>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span style={{ color: "var(--color-text-muted)" }}>{label}</span>
      <span className="font-medium text-end" style={{ color: "var(--color-text-primary)" }}>{value}</span>
    </div>
  )
}