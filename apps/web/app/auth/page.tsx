"use client"

import { useState, useRef, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { apiFetch } from "@/lib/api"

type Step = "phone" | "otp"

export default function AuthPageWrapper() {
  return (
    <Suspense>
      <AuthPage />
    </Suspense>
  )
}

function AuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<Step>("phone")
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState(["", "", "", ""])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const redirectTo = searchParams.get("from") || "/"

  async function handleRequestOtp() {
    setError("")
    if (!phone || phone.length < 7) {
      setError("يرجى إدخال رقم هاتف صحيح")
      return
    }
    setLoading(true)
    try {
      await apiFetch("/auth/request-otp", {
        method: "POST",
        body: JSON.stringify({ phone: `+963${phone}` }),
      })
      setStep("otp")
    } catch {
      setError("حدث خطأ، يرجى المحاولة مرة أخرى")
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp() {
    setError("")
    const code = otp.join("")
    if (code.length !== 4) {
      setError("يرجى إدخال الرمز كاملاً")
      return
    }
    setLoading(true)
    try {
      const data = await apiFetch<{ access_token: string }>("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ phone: `+963${phone}`, code }),
      })
      localStorage.setItem("access_token", data.access_token)
      router.push(redirectTo)
    } catch {
      setError("الرمز غير صحيح أو منتهي الصلاحية")
    } finally {
      setLoading(false)
    }
  }

  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return
    const updated = [...otp]
    updated[index] = value.slice(-1)
    setOtp(updated)
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  useEffect(() => {
    if (step === "otp") inputRefs.current[0]?.focus()
  }, [step])

  return (
    <div
      className="min-h-[80vh] flex items-center justify-center px-4"
      style={{ fontFamily: "var(--font-arabic)" }}
    >
      <div
        className="w-full max-w-sm p-8 rounded-2xl"
        style={{
          background: "#fff",
          border: "1px solid var(--color-border)",
        }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <span
            className="text-3xl font-bold"
            style={{ color: "var(--color-brand)" }}
          >
            شامنا
          </span>
        </div>

        {step === "phone" ? (
          <>
            <h1
              className="text-xl font-semibold mb-2 text-center"
              style={{ color: "var(--color-text-primary)" }}
            >
              أهلاً وسهلاً
            </h1>
            <p
              className="text-sm text-center mb-6"
              style={{ color: "var(--color-text-muted)" }}
            >
              أدخل رقم هاتفك للمتابعة
            </p>

            {/* Phone input */}
            <div
              className="flex items-center rounded-lg overflow-hidden mb-4"
              style={{ border: "1px solid var(--color-border)" }}
            >
              <div
                className="px-3 py-3 text-sm font-medium shrink-0"
                style={{
                  background: "var(--color-brand-light)",
                  color: "var(--color-brand-dark)",
                  borderLeft: "1px solid var(--color-border)",
                }}
              >
                +963
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && handleRequestOtp()}
                placeholder="9xxxxxxxx"
                className="flex-1 px-4 py-3 text-sm outline-none bg-transparent"
                style={{
                  fontFamily: "var(--font-arabic)",
                  direction: "ltr",
                  textAlign: "right",
                }}
                autoFocus
              />
            </div>

            {error && (
              <p className="text-sm mb-4 text-center" style={{ color: "#dc2626" }}>
                {error}
              </p>
            )}

            <button
              onClick={handleRequestOtp}
              disabled={loading}
              className="w-full py-3 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: "var(--color-brand)" }}
            >
              {loading ? "جاري الإرسال..." : "إرسال رمز التحقق"}
            </button>
          </>
        ) : (
          <>
            <h1
              className="text-xl font-semibold mb-2 text-center"
              style={{ color: "var(--color-text-primary)" }}
            >
              أدخل رمز التحقق
            </h1>
            <p
              className="text-sm text-center mb-6"
              style={{ color: "var(--color-text-muted)" }}
            >
              تم إرسال رمز مكون من 4 أرقام إلى{" "}
              <span style={{ color: "var(--color-brand)" }}>+963{phone}</span>
            </p>

            {/* OTP boxes */}
            <div className="flex justify-center gap-3 mb-6" dir="ltr">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el }}
                  type="tel"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="w-14 h-14 text-center text-xl font-semibold rounded-lg outline-none transition-all"
                  style={{
                    border: digit
                      ? "2px solid var(--color-brand)"
                      : "1px solid var(--color-border)",
                    background: digit ? "var(--color-brand-light)" : "#fff",
                    color: "var(--color-text-primary)",
                  }}
                />
              ))}
            </div>

            {error && (
              <p className="text-sm mb-4 text-center" style={{ color: "#dc2626" }}>
                {error}
              </p>
            )}

            <button
              onClick={handleVerifyOtp}
              disabled={loading}
              className="w-full py-3 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: "var(--color-brand)" }}
            >
              {loading ? "جاري التحقق..." : "تأكيد"}
            </button>

            <button
              onClick={() => { setStep("phone"); setOtp(["", "", "", ""]); setError("") }}
              className="w-full py-3 mt-2 text-sm transition-colors"
              style={{ color: "var(--color-text-muted)" }}
            >
              تغيير رقم الهاتف
            </button>
          </>
        )}
      </div>
    </div>
  )
}