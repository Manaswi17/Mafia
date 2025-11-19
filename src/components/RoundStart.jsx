import { useEffect, useState } from 'react'

export default function RoundStart({ roundNumber, onContinue }) {
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          setTimeout(onContinue, 500)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [onContinue])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="text-8xl mb-6">🌙</div>
        <h1 className="text-6xl font-bold text-white mb-4">
          Round {roundNumber}
        </h1>
        <p className="text-2xl text-gray-300 mb-8">
          {roundNumber === 1 ? 'Game Starting...' : 'Next Round Starting...'}
        </p>
        {countdown > 0 && (
          <div className="text-4xl font-bold text-yellow-400">
            {countdown}
          </div>
        )}
      </div>
    </div>
  )
}