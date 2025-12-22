import { useState, useEffect } from "react"
import { CheckCircle2, DollarSign, Send, Sparkles, Loader2 } from "lucide-react"
import { Button } from "./ui/button"

const API_BASE = "http://127.0.0.1:8000"

export default function OfferView({ job }) {
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(false)
  const [offering, setOffering] = useState(null)
  const [salary, setSalary] = useState("")
  const [aiDraft, setAiDraft] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [agentError, setAgentError] = useState("")

  const fetchCandidates = async () => {
    if (!job?.id) return
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/jobs/${job.id}/candidates`)
      const data = await res.json()
      // Filter for Offer candidates
      const relevant = data.filter(c => 
        ["Interview Scheduled", "Offer Pending", "Offer Accepted", "Rejected"].includes(c.status)
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

  const handleGenerateOffer = async (e) => {
    e.preventDefault()
    if (!offering) return

    try {
      await fetch(`${API_BASE}/jobs/${job.id}/offer/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidate_name: offering, salary: parseInt(salary) })
      })
      setOffering(null)
      setSalary("")
      fetchCandidates()
    } catch (e) {
      console.error(e)
    }
  }

  const handleApprove = async (candidateName) => {
    try {
      await fetch(`${API_BASE}/jobs/${job.id}/offer/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidate_name: candidateName })
      })
      fetchCandidates()
    } catch (e) {
      console.error(e)
    }
  }

  const handleOfferAssist = async () => {
    if (!job?.id || !offering) return
    setAiLoading(true)
    setAgentError("")
    try {
      const res = await fetch(`${API_BASE}/offer/assist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: job.id, candidate_name: offering, salary: salary ? parseInt(salary) : null })
      })
      if (!res.ok) throw new Error(`AI offer failed: ${res.status}`)
      const data = await res.json()
      setAiDraft(data?.offer || null)
    } catch (e) {
      console.error(e)
      setAiDraft({ summary: "AI draft failed. Try again." })
      setAgentError("AI offer draft failed. Check JD + salary, then retry.")
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="feature-card">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          Final Selection
        </h3>
        
        {loading ? <p>Loading...</p> : (
          <div className="space-y-4">
            {candidates.map(c => (
              <div key={c.name} className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-slate-200">{c.name}</h4>
                  <p className="text-xs text-slate-500 uppercase">{c.status}</p>
                </div>
                <div>
                  {c.status === "Offer Pending" ? (
                    <Button size="sm" onClick={() => handleApprove(c.name)} className="bg-emerald-600 hover:bg-emerald-700">
                      Approve Offer
                    </Button>
                  ) : c.status === "Offer Accepted" ? (
                    <span className="text-emerald-400 font-bold text-sm">Hired 🎉</span>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => setOffering(c.name)}>
                      Generate Offer
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {candidates.length === 0 && <p className="text-slate-500">No candidates in final stages.</p>}
          </div>
        )}
      </div>

      <div className="feature-card">
        <h3 className="text-xl font-bold text-white mb-6">Offer Details</h3>
        {offering ? (
          <form onSubmit={handleGenerateOffer} className="space-y-6">
            <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-500/30">
              <p className="text-blue-200 text-sm">Generating offer for <strong>{offering}</strong></p>
            </div>
            
            <div>
              <label className="block text-sm text-slate-400 mb-2">Annual Compensation</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="number" 
                  value={salary}
                  onChange={e => setSalary(e.target.value)}
                  placeholder="120000"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  autoFocus
                />
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-300" /> AI Offer Draft
                </div>
                <Button type="button" size="sm" variant="secondary" onClick={handleOfferAssist} disabled={aiLoading}>
                  {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Draft"}
                </Button>
              </div>
              {agentError && <div className="text-xs text-red-300">{agentError}</div>}
              {aiDraft ? (
                <div className="text-sm text-slate-200 space-y-1">
                  {aiDraft.summary && <p>{aiDraft.summary}</p>}
                  {aiDraft.salary_recommendation && <p className="text-emerald-300 text-xs">Salary: {aiDraft.salary_recommendation}</p>}
                  {aiDraft.risks && aiDraft.risks.length > 0 && (
                    <p className="text-amber-200 text-xs">Risks: {aiDraft.risks.join(", ")}</p>
                  )}
                  {aiDraft.negotiation_points && aiDraft.negotiation_points.length > 0 && (
                    <p className="text-slate-300 text-xs">Negotiation: {aiDraft.negotiation_points.join(" · ")}</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500">Get an AI draft for this candidate’s offer.</p>
              )}
            </div>

            <div className="flex gap-3">
              <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                <Send className="w-4 h-4 mr-2" /> Send Offer
              </Button>
              <Button type="button" variant="ghost" onClick={() => setOffering(null)}>Cancel</Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col items-center justify-center h-[200px] text-slate-500">
            <DollarSign className="w-12 h-12 mb-4 opacity-20" />
            <p>Select a candidate to prepare offer</p>
          </div>
        )}
      </div>
    </div>
  )
}
