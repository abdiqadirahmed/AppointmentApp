import { useEffect, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { getCaptcha, verifyCaptcha } from '../api/client'

interface Props {
  onVerified: () => void
}

export default function Captcha({ onVerified }: Props) {
  const [question, setQuestion] = useState('')
  const [token, setToken] = useState('')
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [verified, setVerified] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const loadCaptcha = async () => {
    setAnswer('')
    setError('')
    const { data } = await getCaptcha()
    setQuestion(data.question)
    setToken(data.token)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  useEffect(() => { loadCaptcha() }, [])

  const handleVerify = async () => {
    if (!answer.trim()) { setError('Please enter the answer'); return }
    setLoading(true)
    setError('')
    try {
      await verifyCaptcha(token, answer.trim())
      setVerified(true)
      onVerified()
    } catch {
      setError('Incorrect answer. Please try again.')
      loadCaptcha()
    } finally {
      setLoading(false)
    }
  }

  if (verified) {
    return (
      <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span className="text-sm font-semibold">Verification complete</span>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-700">Security Check</p>
        <button type="button" onClick={loadCaptcha}
          className="text-brand-700 hover:text-brand-900 transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 text-center">
        <span className="font-display font-bold text-2xl tracking-widest text-brand-700 select-none">
          {question}
        </span>
      </div>

      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="number"
          placeholder="Your answer"
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleVerify()}
          className="input-field flex-1 text-center font-semibold"
        />
        <button
          type="button"
          onClick={handleVerify}
          disabled={loading}
          className="btn-primary px-4 py-3 text-sm"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : 'Verify'}
        </button>
      </div>
      {error && <p className="text-red-500 text-xs font-medium">{error}</p>}
    </div>
  )
}
