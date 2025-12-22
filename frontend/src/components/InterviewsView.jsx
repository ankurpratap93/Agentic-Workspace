import { useState, useEffect } from "react"
import { Calendar, Clock, User, Check, Repeat, XCircle, Mail, Sparkles, Loader2, ClipboardList } from "lucide-react"
import { Button } from "./ui/button"

const API_BASE = "http://127.0.0.1:8000"

export default function InterviewsView({ job }) {
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(false)
  const [scheduling, setScheduling] = useState(null) // name of candidate being scheduled
  const [selected, setSelected] = useState(null) // candidate selected to view details
  
  // Form State
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [interviewer, setInterviewer] = useState("")
  const [notification, setNotification] = useState(null)
  const [schedule, setSchedule] = useState([])
  const [busy, setBusy] = useState(false)
  const [roundType, setRoundType] = useState("tech1")
  const [guide, setGuide] = useState(null)
  const [guideLoading, setGuideLoading] = useState(false)
  const [evalTranscript, setEvalTranscript] = useState("")
  const [evaluation, setEvaluation] = useState(null)
  const [evalLoading, setEvalLoading] = useState(false)
  const [summary, setSummary] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [agentError, setAgentError] = useState("")
  const [slotSuggestions, setSlotSuggestions] = useState([])
  const [slotLoading, setSlotLoading] = useState(false)

  const fetchCandidates = async () => {
    if (!job?.id) return
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/jobs/${job.id}/candidates`)
      const data = await res.json()
      // Filter for Screened or already scheduled
      const relevant = data.filter(c => 
        ["AI Screened", "Interview Scheduled", "Interview Ready"].includes(c.status)
      )
      setCandidates(relevant)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCandidates()
    fetchSchedule()
  }, [job?.id])

  const handleSchedule = async (e) => {
    e.preventDefault()
    if (!scheduling) return

    try {
      const res = await fetch(`${API_BASE}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: job.id,
          candidate_name: scheduling,
          date,
          time,
          interviewer
        })
      })
      const data = await res.json().catch(() => ({}))
      setNotification(data?.notification || null)
      setScheduling(null)
      setDate("")
      setTime("")
      setInterviewer("")
      await Promise.all([fetchCandidates(), fetchSchedule()])
    } catch (e) {
      console.error("Schedule failed", e)
    }
  }

  const fetchSchedule = async () => {
    if (!job?.id) return
    try {
      const res = await fetch(`${API_BASE}/jobs/${job.id}/schedule`)
      const data = await res.json()
      setSchedule(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error("Fetch schedule failed", e)
    }
  }

  const roundOptions = [
    { value: "tech1", label: "Tech 1" },
    { value: "tech2", label: "Tech 2" },
    { value: "managerial", label: "Managerial" },
    { value: "hr", label: "HR" },
  ]

  const fetchGuide = async () => {
    if (!job?.id || !selected) return
    setGuideLoading(true)
    setAgentError("")
    try {
      const res = await fetch(`${API_BASE}/interview/guide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: job.id, candidate_name: selected, round_type: roundType }),
      })
      if (!res.ok) throw new Error(`Guide failed: ${res.status}`)
      const data = await res.json()
      setGuide(data?.guide || null)
    } catch (e) {
      console.error(e)
      setAgentError("Guide generation failed.")
    } finally {
      setGuideLoading(false)
    }
  }

  const runEvaluation = async () => {
    if (!job?.id || !selected || !evalTranscript.trim()) return
    setEvalLoading(true)
    setAgentError("")
    try {
      const res = await fetch(`${API_BASE}/interview/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: job.id, candidate_name: selected, round_type: roundType, transcript: evalTranscript }),
      })
      if (!res.ok) throw new Error(`Evaluation failed: ${res.status}`)
      const data = await res.json()
      setEvaluation(data?.evaluation || null)
    } catch (e) {
      console.error(e)
      setAgentError("Evaluation failed.")
    } finally {
      setEvalLoading(false)
    }
  }

  const runSummary = async () => {
    if (!job?.id || !selected) return
    setSummaryLoading(true)
    setAgentError("")
    try {
      const res = await fetch(`${API_BASE}/interview/summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: job.id, candidate_name: selected }),
      })
      if (!res.ok) throw new Error(`Summary failed: ${res.status}`)
      const data = await res.json()
      setSummary(data?.summary || null)
    } catch (e) {
      console.error(e)
      setAgentError("Summary failed.")
    } finally {
      setSummaryLoading(false)
    }
  }

  const suggestSlots = async () => {
    if (!job?.id || !selected) return
    setSlotLoading(true)
    setAgentError("")
    try {
      const res = await fetch(`${API_BASE}/schedule/suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: job.id, candidate_name: selected }),
      })
      if (!res.ok) throw new Error(`Slot suggest failed: ${res.status}`)
      const data = await res.json()
      setSlotSuggestions(data?.slots || [])
    } catch (e) {
      console.error(e)
      setAgentError("Slot suggestion failed.")
    } finally {
      setSlotLoading(false)
    }
  }

  const currentSlot = selected ? schedule.find(ev => ev.candidate === selected) : null

  const cancelSlot = async () => {
    if (!selected) return
    setBusy(true)
    try {
      await fetch(`${API_BASE}/schedule/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: job.id, candidate_name: selected })
      })
      setNotification(null)
      setSelected(null)
      await Promise.all([fetchCandidates(), fetchSchedule()])
    } catch (e) {
      console.error("Cancel failed", e)
    } finally {
      setBusy(false)
    }
  }

  const startReschedule = () => {
    if (!selected || !currentSlot) return
    setScheduling(selected)
    setDate(currentSlot.date)
    setTime(currentSlot.time)
    setInterviewer(currentSlot.interviewer)
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2 space-y-4">
        <div className="feature-card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-xl font-bold text-white">Interview Queue</h3>
                <p className="text-sm text-slate-400">Pick a candidate, see their slot, reschedule or cancel. Use Agent Assist for guides/evals.</p>
              </div>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Live schedule view
            </div>
          </div>

          {loading ? (
            <p className="text-slate-500">Loading...</p>
          ) : (
            <div className="space-y-3">
              {candidates.length === 0 && (
                <p className="text-slate-500">No candidates ready for interviews.</p>
              )}
              {candidates.map(c => {
                const slot = schedule.find(ev => ev.candidate === c.name)
                const isSelected = selected === c.name
                const contactLine = c.email || c.phone ? `${c.email || ""}${c.email && c.phone ? " · " : ""}${c.phone || ""}` : ""
                return (
                  <div 
                    key={c.name} 
                    className={`p-4 rounded-xl border transition-all cursor-pointer bg-slate-900/40 ${
                      isSelected ? "border-amber-400/70 shadow-[0_8px_30px_rgba(255,193,7,0.18)]" : "border-slate-800 hover:border-amber-400/50"
                    }`}
                    onClick={() => setSelected(c.name)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-100">{c.name}</span>
                          <span className="text-[11px] px-2 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-100">
                            {c.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <User className="w-3.5 h-3.5" />
                          {slot ? (
                            <span>{slot.date} · {slot.time} · {slot.interviewer}</span>
                          ) : (
                            <span>Awaiting slot</span>
                          )}
                        </div>
                        {contactLine && (
                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <Mail className="w-3.5 h-3.5" />
                            <span className="truncate">{contactLine}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {slot ? (
                          <span className="text-xs text-emerald-300 flex items-center gap-1">
                            <Check className="w-4 h-4" /> Scheduled
                          </span>
                        ) : (
                          <Button onClick={() => setScheduling(c.name)} variant="outline" size="sm">
                            Schedule
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="feature-card bg-slate-950/40 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-lg font-bold text-white">Schedule Overview</h4>
              <p className="text-sm text-slate-400">See every booked slot at a glance.</p>
            </div>
            <Clock className="w-4 h-4 text-slate-500" />
          </div>
          {schedule.length === 0 ? (
            <p className="text-slate-500">No interviews scheduled yet.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {schedule.map(ev => (
                <div key={`${ev.candidate}-${ev.date}-${ev.time}`} className="rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-slate-100">{ev.candidate}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-200 border border-emerald-400/30">{ev.status}</span>
                  </div>
                  <div className="text-xs text-slate-300 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" /> {ev.date}
                  </div>
                  <div className="text-xs text-slate-300 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" /> {ev.time}
                  </div>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                    <User className="w-3.5 h-3.5" /> {ev.interviewer}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Scheduling Sidebar */}
      <div className="feature-card bg-slate-950/60 border border-slate-800">
        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          Slot & Notifications
        </h3>
        <p className="text-sm text-slate-400 mb-4">
          Pick a candidate to view their slot. Reschedule or cancel in one click.
        </p>
        {notification && (
          <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-3 text-sm text-emerald-200">
            <div className="font-semibold text-emerald-100 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Notifications sent
            </div>
            <div className="text-emerald-200/90">Candidate: {notification.candidate_email}</div>
            {notification.candidate_phone && (
              <div className="text-emerald-200/90">Phone: {notification.candidate_phone}</div>
            )}
            <div className="text-emerald-200/90">Interviewer: {notification.interviewer_email}</div>
            <div className="text-emerald-200/70 mt-1">{notification.message}</div>
          </div>
        )}
        {selected && currentSlot && !scheduling && (
          <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-3 text-sm text-amber-100">
            <div className="font-semibold text-amber-50 mb-1">Current slot</div>
            <div>{currentSlot.date} at {currentSlot.time}</div>
            <div className="text-amber-200/80">Interviewer: {currentSlot.interviewer}</div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="secondary" onClick={startReschedule} disabled={busy} className="gap-1">
                <Repeat className="w-4 h-4" /> Reschedule
              </Button>
              <Button size="sm" variant="destructive" onClick={cancelSlot} disabled={busy} className="gap-1">
                <XCircle className="w-4 h-4" /> Cancel
              </Button>
            </div>
          </div>
        )}
        {scheduling ? (
          <form onSubmit={handleSchedule} className="space-y-4">
            <p className="text-sm text-amber-400 mb-2">Scheduling for: <strong>{scheduling}</strong></p>
            
            <div>
              <label className="text-xs text-slate-400 uppercase font-bold">Date</label>
              <input 
                type="date" 
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 uppercase font-bold">Time</label>
              <input 
                type="time" 
                required
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 uppercase font-bold">Interviewer</label>
              <input 
                type="text" 
                required
                placeholder="e.g. Jane Doe"
                value={interviewer}
                onChange={e => setInterviewer(e.target.value)}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" className="w-full">Confirm</Button>
              <Button type="button" variant="ghost" onClick={() => setScheduling(null)}>Cancel</Button>
            </div>
          </form>
        ) : (
          <div className="text-center text-slate-500 py-10">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p>Select a candidate to view or book a slot.</p>
          </div>
        )}
      </div>

      {/* Agent Assist */}
      <div className="feature-card xl:col-span-3 bg-slate-950/70 border border-slate-800">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-300" />
            <div>
              <h3 className="text-lg font-bold text-white">Interview Agent Assist</h3>
              <p className="text-sm text-slate-400">Round-specific guide, evaluation, and summary.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {roundOptions.map((r) => (
              <button
                key={r.value}
                className={`px-3 py-1.5 rounded-full text-sm border ${
                  roundType === r.value ? "bg-blue-600/30 border-blue-400 text-slate-50" : "bg-slate-900 border-slate-700 text-slate-300 hover:border-blue-400"
                }`}
                onClick={() => setRoundType(r.value)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {agentError && <div className="mb-3 text-sm text-red-300">{agentError}</div>}

        <div className="grid md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-slate-100 text-sm">Question Guide</div>
              <Button size="sm" variant="secondary" onClick={fetchGuide} disabled={!selected || guideLoading}>
                {guideLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate"}
              </Button>
            </div>
            {!selected && <p className="text-xs text-slate-500">Select a candidate.</p>}
            {guide && (
              <div className="text-xs text-slate-200 space-y-2 max-h-60 overflow-y-auto">
                {Object.entries(guide).map(([k, v]) => (
                  <div key={k}>
                    <div className="uppercase text-[10px] text-slate-400 font-semibold mb-1">{k}</div>
                    <ul className="space-y-1">
                      {Array.isArray(v) && v.map((item, idx) => <li key={idx} className="text-slate-200">• {item}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-slate-100 text-sm flex items-center gap-1">
                <ClipboardList className="w-4 h-4" /> Round Evaluation
              </div>
              <Button size="sm" onClick={runEvaluation} disabled={!selected || evalLoading || !evalTranscript.trim()}>
                {evalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Evaluate"}
              </Button>
            </div>
            <textarea
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-100 text-sm min-h-[120px] focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Paste transcript or bullet Q&A for this round..."
              value={evalTranscript}
              onChange={(e) => setEvalTranscript(e.target.value)}
              disabled={!selected}
            />
            {evaluation && (
              <div className="text-xs text-slate-200 space-y-2 max-h-56 overflow-y-auto">
                <div className="flex items-center gap-2">
                  <span className="text-sky-300 font-semibold">Overall:</span>
                  <span>{evaluation.overall_score_0_10}</span>
                  <span className="text-slate-400">({evaluation.hire_recommendation})</span>
                </div>
                {evaluation.skill_scores && (
                  <div>
                    <div className="text-[10px] uppercase text-slate-400 font-semibold mb-1">Skills</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(evaluation.skill_scores).map(([skill, val]) => (
                        <span key={skill} className="px-2 py-1 rounded-full bg-slate-800 text-slate-100">
                          {skill}: {val}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {evaluation.strengths && evaluation.strengths.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase text-slate-400 font-semibold mb-1">Strengths</div>
                    <ul className="space-y-1">
                      {evaluation.strengths.map((s, idx) => <li key={idx}>• {s}</li>)}
                    </ul>
                  </div>
                )}
                {evaluation.concerns && evaluation.concerns.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase text-slate-400 font-semibold mb-1">Concerns</div>
                    <ul className="space-y-1">
                      {evaluation.concerns.map((s, idx) => <li key={idx}>• {s}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-slate-100 text-sm">Final Summary</div>
              <Button size="sm" variant="secondary" onClick={runSummary} disabled={!selected || summaryLoading}>
                {summaryLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Summarize"}
              </Button>
            </div>
            {summary ? (
              <div className="text-xs text-slate-200 space-y-2 max-h-56 overflow-y-auto">
                <div className="flex items-center gap-2">
                  <span className="text-sky-300 font-semibold">Rec:</span>
                  <span>{summary.final_recommendation}</span>
                  <span className="text-slate-400">score {summary.overall_score_0_10}</span>
                </div>
                {summary.strengths && summary.strengths.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase text-slate-400 font-semibold mb-1">Strengths</div>
                    <ul className="space-y-1">
                      {summary.strengths.map((s, idx) => <li key={idx}>• {s}</li>)}
                    </ul>
                  </div>
                )}
                {summary.concerns && summary.concerns.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase text-slate-400 font-semibold mb-1">Concerns</div>
                    <ul className="space-y-1">
                      {summary.concerns.map((s, idx) => <li key={idx}>• {s}</li>)}
                    </ul>
                  </div>
                )}
                {summary.next_steps && summary.next_steps.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase text-slate-400 font-semibold mb-1">Next Steps</div>
                    <ul className="space-y-1">
                      {summary.next_steps.map((s, idx) => <li key={idx}>• {s}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Run summarize after at least one evaluation.</p>
            )}
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-slate-100 text-sm">Slot Suggestions</div>
              <Button size="sm" variant="secondary" onClick={suggestSlots} disabled={!selected || slotLoading}>
                {slotLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Suggest"}
              </Button>
            </div>
            {slotSuggestions.length > 0 ? (
              <ul className="text-xs text-slate-200 space-y-1">
                {slotSuggestions.map((s, idx) => (
                  <li key={idx} className="flex items-center justify-between">
                    <span>{s.day} · {s.time} ({s.timezone || "local"})</span>
                    {s.note && <span className="text-slate-400">{s.note}</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500">Get quick-pick slots for this candidate.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
