import { getRoleDisplayName, getTeam, ROLES } from '../utils/roleAssignment'

export default function PlayerGameEnd({ gameState, players, currentPlayer, onNewGame, onLeaveRoom }) {
  const { winner_team } = gameState
  const currentPlayerTeam = getTeam(currentPlayer.role)
  const playerWon = currentPlayerTeam === winner_team

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 flex items-center justify-center">
      <div className="max-w-2xl mx-auto text-center">
        {/* Main Result */}
        <div className="mb-8">
          <h1 className={`text-8xl font-bold mb-6 ${playerWon ? 'text-green-400' : 'text-red-400'}`}>
            {playerWon ? '🎉 YOU WIN!' : '💀 YOU LOST!'}
          </h1>
          
          <h2 className="text-3xl mb-4">
            {winner_team === 'mafia' ? '🔪 Mafia Wins!' : '👮 Citizens Win!'}
          </h2>
          
          <div className="text-xl text-gray-300 mb-6">
            Your Role: <span className="font-bold text-yellow-400">{getRoleDisplayName(currentPlayer.role)}</span>
          </div>
        </div>

        {/* Game Summary */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h3 className="text-2xl font-bold mb-4">Game Summary</h3>
          <div className="grid grid-cols-2 gap-4 text-lg">
            <div>
              <div className="text-green-400 font-bold">Winners</div>
              <div className="text-sm">
                {players.filter(p => p.role !== ROLES.GOD && getTeam(p.role) === winner_team)
                  .map(p => p.name).join(', ')}
              </div>
            </div>
            <div>
              <div className="text-red-400 font-bold">Losers</div>
              <div className="text-sm">
                {players.filter(p => p.role !== ROLES.GOD && getTeam(p.role) !== winner_team)
                  .map(p => p.name).join(', ')}
              </div>
            </div>
          </div>
        </div>

        {/* All Roles Revealed */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h3 className="text-xl font-bold mb-4">🎭 All Roles Revealed</h3>
          <div className="space-y-2">
            {players.filter(p => p.role !== ROLES.GOD).map(player => (
              <div key={player.player_id} className="bg-gray-700 rounded p-3 flex justify-between items-center">
                <span className={player.player_id === currentPlayer.player_id ? 'font-bold text-yellow-400' : ''}>
                  {player.name} {!player.is_alive && '💀'}
                  {player.player_id === currentPlayer.player_id && ' (You)'}
                </span>
                <span>{getRoleDisplayName(player.role)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <button 
            onClick={onNewGame} 
            className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-lg text-xl font-semibold"
          >
            🎮 New Game
          </button>
          <button 
            onClick={onLeaveRoom} 
            className="bg-gray-600 hover:bg-gray-700 px-8 py-4 rounded-lg text-xl font-semibold"
          >
            🚪 Leave Room
          </button>
        </div>
      </div>
    </div>
  )
}