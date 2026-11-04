import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react"

import {
  createConsultation,
  getCurrentUser,
  getAvailability,
  getConsultations,
  login as authenticate,
  logout as logoutFromApi,
  saveAvailability,
  updateConsultation,
  type Availability,
  type AuthUser,
  type Consultation,
  type RequestStatus,
  type Role,
} from "./api"

type View = "login" | "home" | "requests" | "booking" | "profile"

const A = "/assets"

const icons = {
  logo: `${A}/611df.png`,

  student: `${A}/c2f70.svg`,

  instructor: `${A}/4ad09.svg`,

  check: `${A}/7a3b8.svg`,

  mail: `${A}/d21d1.svg`,

  lock: `${A}/48eb5.svg`,

  eye: `${A}/8763f.svg`,

  arrow: `${A}/66f03.svg`,

  profile: `${A}/ad63f.svg`,

  search: `${A}/0b11b.svg`,

  live: `${A}/21ec1.svg`,

  dot: `${A}/fddc3.svg`,

  pin: `${A}/d36be.svg`,

  info: `${A}/3fef5.svg`,

  home: `${A}/12c8b.svg`,

  requests: `${A}/30c8e.svg`,

  profileNav: `${A}/b59c2.svg`,

  profileAvatar: `${A}/53289.svg`,

  disclosure: `${A}/0b1b9.svg`,

  switchThumb: `${A}/7d301.svg`,

  back: `${A}/9b8a8.svg`,

  calendar: `${A}/742fc.svg`,

  chevron: `${A}/8a411.svg`,

  clock: `${A}/8398c.svg`,

  edit: `${A}/9c352.svg`,
}

function Icon({
  src,
  className = "",
}: {
  src: string
  className?: string
}) {
  return <img aria-hidden="true" className={`icon ${className}`} src={src} />
}

function Arrow() {
  return <Icon className="arrow-icon" src={icons.arrow} />
}

function Login({
  role,

  setRole,

  onLogin,
}: {
  role: Role

  setRole: (role: Role) => void

  onLogin: (role: Role, identifier: string, password: string) => Promise<void>
}) {
  const [email, setEmail] = useState("")

  const [password, setPassword] = useState("")

  const [showPassword, setShowPassword] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)

  const [loginError, setLoginError] = useState("")

  const identifierValid =
    role === "student"
      ? /^\d+$/.test(email)
      : /^[A-Za-z]+(?:\.[A-Za-z]+)*$/.test(email)

  const valid = identifierValid && password.length > 0

  function selectRole(nextRole: Role) {
    setRole(nextRole)

    setEmail("")
    setLoginError("")
  }

  function updateIdentifier(value: string) {
    setEmail(
      role === "student"
        ? value.replace(/\D/g, "")
        : value.replace(/[^A-Za-z.]/g, "").replace(/\.{2,}/g, "."),
    )
  }

  async function submit(event: FormEvent) {
    event.preventDefault()

    if (!valid || isSubmitting) return

    setIsSubmitting(true)
    setLoginError("")
    try {
      await onLogin(role, email, password)
    } catch (error) {
      setLoginError(
        error instanceof Error ? error.message : "Sign-in failed.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-content">
        <header className="brand">
          <img src={icons.logo} alt="Bulacan State University seal" />
          <strong>Bulacan State University</strong>
        </header>

        <h1>
          Student Consultation
          <br />
          Scheduler
        </h1>
        <p className="login-intro">
          {role === "student"
            ? "Know who’s available before you travel. Request your next consultation online."
            : "Manage your availability and review student consultation requests online."}
        </p>

        <form onSubmit={submit}>
          <fieldset>
            <legend>Sign in as</legend>
            <div className="role-grid">
              <button
                className={`role-option ${
                  role === "student" ? "selected" : ""
                }`}
                type="button"
                onClick={() => selectRole("student")}
              >
                <Icon src={icons.student} />
                <span>Student</span>
                {role === "student" && (
                  <Icon className="role-check" src={icons.check} />
                )}
              </button>
              <button
                className={`role-option ${
                  role === "instructor" ? "selected" : ""
                }`}
                type="button"
                onClick={() => selectRole("instructor")}
              >
                <Icon src={icons.instructor} />
                <span>Instructor</span>
                {role === "instructor" && (
                  <Icon className="role-check" src={icons.check} />
                )}
              </button>
            </div>
          </fieldset>

          <label className="field-label" htmlFor="email">
            {role === "student" ? "University ID" : "Faculty email"}
          </label>
          <div className="input-shell email-shell">
            <Icon src={icons.mail} />
            <input
              id="email"
              type="text"
              value={email}
              onChange={(e) => updateIdentifier(e.target.value)}
              placeholder="Enter Email"
              autoComplete="username"
              inputMode={role === "student" ? "numeric" : "text"}
              pattern={
                role === "student" ? "[0-9]+" : "[A-Za-z]+(?:\\.[A-Za-z]+)*"
              }
              aria-describedby="email-domain"
            />
            <span id="email-domain" className="email-domain">
              @ms.bulsu.edu.ph
            </span>
          </div>
          <p className="identifier-hint">Use your university email.</p>

          <label className="field-label" htmlFor="password">
            Password
          </label>
          <div className="input-shell">
            <Icon src={icons.lock} />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter Password"
              autoComplete="current-password"
            />
            <button
              className="icon-button"
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <Icon src={icons.eye} />
            </button>
          </div>

          {loginError && (
            <p className="login-error" role="alert">
              {loginError}
            </p>
          )}

          <button className="forgot" type="button">
            Forgot password?
          </button>
          <button
            className="primary login-button"
            disabled={!valid || isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Signing in…" : "Sign in"} <Arrow />
          </button>
        </form>

        <footer className="login-footer">
          <p>Use your university-issued account to continue.</p>
          <button type="button">Need help? Contact campus support</button>
        </footer>
      </div>
    </main>
  )
}

function AppHeader({
  role,

  onProfile,

  showProfile = true,
}: {
  role: Role

  onProfile: () => void

  showProfile?: boolean
}) {
  return (
    <header className="app-header">
      <div>
        <strong>Campus consultations</strong>
        <span>{role === "student" ? "Student" : "Instructor"} workspace</span>
      </div>
      {showProfile && (
        <button type="button" aria-label="Open profile" onClick={onProfile}>
          <Icon src={icons.profile} />
        </button>
      )}
    </header>
  )
}

function BottomNav({
  active,

  navigate,
}: {
  active: "home" | "requests" | "profile"

  navigate: (view: View) => void
}) {
  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      <button
        className={active === "home" ? "active" : ""}
        onClick={() => navigate("home")}
        type="button"
      >
        <Icon src={icons.home} />
        <span>Home</span>
      </button>
      <button
        className={active === "requests" ? "active" : ""}
        onClick={() => navigate("requests")}
        type="button"
      >
        <Icon src={icons.requests} />
        <span>Requests</span>
      </button>
      <button
        className={active === "profile" ? "active" : ""}
        onClick={() => navigate("profile")}
        type="button"
      >
        <Icon src={icons.profileNav} />
        <span>Profile</span>
      </button>
    </nav>
  )
}

function StudentHome({
  navigate,

  availability,

  studentName,
}: {
  navigate: (view: View) => void
  availability: Availability
  studentName: string
}) {
  const [query, setQuery] = useState("")

  const instructors = [
    {
      initials: "MJ",

      name: "Dr. Monaliza S. Jimenez",

      department: "Logic Circuits and Design",

      status: availability,
    },

    {
      initials: "LN",

      name: "Dr. Lech Walesa Navarra",

      department: "Feedback and Control System",

      status: "Unavailable",
    },

    {
      initials: "MV",

      name: "Dr. Maria Lorena SP Villena",

      department: "Software Design",

      status: "In a Meeting",
    },
  ]

  const filtered = instructors.filter((item) =>
    `${item.name} ${item.department}`

      .toLowerCase()

      .includes(query.toLowerCase()),
  )

  return (
    <div className="app-page">
      <AppHeader role="student" onProfile={() => navigate("profile")} />
      <main className="page-content dashboard-content">
        <h1>Hello, {studentName.split(" ")[0]}</h1>
        <p className="subtitle">
          Check availability. Skip the unnecessary trip.
        </p>
        <div className="search-field">
          <Icon src={icons.search} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or department"
            aria-label="Search instructor"
          />
        </div>
        <div className="section-heading">
          <h2>Instructor availability</h2>
          <span>{filtered.length} instructors</span>
        </div>
        <p className="live-preview">
          <Icon src={icons.live} /> Live status preview
        </p>

        <div className="instructor-list">
          {filtered.map((person, index) => (
            <article
              className={`instructor-card ${index === 0 ? "featured" : ""}`}
              key={person.name}
            >
              <div className="avatar">{person.initials}</div>
              <div className="instructor-copy">
                <h3>{person.name}</h3>
                <p>{person.department}</p>
              </div>
              <span
                className={`availability ${
                  person.status === "Available" ? "available" : ""
                }`}
              >
                {person.status === "Available" && <Icon src={icons.dot} />}
                {person.status}
              </span>
              {index === 0 && (
                <>
                  <p className="location">
                    <Icon src={icons.pin} /> Faculty / Professors Lounge
                  </p>
                  <button
                    className="primary book-button"
                    onClick={() => navigate("booking")}
                    type="button"
                  >
                    Book consultation <Arrow />
                  </button>
                </>
              )}
            </article>
          ))}
          {filtered.length === 0 && (
            <p className="empty-state">No instructors match your search.</p>
          )}
        </div>

        <div className="guidance">
          <Icon src={icons.info} />
          <p>
            Availability can change. Wait for a confirmed request before
            visiting campus.
          </p>
        </div>
      </main>
      <BottomNav active="home" navigate={navigate} />
    </div>
  )
}

function InstructorHome({
  navigate,
  availability,
  setAvailability,
  requests,
  instructorName,
}: {
  navigate: (view: View) => void
  availability: Availability
  setAvailability: (value: Availability) => void
  requests: Consultation[]
  instructorName: string
}) {
  const [draft, setDraft] = useState(availability)

  useEffect(() => setDraft(availability), [availability])

  const options: Availability[] = ["Available", "Unavailable", "In a Meeting"]

  const pendingRequests = requests.filter(
    (request) => request.status === "Pending",
  )

  const newestPendingRequest = pendingRequests[0]

  return (
    <div className="app-page">
      <AppHeader role="instructor" onProfile={() => navigate("profile")} />
      <main className="page-content instructor-home">
        <h1>Hello, {instructorName}</h1>
        <p className="subtitle">Keep students informed before they travel.</p>
        <section className="status-card">
          <div className="status-card-top">
            <strong>Your current status</strong>
            <span>
              <i /> Status
            </span>
          </div>
          <h2>
            <i /> {availability}
          </h2>
          <p>Faculty / Professors Lounge · Saved in MongoDB</p>
        </section>

        <h2 className="update-title">Update availability</h2>
        <div className="availability-options">
          {options.map((option) => (
            <button
              className={draft === option ? "selected" : ""}
              onClick={() => setDraft(option)}
              type="button"
              key={option}
            >
              <span className="status-symbol">
                {option === "Available"
                  ? "✓"
                  : option === "Unavailable"
                    ? "−"
                    : "♧"}
              </span>
              <span>{option}</span>
              <i />
            </button>
          ))}
        </div>
        <button
          className="primary"
          onClick={() => setAvailability(draft)}
          type="button"
        >
          Save status <Arrow />
        </button>

        <div className="section-heading pending-heading">
          <h2>New consultation request</h2>
          <span>{pendingRequests.length} pending</span>
        </div>
        {newestPendingRequest ? (
          <button
            className="pending-card"
            onClick={() => navigate("requests")}
            type="button"
          >
            <strong>{newestPendingRequest.name}</strong>
            <span className="badge neutral">Pending</span>
            <p>{newestPendingRequest.date}</p>
            <small>
              {newestPendingRequest.detail}
              {newestPendingRequest.reason
                ? ` · ${newestPendingRequest.reason}`
                : ""}
            </small>
          </button>
        ) : (
          <div className="pending-card empty-pending">
            <strong>No new requests</strong>
            <small>New student bookings will appear here.</small>
          </div>
        )}
      </main>
      <BottomNav active="home" navigate={navigate} />
    </div>
  )
}

function StatusBadge({ status }: { status: RequestStatus }) {
  return <span className={`badge ${status.toLowerCase()}`}>{status}</span>
}

function Requests({
  role,

  navigate,

  requests,

  onStatusChange,
  userName,
}: {
  role: Role

  navigate: (view: View) => void

  requests: Consultation[]

  onStatusChange: (
    id: string,

    status: Exclude<RequestStatus, "Pending" | "Finished">,
  ) => void
  userName: string
}) {
  const [statusFilter, setStatusFilter] = useState<RequestStatus | null>(null)

  const counts = useMemo(() => {
    return ["Accepted", "Declined", "Finished", "Pending"].map((status) => ({
      status,

      count: requests.filter((request) => request.status === status).length,
    }))
  }, [requests])

  const visibleRequests = statusFilter
    ? requests.filter((request) => request.status === statusFilter)
    : requests

  function update(
    id: string,

    status: Exclude<RequestStatus, "Pending" | "Finished">,
  ) {
    onStatusChange(id, status)
  }

  return (
    <div className="app-page">
      <AppHeader role={role} onProfile={() => navigate("profile")} />
      <main className={`page-content requests-content ${role}`}>
        <h1>Consultation requests</h1>
        <p className="subtitle">
          {userName} · {requests.length} requests
        </p>
        <div className="summary-bar">
          {counts.map(({ status, count }) => {
            const typedStatus = status as RequestStatus

            const active = statusFilter === typedStatus

            return (
              <button
                className={`${status.toLowerCase()} ${active ? "active" : ""}`}
                key={status}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  setStatusFilter(active ? null : status as RequestStatus)
                }
              >
                {status} {count}
              </button>
            )
          })}
        </div>
        <div className="request-list">
          {visibleRequests.map((request) => (
            <article
              className={`request-card ${
                request.status === "Pending" ? "highlighted" : ""
              }`}
              key={request.id}
            >
              <h3>{request.name}</h3>
              <StatusBadge status={request.status} />
              <p className="request-date">{request.date}</p>
              <p>{request.detail}</p>
              {request.reason && <p>{request.reason}</p>}
              {request.place && <p>{request.place}</p>}
              {request.note && (
                <p className={`request-note ${request.status.toLowerCase()}`}>
                  {request.note}
                </p>
              )}
              {role === "instructor" && request.status === "Pending" && (
                <div className="request-actions">
                  <button
                    className="primary"
                    onClick={() => update(request.id, "Accepted")}
                    type="button"
                  >
                    Accept
                  </button>
                  <button
                    className="secondary"
                    onClick={() => update(request.id, "Declined")}
                    type="button"
                  >
                    Decline
                  </button>
                </div>
              )}
            </article>
          ))}
          {visibleRequests.length === 0 && (
            <p className="empty-state">
              No {statusFilter?.toLowerCase()} requests found.
            </p>
          )}
        </div>
      </main>
      <BottomNav active="requests" navigate={navigate} />
    </div>
  )
}

function Profile({
  role,
  navigate,
  onLogout,
  user,
}: {
  role: Role
  navigate: (view: View) => void
  onLogout: () => void
  user: AuthUser
}) {
  const isStudent = role === "student"

  const [editing, setEditing] = useState(false)

  const [studentId, setStudentId] = useState(
    user.studentId ?? "[Faculty ID]",
  )
  const [email, setEmail] = useState(user.email)

  const [program, setProgram] = useState(
    isStudent ? "[Program] · [Year level]" : "Computer Engineering",
  )

  const [notifications, setNotifications] = useState(true)

  const [preference, setPreference] = useState(
    "In person · 30-minute sessions",
  )

  return (
    <div className="app-page">
      <AppHeader
        role={role}
        onProfile={() => navigate("profile")}
        showProfile={false}
      />
      <main className="page-content profile-content">
        <h1>{isStudent ? "Student profile" : "Instructor profile"}</h1>

        <section className="profile-card">
          <div className="profile-avatar">
            <Icon src={icons.profileAvatar} />
            <span>{isStudent ? "OA" : "MJ"}</span>
          </div>
          <div className="profile-identity">
            <h2>{user.name}</h2>
            <p>{isStudent ? "Student" : "Instructor"}</p>
          </div>
        </section>

        <button
          className="primary edit-profile-button"
          onClick={() => setEditing((value) => !value)}
          type="button"
        >
          {editing ? "Save profile" : "Edit profile"}
        </button>

        <h2 className="profile-section-title">
          {isStudent ? "Student & account information" : "Faculty information"}
        </h2>
        <section className="profile-details account-details">
          <div className="profile-detail-row">
            <span>{isStudent ? "Student ID" : "Faculty ID"}</span>
            {editing ? (
              <input
                aria-label={isStudent ? "Student ID" : "Faculty ID"}
                value={studentId}
                onChange={(event) => setStudentId(event.target.value)}
              />
            ) : (
              <strong>{studentId}</strong>
            )}
          </div>
          <div className="profile-detail-row">
            <span>Email</span>
            {editing ? (
              <input
                aria-label="Email address"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            ) : (
              <strong>{email}</strong>
            )}
          </div>
          <div className="profile-detail-row">
            <span>{isStudent ? "Program & year level" : "Department"}</span>
            {editing ? (
              <input
                aria-label={isStudent ? "Program and year level" : "Department"}
                value={program}
                onChange={(event) => setProgram(event.target.value)}
              />
            ) : (
              <strong>{program}</strong>
            )}
          </div>
        </section>

        <h2 className="profile-section-title preferences-title">
          Consultation preferences
        </h2>
        <section className="profile-preferences">
          <button
            className="preference-row"
            type="button"
            onClick={() =>
              setPreference((value) =>
                value.startsWith("In person")
                  ? "Online · 30-minute sessions"
                  : "In person · 30-minute sessions",
              )
            }
          >
            <span>
              <strong>Preferred consultation</strong>
              <small>{preference}</small>
            </span>
            <Icon src={icons.disclosure} />
          </button>
          <div className="preference-row notification-row">
            <span>
              <strong>Consultation notifications</strong>
              <small>Request updates & availability alerts</small>
            </span>
            <button
              className={`notification-switch ${notifications ? "on" : ""}`}
              type="button"
              role="switch"
              aria-checked={notifications}
              aria-label="Consultation notifications"
              onClick={() => setNotifications((value) => !value)}
            >
              <Icon src={icons.switchThumb} />
            </button>
          </div>
        </section>

        <button className="sign-out-button" onClick={onLogout} type="button">
          Sign out
        </button>
      </main>
      <BottomNav active="profile" navigate={navigate} />
    </div>
  )
}

function Booking({
  onBack,

  onSubmit,

  availability,
}: {
  onBack: () => void

  onSubmit: (date: string, start: string, end: string, reason: string) => void

  availability: Availability
}) {
  const currentLocalDate = () => {
    const now = new Date()

    return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)

      .toISOString()

      .split("T")[0]
  }

  const [date, setDate] = useState(currentLocalDate)

  const [start, setStart] = useState("")

  const [end, setEnd] = useState("")

  const [reason, setReason] = useState("Project guidance")

  const [editingReason, setEditingReason] = useState(false)

  const times = Array.from({ length: 19 }, (_, index) => {
    const totalMinutes = 8 * 60 + index * 30

    const hour = Math.floor(totalMinutes / 60)

    const minutes = totalMinutes % 60

    const period = hour >= 12 ? "PM" : "AM"

    const displayHour = hour > 12 ? hour - 12 : hour

    return `${displayHour}:${minutes.toString().padStart(2, "0")} ${period}`
  })

  const formattedDate = date
    ? new Intl.DateTimeFormat("en-US", {
        weekday: "short",

        month: "short",

        day: "numeric",

        year: "numeric",

        timeZone: "UTC",
      }).format(new Date(`${date}T00:00:00Z`))
    : "Select a date"

  const startTimeIndex = times.indexOf(start)

  const endTimeIndex = times.indexOf(end)

  return (
    <div className="app-page booking-page">
      <header className="booking-header">
        <button onClick={onBack} type="button" aria-label="Go back">
          <Icon src={icons.back} />
        </button>
        <div>
          <strong>Book consultation</strong>
          <span>Digital consultation request</span>
        </div>
      </header>
      <main className="page-content booking-content">
        <h1>Plan your consultation</h1>
        <p className="subtitle">Choose a time and send a digital request.</p>
        <section className="booking-instructor">
          <div className="avatar">MJ</div>
          <div>
            <h3>Dr. Monaliza S. Jimenez</h3>
            <p>Logic Circuits and Design</p>
          </div>
          <span
            className={`availability ${
              availability === "Available" ? "available" : ""
            }`}
          >
            {availability === "Available" && <Icon src={icons.dot} />}
            {availability}
          </span>
          <p className="location">
            <Icon src={icons.pin} />
            In person · Faculty / Professors Lounge
          </p>
        </section>
        <label className="field-label">Date</label>
        <div className="select-shell date-select">
          <Icon src={icons.calendar} />
          <input
            aria-label="Consultation date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            min={currentLocalDate()}
          />
        </div>
        <div className="time-grid">
          <label>
            <span>Start time</span>
            <select
              value={start}
              onChange={(e) => {
                setStart(e.target.value)

                setEnd("")
              }}
            >
              <option value="" disabled>
                Pick time
              </option>
              {times.map((time) => (
                <option key={time}>{time}</option>
              ))}
            </select>
          </label>
          <label>
            <span>End time</span>
            <select value={end} onChange={(e) => setEnd(e.target.value)}>
              <option value="" disabled>
                Pick time
              </option>
              {times.map((time) => (
                <option key={time}>{time}</option>
              ))}
            </select>
          </label>
        </div>
        <p className="duration">
          <Icon src={icons.clock} />
          30-minute consultation · Campus local time
        </p>
        <section className="request-summary">
          <div className="summary-title">
            <h3>Request summary</h3>
            <button
              type="button"
              onClick={() => setEditingReason((editing) => !editing)}
            >
              <Icon src={icons.edit} />
              {editingReason ? "Done" : "Edit"}
            </button>
          </div>
          <p>Oliver Aniate → Dr. Monaliza S. Jimenez</p>
          <small>
            {formattedDate.replace(/^[A-Za-z]{3}, /, "")} ·{" "}
            {start && end
              ? `${start.replace(" AM", "")}–${end}`
              : "Pick start and end time"}
          </small>
          <small>CPE 301L</small>
          <div className={`reason-frame ${editingReason ? "editing" : ""}`}>
            <label htmlFor="consultation-reason">Reason for consultation</label>
            {editingReason ? (
              <textarea
                id="consultation-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Describe what you need help with"
                autoFocus
              />
            ) : (
              <p>{reason || "No reason provided"}</p>
            )}
          </div>
        </section>
        <button
          className="primary submit-request"
          onClick={() => onSubmit(date, start, end, reason)}
          disabled={
            !date ||
            !start ||
            !end ||
            !reason.trim() ||
            endTimeIndex !== startTimeIndex + 1
          }
          type="button"
        >
          Submit consultation request <Arrow />
        </button>
        <p className="booking-disclaimer">
          This sends a request, not a confirmed booking. Your instructor will
          review it first.
        </p>
      </main>
    </div>
  )
}

export default function App() {
  const [role, setRole] = useState<Role>("student")

  const [view, setView] = useState<View>("login")

  const [authenticatedUser, setAuthenticatedUser] = useState<AuthUser | null>(
    null,
  )

  const [availability, setAvailability] = useState<Availability>("Available")

  const [studentRequests, setStudentRequests] = useState<Consultation[]>([])

  const [instructorRequests, setInstructorRequests] = useState<Consultation[]>(
    [],
  )

  const [databaseError, setDatabaseError] = useState("")

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function restoreSession() {
      try {
        const user = await getCurrentUser()
        if (cancelled) return

        if (user) {
          setAuthenticatedUser(user)
          setRole(user.role)
          setView("home")
        } else {
          setIsLoading(false)
        }
      } catch (error) {
        if (cancelled) return

        setDatabaseError(
          error instanceof Error
            ? `Could not connect to the local sign-in service: ${error.message}`
            : "Could not connect to the local sign-in service.",
        )
        setIsLoading(false)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void restoreSession()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const user = authenticatedUser
    if (user === null) return
    let cancelled = false

    async function loadAccountData(user: AuthUser) {
      setIsLoading(true)
      try {
        const [consultations, savedAvailability] = await Promise.all([
          getConsultations(),
          getAvailability(),
        ])
        if (cancelled) return
        setStudentRequests(
          user.role === "student" ? consultations : [],
        )
        setInstructorRequests(
          user.role === "instructor" ? consultations : [],
        )
        setAvailability(savedAvailability.status)
        setDatabaseError("")
      } catch (error) {
        if (cancelled) return
        setDatabaseError(
          error instanceof Error
            ? `Could not load your MongoDB data: ${error.message}`
            : "Could not load your MongoDB data.",
        )
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void loadAccountData(user)
    return () => {
      cancelled = true
    }
  }, [authenticatedUser])

  async function handleLogin(
    selectedRole: Role,
    identifier: string,
    password: string,
  ) {
    const user = await authenticate(selectedRole, identifier, password)
    setAuthenticatedUser(user)
    setRole(user.role)
    setDatabaseError("")
    setView("home")
  }

  async function logout() {
    try {
      await logoutFromApi()
      setAuthenticatedUser(null)
      setStudentRequests([])
      setInstructorRequests([])
      setView("login")
      setDatabaseError("")
    } catch (error) {
      setDatabaseError(
        error instanceof Error ? error.message : "Could not sign out.",
      )
    }
  }

  async function submitBooking(
    date: string,

    start: string,

    end: string,

    reason: string,
  ) {
    try {
      const created = await createConsultation(date, start, end, reason)

      setStudentRequests((requests) => [created.student, ...requests])

      setInstructorRequests((requests) => [created.instructor, ...requests])

      setDatabaseError("")

      setView("requests")
    } catch (error) {
      setDatabaseError(
        error instanceof Error ? error.message : "Could not save the request.",
      )
    }
  }

  async function updateConsultationStatus(
    id: string,

    status: Exclude<RequestStatus, "Pending" | "Finished">,
  ) {
    try {
      const updated = await updateConsultation(id, status)

      setStudentRequests((requests) =>
        requests.map((request) =>
          request.id === id ? updated.student : request,
        ),
      )

      setInstructorRequests((requests) =>
        requests.map((request) =>
          request.id === id ? updated.instructor : request,
        ),
      )

      setDatabaseError("")
    } catch (error) {
      setDatabaseError(
        error instanceof Error
          ? error.message
          : "Could not update the consultation.",
      )
    }
  }

  async function updateAvailability(value: Availability) {
    try {
      const saved = await saveAvailability(value)

      setAvailability(saved.status)

      setDatabaseError("")
    } catch (error) {
      setDatabaseError(
        error instanceof Error
          ? error.message
          : "Could not save instructor availability.",
      )
    }
  }

  let page: ReactNode

  if (view === "login") {
    page = (
      <Login role={role} setRole={setRole} onLogin={handleLogin} />
    )
  } else if (view === "booking") {
    page = (
      <Booking
        onBack={() => setView("home")}
        onSubmit={submitBooking}
        availability={availability}
      />
    )
  } else if (view === "profile") {
    page = authenticatedUser ? (
      <Profile
        role={role}
        navigate={setView}
        onLogout={logout}
        user={authenticatedUser}
      />
    ) : null
  } else if (view === "requests") {
    page = (
      <Requests
        role={role}
        navigate={setView}
        requests={role === "student" ? studentRequests : instructorRequests}
        onStatusChange={updateConsultationStatus}
        userName={authenticatedUser?.name ?? ""}
      />
    )
  } else if (role === "student") {
    page = (
      <StudentHome
        navigate={setView}
        availability={availability}
        studentName={authenticatedUser?.name ?? ""}
      />
    )
  } else {
    page = (
      <InstructorHome
        navigate={setView}
        availability={availability}
        setAvailability={updateAvailability}
        requests={instructorRequests}
        instructorName={authenticatedUser?.name ?? ""}
      />
    )
  }

  return (
    <>
      {(isLoading || databaseError) && (
        <div
          className={`database-notice ${isLoading ? "loading" : ""}`}
          role={databaseError ? "alert" : "status"}
        >
          {isLoading ? "Connecting to local MongoDB…" : databaseError}
        </div>
      )}
      {page}
    </>
  )
}
