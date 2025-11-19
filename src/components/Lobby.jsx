import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useSupabase } from '../hooks/useSupabase'
import { GAME_PHASES } from '../utils/gamePhases'

export default function Lobby({ playerId, onJoinRoom, currentRoomId }) {
  const [roomCode, setRoomCode] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [players, setPlayers] = useState([])
  const [game, setGame] = useState(null)
  const [error, setError] = useState('')

  // Load player name from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('mafia_player_name')
    if (stored) {
      setPlayerName(stored)
    }
  }, [])

  // Subscribe to game updates if in a room
  useEffect(() => {
    if (!currentRoomId) return

    // Check if player is already in this room (for page refresh)
    async function checkAndRejoin() {
      const { data: existingPlayer } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', currentRoomId)
        .eq('player_id', playerId)
        .single()

      // If player exists but name might be missing, update it
      if (existingPlayer && playerName.trim()) {
        if (existingPlayer.name !== playerName.trim()) {
          await supabase
            .from('players')
            .update({ name: playerName.trim() })
            .eq('id', existingPlayer.id)
        }
      } else if (!existingPlayer && playerName.trim()) {
        // Player not in room, add them (for refresh scenario)
        await supabase
          .from('players')
          .insert({
            player_id: playerId,
            room_id: currentRoomId,
            name: playerName.trim(),
            is_alive: true
          })
      }
    }

    checkAndRejoin()

    const channel = supabase
      .channel(`lobby_${currentRoomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `room_id=eq.${currentRoomId}`
        },
        async () => {
          await fetchPlayers()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${currentRoomId}`
        },
        async () => {
          await fetchGame()
        }
      )
      .subscribe()

    fetchPlayers()
    fetchGame()

    return () => {
      channel.unsubscribe()
    }
  }, [currentRoomId, playerId, playerName])

  async function fetchPlayers() {
    if (!currentRoomId) return
    const { data } = await supabase
      .from('players')
      .select('*')
      .eq('room_id', currentRoomId)
      .order('created_at', { ascending: true })
    
    if (data) setPlayers(data)
  }

  async function fetchGame() {
    if (!currentRoomId) return
    const { data } = await supabase
      .from('games')
      .select('*')
      .eq('id', currentRoomId)
      .single()
    
    if (data) setGame(data)
  }

  async function createRoom() {
    if (!playerName.trim()) {
      setError('Please enter your name')
      return
    }

    try {
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase()
      
      // Create game
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .insert({
          id: roomCode,
          phase: GAME_PHASES.LOBBY,
          created_by: playerId
        })
        .select()
        .single()

      if (gameError) throw gameError

      // Add player
      await joinRoom(roomCode)
    } catch (err) {
      setError(err.message)
    }
  }

  async function joinRoom(code) {
    if (!playerName.trim()) {
      setError('Please enter your name')
      return
    }

    if (!code) {
      code = roomCode.toUpperCase().trim()
    }

    try {
      // Check if game exists
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('id', code)
        .single()

      if (gameError || !gameData) {
        setError('Room not found')
        return
      }

      // Check if game already started
      if (gameData.phase !== GAME_PHASES.LOBBY) {
        setError('Game already in progress')
        return
      }

      // Check if player already in room
      const { data: existingPlayer } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', code)
        .eq('player_id', playerId)
        .single()

      if (!existingPlayer) {
        // Add player
        const { error: playerError } = await supabase
          .from('players')
          .insert({
            player_id: playerId,
            room_id: code,
            name: playerName.trim(),
            is_alive: true
          })

        if (playerError) throw playerError
      }

      localStorage.setItem('mafia_player_name', playerName.trim())
      onJoinRoom(code)
    } catch (err) {
      setError(err.message)
    }
  }

  async function startGame() {
    if (!currentRoomId || !game) return

    try {
      // Get all players
      const { data: allPlayers } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', currentRoomId)

      if (!allPlayers || allPlayers.length < 6) {
        setError('Need at least 6 players to start')
        return
      }

      // Only creator can start
      if (game.created_by !== playerId) {
        setError('Only room creator can start the game')
        return
      }

      // Assign roles (import dynamically to avoid circular deps)
      const { assignRoles } = await import('../utils/roleAssignment')
      const playerIds = allPlayers.map(p => p.player_id)
      const roleAssignments = assignRoles(playerIds)

      // Update players with roles
      for (const player of allPlayers) {
        await supabase
          .from('players')
          .update({ role: roleAssignments[player.player_id] })
          .eq('id', player.id)
      }

      // Start game
      try {
        await supabase
          .from('games')
          .update({ 
            phase: GAME_PHASES.NIGHT,
            current_round: 1,
            started_at: new Date().toISOString()
          })
          .eq('id', currentRoomId)
      } catch (error) {
        // Fallback for databases without new columns
        await supabase
          .from('games')
          .update({ 
            phase: GAME_PHASES.NIGHT,
            started_at: new Date().toISOString()
          })
          .eq('id', currentRoomId)
      }

    } catch (err) {
      setError(err.message)
    }
  }

  if (currentRoomId && game) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
          <h1 className="text-3xl font-bold mb-2">Room: {currentRoomId}</h1>
          <p className="text-gray-400 mb-6">Waiting for players...</p>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Your Name</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 rounded text-white"
              placeholder="Enter your name"
            />
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Players ({players.length})</h2>
            <div className="space-y-2">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="bg-gray-700 p-3 rounded flex items-center justify-between"
                >
                  <span>{player.name || 'Anonymous'}</span>
                  {player.player_id === playerId && (
                    <span className="text-xs text-blue-400">(You)</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900 rounded text-red-200">
              {error}
            </div>
          )}

          {/* Debug info - remove in production */}
          <div className="mb-4 p-3 bg-gray-700 rounded text-xs text-gray-400">
            <div>Players: {players.length}/6</div>
            <div>You are creator: {game.created_by === playerId ? 'Yes' : 'No'}</div>
            <div>Game creator ID: {game.created_by}</div>
            <div>Your player ID: {playerId}</div>
          </div>

          {game.created_by === playerId && players.length >= 6 && (
            <button
              onClick={startGame}
              className="w-full bg-green-600 hover:bg-green-700 px-6 py-3 rounded font-semibold text-lg"
            >
              Start Game
            </button>
          )}

          {game.created_by === playerId && players.length < 6 && (
            <div className="text-center text-gray-400 py-4">
              Need at least 6 players to start (1 Mafia, 1 Citizen, 1 Doctor, 1 Police, 1 Terrorist, 1 God)
            </div>
          )}

          {game.created_by !== playerId && (
            <div className="text-center text-gray-400 py-4">
              Waiting for room creator to start the game...
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
        <h1 className="text-3xl font-bold mb-2 text-center">Mafia Game</h1>
        <p className="text-gray-400 mb-6 text-center">Join or create a room</p>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Your Name</label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 rounded text-white"
            placeholder="Enter your name"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Room Code</label>
          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            className="w-full px-4 py-2 bg-gray-700 rounded text-white uppercase"
            placeholder="Enter room code"
            maxLength={6}
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900 rounded text-red-200">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={() => joinRoom()}
            className="w-full bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded font-semibold"
          >
            Join Room
          </button>
          <button
            onClick={createRoom}
            className="w-full bg-green-600 hover:bg-green-700 px-6 py-3 rounded font-semibold"
          >
            Create Room
          </button>
        </div>
      </div>
    </div>
  )
}

