"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from "react"
import { apiFetch } from "@/lib/api"

export interface AuthUser {
  id: string
  phone: string
  name: string | null
  email: string | null
  bio: string | null
  profile_pic: string | null
  user_type: string
  standing: string // "good" | "warned" | "suspended"
  warning_reason: string | null
  created_at: string
}

interface AuthContextValue {
  user: AuthUser | null
  accessToken: string | null
  isLoading: boolean
  login: (token: string, user: AuthUser) => void
  logout: () => void
  refreshToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null)

  const logout = useCallback(() => {
    localStorage.removeItem("access_token")
    setAccessToken(null)
    setUser(null)
  }, [])

  // Used mid-session (e.g. when an API call 401s) — calls logout() on failure
  const refreshToken = useCallback((): Promise<string | null> => {
    if (refreshPromiseRef.current) return refreshPromiseRef.current

    const promise = (async () => {
      try {
        const data: any = await apiFetch("/auth/refresh", { method: "POST" })
        const newToken: string = data.access_token
        localStorage.setItem("access_token", newToken)
        setAccessToken(newToken)
        return newToken
      } catch {
        logout()  // legitimate — session expired mid-use
        return null
      } finally {
        refreshPromiseRef.current = null
      }
    })()

    refreshPromiseRef.current = promise
    return promise
  }, [logout])

  // Used only during hydration — returns null on failure without calling logout()
  const tryRefreshSilently = useCallback(async (): Promise<string | null> => {
    try {
      const data: any = await apiFetch("/auth/refresh", { method: "POST" })
      const newToken: string = data.access_token
      localStorage.setItem("access_token", newToken)
      setAccessToken(newToken)
      return newToken
    } catch {
      return null  // no session — stay logged out, don't wipe anything
    }
  }, [])

  const login = useCallback((token: string, userData: AuthUser) => {
    localStorage.setItem("access_token", token)
    setAccessToken(token)
    setUser(userData)
  }, [])

  useEffect(() => {
    const hydrate = async () => {
      const stored = localStorage.getItem("access_token")

      if (!stored) {
        // No token in localStorage — try the refresh cookie quietly
        const newToken = await tryRefreshSilently()
        if (newToken) {
          try {
            const me: any = await apiFetch("/auth/me", {
              headers: { Authorization: `Bearer ${newToken}` },
            })
            setUser(me)
          } catch {
            // refresh cookie worked but /me failed — clear the bad token
            localStorage.removeItem("access_token")
            setAccessToken(null)
          }
        }
        // no token, no cookie — just not logged in, nothing to do
        setIsLoading(false)
        return
      }

      // Token exists — verify it against /auth/me
      try {
        const me: any = await apiFetch("/auth/me", {
          headers: { Authorization: `Bearer ${stored}` },
        })
        setAccessToken(stored)
        setUser(me)
      } catch {
        // Token expired — try silent refresh
        const newToken = await tryRefreshSilently()
        if (newToken) {
          try {
            const me: any = await apiFetch("/auth/me", {
              headers: { Authorization: `Bearer ${newToken}` },
            })
            setUser(me)
          } catch {
            // Both failed — clear stale token but don't call logout()
            localStorage.removeItem("access_token")
            setAccessToken(null)
          }
        } else {
          // No valid refresh cookie either — clear stale localStorage token
          localStorage.removeItem("access_token")
          setAccessToken(null)
        }
      } finally {
        setIsLoading(false)
      }
    }

    hydrate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, accessToken, isLoading, login, logout, refreshToken }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>")
  return ctx
}