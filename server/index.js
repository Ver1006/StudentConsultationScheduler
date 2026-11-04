import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"

import express from "express"

import { MongoClient, ObjectId } from "mongodb"

const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017"

const databaseName = process.env.MONGODB_DB || "student_consultation_scheduler"

const port = Number(process.env.API_PORT || 3001)

const defaultInstructorEmail = "monalizajimenez@ms.bulsu.edu.ph"

const scrypt = promisify(scryptCallback)

const availabilityStatuses = ["Available", "Unavailable", "In a Meeting"]

const sessionLifetimeMs = 8 * 60 * 60 * 1000

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("API_PORT must be a valid TCP port.")
}

const client = new MongoClient(mongoUri)

const app = express()

app.use(express.json({ limit: "16kb" }))

const sessions = new Map()

function isRole(value) {
  return value === "student" || value === "instructor"
}

function getSessionToken(request) {
  const cookie = request.headers.cookie
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("scheduler_session="))

  return cookie?.slice("scheduler_session=".length)
}

function getPublicUser(user) {
  return {
    role: user.role,
    name: user.name,
    email: user.email,
    ...(user.studentId ? { studentId: user.studentId } : {}),
  }
}

function requireAuthentication(request, response, next) {
  const token = getSessionToken(request)
  const session = token && sessions.get(token)

  if (!session || session.expiresAt <= Date.now()) {
    if (token) sessions.delete(token)
    response.status(401).json({ error: "Please sign in to continue." })
    return
  }

  request.user = session.user
  next()
}

function parseTime(value) {
  const match = /^([1-9]|1[0-2]):([0-5]\d) (AM|PM)$/.exec(value)

  if (!match) return null

  const hour = (Number(match[1]) % 12) + (match[3] === "PM" ? 12 : 0)

  return hour * 60 + Number(match[2])
}

function formatConsultation(document, role) {
  let note = ""

  if (document.status === "Accepted") {
    note =
      role === "student"
        ? "Confirmed · Attend at the scheduled time."
        : "Confirmed · Ready for your scheduled session."
  } else if (document.status === "Declined") {
    note =
      role === "student"
        ? "Declined · Request another consultation time."
        : "Declined · Student should request another time."
  } else if (document.status === "Finished") {
    note =
      role === "student"
        ? "Session completed. Feedback received."
        : "Session completed. Feedback shared."
  } else if (role === "student") {
    note = "Awaiting confirmation · Wait before visiting."
  }

  return {
    id: document._id.toHexString(),

    name: role === "student" ? document.instructorName : document.studentName,

    date: document.date,

    detail: document.detail,

    reason: document.reason,

    place: document.place,

    note,

    status: document.status,
  }
}

function responseForConsultation(document) {
  return {
    student: formatConsultation(document, "student"),

    instructor: formatConsultation(document, "instructor"),
  }
}

function getConsultationFilter(user) {
  if (user.role === "student") {
    return {
      $or: [
        { studentEmail: user.email },
        { studentName: user.name, studentEmail: { $exists: false } },
      ],
    }
  }

  return {
    $or: [
      { instructorEmail: user.email },
      { instructorName: user.name, instructorEmail: { $exists: false } },
    ],
  }
}

const database = await client
  .connect()
  .then((connectedClient) => connectedClient.db(databaseName))

const consultations = database.collection("consultations")

const settings = database.collection("settings")
const users = database.collection("users")

app.post("/api/auth/login", async (request, response) => {
  const { role, identifier, password } = request.body ?? {}
  if (
    !isRole(role) ||
    typeof identifier !== "string" ||
    typeof password !== "string" ||
    !identifier.trim() ||
    !password
  ) {
    response.status(400).json({ error: "Enter your account and password." })
    return
  }

  const normalizedIdentifier = identifier.trim().toLowerCase()
  const query =
    role === "student"
      ? { role, studentId: normalizedIdentifier }
      : {
          role,
          email: normalizedIdentifier.includes("@")
            ? normalizedIdentifier.replace(/\s+/g, "")
            : `${normalizedIdentifier.replace(/\s+/g, "")}@ms.bulsu.edu.ph`,
        }
  const user = await users.findOne(query)
  const salt = user?.passwordSalt
    ? Buffer.from(user.passwordSalt, "hex")
    : Buffer.alloc(16)
  const expectedHash = user?.passwordHash
    ? Buffer.from(user.passwordHash, "hex")
    : Buffer.alloc(64)
  const actualHash = await scrypt(password, salt, 64)
  const passwordMatches =
    expectedHash.length === actualHash.length &&
    timingSafeEqual(expectedHash, actualHash)

  if (
    !user ||
    user.passwordAlgorithm !== "scrypt" ||
    !passwordMatches
  ) {
    response.status(401).json({ error: "Account or password is incorrect." })
    return
  }

  const token = randomBytes(32).toString("hex")
  sessions.set(token, {
    user: getPublicUser(user),
    expiresAt: Date.now() + sessionLifetimeMs,
  })
  response.setHeader(
    "Set-Cookie",
    `scheduler_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${sessionLifetimeMs / 1000}`,
  )
  response.json({ user: getPublicUser(user) })
})

app.get("/api/auth/me", (request, response) => {
  const token = getSessionToken(request)
  const session = token && sessions.get(token)
  if (!session || session.expiresAt <= Date.now()) {
    if (token) sessions.delete(token)
    response.json({ user: null })
    return
  }

  response.json({ user: session.user })
})

app.post("/api/auth/logout", (request, response) => {
  const token = getSessionToken(request)
  if (token) sessions.delete(token)
  response.setHeader(
    "Set-Cookie",
    "scheduler_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0",
  )
  response.status(204).end()
})

app.get("/api/health", async (_request, response) => {
  await database.command({ ping: 1 })

  response.json({ status: "ok", database: databaseName })
})

app.use("/api", requireAuthentication)

app.get("/api/consultations", async (request, response) => {
  const documents = await consultations
    .find(getConsultationFilter(request.user))
    .sort({ createdAt: -1 })
    .toArray()

  response.json(
    documents.map((document) =>
      formatConsultation(document, request.user.role),
    ),
  )
})

app.post("/api/consultations", async (request, response) => {
  if (request.user.role !== "student") {
    response.status(403).json({ error: "Only students can book consultations." })
    return
  }

  const { date, start, end, reason } = request.body ?? {}

  if (
    typeof date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(new Date(`${date}T00:00:00.000Z`).getTime()) ||
    new Date(`${date}T00:00:00.000Z`).toISOString().slice(0, 10) !== date
  ) {
    response.status(400).json({ error: "Choose a valid consultation date." })

    return
  }

  const startMinutes = typeof start === "string" ? parseTime(start) : null

  const endMinutes = typeof end === "string" ? parseTime(end) : null

  if (
    startMinutes === null ||
    endMinutes === null ||
    endMinutes - startMinutes !== 30
  ) {
    response.status(400).json({
      error: "Choose an end time exactly 30 minutes after the start time.",
    })

    return
  }

  if (typeof reason !== "string" || !reason.trim() || reason.length > 500) {
    response

      .status(400)

      .json({ error: "Enter a reason of 1 to 500 characters." })

    return
  }

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "short",

    month: "short",

    day: "numeric",

    year: "numeric",

    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00.000Z`))

  const instructor = await users.findOne({
    role: "instructor",
    email: defaultInstructorEmail,
  })
  if (!instructor) {
    response.status(503).json({
      error: "The selected instructor account is not configured.",
    })
    return
  }

  const document = {
    studentId: request.user.studentId,
    studentEmail: request.user.email,
    studentName: request.user.name,
    instructorEmail: instructor.email,
    instructorName: instructor.name,

    date: `${formattedDate} · ${start}–${end}`,

    detail: "CPE 301L · Logic Circuits and Design",

    reason: reason.trim(),

    place: "Faculty / Professors Lounge · In person",

    status: "Pending",

    createdAt: new Date(),
  }

  const result = await consultations.insertOne(document)

  response
    .status(201)
    .json(responseForConsultation({ _id: result.insertedId, ...document }))
})

app.patch("/api/consultations/:id/status", async (request, response) => {
  if (request.user.role !== "instructor") {
    response
      .status(403)
      .json({ error: "Only instructors can review consultations." })
    return
  }

  const { id } = request.params

  const { status } = request.body ?? {}

  if (!ObjectId.isValid(id)) {
    response.status(400).json({ error: "Consultation ID is invalid." })

    return
  }

  if (status !== "Accepted" && status !== "Declined") {
    response

      .status(400)

      .json({ error: "Status must be Accepted or Declined." })

    return
  }

  const document = await consultations.findOneAndUpdate(
    {
      _id: new ObjectId(id),
      status: "Pending",
      ...getConsultationFilter(request.user),
    },

    { $set: { status } },

    { returnDocument: "after" },
  )

  if (!document) {
    const existing = await consultations.findOne({
      _id: new ObjectId(id),
      ...getConsultationFilter(request.user),
    })

    response

      .status(existing ? 409 : 404)

      .json({
        error: existing
          ? "This consultation has already been reviewed."
          : "Consultation was not found.",
      })

    return
  }

  response.json(responseForConsultation(document))
})

app.get("/api/availability", async (request, response) => {
  const record = await settings.findOne({
    _id:
      request.user.role === "instructor"
        ? `instructor-availability:${request.user.email}`
        : `instructor-availability:${defaultInstructorEmail}`,
  })

  response.json({
    status:
      record?.status ??
      (request.user.role === "instructor"
        ? (
            await settings.findOne({ _id: "instructor-availability" })
          )?.status
        : undefined) ??
      "Available",

    updatedAt: record?.updatedAt ?? null,
  })
})

app.put("/api/availability", async (request, response) => {
  if (request.user.role !== "instructor") {
    response
      .status(403)
      .json({ error: "Only instructors can update availability." })
    return
  }

  const { status } = request.body ?? {}

  if (!availabilityStatuses.includes(status)) {
    response.status(400).json({ error: "Availability status is invalid." })

    return
  }

  const updatedAt = new Date()

  await settings.updateOne(
    { _id: `instructor-availability:${request.user.email}` },

    { $set: { status, updatedAt } },

    { upsert: true },
  )

  response.json({ status, updatedAt })
})

app.use((error, _request, response, _next) => {
  console.error("API request failed:", error)

  response.status(500).json({ error: "The local API request failed." })
})

const server = app.listen(port, "127.0.0.1", () => {
  console.log(
    `MongoDB API listening on http://127.0.0.1:${port} (database: ${databaseName})`,
  )
})

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => {
    server.close(async (error) => {
      try {
        if (error) throw error

        await client.close()
      } catch (closeError) {
        console.error("Failed to close the MongoDB API cleanly:", closeError)

        process.exitCode = 1
      }
    })
  })
}
