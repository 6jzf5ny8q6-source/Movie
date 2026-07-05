import { useState } from 'react'
import { selectQuiz } from '../data/quizQuestions.js'

// The taste quiz. Draws a fresh, randomized set of questions each time it
// mounts (so a retake asks new questions) and always starts with no prior
// answers. Hands the answer map back to App, which builds a taste profile.
export default function Quiz({ onComplete, onCancel, cancelLabel = 'Cancel' }) {
  const [questions] = useState(() => selectQuiz(12))
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})

  const q = questions[step]
  const total = questions.length
  const selectedIndex = answers[q.id]?._i

  const choose = (opt, i, e) => {
    // Drop focus from the clicked button so its focus/hover styling can't
    // carry over onto the next question.
    e?.currentTarget?.blur()
    const next = { ...answers, [q.id]: { ...opt, _i: i } }
    setAnswers(next)
    // brief pause so the selection is visible, then advance
    setTimeout(() => {
      if (step < total - 1) setStep(step + 1)
      else onComplete(next)
    }, 180)
  }

  const progress = Math.round(((step + (selectedIndex != null ? 1 : 0)) / total) * 100)

  return (
    <section className="quiz">
      <div className="quiz__top">
        <div className="quiz__progress">
          <div className="quiz__bar" style={{ width: `${progress}%` }} />
        </div>
        <span className="quiz__count">Question {step + 1} of {total}</span>
      </div>

      <h2 className="quiz__prompt">{q.prompt}</h2>

      <div className="quiz__options" key={q.id}>
        {q.options.map((opt, i) => (
          <button
            key={`${q.id}-${i}`}
            className={`quiz__option ${selectedIndex === i ? 'is-selected' : ''}`}
            onClick={(e) => choose(opt, i, e)}
          >
            <span className="quiz__optletter">{String.fromCharCode(65 + i)}</span>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>

      <div className="quiz__nav">
        <button
          className="btn btn--ghost"
          onClick={() => (step > 0 ? setStep(step - 1) : onCancel?.())}
        >
          {step > 0 ? '‹ Back' : cancelLabel}
        </button>
        <span className="quiz__hint">Pick the answer that feels most like you.</span>
      </div>
    </section>
  )
}
