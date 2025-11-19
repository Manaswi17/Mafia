import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { ROLES, getRoleDisplayName, getTeam } from '../utils/roleAssignment'
import { GAME_PHASES, canRoleAct } from '../utils/gamePhases'

export default function PlayerView({ player, roomId, gameState, players, actions, onLeaveRoom }) {
  const [selectedTarget, setSelectedTarget] = useState(null)
  const [hasActed, setHasActed] = useState(false)
  const [doctorSelfProtectUsed, setDoctorSelfProtectUsed] = useState(false)
  const [terroristActed, setTerroristActed] = useState(false)

  useEffect(() => {
    // Reset selected target when phase changes
    if (gameState.phase !== GAME_PHASES.VOTING) {
      setSelectedTarget(null)
    }
    
    // Check if player has already acted this phase
    const phaseActions = actions.filter(
      a => a.player_id === player.player_id && 
           a.phase === gameState.phase &&
           (a.confirmed === true || gameState.phase === GAME_PHASES.VOTING) // Votes are auto-confirmed
    )
    setHasActed(phaseActions.length > 0)

    // Check doctor self-protect usage
    const selfProtect = actions.find(
      a => a.player_id === player.player_id &&
           a.action_type === 'doctor_protect' &&
           a.target_player_id === player.player_id
    )
    setDoctorSelfProtectUsed(!!selfProtect)

    // Check if terrorist has acted
    const terroristAction = actions.find(
      a => a.player_id === player.player_id &&
           a.action_type === 'terrorist_bomb'
    )
    setTerroristActed(!!terroristAction)
  }, [actions, gameState.phase, player.player_id])

  // For voting, include all alive players (except self), including God
  // For night actions, exclude self and God
  const alivePlayers = gameState.phase === GAME_PHASES.VOTING
    ? players.filter(p => p.is_alive && p.player_id !== player.player_id) // Include God in voting
    : players.filter(p => p.is_alive && p.player_id !== player.player_id && p.role !== ROLES.GOD)
  
  const canAct = canRoleAct(player.role, gameState.phase) && !hasActed && gameState.phase === GAME_PHASES.NIGHT
  const canVote = gameState.phase === GAME_PHASES.VOTING && player.is_alive && player.role !== ROLES.GOD

  async function submitAction(actionType) {
    if (!selectedTarget && actionType !== 'police_investigate') {
      alert('Please select a target')
      return
    }

    // Special checks
    if (actionType === 'doctor_protect' && selectedTarget === player.player_id) {
      if (doctorSelfProtectUsed) {
        alert('You can only self-protect once per game')
        return
      }
    }

    if (actionType === 'terrorist_bomb' && terroristActed) {
      alert('Terrorist can only act once per game')
      return
    }

    try {
      const { data, error } = await supabase
        .from('actions')
        .insert({
          room_id: roomId,
          player_id: player.player_id,
          action_type: actionType,
          target_player_id: selectedTarget,
          phase: gameState.phase,
          confirmed: false
        })
        .select()

      if (error) throw error

      setHasActed(true)
      setSelectedTarget(null)
    } catch (err) {
      alert('Error submitting action: ' + err.message)
      console.error('Action submission error:', err)
    }
  }

  async function submitVote() {
    if (!selectedTarget) {
      alert('Please select a player to vote out')
      return
    }

    try {
      // Remove any existing vote for this phase
      await supabase
        .from('actions')
        .delete()
        .eq('room_id', roomId)
        .eq('player_id', player.player_id)
        .eq('phase', GAME_PHASES.VOTING)

      // Submit new vote
      await supabase
        .from('actions')
        .insert({
          room_id: roomId,
          player_id: player.player_id,
          action_type: 'vote',
          target_player_id: selectedTarget,
          phase: GAME_PHASES.VOTING,
          confirmed: true // Votes are auto-confirmed
        })

      setSelectedTarget(null)
      setHasActed(true) // Mark as voted
    } catch (err) {
      alert('Error voting: ' + err.message)
      console.error('Vote submission error:', err)
    }
  }

  const getActionButton = () => {
    if (gameState.phase === GAME_PHASES.NIGHT) {
      if (player.role === ROLES.MAFIA) {
        return (
          <button
            onClick={() => submitAction('mafia_kill')}
            disabled={!canAct || !selectedTarget}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded font-semibold"
          >
            Kill Target
          </button>
        )
      }
      if (player.role === ROLES.DOCTOR) {
        return (
          <button
            onClick={() => submitAction('doctor_protect')}
            disabled={!canAct || !selectedTarget}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded font-semibold"
          >
            Protect Target
          </button>
        )
      }
      if (player.role === ROLES.POLICE) {
        return (
          <button
            onClick={() => submitAction('police_investigate')}
            disabled={!canAct}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded font-semibold"
          >
            Investigate Target
          </button>
        )
      }
      if (player.role === ROLES.TERRORIST && !terroristActed) {
        return (
          <button
            onClick={() => submitAction('terrorist_bomb')}
            disabled={!canAct || !selectedTarget}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded font-semibold"
          >
            Bomb Target (One Time)
          </button>
        )
      }
    }
    if (gameState.phase === GAME_PHASES.VOTING && canVote) {
      return (
        <button
          onClick={submitVote}
          disabled={!selectedTarget}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded font-semibold"
        >
          Vote to Eliminate
        </button>
      )
    }
    return null
  }

  const getRoleInstructions = () => {
    if (gameState.phase === GAME_PHASES.NIGHT) {
      if (player.role === ROLES.MAFIA) {
        return 'Select a player to eliminate tonight.'
      }
      if (player.role === ROLES.DOCTOR) {
        return 'Select a player to protect. You can self-protect once per game.'
      }
      if (player.role === ROLES.POLICE) {
        return 'Select a player to investigate. You will see their team (Mafia or Citizen).'
      }
      if (player.role === ROLES.TERRORIST) {
        return 'Select a player to bomb. This will eliminate both of you. You can only do this once.'
      }
      if (player.role === ROLES.CITIZEN) {
        return 'You have no night action. Wait for day phase.'
      }
    }
    if (gameState.phase === GAME_PHASES.DAY) {
      return 'Discuss with other players. Voting phase will begin soon.'
    }
    if (gameState.phase === GAME_PHASES.VOTING) {
      return 'Vote to eliminate a player you suspect.'
    }
    return ''
  }

  // Get investigation result if police investigated
  const getInvestigationResult = () => {
    if (player.role !== ROLES.POLICE) return null
    
    // Get the most recent confirmed investigation
    const investigations = actions.filter(
      a => a.player_id === player.player_id &&
           a.action_type === 'police_investigate' &&
           a.confirmed === true
    ).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    if (investigations.length === 0) return null

    const investigation = investigations[0]
    if (!investigation.target_player_id) return null

    const target = players.find(p => p.player_id === investigation.target_player_id)
    if (!target) return null

    const team = getTeam(target.role)
    
    return `You investigated ${target.name}. They are ${team === 'mafia' ? 'Mafia' : 'Citizen'}.`
  }

  return (
    <div className="container mx-auto px-4 py-4 max-w-2xl">
      <div className="bg-gray-800 rounded-lg p-4 md:p-6 shadow-lg mb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Mafia Game</h1>
            <p className="text-gray-400">Room: {roomId}</p>
            <p className="text-lg font-semibold mt-2">
              Phase: <span className="text-yellow-400">{gameState.phase.toUpperCase()}</span>
            </p>
          </div>
          <button
            onClick={onLeaveRoom}
            className="mt-2 md:mt-0 px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
          >
            Leave Room
          </button>
        </div>

        <div className="bg-gray-700 rounded p-4 mb-4">
          <div className="text-lg font-semibold mb-2">Your Role</div>
          <div className="text-2xl text-blue-400">{getRoleDisplayName(player.role)}</div>
          {player.role === ROLES.DOCTOR && doctorSelfProtectUsed && (
            <div className="text-sm text-gray-400 mt-2">Self-protect used</div>
          )}
          {player.role === ROLES.TERRORIST && terroristActed && (
            <div className="text-sm text-gray-400 mt-2">Bomb action used</div>
          )}
        </div>

        {getInvestigationResult() && (
          <div className="bg-purple-900 rounded p-4 mb-4">
            <div className="font-semibold text-purple-200">{getInvestigationResult()}</div>
          </div>
        )}

        <div className="text-gray-300 mb-4">{getRoleInstructions()}</div>

        {/* Show target selection only during night phase for roles that can act */}
        {canAct && gameState.phase === GAME_PHASES.NIGHT && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Select Target</label>
            {alivePlayers.length === 0 ? (
              <div className="text-gray-400 text-sm">No other players available</div>
            ) : (
              <select
                value={selectedTarget || ''}
                onChange={(e) => {
                  const value = e.target.value
                  setSelectedTarget(value || null)
                }}
                className="w-full px-4 py-2 bg-gray-700 rounded text-white"
              >
                <option value="">Choose a player...</option>
                {alivePlayers.map((p) => (
                  <option key={p.id} value={p.player_id}>
                    {p.name}
                  </option>
                ))}
                {player.role === ROLES.DOCTOR && !doctorSelfProtectUsed && (
                  <option value={player.player_id}>Yourself (One Time)</option>
                )}
              </select>
            )}
          </div>
        )}

        {/* Show target selection for voting phase */}
        {gameState.phase === GAME_PHASES.VOTING && canVote && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Select Player to Vote Out</label>
            {alivePlayers.length === 0 ? (
              <div className="text-gray-400 text-sm">No other players available</div>
            ) : (
              <select
                value={selectedTarget || ''}
                onChange={(e) => {
                  const value = e.target.value
                  setSelectedTarget(value || null)
                }}
                className="w-full px-4 py-2 bg-gray-700 rounded text-white"
              >
                <option value="">Choose a player...</option>
                {alivePlayers.map((p) => (
                  <option key={p.id} value={p.player_id}>
                    {p.name} {p.role === ROLES.GOD ? '(God)' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {gameState.phase === GAME_PHASES.VOTING && player.role === ROLES.GOD && (
          <div className="mb-4 p-3 bg-yellow-900 rounded text-yellow-200">
            As God, you observe the voting but do not participate.
          </div>
        )}

        {hasActed && gameState.phase !== GAME_PHASES.VOTING && (
          <div className="mb-4 p-3 bg-green-900 rounded text-green-200">
            Action submitted. Waiting for God to confirm.
          </div>
        )}

        {hasActed && gameState.phase === GAME_PHASES.VOTING && (
          <div className="mb-4 p-3 bg-green-900 rounded text-green-200">
            Vote submitted!
          </div>
        )}

        {getActionButton()}
      </div>

      {/* Players List */}
      <div className="bg-gray-800 rounded-lg p-4 md:p-6 shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Players</h2>
        <div className="space-y-2">
          {players.map((p) => (
            <div
              key={p.id}
              className={`bg-gray-700 p-3 rounded flex items-center justify-between ${
                !p.is_alive ? 'opacity-50' : ''
              }`}
            >
              <span className="font-medium">{p.name}</span>
              <div className="text-xs text-gray-400">
                {p.is_alive ? 'Alive' : 'Dead'}
                {p.player_id === player.player_id && (
                  <span className="ml-2 text-blue-400">(You)</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Game End */}
      {gameState.phase === GAME_PHASES.ENDED && (
        <div className="mt-4 bg-gray-800 rounded-lg p-4 md:p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Game Ended</h2>
          <div className="space-y-2">
            {players.map((p) => (
              <div
                key={p.id}
                className="bg-gray-700 p-3 rounded"
              >
                <div className="flex justify-between">
                  <span>{p.name}</span>
                  <span className="text-gray-400">{getRoleDisplayName(p.role)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

