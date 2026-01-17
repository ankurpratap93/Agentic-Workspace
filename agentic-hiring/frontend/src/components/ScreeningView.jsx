import { useState, useEffect } from "react"
import { FileText, Phone, Play, CheckCircle2, XCircle, Sparkles, Loader2 } from "lucide-react"
import { Button } from "./ui/button"
import CallingAgentModal from "./CallingAgentModal"
import RejectionModal from "./RejectionModal"

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"

export default function ScreeningView({ job }) {
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeCandidate, setActiveCandidate] = useState(null)
  const [transcripts, setTranscripts] = useState({})
  const [processing, setProcessing] = useState(false)
  const [acting, setActing] = useState({})
  const [assessments, setAssessments] = useState({})
  const [assessing, setAssessing] = useState({})
  const [agentError, setAgentError] = useState({})

  // New Agent Modals State
  const [callingModalOpen, setCallingModalOpen] = useState(false)
  const [selectedCandidateData, setSelectedCandidateData] = useState(null)
  const [extractingPhone, setExtractingPhone] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionCandidate, setRejectionCandidate] = useState(null)

  const fetchContactInfo = async (candidateName) => {
    if (!job?.id || !candidateName) return null
    setExtractingPhone(true)
    try {
      const res = await fetch(`${API_BASE}/jobs/${job.id}/candidates/${candidateName}/contact`)
      if (!res.ok) throw new Error("Failed to fetch contact")
      const data = await res.json()
      return data // { email, phone }
    } catch (e) {
      console.error("Error fetching contact info:", e)
      return null
    } finally {
      setExtractingPhone(false)
    }
  }

  const handleCallClick = async (e, candidate) => {
    e.stopPropagation()
    let currentCandidate = { ...candidate }

    // Auto-select this candidate so the detail view shows up immediately
    setActiveCandidate(candidate.name)

    // If phone is missing, try to extract it lazily
    if (!currentCandidate.phone) {
      const contact = await fetchContactInfo(candidate.name)
      if (contact) {
        currentCandidate.phone = contact.phone
        currentCandidate.email = contact.email
      }
    }

    setSelectedCandidateData(currentCandidate)
    setCallingModalOpen(true)
  }

  const fetchCandidates = async () => {
    if (!job?.id) return
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/jobs/${job.id}/candidates`)
      const data = await res.json()
      console.log("DEBUG: Fetched candidates:", data)
      // Filter for those ready for screening or already screened
      const relevant = data.filter(c =>
        ["Shortlisted", "Screening", "AI Screened", "Screened"].includes(c.status)
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

  const fetchTranscript = async (candidateName) => {
    if (!job?.id || !candidateName) return
    try {
      const res = await fetch(`${API_BASE}/jobs/${job.id}/candidates/${candidateName}/transcript`)
      if (res.ok) {
        const data = await res.json()
        if (data.transcript) {
          setTranscripts(prev => ({ ...prev, [candidateName]: data.transcript }))
        }
      }
    } catch (e) {
      console.error("Error fetching transcript:", e)
    }
  }

  useEffect(() => {
    if (activeCandidate) {
      fetchTranscript(activeCandidate)
    }
  }, [activeCandidate, job?.id])

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
      console.log("DEBUG: Assessment result:", data)
      const assessmentObj = data?.assessment || null
      setAssessments((m) => ({ ...m, [activeCandidate]: assessmentObj }))

      // Force immediate local update of the candidate's score to trigger button activation
      if (assessmentObj && (assessmentObj.score !== undefined && assessmentObj.score !== null)) {
        const numericScore = parseFloat(assessmentObj.score)

        const normalize = (s) => (s || "").toString().replace(/_/g, " ").trim().toLowerCase()
        const targetSearchName = normalize(activeCandidate)

        console.log(`DEBUG: runAssessment - target normalized [${targetSearchName}] score [${numericScore}]`)

        setCandidates(prev => {
          const next = prev.map(c => {
            const currentName = normalize(c.name)
            if (currentName === targetSearchName) {
              console.log(`DEBUG: SUCCESS - Matched candidate [${c.name}] in state. Updating locally.`)
              return { ...c, screening_score: numericScore, status: "AI Screened" }
            }
            return c
          })
          console.log("DEBUG: Candidates list after local map:", next)
          return next
        })
      }

      // 5 second delay to let user see the local update and let backend stabilize
      setTimeout(() => {
        console.log("DEBUG: Running background refresh after assessment")
        fetchCandidates()
      }, 5000)
    } catch (e) {
      console.error(e)
      setAgentError((m) => ({ ...m, [activeCandidate]: "Assessment failed." }))
    } finally {
      setAssessing((m) => ({ ...m, [activeCandidate]: false }))
    }
  }

  return (
    <div>
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
                    console.log(`DEBUG: Selecting ${c.name}, score: ${c.screening_score}`)
                    setActiveCandidate(c.name)
                    // Clear previous assessments if not for this candidate
                    if (!assessments[c.name]) setAssessments(prev => ({ ...prev, [c.name]: null }))
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${activeCandidate && c.name.trim().toLowerCase() === activeCandidate.trim().toLowerCase()
                    ? "bg-purple-500/10 border-purple-500/50"
                    : c.status === "Shortlisted"
                      ? "!bg-green-900/20 !border-green-500/30 hover:!bg-green-900/30"
                      : "bg-slate-900/40 border-slate-800 hover:bg-slate-800"
                    }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-slate-200">{c.name}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${c.status === "AI Screened" ? "bg-emerald-500/20 text-emerald-300" :
                      c.status === "Shortlisted" ? "!bg-green-500/20 !text-green-300" :
                        "bg-blue-500/20 text-blue-300"
                      }`}>
                      {c.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">
                      Score:{" "}
                      {c.screening_score !== undefined && c.screening_score !== null
                        ? `${c.screening_score}/10`
                        : "Pending (run AI screen)"}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-blue-300 hover:text-blue-200 hover:bg-blue-500/10 gap-1"
                        disabled={extractingPhone}
                        onClick={(e) => handleCallClick(e, c)}
                        title="AI Call"
                      >
                        {extractingPhone && selectedCandidateData?.name === c.name ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Phone className="w-3.5 h-3.5" />
                        )}
                        Call
                      </Button>
                      <Button
                        size="sm"
                        disabled={acting[c.name] || (c.screening_score === undefined || c.screening_score === null)}
                        className={`gap-1 transition-all ${(c.screening_score !== undefined && c.screening_score !== null)
                          ? "!bg-green-500 hover:!bg-green-600 text-white font-medium shadow-lg shadow-green-900/20"
                          : "bg-slate-800 text-slate-500 opacity-50 cursor-not-allowed"
                          }`}
                        onClick={(e) => {
                          e.stopPropagation()
                          doStatus(c.name, "shortlist")
                        }}
                      >
                        Shortlist
                      </Button>
                      <Button
                        size="sm"
                        disabled={acting[c.name] || (c.screening_score === undefined || c.screening_score === null)}
                        className={`gap-1 transition-all ${(c.screening_score !== undefined && c.screening_score !== null)
                          ? "!bg-red-900 hover:!bg-red-950 text-white border border-red-800/50"
                          : "bg-slate-800 text-slate-500 opacity-50 cursor-not-allowed"
                          }`}
                        onClick={(e) => {
                          e.stopPropagation()
                          setRejectionCandidate(c.name)
                          setShowRejectModal(true)
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

                  {assessments[activeCandidate].criteria_breakdown && (
                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-700/50">
                      {Object.entries(assessments[activeCandidate].criteria_breakdown).map(([key, val]) => (
                        <div key={key} className="text-[10px] space-y-0.5">
                          <div className="text-slate-500 uppercase tracking-wider font-bold">{key}</div>
                          <div className="text-slate-300 truncate" title={val}>{val}</div>
                        </div>
                      ))}
                    </div>
                  )}

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

      <CallingAgentModal
        isOpen={callingModalOpen}
        onClose={() => {
          setCallingModalOpen(false)
          setSelectedCandidateData(null)
          fetchCandidates()
          // ALSO REFRESH TRANSCRIPT immediately after modal closes
          if (activeCandidate) fetchTranscript(activeCandidate)
        }}
        onCallComplete={(data) => {
          if (data.candidateName) {
            // Update transcripts and assessments locally for immediate feedback
            if (data.transcript) {
              setTranscripts(prev => ({ ...prev, [data.candidateName]: data.transcript }))
            }
            if (data.assessment) {
              setAssessments(prev => ({ ...prev, [data.candidateName]: { assessment: data.assessment } }))
            }
            // Ensure this candidate is active so the panel shows the results
            setActiveCandidate(data.candidateName)
          }
        }}
        jobId={job?.id}
        candidateName={selectedCandidateData?.name}
        initialPhoneNumber={selectedCandidateData?.phone}
      />

      <RejectionModal
        isOpen={showRejectModal}
        candidateName={rejectionCandidate}
        onClose={() => {
          setShowRejectModal(false)
          setRejectionCandidate(null)
        }}
        onConfirm={(feedback) => {
          doStatus(rejectionCandidate, "reject", feedback)
          setShowRejectModal(false)
          setRejectionCandidate(null)
        }}
      />
    </div>
  )
}
