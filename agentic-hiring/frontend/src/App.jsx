import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Users, FileText, Calendar, CheckCircle2, Sparkles } from "lucide-react"
import { Button } from "./components/ui/button"
import CandidatesView from "./components/CandidatesView"
import ScreeningView from "./components/ScreeningView"
import InterviewsView from "./components/InterviewsView"
import OfferView from "./components/OfferView"

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"

function App() {
  const [jobs, setJobs] = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const [metrics, setMetrics] = useState({ total: 0, screened: 0, interviewing: 0, offers: 0 })
  const [funnelData, setFunnelData] = useState([])
  const [apiStatus, setApiStatus] = useState("loading")
  const [activeStep, setActiveStep] = useState(0)
  const [showArchived, setShowArchived] = useState(false)
  const [manageOpen, setManageOpen] = useState(false)
  const [jdText, setJdText] = useState("")
  const [jdSaving, setJdSaving] = useState(false)
  const [jdLoading, setJdLoading] = useState(false)
  const [jdError, setJdError] = useState("")

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newJobTitle, setNewJobTitle] = useState("")
  const [newJobJD, setNewJobJD] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    // Fetch Jobs
    const url = showArchived ? `${API_URL}/jobs?include_archived=true` : `${API_URL}/jobs`
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setJobs(data)
        if (data.length > 0) {
          // keep selection if possible
          const keep = selectedJob ? data.find(j => j.id === selectedJob.id) : null
          setSelectedJob(keep || data[0])
        } else {
          setSelectedJob(null)
        }
        setApiStatus("ready")
      })
      .catch(err => {
        console.error("API Error", err)
        setApiStatus("error")
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showArchived])

  const refreshJobs = async (preferJobId) => {
    const url = showArchived ? `${API_URL}/jobs?include_archived=true` : `${API_URL}/jobs`
    const data = await fetch(url).then(r => r.json())
    setJobs(data)
    if (data.length === 0) {
      setSelectedJob(null)
      return
    }
    const preferred = preferJobId ? data.find(j => j.id === preferJobId) : null
    const keep = selectedJob ? data.find(j => j.id === selectedJob.id) : null
    setSelectedJob(preferred || keep || data[0])
  }

  const archiveSelectedJob = async () => {
    if (!selectedJob?.id) return
    await fetch(`${API_URL}/jobs/${selectedJob.id}/archive`, { method: "POST" })
    setManageOpen(false)
    await refreshJobs()
  }

  const restoreSelectedJob = async () => {
    if (!selectedJob?.id) return
    await fetch(`${API_URL}/jobs/${selectedJob.id}/restore`, { method: "POST" })
    setManageOpen(false)
    await refreshJobs(selectedJob.id)
  }

  const deleteSelectedJob = async () => {
    if (!selectedJob?.id) return
    const ok = window.confirm(`Delete requisition "${selectedJob.title}" permanently? This cannot be undone.`)
    if (!ok) return
    await fetch(`${API_URL}/jobs/${selectedJob.id}`, { method: "DELETE" })
    setManageOpen(false)
    // Reset local state since the job is gone
    setSelectedJob(null)
    setMetrics({ total: 0, screened: 0, interviewing: 0, offers: 0 })
    setFunnelData([])
    setJdText("")
    await refreshJobs()
  }

  useEffect(() => {
    if (selectedJob) {
      fetch(`${API_URL}/jobs/${selectedJob.id}/metrics`)
        .then(res => res.json())
        .then(data => setMetrics(data))
        .catch(console.error)

      // Fetch Funnel
      fetch(`${API_URL}/jobs/${selectedJob.id}/funnel`)
        .then(res => res.json())
        .then(data => setFunnelData(data))
        .catch(console.error)

      // Fetch JD
      setJdLoading(true)
      setJdError("")
      fetch(`${API_URL}/jobs/${selectedJob.id}/jd`)
        .then(res => res.json())
        .then(data => setJdText(data?.jd_text || ""))
        .catch((e) => {
          console.error(e)
          setJdError("Failed to load JD.")
        })
        .finally(() => setJdLoading(false))
    }
  }, [selectedJob])

  // Helper for max value to normalize bars
  const maxCount = Math.max(...(funnelData.length > 0 ? funnelData.map(d => d.count) : [1]))

  // Create Job Handler
  const handleCreateJob = (e) => {
    e.preventDefault()
    if (!newJobTitle.trim()) return

    setIsCreating(true)
    fetch(`${API_URL}/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newJobTitle, jd_text: newJobJD })
    })
      .then(res => res.json())
      .then(newJob => {
        const normalized = { ...newJob, count: 0, created_at: "Just now" }
        setJobs(prev => [...prev, normalized])
        setSelectedJob(normalized)
        setNewJobTitle("")
        setNewJobJD("")
        setIsModalOpen(false)
        setIsCreating(false)
      })
      .catch(err => {
        console.error("Creation Error:", err)
        setIsCreating(false)
      })
  }

  const saveJD = async () => {
    if (!selectedJob?.id) return
    setJdSaving(true)
    setJdError("")
    try {
      const res = await fetch(`${API_URL}/jobs/${selectedJob.id}/jd`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jd_text: jdText }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
    } catch (e) {
      console.error(e)
      setJdError("Failed to save JD.")
    } finally {
      setJdSaving(false)
    }
  }

  const rescore = async () => {
    if (!selectedJob?.id) return
    setJdLoading(true)
    setJdError("")
    try {
      const res = await fetch(`${API_URL}/jobs/${selectedJob.id}/rescore`, { method: "POST" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      console.log("Rescore response:", data)
      
      // refresh metrics/funnel
      const [m, f] = await Promise.all([
        fetch(`${API_URL}/jobs/${selectedJob.id}/metrics`).then(r => r.json()),
        fetch(`${API_URL}/jobs/${selectedJob.id}/funnel`).then(r => r.json()),
      ])
      setMetrics(m)
      setFunnelData(f)
      
      // Force a page refresh to show updated scores if on candidates view
      if (activeStep === 1) {
        // Trigger a custom event that CandidatesView can listen to
        window.dispatchEvent(new CustomEvent('candidatesRefresh'))
      }
    } catch (e) {
      console.error(e)
      setJdError("Re-score failed.")
    } finally {
      setJdLoading(false)
    }
  }

  const aiImproveJD = async () => {
    if (!selectedJob?.id) return
    setJdLoading(true)
    setJdError("")
    try {
      const res = await fetch(`${API_URL}/jd/improve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: selectedJob.id }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setJdText(data?.result?.improved_jd || jdText)
    } catch (e) {
      console.error(e)
      setJdError("AI improve failed.")
    } finally {
      setJdLoading(false)
    }
  }

  const aiRescore = async () => {
    if (!selectedJob?.id) return
    setJdLoading(true)
    setJdError("")
    try {
      const res = await fetch(`${API_URL}/jobs/${selectedJob.id}/rescore_llm`, { method: "POST" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      console.log("AI Rescore response:", data)
      
      // Wait a bit for processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const [m, f] = await Promise.all([
        fetch(`${API_URL}/jobs/${selectedJob.id}/metrics`).then(r => r.json()),
        fetch(`${API_URL}/jobs/${selectedJob.id}/funnel`).then(r => r.json()),
      ])
      setMetrics(m)
      setFunnelData(f)
      
      // Force a page refresh to show updated scores if on candidates view
      if (activeStep === 1) {
        // Trigger a custom event that CandidatesView can listen to
        window.dispatchEvent(new CustomEvent('candidatesRefresh'))
        // Also trigger after a delay
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('candidatesRefresh'))
        }, 3000)
      }
    } catch (e) {
      console.error(e)
      setJdError("AI rescore failed.")
    } finally {
      setJdLoading(false)
    }
  }

  return (
    <div className="min-h-screen text-foreground p-6 md:p-8 font-sans selection:bg-blue-500/30 app-shell">
      {/* Top Nav (Lovable-style) */}
      <header className="nav-glass rounded-2xl px-4 md:px-6 py-4 mb-10">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-400/40 via-fuchsia-500/30 to-indigo-500/30 border border-slate-700 flex items-center justify-center shadow-[0_0_36px_rgba(56,189,248,0.25)]">
              <Sparkles className="w-5 h-5 text-sky-100" />
            </div>
            <div>
              <div className="text-slate-100 font-semibold leading-tight tracking-tight">HirePilot</div>
              <div className="text-slate-400 text-sm">AI-first hiring OS</div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-end">
            <div className="hidden md:flex items-center gap-2 bg-slate-900/60 border border-sky-600/50 rounded-xl px-3 py-2 shadow-[0_10px_30px_rgba(59,130,246,0.18)]">
              <span className="text-[11px] uppercase tracking-wider text-slate-300">Job</span>
              <select
                value={selectedJob?.id || ""}
                onChange={(e) => {
                  const job = jobs.find(j => j.id === e.target.value)
                  setSelectedJob(job || null)
                }}
                className="bg-transparent border-none text-slate-100 text-sm focus:ring-0 focus:outline-none min-w-[260px]"
                disabled={apiStatus !== "ready" || jobs.length === 0}
              >
                {jobs.length === 0 ? (
                  <option value="">No jobs</option>
                ) : (
                  jobs.map(j => {
                    const created = j.created_at && j.created_at !== "Unknown" ? ` • ${j.created_at}` : ""
                    const count = (typeof j.count === "number" ? j.count : (typeof j.candidate_count === "number" ? j.candidate_count : 0))
                    const archived = j.archived ? " • Archived" : ""
                    return (
                      <option key={j.id} value={j.id}>
                        {j.title}{created} • {count} candidates{archived}
                      </option>
                    )
                  })
                )}
              </select>
            </div>

            <label className="hidden md:flex items-center gap-2 text-xs text-slate-100 select-none bg-slate-900/60 border border-fuchsia-500/50 rounded-xl px-3 py-2 shadow-[0_10px_28px_rgba(236,72,153,0.20)]">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
              />
              <span className="px-1">Show archived</span>
            </label>

            <Button
              variant="secondary"
              onClick={() => setManageOpen(true)}
              disabled={!selectedJob}
              className="shadow-[0_12px_30px_rgba(59,130,246,0.28)] border border-sky-500/40"
            >
              Manage
            </Button>
            <Button size="lg" onClick={() => setIsModalOpen(true)} className="shadow-[0_14px_34px_rgba(236,72,153,0.28)] border border-fuchsia-500/40">
              Create Requisition +
            </Button>
          </div>
        </div>
      </header>

      {/* Stepper */}
      <div className="mb-16">
        <div className="feature-card stepper-band max-w-5xl mx-auto">
          <div className="flex justify-between items-center relative">
            {/* Line */}
            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-800 -z-10" />

            {["Overview", "Candidates", "Screening", "Interviews", "Offer"].map((step, i) => (
              <button
                key={step}
                type="button"
                onClick={() => setActiveStep(i)}
                className="flex flex-col items-center gap-3 bg-transparent px-4 z-10 focus:outline-none py-4"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.08 }}
                  className={`w-11 h-11 rounded-full flex items-center justify-center border-2
                    ${i === activeStep ? "border-blue-500 bg-blue-500/15 text-blue-300 shadow-[0_0_20px_rgba(59,130,246,0.4)]" : "border-slate-700 bg-slate-900/80 text-slate-500"}
                    font-bold text-sm transition-all duration-300`}
                >
                  {i + 1}
                </motion.div>
                <span className={`text-xs font-semibold uppercase tracking-wider ${i === activeStep ? "text-blue-300" : "text-slate-500"}`}>{step}</span>
              </button>
            ))}
          </div>

          {/* Back/Next controls */}
          <div className="flex justify-between items-center mt-6 px-4 pb-2">
            <Button
              variant="secondary"
              onClick={() => setActiveStep(s => Math.max(0, s - 1))}
              disabled={activeStep === 0}
            >
              Back
            </Button>
            <Button
              onClick={() => setActiveStep(s => Math.min(4, s + 1))}
              disabled={activeStep === 4}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {activeStep === 0 && (
        <>
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="max-w-5xl mx-auto mb-10"
          >
            <div className="kicker-pill inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              AI-ASSISTED HIRING WORKFLOW
            </div>
            <h2 className="mt-5 text-4xl md:text-6xl font-extrabold tracking-tight text-slate-100">
              Run your hiring cockpit
              <span className="block bg-clip-text text-transparent bg-gradient-to-r from-sky-300 to-fuchsia-400">
                faster, clearer, end-to-end
              </span>
            </h2>
            <p className="mt-4 text-slate-300/90 text-lg max-w-2xl">
              Drop in a requisition, capture the JD, import resumes, auto-score, screen, schedule, and offer — all in one Midnight SaaS workspace designed to keep recruiters, interviewers, and candidates in sync.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button size="lg" onClick={() => setActiveStep(1)}>Go to Candidates</Button>
              <Button size="lg" variant="secondary" onClick={() => setIsModalOpen(true)}>Create Requisition</Button>
            </div>
          </motion.div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {[
              { label: "Total Candidates", value: metrics.total, icon: Users, color: "text-blue-400" },
              { label: "AI Screened", value: metrics.screened, icon: FileText, color: "text-purple-400" },
              { label: "Interviewing", value: metrics.interviewing, icon: Calendar, color: "text-amber-400" },
              { label: "Offers Sent", value: metrics.offers, icon: CheckCircle2, color: "text-emerald-400" }
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 + (i * 0.1) }}
                className="feature-card group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-lg bg-slate-900/50 group-hover:bg-slate-800 transition-colors ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <span className="text-3xl font-bold text-white tracking-tight group-hover:scale-105 transition-transform">{stat.value}</span>
                </div>
                <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider">{stat.label}</h3>
              </motion.div>
            ))}
          </div>

          {/* Funnel Section */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="feature-card"
          >
            <h3 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
              <div className="w-2 h-6 bg-blue-500 rounded-full" />
              Hiring Pipeline Analysis
            </h3>

            <div className="space-y-4">
              {funnelData.length === 0 ? (
                <p className="text-slate-500 italic">No candidate data available.</p>
              ) : (
                funnelData.map((stage, i) => (
                  <div key={stage.stage} className="relative group">
                    <div className="flex justify-between text-sm mb-1 font-medium">
                      <span className="text-slate-300">{stage.stage}</span>
                      <span className="text-slate-400">{stage.count} candidates</span>
                    </div>
                    <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(stage.count / maxCount) * 100}%` }}
                        transition={{ duration: 1, delay: i * 0.1 }}
                        className={`h-full rounded-full ${stage.stage.includes("Rejected") ? "bg-red-500/50" :
                          stage.stage.includes("Offer") ? "bg-emerald-500" :
                            "bg-blue-500"
                          }`}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Job Description */}
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.75 }}
            className="feature-card mt-8"
          >
            <h3 className="text-xl font-bold mb-3 text-white flex items-center gap-2">
              <div className="w-2 h-6 bg-fuchsia-500 rounded-full" />
              Job Description (JD)
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              Scores are computed against this JD when resumes are uploaded (and can be re-scored anytime).
            </p>
            {jdError && <p className="text-red-400 text-sm mb-3">{jdError}</p>}
            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste the job description here…"
              className="w-full min-h-[180px] bg-slate-950/40 border border-slate-700/80 rounded-xl px-3 py-3 text-slate-100 text-sm focus:ring-2 focus:ring-fuchsia-400 outline-none"
              disabled={!selectedJob || jdLoading}
            />
            <div className="flex flex-wrap gap-3 justify-end mt-4">
              <Button onClick={saveJD} disabled={!selectedJob || jdSaving} title="Save JD before scoring">
                {jdSaving ? "Saving…" : "Save JD"}
              </Button>
              <Button variant="secondary" onClick={rescore} disabled={!selectedJob} title="Keyword-based scoring from the JD">
                Score (JD keywords)
              </Button>
              <Button variant="secondary" onClick={aiRescore} disabled={!selectedJob || jdLoading} title="LLM scoring with rationale">
                AI Score (LLM)
              </Button>
              <Button variant="secondary" onClick={aiImproveJD} disabled={!selectedJob || jdLoading}>
                AI Improve JD
              </Button>
            </div>
          </motion.div>
        </>
      )}

      {activeStep === 1 && (
        <CandidatesView job={selectedJob} />
      )}

      {activeStep === 2 && (
        <ScreeningView job={selectedJob} />
      )}

      {activeStep === 3 && (
        <InterviewsView job={selectedJob} />
      )}

      {activeStep === 4 && (
        <OfferView job={selectedJob} />
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="feature-card w-full max-w-md bg-[#0f172a] border-slate-700 shadow-2xl relative"
          >
            <h2 className="text-xl font-bold mb-4 text-white">Create New Requisition</h2>
            <form onSubmit={handleCreateJob} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Job Description</label>
                <textarea
                  value={newJobJD}
                  onChange={(e) => setNewJobJD(e.target.value)}
                  placeholder="Paste JD here (used to evaluate resumes)..."
                  className="w-full min-h-[140px] bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Job Title</label>
                <input
                  autoFocus
                  type="text"
                  value={newJobTitle}
                  onChange={(e) => setNewJobTitle(e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={!newJobTitle.trim() || isCreating}>
                  {isCreating ? "Creating..." : "Create Requisition"}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Manage Job Modal */}
      {manageOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="feature-card w-full max-w-md bg-[#0f172a] border-slate-700 shadow-2xl relative"
          >
            <h2 className="text-xl font-bold mb-2 text-white">Manage requisition</h2>
            <p className="text-slate-400 text-sm mb-5">
              {selectedJob?.title ? <span className="text-slate-200 font-medium">{selectedJob.title}</span> : "—"}
            </p>

            <div className="space-y-3">
              {selectedJob?.archived ? (
                <Button className="w-full" onClick={restoreSelectedJob}>Restore</Button>
              ) : (
                <Button className="w-full" variant="secondary" onClick={archiveSelectedJob}>Archive</Button>
              )}

              <Button className="w-full" variant="destructive" onClick={deleteSelectedJob}>
                Delete permanently
              </Button>

              <Button className="w-full" variant="ghost" onClick={() => setManageOpen(false)}>
                Close
              </Button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  )
}

export default App