import { useState } from "react"
import { Button } from "./ui/button"

export default function RejectionModal({ candidateName, isOpen, onClose, onConfirm }) {
    const [feedback, setFeedback] = useState("")

    if (!isOpen) return null

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={(e) => {
                // Optional: Close on backdrop click (if desired), currently disabled for stability
                e.stopPropagation()
            }}
        >
            <div
                className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-xl font-bold text-white mb-2">Reject Candidate</h3>
                <p className="text-sm text-slate-400 mb-4">
                    Please provide a reason for rejecting <span className="text-purple-300 font-semibold">{candidateName}</span>.
                </p>
                <textarea
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-purple-500 outline-none mb-4 min-h-[100px]"
                    placeholder="Enter feedback/reason (Required)..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    autoFocus
                />
                <div className="flex justify-end gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => {
                            setFeedback("")
                            onClose()
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        className="bg-red-600 hover:bg-red-700 text-white font-medium"
                        disabled={!feedback.trim()}
                        onClick={() => {
                            onConfirm(feedback)
                            setFeedback("")
                        }}
                    >
                        Confirm Rejection
                    </Button>
                </div>
            </div>
        </div>
    )
}
