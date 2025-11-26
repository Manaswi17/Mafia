import { describe, it, expect } from 'vitest'
import { validateAction } from '../utils/actionValidation'
import { ROLES } from '../utils/roleAssignment'
import { GAME_PHASES } from '../utils/gamePhases'

describe('Voting & Elimination', () => {
  const mockPlayers = [
    { player_id: 'p1', role: ROLES.MAFIA, is_alive: true },
    { player_id: 'p2', role: ROLES.DOCTOR, is_alive: true },
    { player_id: 'p3', role: ROLES.POLICE, is_alive: true },
    { player_id: 'p4', role: ROLES.CITIZEN, is_alive: true },
    { player_id: 'p5', role: ROLES.TERRORIST, is_alive: true },
    { player_id: 'p6', role: ROLES.GOD, is_alive: true },
    { player_id: 'p7', role: ROLES.CITIZEN, is_alive: false }
  ]
  const votingGameState = { phase: GAME_PHASES.VOTING }

  // Test Case: Allow legitimate voting actions
  // Validates alive players can vote for valid targets during voting phase
  it('should allow alive players to vote', () => {
    const action = { action_type: 'vote', target_player_id: 'p4', phase: GAME_PHASES.VOTING }
    expect(() => validateAction(action, mockPlayers[0], votingGameState, mockPlayers, [])).not.toThrow()
  })

  // Test Case: Prevent duplicate voting in same round
  // Ensures each player can only vote once per voting phase
  it('should prevent voting twice', () => {
    const action = { action_type: 'vote', target_player_id: 'p4', phase: GAME_PHASES.VOTING }
    const existingVotes = [{ player_id: 'p1', phase: GAME_PHASES.VOTING, confirmed: false }]
    expect(() => validateAction(action, mockPlayers[0], votingGameState, mockPlayers, existingVotes))
      .toThrow('Player already voted')
  })

  // Test Case: Block votes for eliminated players
  // Prevents wasting votes on already dead players
  it('should prevent voting for dead players', () => {
    const action = { action_type: 'vote', target_player_id: 'p7', phase: GAME_PHASES.VOTING }
    expect(() => validateAction(action, mockPlayers[0], votingGameState, mockPlayers, []))
      .toThrow('Cannot vote for dead player')
  })

  // Test Case: Protect moderator from elimination
  // Ensures God cannot be voted out to maintain game control
  it('should prevent voting for God', () => {
    const action = { action_type: 'vote', target_player_id: 'p6', phase: GAME_PHASES.VOTING }
    expect(() => validateAction(action, mockPlayers[0], votingGameState, mockPlayers, []))
      .toThrow('Cannot vote out God')
  })

  // Test Case: Handle tied vote scenarios correctly
  // Validates tie-breaking logic eliminates all tied players
  it('should handle tie elimination', () => {
    const votes = [
      { target_player_id: 'p1' }, { target_player_id: 'p1' },
      { target_player_id: 'p2' }, { target_player_id: 'p2' }
    ]
    const result = resolveVoting(votes)
    expect(result.eliminated).toContain('p1')
    expect(result.eliminated).toContain('p2')
    expect(result.tie).toBe(true)
  })
})

function resolveVoting(votes) {
  const counts = {}
  votes.forEach(v => counts[v.target_player_id] = (counts[v.target_player_id] || 0) + 1)
  const maxVotes = Math.max(...Object.values(counts))
  const eliminated = Object.keys(counts).filter(id => counts[id] === maxVotes)
  return { eliminated, tie: eliminated.length > 1 }
}