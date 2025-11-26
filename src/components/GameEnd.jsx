import { getRoleDisplayName, getTeam, ROLES } from '../utils/roleAssignment'

export default function GameEnd({ gameState, players, currentPlayer, onNewGame, onLeaveRoom }) {
  const { winner_team } = gameState
  
  // Check if current player won or lost
  const currentPlayerTeam = getTeam(currentPlayer.role)
  const playerWon = currentPlayerTeam === winner_team
  
  const winners = players.filter(p => 
    p.role !== ROLES.GOD && getTeam(p.role) === winner_team
  )
  
  const losers = players.filter(p => 
    p.role !== ROLES.GOD && getTeam(p.role) !== winner_team
  )

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          {currentPlayer.role !== ROLES.GOD ? (
            <>
              <h1 className="text-6xl font-bold mb-4">
                {playerWon ? '🎉 YOU WIN!' : '💀 YOU LOST!'}
              </h1>
              <h2 className="text-2xl mb-4">
                {winner_team === 'mafia' ? '🔪 Mafia Wins!' : '👮 Citizens Win!'}
              </h2>
            </>
          ) : (
            <h1 className="text-4xl font-bold mb-4">
              {winner_team === 'mafia' ? '🔪 Mafia Wins!' : '👮 Citizens Win!'}
            </h1>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-green-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-center">🏆 Winners</h2>
            {winners.map(player => (
              <div key={player.player_id} className="bg-green-700 rounded p-3 mb-2 flex justify-between">
                <span>{player.name}</span>
                <span>{getRoleDisplayName(player.role)}</span>
              </div>
            ))}
          </div>

          <div className="bg-red-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-center">💀 Losers</h2>
            {losers.map(player => (
              <div key={player.player_id} className="bg-red-700 rounded p-3 mb-2 flex justify-between">
                <span>{player.name}</span>
                <span>{getRoleDisplayName(player.role)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-center">🎭 All Roles</h2>
          {players.filter(p => p.role !== ROLES.GOD).map(player => (
            <div key={player.player_id} className="bg-gray-700 rounded p-3 mb-2 flex justify-between">
              <span>{player.name} {!player.is_alive && '💀'}</span>
              <span>{getRoleDisplayName(player.role)}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-4 mt-8">
          <button onClick={onNewGame} className="bg-blue-600 px-6 py-3 rounded">
            New Game
          </button>
          <button onClick={onLeaveRoom} className="bg-gray-600 px-6 py-3 rounded">
            Leave Room
          </button>
        </div>
      </div>
    </div>
  )
}