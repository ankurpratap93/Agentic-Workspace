import { useState, useEffect } from "react"
import { FileText, Phone, Play, CheckCircle2, XCircle, Sparkles, Loader2 } from "lucide-react"
import { Button } from "./ui/button"

const API_BASE = "http://127.0.0.1:8000"

export default function ScreeningView({ job }) {
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeCandidate, setActiveCandidate] = useState(null)
  const [transcripts, setTranscripts] = useState({})
  const [processing, setProcessing] = useState(false)
  const [acting, setActing] = useState({})
  const [feedbackDraft, setFeedbackDraft] = useState("")
  const [assessments, setAssessments] = useState({})
  const [assessing, setAssessing] = useState({})
  const [agentError, setAgentError] = useState({})

  const fetchCandidates = async () => {
    if (!job?.id) return
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/jobs/${job.id}/candidates`)
      const data = await res.json()
      // Filter for those ready for screening or already screened
      const relevant = data.filter(c => 
        ["Shortlisted", "Screening", "AI Screened", "Interview Ready"].includes(c.status)
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
  }, [job?.id])

  const doStatus = async (candidateName, action, feedbackText = "") => {
    if (!candidateName || !job?.id) return
    setActing((m) => ({ ...m, [candidateName]: true }))
    try {
      const res = await fetch(`${API_BASE}/candidates/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: job.id, candidate_name: candidateName, action, feedback: feedbackText })
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      await fetchCandidates()
    } catch (e) {
      console.error(e)
    } finally {
      setActing((m) => ({ ...m, [candidateName]: false }))
    }
  }

  const runScreening = async (candidateName) => {
    setProcessing(true)
    setActiveCandidate(candidateName)
    try {
      const res = await fetch(`${API_BASE}/screen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: job.id, candidate_name: candidateName, action: "screen" })
      })
      const data = await res.json()
      setTranscripts((m) => ({ ...m, [candidateName]: data.transcript || "" }))
      // Clear stale assessment if a fresh screen run occurs
      setAssessments((m) => ({ ...m, [candidateName]: null }))
      await fetchCandidates()
    } catch (e) {
      console.error(e)
      setTranscripts((m) => ({ ...m, [candidateName]: "Error: Could not complete screening call." }))
    } finally {
      setProcessing(false)
    }
  }

  const runAssessment = async () => {
    const transcript = transcripts[activeCandidate] || ""
    if (!job?.id || !activeCandidate || !transcript.trim()) return
    setAssessing((m) => ({ ...m, [activeCandidate]: true }))
    setAgentError((m) => ({ ...m, [activeCandidate]: "" }))
    try {
      const res = await fetch(`${API_BASE}/screen/assess`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: job.id, candidate_name: activeCandidate, transcript })
      })
      if (!res.ok) throw new Error(`Assessment failed: ${res.status}`)
      const data = await res.json()
      setAssessments((m) => ({ ...m, [activeCandidate]: data?.assessment || null }))
    } catch (e) {
      console.error(e)
      setAgentError((m) => ({ ...m, [activeCandidate]: "Assessment failed." }))
    } finally {
      setAssessing((m) => ({ ...m, [activeCandidate]: false }))
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* List */}
      <div className="feature-card">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Phone className="w-5 h-5 text-purple-400" />
          AI Screening Queue
        </h3>
        {loading ? (
          <p className="text-slate-500">Loading...</p>
        ) : candidates.length === 0 ? (
          <p className="text-slate-500 italic">No candidates shortlisted for screening yet.</p>
        ) : (
          <div className="space-y-3">
            {candidates.map(c => (
              <div 
                key={c.name} 
                onClick={() => {
                  setActiveCandidate(c.name)
                  // keep per-candidate transcript/assessment; no global reset
                }}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  activeCandidate === c.name 
                    ? "bg-purple-500/10 border-purple-500/50" 
                    : "bg-slate-900/40 border-slate-800 hover:bg-slate-800"
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-slate-200">{c.name}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    c.status === "AI Screened" ? "bg-emerald-500/20 text-emerald-300" : "bg-blue-500/20 text-blue-300"
                  }`}>
                    {c.status}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">
                    Score:{" "}
                    {c.status === "AI Screened"
                      ? (c.score ?? "—")
                      : "Pending (run AI screen)"}
                  </span>
                  <div className="flex items-center gap-2">
                    {c.status !== "AI Screened" && (
                      <Button size="sm" onClick={(e) => {
                        e.stopPropagation()
                        runScreening(c.name)
                      }} disabled={processing}>
                        <Play className="w-3 h-3 mr-2" />
                        Start Call
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={acting[c.name]}
                      onClick={(e) => {
                        e.stopPropagation()
                        doStatus(c.name, "shortlist")
                      }}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={acting[c.name]}
                      onClick={(e) => {
                        e.stopPropagation()
                        const fb = window.prompt("Add rejection feedback (optional):", feedbackDraft) || ""
                        setFeedbackDraft(fb)
                        doStatus(c.name, "reject", fb)
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail / Transcript */}
      <div className="feature-card min-h-[400px]">
        <h3 className="text-xl font-bold text-white mb-4">Call Transcript</h3>
        {activeCandidate ? (
          <div className="h-full">
            <div className="mb-4 pb-4 border-b border-slate-800">
              <h4 className="text-lg font-medium text-purple-300">{activeCandidate}</h4>
              <p className="text-sm text-slate-500">AI Agent Interview Log</p>
            </div>
            <div className="bg-slate-950/50 rounded-lg p-4 font-mono text-sm text-slate-300 whitespace-pre-wrap max-h-[500px] overflow-y-auto border border-slate-800">
              {(transcripts[activeCandidate] || "") || (processing ? "Agent is calling candidate..." : "Select a candidate or start a call to view transcript.")}
            </div>
            <div className="flex items-center gap-2 mt-3">
              <Button
                size="sm"
                onClick={runAssessment}
                disabled={!(transcripts[activeCandidate] || "").trim() || assessing[activeCandidate]}
              >
                {assessing[activeCandidate] ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                {assessments[activeCandidate] ? "Reassess" : "AI Assess"}
              </Button>
              {agentError[activeCandidate] && <span className="text-xs text-red-300">{agentError[activeCandidate]}</span>}
            </div>
            {assessments[activeCandidate] && (
              <div className="mt-3 text-sm text-slate-200 bg-slate-900/60 border border-slate-800 rounded-lg p-3 space-y-2">
                <div className="text-sky-300 font-semibold">Assessment</div>
                <div>{assessments[activeCandidate].assessment}</div>
                <div className="text-xs text-slate-400">Recommendation: {assessments[activeCandidate].hire_recommendation}</div>
                {assessments[activeCandidate].risks && assessments[activeCandidate].risks.length > 0 && (
                  <div className="text-xs text-amber-200">
                    Risks: {assessments[activeCandidate].risks.join(", ")}
                  </div>
                )}
                {assessments[activeCandidate].next_questions && assessments[activeCandidate].next_questions.length > 0 && (
                  <div className="text-xs text-slate-300">
                    Next questions: {assessments[activeCandidate].next_questions.join(" · ")}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-500">
            Select a candidate to view details
          </div>
        )}
      </div>
    </div>
  )
}
