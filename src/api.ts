export type Role = "student" | "instructor"

export type AuthUser = {
  role: Role
  name: string
  email: string
  studentId?: string
}

export type RequestStatus = "Pending" | "Accepted" | "Declined" | "Finished"

export type Availability = "Available" | "Unavailable" | "In a Meeting"

export type Consultation = {
  id: string

  name: string

  date: string

  detail: string

  reason: string

  place: string

  note: string

  status: RequestStatus
}

type ConsultationPair = {
  student: Consultation

  instructor: Consultation
}

async function request<T>(
  path: string,

  init?: RequestInit,
): Promise<T> {
  const response = await fetch(path, {
    ...init,

    headers: {
      "Content-Type": "application/json",

      ...init?.headers,
    },
  })

  const payload: unknown =
    response.status === 204 ? undefined : await response.json()

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : `Request failed with status ${response.status}.`

    throw new Error(message)
  }

  return payload as T
}

export async function login(
  role: Role,
  identifier: string,
  password: string,
): Promise<AuthUser> {
  const result = await request<{ user: AuthUser }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ role, identifier, password }),
  })
  return result.user
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const result = await request<{ user: AuthUser | null }>("/api/auth/me")
  return result.user
}

export function logout(): Promise<void> {
  return request("/api/auth/logout", { method: "POST" })
}

export function getConsultations(): Promise<Consultation[]> {
  return request("/api/consultations")
}

export function createConsultation(
  date: string,

  start: string,

  end: string,

  reason: string,
): Promise<ConsultationPair> {
  return request("/api/consultations", {
    method: "POST",

    body: JSON.stringify({ date, start, end, reason }),
  })
}

export function updateConsultation(
  id: string,

  status: Exclude<RequestStatus, "Pending" | "Finished">,
): Promise<ConsultationPair> {
  return request(`/api/consultations/${id}/status`, {
    method: "PATCH",

    body: JSON.stringify({ status }),
  })
}

export function getAvailability(): Promise<{ status: Availability }> {
  return request("/api/availability")
}

export function saveAvailability(
  status: Availability,
): Promise<{ status: Availability }> {
  return request("/api/availability", {
    method: "PUT",

    body: JSON.stringify({ status }),
  })
}
