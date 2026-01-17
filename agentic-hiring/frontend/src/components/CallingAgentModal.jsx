import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Phone, PhoneCall, Loader2, FileText } from "lucide-react"
import { Button } from "./ui/button"

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"

export default function CallingAgentModal({ isOpen, onClose, jobId, candidateName, initialPhoneNumber, onCallComplete }) {
    const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber || "")
    const [extracting, setExtracting] = useState(false)
    const [extractedSource, setExtractedSource] = useState(initialPhoneNumber ? "prop" : null)
    const [callType, setCallType] = useState("screening")
    const [calling, setCalling] = useState(false)
    const [callResult, setCallResult] = useState(null)
    const [error, setError] = useState("")

    // Auto-extract if empty when opening
    useEffect(() => {
        if (isOpen && !phoneNumber && candidateName && jobId) {
            handleExtract(true)
        } else if (isOpen && initialPhoneNumber) {
            setPhoneNumber(initialPhoneNumber)
            setExtractedSource("prop")
        }
    }, [isOpen, candidateName, jobId, initialPhoneNumber])

    const handleExtract = async (silent = false) => {
        if (!jobId || !candidateName) return
        if (!silent) setExtracting(true)
        setError("")
        try {
            const res = await fetch(`${API_BASE}/jobs/${jobId}/candidates/${candidateName}/contact`)
            if (!res.ok) throw new Error("Extraction failed")
            const data = await res.json()
            if (data.phone) {
                setPhoneNumber(data.phone)
                setExtractedSource("extracted")
            } else if (!silent) {
                setError("No phone number found in resume.")
            }
        } catch (e) {
            console.error("Extraction error", e)
            if (!silent) setError("Failed to extract contact details.")
        } finally {
            if (!silent) setExtracting(false)
        }
    }

    const handleCall = async () => {
        if (!phoneNumber.trim()) {
            setError("Please enter a phone number")
            return
        }

        setCalling(true)
        setError("")
        setCallResult(null)

        try {
            const res = await fetch(`${API_BASE}/call`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    job_id: jobId,
                    candidate_name: candidateName,
                    phone_number: phoneNumber,
                    call_type: callType
                })
            })

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}))
                throw new Error(errorData.detail || `HTTP ${res.status}`)
            }

            const data = await res.json()
            setCallResult(data)
            if (onCallComplete) {
                onCallComplete({
                    candidateName,
                    transcript: data.transcript,
                    assessment: data.assessment,
                    score: data.score
                })
            }
        } catch (e) {
            setError(e.message || "Call failed. Please try again.")
        } finally {
            setCalling(false)
        }
    }

    const handleClose = () => {
        setPhoneNumber("")
        setCallType("screening")
        setCallResult(null)
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
                    className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-xl shadow-2xl"
                >
                    {/* Header */}
                    <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/30">
                                <Phone className="w-5 h-5 text-blue-300" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">AI Calling Agent</h2>
                                <p className="text-sm text-slate-400">Call {candidateName}</p>
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
                        {!callResult ? (
                            <>
                                {/* Phone Number Input */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Phone Number
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="tel"
                                            value={phoneNumber}
                                            onChange={(e) => {
                                                setPhoneNumber(e.target.value)
                                                setExtractedSource("manual")
                                            }}
                                            placeholder="+1 (555) 123-4567"
                                            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                            disabled={calling || extracting}
                                        />
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => handleExtract(false)}
                                            disabled={calling || extracting || !candidateName}
                                            type="button"
                                            title="Re-extract from Resume"
                                            className="h-[46px] px-3"
                                        >
                                            {extracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                    {extractedSource === "prop" && (
                                        <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                                            ✓ Pre-filled from contact record
                                        </p>
                                    )}
                                    {extractedSource === "extracted" && (
                                        <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                                            ✓ Auto-extracted from resume
                                        </p>
                                    )}
                                    {extractedSource === "manual" && phoneNumber && (
                                        <p className="text-xs text-slate-500 mt-1">
                                            Hand-entered or edited
                                        </p>
                                    )}
                                    {!phoneNumber && !extracting && (
                                        <p className="text-xs text-amber-400 mt-1">
                                            ⚠ No phone number found. Please enter manually.
                                        </p>
                                    )}
                                </div>

                                {/* Call Type Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Call Type
                                    </label>
                                    <select
                                        value={callType}
                                        onChange={(e) => setCallType(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        disabled={calling}
                                    >
                                        <option value="screening">Screening Call</option>
                                        <option value="followup">Follow-up Call</option>
                                        <option value="verification">Verification Call</option>
                                    </select>
                                </div>

                                {/* Error Message */}
                                {error && (
                                    <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200 text-sm">
                                        {error}
                                    </div>
                                )}

                                {/* Call Button */}
                                <Button
                                    onClick={handleCall}
                                    disabled={calling || extracting || !phoneNumber.trim()}
                                    className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                                    size="lg"
                                >
                                    {calling ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Calling...
                                        </>
                                    ) : (
                                        <>
                                            <PhoneCall className="w-5 h-5" />
                                            Start Call
                                        </>
                                    )}
                                </Button>

                                {/* Info Box */}
                                <div className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm text-slate-300">
                                    <p className="font-medium text-slate-200 mb-1">How it works:</p>
                                    <ul className="space-y-1 text-slate-400">
                                        <li>• AI agent will call the candidate at the provided number</li>
                                        <li>• Conducts screening questions based on job requirements</li>
                                        <li>• Transcript and score are automatically saved</li>
                                        <li>• Works in simulation mode without Twilio credentials</li>
                                    </ul>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Call Result */}
                                <div className="space-y-4">
                                    {/* Status */}
                                    <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                                        <PhoneCall className="w-6 h-6 text-emerald-300" />
                                        <div>
                                            <p className="font-medium text-emerald-200">Call {callResult.status}</p>
                                            <p className="text-sm text-emerald-300/70">{callResult.message}</p>
                                        </div>
                                    </div>

                                    {/* Call Details */}
                                    {callResult.call_id && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                                                <p className="text-xs text-slate-400 mb-1">Call ID</p>
                                                <p className="text-sm font-mono text-slate-200">{callResult.call_id}</p>
                                            </div>
                                            {callResult.duration_seconds && (
                                                <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                                                    <p className="text-xs text-slate-400 mb-1">Duration</p>
                                                    <p className="text-sm text-slate-200">{Math.floor(callResult.duration_seconds / 60)}m {callResult.duration_seconds % 60}s</p>
                                                </div>
                                            )}
                                            {callResult.score && (
                                                <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                                                    <p className="text-xs text-slate-400 mb-1">Screening Score</p>
                                                    <p className="text-lg font-bold text-blue-300">{callResult.score}/10</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Transcript */}
                                    {callResult.transcript && (
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <FileText className="w-4 h-4 text-slate-400" />
                                                <h3 className="text-sm font-medium text-slate-300">Transcript</h3>
                                            </div>
                                            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 max-h-64 overflow-y-auto">
                                                <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono">
                                                    {callResult.transcript}
                                                </pre>
                                            </div>
                                        </div>
                                    )}

                                    {/* Assessment */}
                                    {callResult.assessment && (
                                        <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg">
                                            <h3 className="text-sm font-medium text-slate-300 mb-2">Assessment</h3>
                                            <p className="text-sm text-slate-400">{callResult.assessment}</p>
                                        </div>
                                    )}

                                    {/* Key Findings */}
                                    {callResult.key_findings && callResult.key_findings.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-medium text-slate-300 mb-2">Key Findings</h3>
                                            <ul className="space-y-1">
                                                {callResult.key_findings.map((finding, idx) => (
                                                    <li key={idx} className="text-sm text-slate-400 flex items-start gap-2">
                                                        <span className="text-blue-400 mt-1">•</span>
                                                        <span>{finding}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Close Button */}
                                    <Button
                                        onClick={handleClose}
                                        className="w-full"
                                        variant="secondary"
                                    >
                                        Close
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
