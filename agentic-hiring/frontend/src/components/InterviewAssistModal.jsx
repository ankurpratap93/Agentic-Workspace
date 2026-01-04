import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Video, Loader2, Send, AlertCircle, CheckCircle2, Lightbulb } from "lucide-react"
import { Button } from "./ui/button"

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"

export default function InterviewAssistModal({ isOpen, onClose, jobId, candidateName }) {
    const [interviewType, setInterviewType] = useState("technical")
    const [platform, setPlatform] = useState("teams")
    const [meetingLink, setMeetingLink] = useState("")
    const [sessionId, setSessionId] = useState(null)
    const [session, setSession] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    // Real-time transcript
    const [transcriptInput, setTranscriptInput] = useState("")
    const [speaker, setSpeaker] = useState("candidate")
    const [insights, setInsights] = useState(null)
    const [processingTranscript, setProcessingTranscript] = useState(false)

    const handleJoinInterview = async () => {
        setLoading(true)
        setError("")

        try {
            const res = await fetch(`${API_BASE}/interview/join`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    job_id: jobId,
                    candidate_name: candidateName,
                    interview_type: interviewType,
                    meeting_platform: platform,
                    meeting_link: meetingLink || null
                })
            })

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}))
                throw new Error(errorData.detail || `HTTP ${res.status}`)
            }

            const data = await res.json()
            setSessionId(data.session_id)
            setSession(data)
        } catch (e) {
            setError(e.message || "Failed to join interview")
        } finally {
            setLoading(false)
        }
    }

    const handleProcessTranscript = async () => {
        if (!transcriptInput.trim() || !sessionId) return

        setProcessingTranscript(true)
        try {
            const res = await fetch(`${API_BASE}/interview/transcript`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    session_id: sessionId,
                    transcript_chunk: transcriptInput,
                    speaker: speaker
                })
            })

            if (!res.ok) throw new Error(`HTTP ${res.status}`)

            const data = await res.json()
            setInsights(data.insights)
            setTranscriptInput("")
        } catch (e) {
            console.error("Failed to process transcript:", e)
        } finally {
            setProcessingTranscript(false)
        }
    }

    const handleEndInterview = async () => {
        if (!sessionId) return

        setLoading(true)
        try {
            const res = await fetch(`${API_BASE}/interview/end?session_id=${sessionId}`, {
                method: "POST"
            })

            if (!res.ok) throw new Error(`HTTP ${res.status}`)

            const data = await res.json()
            alert(`Interview ended. Overall score: ${data.summary?.overall_score || "N/A"}/10`)
            handleClose()
        } catch (e) {
            setError(e.message || "Failed to end interview")
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        setInterviewType("technical")
        setPlatform("teams")
        setMeetingLink("")
        setSessionId(null)
        setSession(null)
        setTranscriptInput("")
        setInsights(null)
        setError("")
        onClose()
    }

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-xl shadow-2xl"
                >
                    {/* Header */}
                    <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/30">
                                <Video className="w-5 h-5 text-purple-300" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">AI Interview Assistant</h2>
                                <p className="text-sm text-slate-400">
                                    {sessionId ? `Session active - ${candidateName}` : `Setup interview with ${candidateName}`}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {!sessionId ? (
                            <>
                                {/* Setup Form */}
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Interview Type */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Interview Type
                                        </label>
                                        <select
                                            value={interviewType}
                                            onChange={(e) => setInterviewType(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                                            disabled={loading}
                                        >
                                            <option value="technical">Technical Interview</option>
                                            <option value="behavioral">Behavioral Interview</option>
                                            <option value="cultural">Cultural Fit</option>
                                            <option value="managerial">Managerial Round</option>
                                        </select>
                                    </div>

                                    {/* Platform */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Meeting Platform
                                        </label>
                                        <select
                                            value={platform}
                                            onChange={(e) => setPlatform(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                                            disabled={loading}
                                        >
                                            <option value="teams">Microsoft Teams</option>
                                            <option value="google_meet">Google Meet</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Meeting Link (Optional) */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Meeting Link (Optional)
                                    </label>
                                    <input
                                        type="url"
                                        value={meetingLink}
                                        onChange={(e) => setMeetingLink(e.target.value)}
                                        placeholder="https://teams.microsoft.com/l/meetup-join/..."
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                                        disabled={loading}
                                    />
                                    <p className="text-xs text-slate-500 mt-1">
                                        Leave empty to generate a new meeting link
                                    </p>
                                </div>

                                {/* Error Message */}
                                {error && (
                                    <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200 text-sm">
                                        {error}
                                    </div>
                                )}

                                {/* Join Button */}
                                <Button
                                    onClick={handleJoinInterview}
                                    disabled={loading}
                                    className="w-full gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                                    size="lg"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Joining...
                                        </>
                                    ) : (
                                        <>
                                            <Video className="w-5 h-5" />
                                            Join Interview
                                        </>
                                    )}
                                </Button>

                                {/* Info Box */}
                                <div className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm text-slate-300">
                                    <p className="font-medium text-slate-200 mb-1">AI Assistant Features:</p>
                                    <ul className="space-y-1 text-slate-400">
                                        <li>• Real-time question suggestions based on candidate responses</li>
                                        <li>• Automatic red flag detection</li>
                                        <li>• Live response quality assessment</li>
                                        <li>• Post-interview evaluation and scoring</li>
                                    </ul>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Active Interview Session */}
                                <div className="grid grid-cols-3 gap-4">
                                    {/* Briefing Panel */}
                                    <div className="col-span-2 space-y-4">
                                        {/* Session Info */}
                                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                                                <h3 className="font-medium text-emerald-200">Session Active</h3>
                                            </div>
                                            {session?.meeting_link && (
                                                <a
                                                    href={session.meeting_link}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-sm text-emerald-300 hover:text-emerald-200 underline"
                                                >
                                                    Open Meeting Link →
                                                </a>
                                            )}
                                        </div>

                                        {/* Briefing */}
                                        {session?.briefing && (
                                            <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg">
                                                <h3 className="text-sm font-medium text-slate-300 mb-3">Interview Briefing</h3>
                                                <div className="space-y-2 text-sm">
                                                    {session.briefing.candidate_summary && (
                                                        <p className="text-slate-400">{session.briefing.candidate_summary}</p>
                                                    )}
                                                    {session.briefing.recommended_questions && (
                                                        <div>
                                                            <p className="text-slate-300 font-medium mb-1">Recommended Questions:</p>
                                                            <ul className="space-y-1">
                                                                {session.briefing.recommended_questions.slice(0, 3).map((q, idx) => (
                                                                    <li key={idx} className="text-slate-400 text-xs flex items-start gap-2">
                                                                        <span className="text-purple-400">•</span>
                                                                        <span>{q}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Transcript Input */}
                                        <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg">
                                            <h3 className="text-sm font-medium text-slate-300 mb-3">Real-time Transcript</h3>
                                            <div className="space-y-3">
                                                <div className="flex gap-2">
                                                    <select
                                                        value={speaker}
                                                        onChange={(e) => setSpeaker(e.target.value)}
                                                        className="bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200"
                                                    >
                                                        <option value="candidate">Candidate</option>
                                                        <option value="interviewer">Interviewer</option>
                                                    </select>
                                                </div>
                                                <textarea
                                                    value={transcriptInput}
                                                    onChange={(e) => setTranscriptInput(e.target.value)}
                                                    placeholder="Enter what was just said..."
                                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 text-sm min-h-[80px] focus:ring-2 focus:ring-purple-500 outline-none"
                                                    disabled={processingTranscript}
                                                />
                                                <Button
                                                    onClick={handleProcessTranscript}
                                                    disabled={!transcriptInput.trim() || processingTranscript}
                                                    size="sm"
                                                    className="gap-2"
                                                >
                                                    {processingTranscript ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            Processing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Send className="w-4 h-4" />
                                                            Process
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* AI Insights Panel */}
                                    <div className="space-y-4">
                                        <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Lightbulb className="w-4 h-4 text-amber-400" />
                                                <h3 className="text-sm font-medium text-slate-300">AI Insights</h3>
                                            </div>

                                            {insights ? (
                                                <div className="space-y-3 text-xs">
                                                    {/* Response Quality */}
                                                    {insights.response_quality && (
                                                        <div>
                                                            <p className="text-slate-400 mb-1">Response Quality:</p>
                                                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${insights.response_quality === 'excellent' ? 'bg-emerald-500/20 text-emerald-300' :
                                                                    insights.response_quality === 'good' ? 'bg-blue-500/20 text-blue-300' :
                                                                        insights.response_quality === 'fair' ? 'bg-amber-500/20 text-amber-300' :
                                                                            'bg-red-500/20 text-red-300'
                                                                }`}>
                                                                {insights.response_quality}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* Suggested Follow-up */}
                                                    {insights.suggested_followup && (
                                                        <div>
                                                            <p className="text-slate-400 mb-1">Suggested Follow-up:</p>
                                                            <p className="text-slate-300 bg-slate-900 p-2 rounded">{insights.suggested_followup}</p>
                                                        </div>
                                                    )}

                                                    {/* Red Flags */}
                                                    {insights.red_flags && insights.red_flags.length > 0 && (
                                                        <div>
                                                            <div className="flex items-center gap-1 mb-1">
                                                                <AlertCircle className="w-3 h-3 text-red-400" />
                                                                <p className="text-red-300 font-medium">Red Flags:</p>
                                                            </div>
                                                            <ul className="space-y-1">
                                                                {insights.red_flags.map((flag, idx) => (
                                                                    <li key={idx} className="text-red-300 text-xs">• {flag}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}

                                                    {/* Confidence Score */}
                                                    {insights.confidence_score !== undefined && (
                                                        <div>
                                                            <p className="text-slate-400 mb-1">Confidence:</p>
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex-1 bg-slate-900 rounded-full h-2">
                                                                    <div
                                                                        className="bg-purple-500 h-2 rounded-full transition-all"
                                                                        style={{ width: `${(insights.confidence_score / 10) * 100}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-slate-300 font-medium">{insights.confidence_score}/10</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-slate-500 text-xs">Process transcript to see AI insights</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    <Button
                                        onClick={handleEndInterview}
                                        disabled={loading}
                                        className="flex-1 bg-red-600 hover:bg-red-700"
                                    >
                                        {loading ? "Ending..." : "End Interview"}
                                    </Button>
                                    <Button
                                        onClick={handleClose}
                                        variant="secondary"
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
