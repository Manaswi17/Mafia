import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Lobby from './components/Lobby'
import Game from './components/Game'
import { GAME_PHASES } from './utils/gamePhases'

function App() {
  const [playerId, setPlayerId] = useState(null)
  const [roomId, setRoomId] = useState(null)
  const [gameState, setGameState] = useState(null)

  // Initialize player ID (stored in localStorage)
  useEffect(() => {
    let storedPlayerId = localStorage.getItem('mafia_player_id')
    if (!storedPlayerId) {
      storedPlayerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('mafia_player_id', storedPlayerId)
    }
    setPlayerId(storedPlayerId)

    // Restore room ID from localStorage if exists
    const storedRoomId = localStorage.getItem('mafia_room_id')
    if (storedRoomId) {
      setRoomId(storedRoomId)
    }
  }, [])

  // Subscribe to game state changes
  useEffect(() => {
    if (!roomId) return

    const channel = supabase
      .channel(`game_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${roomId}`
        },
        async (payload) => {
          // Update game state immediately
          setGameState(payload.new)
          
          // If phase changed to LOBBY, also refresh from database to ensure consistency
          if (payload.new.phase === GAME_PHASES.LOBBY) {
            const { data } = await supabase
              .from('games')
              .select('*')
              .eq('id', roomId)
              .single()
            if (data) {
              setGameState(data)
            }
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [roomId])

  // Fetch initial game state
  useEffect(() => {
    if (!roomId) return

    async function fetchGame() {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('id', roomId)
        .single()

      if (!error && data) {
        setGameState(data)
      }
    }

    fetchGame()
  }, [roomId])

  const handleJoinRoom = (newRoomId) => {
    setRoomId(newRoomId)
    localStorage.setItem('mafia_room_id', newRoomId)
  }

  const handleLeaveRoom = () => {
    setRoomId(null)
    setGameState(null)
    localStorage.removeItem('mafia_room_id')
  }

  if (!playerId) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  // Show lobby if no room, or if phase is LOBBY or ENDED
  // Show game if phase is NIGHT, DAY, or VOTING
  const showLobby = !roomId || !gameState || gameState.phase === GAME_PHASES.LOBBY || gameState.phase === GAME_PHASES.ENDED

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {showLobby ? (
        <Lobby 
          playerId={playerId} 
          onJoinRoom={handleJoinRoom}
          currentRoomId={roomId}
        />
      ) : (
        <Game 
          playerId={playerId}
          roomId={roomId}
          gameState={gameState}
          onLeaveRoom={handleLeaveRoom}
        />
      )}
    </div>
  )
}

export default App

