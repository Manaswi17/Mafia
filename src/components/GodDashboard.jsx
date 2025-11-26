import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { ROLES, getRoleDisplayName, getTeam } from '../utils/roleAssignment'
import { GAME_PHASES } from '../utils/gamePhases'
import { canAdvancePhase, getMissingActions } from '../utils/phaseControl'
import { canGodAdvancePhase, getConfirmationErrorMessage } from '../utils/godConfirmation'

export default function GodDashboard({ playerId, roomId, gameState, players, actions, onLeaveRoom }) {
  const [pendingActions, setPendingActions] = useState([])
  const [votes, setVotes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [narration, setNarration] = useState(null)

  useEffect(() => {
    if (!gameState || !roomId) return

    // Get pending actions for current phase (night actions that need confirmation)
    async function fetchPendingActions() {
      if (gameState.phase === GAME_PHASES.VOTING) {
        // During voting, don't show pending actions
        setPendingActions([])
        return
      }

      const { data } = await supabase
        .from('actions')
        .select('*')
        .eq('room_id', roomId)
        .eq('phase', gameState.phase)
        .eq('confirmed', false)
        .filter('round_number', 'eq', gameState.current_round || 1)
        .order('created_at', { ascending: true })

      if (data) {
        setPendingActions(data)
      }
    }

    // Get votes for voting phase
    async function fetchVotes() {
      if (gameState.phase !== GAME_PHASES.VOTING) {
        setVotes([])
        return
      }

      const { data } = await supabase
        .from('actions')
        .select('*')
        .eq('room_id', roomId)
        .eq('phase', GAME_PHASES.VOTING)
        .filter('round_number', 'eq', gameState.current_round || 1)
        .order('created_at', { ascending: true })

      if (data) {
        setVotes(data)
      }
    }

    fetchPendingActions()
    fetchVotes()

    // Subscribe to real-time action updates
    const channel = supabase
      .channel(`god_actions_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'actions',
          filter: `room_id=eq.${roomId}`
        },
        async (payload) => {
          // Only refresh if it's relevant to current phase
          if (gameState.phase === GAME_PHASES.VOTING) {
            await fetchVotes()
          } else {
            await fetchPendingActions()
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [gameState, roomId])

  async function confirmAction(actionId) {
    try {
      setLoading(true)
      setError('')
      const { error: updateError } = await supabase
        .from('actions')
        .update({ confirmed: true })
        .eq('id', actionId)

      if (updateError) {
        throw updateError
      }

      setSuccess('Action confirmed!')
      setTimeout(() => setSuccess(''), 2000)
      
      // Refresh pending actions
      const { data } = await supabase
        .from('actions')
        .select('*')
        .eq('room_id', roomId)
        .eq('phase', gameState.phase)
        .eq('confirmed', false)
        .filter('round_number', 'eq', gameState.current_round || 1)
        .order('created_at', { ascending: true })
      
      if (data) {
        setPendingActions(data)
      }
    } catch (err) {
      setError(err.message || 'Failed to confirm action')
      setTimeout(() => setError(''), 3000)
    } finally {
      setLoading(false)
    }
  }

  async function nextPhase() {
    // Check if all actions are confirmed first
    const currentPhaseActions = actions.filter(a => 
      a.phase === gameState.phase && 
      (a.round_number || 1) === (gameState.current_round || 1)
    )
    
    if (!canGodAdvancePhase(currentPhaseActions, gameState.phase)) {
      const errorMsg = getConfirmationErrorMessage(currentPhaseActions, gameState.phase)
      setError(errorMsg)
      setTimeout(() => setError(''), 5000)
      return
    }
    
    let nextPhase
    let updateData = {}
    
    // Determine next phase (without win condition check yet)
    if (gameState.phase === GAME_PHASES.NIGHT) {
      nextPhase = GAME_PHASES.DAY
    } else if (gameState.phase === GAME_PHASES.DAY) {
      nextPhase = GAME_PHASES.VOTING
    } else if (gameState.phase === GAME_PHASES.VOTING) {
      nextPhase = GAME_PHASES.NIGHT
      updateData.current_round = (gameState.current_round || 1) + 1
    } else {
      return
    }

    updateData.phase = nextPhase

    try {
      await supabase
        .from('games')
        .update(updateData)
        .eq('id', roomId)
    } catch (error) {
      // Fallback for databases without new columns
      await supabase
        .from('games')
        .update({ phase: nextPhase })
        .eq('id', roomId)
    }

    // Process actions and check win conditions after processing
    if (gameState.phase === GAME_PHASES.NIGHT) {
      const result = await processNightActions()
      if (result?.narration) {
        setNarration(result.narration)
      }
      // Check win conditions after night actions
      await checkAndUpdateWinCondition()
    }

    if (gameState.phase === GAME_PHASES.VOTING) {
      const result = await processVoting()
      if (result?.narration) {
        setNarration(result.narration)
      }
      // Check win conditions after voting
      await checkAndUpdateWinCondition()
    }
  }

  async function processNightActions() {
    const { data: confirmedActions } = await supabase
      .from('actions')
      .select('*')
      .eq('room_id', roomId)
      .eq('phase', GAME_PHASES.NIGHT)
      .eq('confirmed', true)
      .filter('round_number', 'eq', gameState.current_round || 1)

    if (!confirmedActions) return { narration: null }

    const narrationLines = []
    let killedPlayers = []
    let protectedPlayers = []
    let terroristActed = false

    // Process Mafia kill
    const mafiaKill = confirmedActions.find(a => a.action_type === 'mafia_kill')
    if (mafiaKill && mafiaKill.target_player_id) {
      const target = players.find(p => p.player_id === mafiaKill.target_player_id)
      const mafiaPlayer = players.find(p => p.player_id === mafiaKill.player_id)
      
      // Check if doctor protected
      const doctorProtect = confirmedActions.find(
        a => a.action_type === 'doctor_protect' && a.target_player_id === mafiaKill.target_player_id
      )

      if (doctorProtect) {
        const doctor = players.find(p => p.player_id === doctorProtect.player_id)
        narrationLines.push(`🛡️ ${doctor?.name || 'Doctor'} protected ${target?.name || 'target'} from the Mafia's attack!`)
        protectedPlayers.push(target?.name)
      } else {
        narrationLines.push(`🔪 The Mafia killed ${target?.name || 'target'}.`)
        await supabase
          .from('players')
          .update({ is_alive: false })
          .eq('player_id', mafiaKill.target_player_id)
          .eq('room_id', roomId)
        killedPlayers.push(target?.name)
      }
    }

    // Process Terrorist bomb
    const terroristBomb = confirmedActions.find(a => a.action_type === 'terrorist_bomb')
    if (terroristBomb && terroristBomb.target_player_id) {
      const terrorist = players.find(p => p.player_id === terroristBomb.player_id)
      const target = players.find(p => p.player_id === terroristBomb.target_player_id)
      
      narrationLines.push(`💣 ${terrorist?.name || 'Terrorist'} detonated a bomb, eliminating themselves and ${target?.name || 'target'}!`)
      terroristActed = true
      
      // Kill terrorist and target
      await supabase
        .from('players')
        .update({ is_alive: false })
        .in('player_id', [terroristBomb.player_id, terroristBomb.target_player_id])
        .eq('room_id', roomId)
      
      killedPlayers.push(terrorist?.name, target?.name)
    }

    // Process Police investigations
    const investigations = confirmedActions.filter(a => a.action_type === 'police_investigate')
    investigations.forEach(investigation => {
      const police = players.find(p => p.player_id === investigation.player_id)
      const target = players.find(p => p.player_id === investigation.target_player_id)
      if (police && target) {
        const targetTeam = getTeam(target.role)
        const isCorrect = targetTeam === 'mafia'
        narrationLines.push(`🔍 ${police.name} investigated ${target.name}. Result: ${isCorrect ? '✅ CORRECT (Mafia)' : '❌ WRONG (Citizen)'}`)
      }
    })

    // Get updated player status
    const { data: updatedPlayers } = await supabase
      .from('players')
      .select('*')
      .eq('room_id', roomId)

    if (updatedPlayers) {
      const alive = updatedPlayers.filter(p => p.is_alive).map(p => p.name)
      const dead = updatedPlayers.filter(p => !p.is_alive).map(p => p.name)
      
      narrationLines.push('')
      narrationLines.push('📊 Current Status:')
      narrationLines.push(`Alive: ${alive.join(', ') || 'None'}`)
      if (dead.length > 0) {
        narrationLines.push(`Dead: ${dead.join(', ')}`)
      }
    }

    return {
      narration: narrationLines.length > 0 ? narrationLines.join('\n') : null,
      killedPlayers,
      protectedPlayers,
      terroristActed
    }
  }

  async function checkAndUpdateWinCondition() {
    // Get fresh player data from database
    const { data: updatedPlayers } = await supabase
      .from('players')
      .select('*')
      .eq('room_id', roomId)

    if (!updatedPlayers) return

    const alivePlayers = updatedPlayers.filter(p => p.is_alive)
    const mafiaCount = alivePlayers.filter(p => p.role === ROLES.MAFIA).length
    const citizenCount = alivePlayers.filter(p => 
      [ROLES.CITIZEN, ROLES.DOCTOR, ROLES.POLICE, ROLES.TERRORIST].includes(p.role)
    ).length

    let winner = null
    if (mafiaCount === 0) {
      winner = 'citizen'
    } else if (mafiaCount >= citizenCount) {
      winner = 'mafia'
    }

    if (winner) {
      try {
        await supabase
          .from('games')
          .update({ 
            phase: GAME_PHASES.ENDED,
            winner_team: winner
          })
          .eq('id', roomId)
      } catch (error) {
        // Fallback for databases without winner_team column
        await supabase
          .from('games')
          .update({ phase: GAME_PHASES.ENDED })
          .eq('id', roomId)
      }
    }
  }

  async function processVoting() {
    const { data: votes } = await supabase
      .from('actions')
      .select('*')
      .eq('room_id', roomId)
      .eq('phase', GAME_PHASES.VOTING)
      .eq('confirmed', true)
      .filter('round_number', 'eq', gameState.current_round || 1)

    if (!votes || votes.length === 0) return { narration: null }

    const narrationLines = []

    // Count votes
    const voteCounts = {}
    votes.forEach(vote => {
      if (vote.target_player_id) {
        voteCounts[vote.target_player_id] = (voteCounts[vote.target_player_id] || 0) + 1
      }
    })

    // Show vote breakdown
    narrationLines.push('🗳️ Voting Results:')
    Object.keys(voteCounts).forEach(playerId => {
      const player = players.find(p => p.player_id === playerId)
      narrationLines.push(`  ${player?.name || 'Unknown'}: ${voteCounts[playerId]} vote(s)`)
    })

    // Find players with most votes (eliminate all tied players)
    let maxVotes = 0
    let eliminatedPlayers = []

    Object.keys(voteCounts).forEach(playerId => {
      if (voteCounts[playerId] > maxVotes) {
        maxVotes = voteCounts[playerId]
        eliminatedPlayers = [playerId]
      } else if (voteCounts[playerId] === maxVotes && maxVotes > 0) {
        eliminatedPlayers.push(playerId)
      }
    })

    if (eliminatedPlayers.length > 0 && maxVotes > 0) {
      if (eliminatedPlayers.length > 1) {
        narrationLines.push(`⚖️ Multiple players tied with ${maxVotes} vote(s). All tied players are eliminated!`)
      }
      
      narrationLines.push('')
      eliminatedPlayers.forEach(playerId => {
        const eliminated = players.find(p => p.player_id === playerId)
        const eliminatedRole = eliminated?.role
        narrationLines.push(`⚰️ ${eliminated?.name || 'Player'} was eliminated by vote!`)
        narrationLines.push(`   Role: ${getRoleDisplayName(eliminatedRole)}`)
      })
      
      // Update all tied players status to dead
      await supabase
        .from('players')
        .update({ is_alive: false })
        .in('player_id', eliminatedPlayers)
        .eq('room_id', roomId)
    } else {
      narrationLines.push('')
      narrationLines.push('No one was eliminated (no votes cast).')
    }

    // Get updated player status
    const { data: updatedPlayers } = await supabase
      .from('players')
      .select('*')
      .eq('room_id', roomId)

    if (updatedPlayers) {
      const alive = updatedPlayers.filter(p => p.is_alive).map(p => p.name)
      const dead = updatedPlayers.filter(p => !p.is_alive).map(p => p.name)
      
      narrationLines.push('')
      narrationLines.push('📊 Current Status:')
      narrationLines.push(`Alive: ${alive.join(', ') || 'None'}`)
      if (dead.length > 0) {
        narrationLines.push(`Dead: ${dead.join(', ')}`)
      }
    }

    return {
      narration: narrationLines.join('\n')
    }
  }

  async function resetGame() {
    try {
      setLoading(true)
      setError('')
      
      // Clear actions first
      const { error: actionsError } = await supabase
        .from('actions')
        .delete()
        .eq('room_id', roomId)

      if (actionsError) throw actionsError

      // Reset all players
      const { error: playersError } = await supabase
        .from('players')
        .update({ 
          is_alive: true,
          role: null,
          has_acted: false
        })
        .eq('room_id', roomId)

      if (playersError) throw playersError

      // Reset game - this will trigger real-time update for all clients
      const { error: gameError } = await supabase
        .from('games')
        .update({ 
          phase: GAME_PHASES.LOBBY,
          current_round: 1,
          winner_team: null,
          started_at: null
        })
        .eq('id', roomId)

      if (gameError) throw gameError

      // Force a small delay to ensure updates propagate
      await new Promise(resolve => setTimeout(resolve, 500))

      setNarration(null)
      setSuccess('Game reset to lobby!')
      setTimeout(() => setSuccess(''), 2000)
    } catch (err) {
      setError(err.message || 'Failed to reset game')
      setTimeout(() => setError(''), 3000)
    } finally {
      setLoading(false)
    }
  }

  async function restartGame() {
    try {
      setLoading(true)
      setError('')
      
      // Clear actions first
      const { error: actionsError } = await supabase
        .from('actions')
        .delete()
        .eq('room_id', roomId)

      if (actionsError) throw actionsError

      // Reset players but keep roles
      const { error: playersError } = await supabase
        .from('players')
        .update({ 
          is_alive: true,
          has_acted: false
        })
        .eq('room_id', roomId)

      if (playersError) throw playersError

      // Start new game - this will trigger real-time update for all clients
      const { error: gameError } = await supabase
        .from('games')
        .update({ 
          phase: GAME_PHASES.NIGHT,
          current_round: 1,
          started_at: new Date().toISOString()
        })
        .eq('id', roomId)

      if (gameError) throw gameError

      // Force a small delay to ensure updates propagate
      await new Promise(resolve => setTimeout(resolve, 500))

      setNarration(null)
      setSuccess('Game restarted!')
      setTimeout(() => setSuccess(''), 2000)
    } catch (err) {
      setError(err.message || 'Failed to restart game')
      setTimeout(() => setError(''), 3000)
    } finally {
      setLoading(false)
    }
  }

  const alivePlayers = players.filter(p => p.is_alive)
  const deadPlayers = players.filter(p => !p.is_alive)

  return (
    <div className="container mx-auto px-4 py-4 max-w-6xl">
      <div className="bg-gray-800 rounded-lg p-4 md:p-6 shadow-lg mb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">God Dashboard</h1>
            <p className="text-gray-400">Room: {roomId}</p>
            <p className="text-lg font-semibold mt-2">
              Round: <span className="text-blue-400">{gameState.current_round || 1}</span>
            </p>
            <p className="text-lg font-semibold">
              Phase: <span className="text-yellow-400">{gameState.phase.toUpperCase().replace('_', ' ')}</span>
            </p>
          </div>
          <button
            onClick={onLeaveRoom}
            className="mt-2 md:mt-0 px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
          >
            Leave Room
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900 rounded text-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-900 rounded text-green-200">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <button
            onClick={nextPhase}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded font-semibold"
            disabled={gameState.phase === GAME_PHASES.ENDED || loading || !canAdvancePhase(players, actions, gameState.phase)}
          >
            {canAdvancePhase(players, actions, gameState.phase) ? 'Next Phase' : 'Waiting for Actions'}
          </button>

          <button
            onClick={resetGame}
            className="px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded font-semibold"
            disabled={loading}
          >
            {loading ? 'Resetting...' : 'Reset to Lobby'}
          </button>
        </div>
      </div>

      {/* Narration Display */}
      {narration && (
        <div className="mb-4 bg-blue-900 rounded-lg p-4 md:p-6 shadow-lg border-2 border-blue-600">
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-xl font-semibold text-blue-200">📢 Phase Narration</h2>
            <button
              onClick={() => setNarration(null)}
              className="text-blue-300 hover:text-blue-100 text-sm"
            >
              ✕ Close
            </button>
          </div>
          <div className="text-blue-100 whitespace-pre-line leading-relaxed">
            {narration.split('\n').map((line, index) => {
              if (line.trim() === '') return <br key={index} />
              if (line.startsWith('📊') || line.startsWith('🗳️')) {
                return <div key={index} className="font-semibold mt-2 mb-1">{line}</div>
              }
              return <div key={index}>{line}</div>
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* All Players View */}
        <div className="bg-gray-800 rounded-lg p-4 md:p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">All Players</h2>
          <div className="space-y-2">
            {players.map((p) => {
              const team = getTeam(p.role)
              const teamColor = team === 'mafia' ? 'text-red-400' : 
                              team === 'citizen' ? 'text-blue-400' : 'text-yellow-400'
              return (
                <div
                  key={p.id}
                  className={`bg-gray-700 p-3 rounded flex items-center justify-between ${
                    !p.is_alive ? 'opacity-50' : ''
                  }`}
                >
                  <div>
                    <span className="font-medium">{p.name}</span>
                    <span className={`ml-2 ${teamColor}`}>
                      ({getRoleDisplayName(p.role)})
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {p.is_alive ? 'Alive' : 'Dead'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Pending Actions (Night Phase) or Votes (Voting Phase) */}
        <div className="bg-gray-800 rounded-lg p-4 md:p-6 shadow-lg">
          {gameState.phase === GAME_PHASES.VOTING ? (
            <>
              <h2 className="text-xl font-semibold mb-4">🗳️ Voting Status</h2>
              {votes.length === 0 ? (
                <p className="text-gray-400">No votes submitted yet</p>
              ) : (
                <div className="space-y-2">
                  {/* Count votes */}
                  {(() => {
                    const voteCounts = {}
                    votes.forEach(vote => {
                      if (vote.target_player_id) {
                        voteCounts[vote.target_player_id] = (voteCounts[vote.target_player_id] || 0) + 1
                      }
                    })
                    
                    const alivePlayersCount = players.filter(p => p.is_alive && p.role !== ROLES.GOD).length
                    const votedPlayers = votes.map(v => v.player_id).filter((v, i, a) => a.indexOf(v) === i).length
                    
                    return (
                      <>
                        <div className="mb-4 p-3 bg-gray-700 rounded">
                          <div className="text-sm text-gray-300">
                            <div>Total Votes: {votes.length}</div>
                            <div>Players Voted: {votedPlayers} / {alivePlayersCount}</div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          {Object.keys(voteCounts).map(playerId => {
                            const target = players.find(p => p.player_id === playerId)
                            const count = voteCounts[playerId]
                            return (
                              <div key={playerId} className="bg-gray-700 p-3 rounded">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium">{target?.name || 'Unknown'}</span>
                                  <span className="text-lg font-bold text-red-400">{count} vote{count !== 1 ? 's' : ''}</span>
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  Voted by: {votes.filter(v => v.target_player_id === playerId).map(v => {
                                    const voter = players.find(p => p.player_id === v.player_id)
                                    return voter?.name
                                  }).filter(Boolean).join(', ')}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </>
                    )
                  })()}
                </div>
              )}
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-4">Pending Actions</h2>
              {pendingActions.length === 0 ? (
                <p className="text-gray-400">No pending actions</p>
              ) : (
                <div className="space-y-2">
                  {pendingActions.map((action) => {
                    const player = players.find(p => p.player_id === action.player_id)
                    const target = action.target_player_id 
                      ? players.find(p => p.player_id === action.target_player_id)
                      : null
                    return (
                      <div
                        key={action.id}
                        className="bg-gray-700 p-3 rounded"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-medium">{player?.name || 'Unknown'}</span>
                            <span className="text-gray-400 ml-2">
                              ({action.action_type.replace('_', ' ')})
                            </span>
                          </div>
                          <button
                            onClick={() => confirmAction(action.id)}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-sm"
                            disabled={loading}
                          >
                            {loading ? '...' : 'Confirm'}
                          </button>
                        </div>
                        {target && (
                          <div className="text-sm text-gray-400">
                            Target: {target.name}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Game Status */}
      {gameState.phase === GAME_PHASES.ENDED && (
        <div className="mt-4 bg-gray-800 rounded-lg p-4 md:p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Game Ended</h2>
          <div className="text-lg mb-4">
            {gameState.winner_team === 'citizen' && (
              <span className="text-blue-400">🎉 Citizens Win!</span>
            )}
            {gameState.winner_team === 'mafia' && (
              <span className="text-red-400">🎉 Mafia Wins!</span>
            )}
          </div>
          <div className="text-sm text-gray-400">
            Game lasted {gameState.current_round || 1} round(s)
          </div>
        </div>
      )}


    </div>
  )
}

