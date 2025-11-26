import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { ROLES, getRoleDisplayName } from '../utils/roleAssignment'
import { GAME_PHASES } from '../utils/gamePhases'
import GodDashboard from './GodDashboard'
import PlayerView from './PlayerView'
import RoundStart from './RoundStart'
import GameEnd from './GameEnd'
import PlayerGameEnd from './PlayerGameEnd'

export default function Game({ playerId, roomId, gameState, onLeaveRoom }) {
  const [player, setPlayer] = useState(null)
  const [players, setPlayers] = useState([])
  const [actions, setActions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!roomId) return

    // Verify player is still in the room (for page refresh)
    async function verifyPlayer() {
      const { data: playerData } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId)
        .eq('player_id', playerId)
        .single()

      if (!playerData) {
        // Player not found, might need to rejoin
        // For now, just fetch data - if player doesn't exist, loading will stay true
        console.warn('Player not found in room, may need to rejoin')
      }
    }

    verifyPlayer()

    // Subscribe to player updates
    const playerChannel = supabase
      .channel(`players_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `room_id=eq.${roomId}`
        },
        async () => {
          await fetchPlayers()
        }
      )
      .subscribe()

    // Subscribe to action updates
    const actionChannel = supabase
      .channel(`actions_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'actions',
          filter: `room_id=eq.${roomId}`
        },
        async (payload) => {
          // Only refresh actions, don't cause full page refresh
          // For voting phase, we want to see votes update in real-time
          await fetchActions()
        }
      )
      .subscribe()

    fetchData()

    return () => {
      playerChannel.unsubscribe()
      actionChannel.unsubscribe()
    }
  }, [roomId, playerId])

  async function fetchData() {
    await Promise.all([fetchPlayers(), fetchActions()])
    setLoading(false)
  }

  async function fetchPlayers() {
    const { data } = await supabase
      .from('players')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })

    if (data) {
      setPlayers(data)
      const currentPlayer = data.find(p => p.player_id === playerId)
      if (currentPlayer) {
        setPlayer(currentPlayer)
      }
    }
  }

  async function fetchActions() {
    const { data } = await supabase
      .from('actions')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })

    if (data) {
      setActions(data)
    }
  }

  if (loading || !player || !gameState) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading game...</div>
      </div>
    )
  }

  // Show game end screen when game is finished
  if (gameState.phase === GAME_PHASES.ENDED) {
    if (player.role === ROLES.GOD) {
      return (
        <GameEnd
          gameState={gameState}
          players={players}
          currentPlayer={player}
          onNewGame={() => window.location.reload()}
          onLeaveRoom={onLeaveRoom}
        />
      )
    } else {
      return (
        <PlayerGameEnd
          gameState={gameState}
          players={players}
          currentPlayer={player}
          onNewGame={() => window.location.reload()}
          onLeaveRoom={onLeaveRoom}
        />
      )
    }
  }

  // Show round start splash screen (only if round system is available)
  if (gameState.phase === GAME_PHASES.ROUND_START) {
    if (player.role === ROLES.GOD) {
      return (
        <>
          <GodDashboard
            playerId={playerId}
            roomId={roomId}
            gameState={gameState}
            players={players}
            actions={actions}
            onLeaveRoom={onLeaveRoom}
          />
          <RoundStart 
            roundNumber={gameState.current_round || 1}
            onContinue={() => {}} // God controls phase transitions
          />
        </>
      )
    } else {
      return (
        <RoundStart 
          roundNumber={gameState.current_round || 1}
          onContinue={() => {}} // Only God can advance
        />
      )
    }
  }

  // God sees special dashboard
  if (player.role === ROLES.GOD) {
    return (
      <GodDashboard
        playerId={playerId}
        roomId={roomId}
        gameState={gameState}
        players={players}
        actions={actions}
        onLeaveRoom={onLeaveRoom}
      />
    )
  }

  // Regular player view
  return (
    <PlayerView
      player={player}
      roomId={roomId}
      gameState={gameState}
      players={players}
      actions={actions}
      onLeaveRoom={onLeaveRoom}
    />
  )
}

