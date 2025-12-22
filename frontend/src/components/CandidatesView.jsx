import { useEffect, useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"
import { FileText, ArrowUpDown, RefreshCcw, Upload, Sparkles } from "lucide-react"
import { Button } from "./ui/button"

const API_BASE = "http://127.0.0.1:8000"

function statusBadgeClass(status) {
  const s = String(status || "").toLowerCase()
  if (s.includes("reject")) return "bg-red-500/10 text-red-300 border-red-500/30"
  if (s.includes("offer")) return "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
  if (s.includes("interview")) return "bg-amber-500/10 text-amber-200 border-amber-500/30"
  if (s.includes("shortlist")) return "bg-blue-500/10 text-blue-300 border-blue-500/30"
  if (s.includes("screen")) return "bg-purple-500/10 text-purple-200 border-purple-500/30"
  return "bg-slate-500/10 text-slate-200 border-slate-500/30"
}

function scorePill(score) {
  const n = Number(score)
  if (!Number.isFinite(n)) return { label: "—", cls: "bg-slate-800 text-slate-200 border-slate-700" }
  if (n >= 8) return { label: n.toFixed(1), cls: "bg-emerald-500/10 text-emerald-200 border-emerald-500/30" }
  if (n >= 6) return { label: n.toFixed(1), cls: "bg-blue-500/10 text-blue-200 border-blue-500/30" }
  if (n >= 4) return { label: n.toFixed(1), cls: "bg-amber-500/10 text-amber-100 border-amber-500/30" }
  return { label: n.toFixed(1), cls: "bg-red-500/10 text-red-200 border-red-500/30" }
}

export default function CandidatesView({ job }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState({ key: "score", dir: "desc" })
  const [acting, setActing] = useState({}) // name -> boolean
  const [uploading, setUploading] = useState(false)
  const [lastUploadedNames, setLastUploadedNames] = useState([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiNotice, setAiNotice] = useState("")

  const fetchCandidates = async (opts = {}) => {
    const { silent = false } = opts
    if (!job?.id) return
    if (!silent) setLoading(true)
    setError("")
    try {
      const res = await fetch(`${API_BASE}/jobs/${job.id}/candidates`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setRows(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
      setError("Couldn’t load candidates. Check the backend console for errors.")
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    fetchCandidates()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.id])

  // Lightweight auto-refresh so new uploads/edits appear without manual click
  useEffect(() => {
    if (!job?.id) return
    const id = setInterval(() => {
      fetchCandidates({ silent: true })
    }, 8000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.id])

  const sorted = useMemo(() => {
    const key = sort.key
    const dir = sort.dir === "asc" ? 1 : -1
    const q = query.trim().toLowerCase()
    const filtered = q
      ? rows.filter((r) => String(r?.name ?? "").toLowerCase().includes(q) || String(r?.status ?? "").toLowerCase().includes(q))
      : rows

    const copy = [...filtered]
    copy.sort((a, b) => {
      const av = a?.[key]
      const bv = b?.[key]
      const an = Number(av)
      const bn = Number(bv)
      if (Number.isFinite(an) && Number.isFinite(bn)) return (an - bn) * dir
      return String(av ?? "").localeCompare(String(bv ?? "")) * dir
    })
    return copy
  }, [rows, sort, query])

  const toggleSort = (key) => {
    setSort((s) => {
      if (s.key !== key) return { key, dir: "asc" }
      return { key, dir: s.dir === "asc" ? "desc" : "asc" }
    })
  }

  const doAction = async (candidateName, action) => {
    if (!job?.id || !candidateName) return
    setActing((m) => ({ ...m, [candidateName]: true }))
    try {
      const res = await fetch(`${API_BASE}/candidates/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: job.id, candidate_name: candidateName, action }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const newStatus = data?.new_candidate_status
      if (newStatus) {
        setRows((prev) =>
          prev.map((r) => (r?.name === candidateName ? { ...r, status: newStatus } : r)),
        )
      }
    } catch (e) {
      console.error(e)
      setError("Action failed. Please retry.")
    } finally {
      setActing((m) => ({ ...m, [candidateName]: false }))
    }
  }

  const uploadResumes = async (fileList) => {
    if (!job?.id) return
    const files = Array.from(fileList || [])
    if (files.length === 0) return

    setUploading(true)
    setError("")
    setLastUploadedNames(files.map((f) => f.name))
    try {
      const fd = new FormData()
      for (const f of files) fd.append("files", f)

      const res = await fetch(`${API_BASE}/jobs/${job.id}/resumes`, {
        method: "POST",
        body: fd,
      })
      if (!res.ok) {
        let detail = ""
        try {
          const j = await res.json()
          detail = j?.detail ? ` (${j.detail})` : ""
        } catch {
          // ignore
        }
        throw new Error(`Upload failed: HTTP ${res.status}${detail}`)
      }
      // Auto re-score immediately after upload so the user sees scores without extra clicks
      await rescoreJob(true)
      await fetchCandidates()
    } catch (e) {
      console.error(e)
      setError(e?.message || "Upload failed. Please retry.")
    } finally {
      setUploading(false)
    }
  }

  const rescoreJob = async (silent = false) => {
    if (!job?.id) return
    if (!silent) {
      setUploading(true)
      setError("")
    }
    try {
      const res = await fetch(`${API_BASE}/jobs/${job.id}/rescore`, { method: "POST" })
      if (!res.ok) {
        let detail = ""
        try {
          const j = await res.json()
          detail = j?.detail ? ` (${j.detail})` : ""
        } catch {/**/}
        throw new Error(`HTTP ${res.status}${detail}`)
      }
      await fetchCandidates()
    } catch (e) {
      console.error(e)
      if (!silent) setError("Re-score failed. Ensure JD is saved and logs are valid.")
    } finally {
      if (!silent) setUploading(false)
    }
  }

  const aiRescore = async () => {
    if (!job?.id) return
    setAiLoading(true)
    setAiNotice("AI scoring in progress… large batches (100+ resumes) can take up to a minute. We will refresh automatically when done.")
    setError("")
    try {
      const res = await fetch(`${API_BASE}/jobs/${job.id}/rescore_llm`, { method: "POST" })
      if (!res.ok) throw new Error(`AI rescore failed: HTTP ${res.status}`)
      await fetchCandidates()
    } catch (e) {
      console.error("AI Rescore error:", e)
      setError(e?.message || "AI rescore failed.")
    } finally {
      setAiLoading(false)
      setAiNotice("")
    }
  }

  return (
    <motion.div
      initial={{ y: 14, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="feature-card"
    >
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold text-white">Candidates</h3>
          <p className="text-slate-400 text-sm">
            {job?.title ? (
              <>
                For <span className="text-slate-200 font-medium">{job.title}</span>
              </>
            ) : (
              "Select a job to view candidates."
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* SEARCH INPUT */}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or status…"
            className="hidden md:block bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-[240px]"
            disabled={!job?.id || loading || uploading}
          />
          
          {/* UPLOAD: Modern Icon Button (Native Label) */}
          <label 
            title="Upload Resumes"
            className={`
              flex items-center justify-center w-9 h-9 rounded-md border border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer
              ${(!job?.id || uploading) ? 'opacity-50 pointer-events-none' : ''}
            `}
          >
            <Upload className="w-4 h-4" />
            <input 
              type="file" 
              accept=".pdf,.doc,.docx,.txt" 
              multiple 
              className="sr-only"
              onChange={(e) => {
                if (e.target.files?.length) uploadResumes(e.target.files);
                e.target.value = "";
              }}
              disabled={!job?.id || uploading}
            />
          </label>

          {/* REFRESH BUTTON */}
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchCandidates}
            disabled={!job?.id || loading || uploading}
            className="gap-2"
          >
            <RefreshCcw className="w-4 h-4" />
            Refresh
          </Button>

          {/* Baseline score */}
          <Button
            variant="secondary"
            size="sm"
            onClick={rescoreJob}
            disabled={!job?.id || uploading}
            className="gap-2"
            title="Keyword-based scoring from saved JD"
          >
            Score (JD)
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={aiRescore}
            disabled={!job?.id || uploading || aiLoading}
            className="gap-2"
            title="LLM scoring with rationale"
          >
            <Sparkles className="w-4 h-4" />
            {aiLoading ? "AI scoring…" : "AI Score (LLM)"}
          </Button>
        </div>
      </div>

      <div className="mb-4 text-[13px] text-slate-400 flex flex-wrap gap-3">
        <span className="px-2 py-1 rounded-full bg-slate-900/60 border border-slate-800">Score (JD): fast keyword points from your JD.</span>
        <span className="px-2 py-1 rounded-full bg-slate-900/60 border border-slate-800">AI Score (LLM): deeper scoring + rationale.</span>
        {aiLoading && (
          <span className="flex items-center gap-2 px-2 py-1 rounded-full bg-sky-900/50 border border-sky-700 text-sky-100">
            <RefreshCcw className="w-4 h-4 animate-spin" />
            {aiNotice || "AI scoring in progress… please wait."}
          </span>
        )}
      </div>

      {lastUploadedNames.length > 0 && (
        <div className="mb-4 rounded-lg border border-slate-700/60 bg-slate-950/30 px-4 py-3 text-slate-200 text-sm">
          <span className="text-slate-400 mr-2">Selected:</span>
          {lastUploadedNames.slice(0, 3).join(", ")}
          {lastUploadedNames.length > 3 ? ` (+${lastUploadedNames.length - 3} more)` : ""}
          {uploading ? <span className="text-sky-300 ml-2">Uploading…</span> : null}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200 text-sm">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-800">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-950/60">
              <tr className="text-xs uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3">
                  <button
                    className="inline-flex items-center gap-2 hover:text-slate-200 transition-colors"
                    onClick={() => toggleSort("name")}
                    type="button"
                  >
                    Name <ArrowUpDown className="w-4 h-4 opacity-70" />
                  </button>
                </th>
                <th className="px-4 py-3">
                  <button
                    className="inline-flex items-center gap-2 hover:text-slate-200 transition-colors"
                    onClick={() => toggleSort("score")}
                    type="button"
                  >
                    Score <ArrowUpDown className="w-4 h-4 opacity-70" />
                  </button>
                </th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Resume</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800 bg-slate-950/20">
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-slate-400" colSpan={5}>
                    Loading candidates…
                  </td>
                </tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500 italic" colSpan={5}>
                    No candidates found for this job.
                  </td>
                </tr>
              ) : (
                sorted.map((c) => {
                  const name = String(c?.name ?? "")
                  const primaryScore = c?.screening_score ?? c?.score
                  const pill = scorePill(primaryScore)
                  const mk = c?.matching_keywords
                  const mkDisplay = mk && String(mk).trim().length > 0 ? String(mk) : "No JD matches captured yet"
                  const resumeUrl = c?.resume_url ? `${API_BASE}${c.resume_url}` : null
                  const isBusy = Boolean(acting[name])

                  return (
                    <tr key={String(c?.id ?? name)} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-4 py-4 text-slate-100 font-medium">{name || "—"}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${pill.cls}`}
                          title={`JD matches: ${mkDisplay}`}
                        >
                          {pill.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(
                            c?.status,
                          )}`}
                        >
                          {c?.status || "New"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {resumeUrl ? (
                          <a
                            href={resumeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-blue-300 hover:text-blue-200 font-medium text-sm"
                          >
                            <FileText className="w-4 h-4" />
                            View
                          </a>
                        ) : (
                          <span className="text-slate-500 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={isBusy || !name}
                            onClick={() => doAction(name, "shortlist")}
                          >
                            Shortlist
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={isBusy || !name}
                            onClick={() => doAction(name, "reject")}
                          >
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  )
}
