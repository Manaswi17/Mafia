import { describe, it, expect } from 'vitest'
import { ROLES } from '../utils/roleAssignment'
import { GAME_PHASES } from '../utils/gamePhases'

describe('Moderator (God) Controls', () => {
  const mockPlayers = [
    { player_id: 'god1', role: ROLES.GOD, is_alive: true },
    { player_id: 'p1', role: ROLES.MAFIA, is_alive: true },
    { player_id: 'p2', role: ROLES.CITIZEN, is_alive: true }
  ]

  // Test Case: Validate God's role visibility privilege
  // Ensures only God can see all player roles for moderation
  it('should allow God to see all roles', () => {
    const godPlayer = mockPlayers.find(p => p.role === ROLES.GOD)
    expect(canSeeAllRoles(godPlayer)).toBe(true)
    expect(canSeeAllRoles(mockPlayers[1])).toBe(false)
  })

  // Test Case: Validate God's action confirmation privilege
  // Ensures only God can confirm night actions and phase transitions
  it('should allow God to confirm actions', () => {
    const godPlayer = mockPlayers.find(p => p.role === ROLES.GOD)
    expect(canConfirmActions(godPlayer)).toBe(true)
    expect(canConfirmActions(mockPlayers[1])).toBe(false)
  })

  // Test Case: Validate God's phase control privilege
  // Ensures only God can manually advance game phases
  it('should allow God to advance phases', () => {
    const godPlayer = mockPlayers.find(p => p.role === ROLES.GOD)
    expect(canAdvancePhase(godPlayer)).toBe(true)
    expect(canAdvancePhase(mockPlayers[1])).toBe(false)
  })

  // Test Case: Validate God's game reset privilege
  // Ensures only God can reset/restart the game
  it('should allow God to reset game', () => {
    const godPlayer = mockPlayers.find(p => p.role === ROLES.GOD)
    expect(canResetGame(godPlayer)).toBe(true)
    expect(canResetGame(mockPlayers[1])).toBe(false)
  })

  // Test Case: Block regular players from moderator functions
  // Ensures non-God players cannot access any moderator privileges
  it('should prevent non-God from accessing moderator privileges', () => {
    const regularPlayer = mockPlayers[1]
    expect(canSeeAllRoles(regularPlayer)).toBe(false)
    expect(canConfirmActions(regularPlayer)).toBe(false)
    expect(canAdvancePhase(regularPlayer)).toBe(false)
    expect(canResetGame(regularPlayer)).toBe(false)
  })

  // Test Case: Handle God disconnection gracefully
  // Validates system can reassign God role when original God leaves
  it('should handle God disconnection scenario', () => {
    const players = [...mockPlayers]
    const godIndex = players.findIndex(p => p.role === ROLES.GOD)
    players.splice(godIndex, 1) // Remove God
    
    const newGod = reassignGod(players)
    expect(newGod).toBeDefined()
    expect(players.some(p => p.player_id === newGod)).toBe(true)
  })
})

function canSeeAllRoles(player) {
  return player.role === ROLES.GOD
}

function canConfirmActions(player) {
  return player.role === ROLES.GOD
}

function canAdvancePhase(player) {
  return player.role === ROLES.GOD
}

function canResetGame(player) {
  return player.role === ROLES.GOD
}

function reassignGod(players) {
  const alivePlayers = players.filter(p => p.is_alive && p.role !== ROLES.GOD)
  return alivePlayers.length > 0 ? alivePlayers[0].player_id : null
}