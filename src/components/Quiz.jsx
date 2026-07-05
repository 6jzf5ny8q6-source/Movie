import { useState } from 'react'
import { QUIZ } from '../data/quizQuestions.js'

// The 12-question taste quiz. Collects one option per question and hands the
// answer map back to App, which turns it into a taste profile.
export default function Quiz({ initialAnswers, onComplete, onCancel }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState(initialAnswers || {})

  const q = QUIZ[step]
  const total = QUIZ.length
  const selectedIndex = answers[q.id]?._i

  const choose = (opt, i) => {
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

      <div className="quiz__options">
        {q.options.map((opt, i) => (
          <button
            key={i}
            className={`quiz__option ${selectedIndex === i ? 'is-selected' : ''}`}
            onClick={() => choose(opt, i)}
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
          {step > 0 ? '‹ Back' : 'Cancel'}
        </button>
        <span className="quiz__hint">Pick the answer that feels most like you.</span>
      </div>
    </section>
  )
}
