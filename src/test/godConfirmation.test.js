import { describe, it, expect } from 'vitest'
import { ROLES } from '../utils/roleAssignment'
import { GAME_PHASES, NIGHT_ACTIONS } from '../utils/gamePhases'

describe('God Confirmation Requirements', () => {
  const mockPlayers = [
    { player_id: 'p1', role: ROLES.MAFIA, is_alive: true },
    { player_id: 'p2', role: ROLES.DOCTOR, is_alive: true },
    { player_id: 'p3', role: ROLES.POLICE, is_alive: true },
    { player_id: 'p6', role: ROLES.GOD, is_alive: true }
  ]

  // Test Case: Block next phase when unconfirmed actions exist
  // Prevents God from advancing phase without confirming all actions
  it('should block next phase when unconfirmed actions exist', () => {
    const unconfirmedActions = [
      { player_id: 'p1', action_type: NIGHT_ACTIONS.MAFIA_KILL, confirmed: false },
      { player_id: 'p2', action_type: NIGHT_ACTIONS.DOCTOR_PROTECT, confirmed: false },
      { player_id: 'p3', action_type: NIGHT_ACTIONS.POLICE_INVESTIGATE, confirmed: false }
    ]
    
    const canAdvance = canGodAdvanceWithoutConfirming(mockPlayers, unconfirmedActions, GAME_PHASES.NIGHT)
    expect(canAdvance).toBe(false)
  })

  // Test Case: Allow next phase when all actions confirmed
  // Validates God can advance phase after confirming all actions
  it('should allow next phase when all actions confirmed', () => {
    const confirmedActions = [
      { player_id: 'p1', action_type: NIGHT_ACTIONS.MAFIA_KILL, confirmed: true },
      { player_id: 'p2', action_type: NIGHT_ACTIONS.DOCTOR_PROTECT, confirmed: true },
      { player_id: 'p3', action_type: NIGHT_ACTIONS.POLICE_INVESTIGATE, confirmed: true }
    ]
    
    const canAdvance = canGodAdvanceWithoutConfirming(mockPlayers, confirmedActions, GAME_PHASES.NIGHT)
    expect(canAdvance).toBe(true)
  })

  // Test Case: Block next phase with partial confirmations
  // Ensures God must confirm ALL actions before advancing
  it('should block next phase with partial confirmations', () => {
    const partiallyConfirmedActions = [
      { player_id: 'p1', action_type: NIGHT_ACTIONS.MAFIA_KILL, confirmed: true },
      { player_id: 'p2', action_type: NIGHT_ACTIONS.DOCTOR_PROTECT, confirmed: false },
      { player_id: 'p3', action_type: NIGHT_ACTIONS.POLICE_INVESTIGATE, confirmed: false }
    ]
    
    const canAdvance = canGodAdvanceWithoutConfirming(mockPlayers, partiallyConfirmedActions, GAME_PHASES.NIGHT)
    expect(canAdvance).toBe(false)
  })

  // Test Case: Generate error message for unconfirmed actions
  // Validates proper error messaging when God tries to advance prematurely
  it('should generate error message for unconfirmed actions', () => {
    const unconfirmedActions = [
      { player_id: 'p1', action_type: NIGHT_ACTIONS.MAFIA_KILL, confirmed: false },
      { player_id: 'p2', action_type: NIGHT_ACTIONS.DOCTOR_PROTECT, confirmed: false }
    ]
    
    const errorMessage = getConfirmationErrorMessage(mockPlayers, unconfirmedActions)
    expect(errorMessage).toContain('confirm all actions')
    expect(errorMessage).toContain('2 unconfirmed')
  })

  // Test Case: Allow phase advance when no actions submitted
  // Validates God can advance if no players have acted yet
  it('should allow phase advance when no actions submitted', () => {
    const noActions = []
    
    const canAdvance = canGodAdvanceWithoutConfirming(mockPlayers, noActions, GAME_PHASES.NIGHT)
    expect(canAdvance).toBe(true)
  })

  // Test Case: Block voting phase advance with unconfirmed votes
  // Ensures God must confirm votes before advancing from voting phase
  it('should block voting phase advance with unconfirmed votes', () => {
    const unconfirmedVotes = [
      { player_id: 'p1', action_type: 'vote', target_player_id: 'p2', confirmed: false },
      { player_id: 'p2', action_type: 'vote', target_player_id: 'p1', confirmed: false }
    ]
    
    const canAdvance = canGodAdvanceWithoutConfirming(mockPlayers, unconfirmedVotes, GAME_PHASES.VOTING)
    expect(canAdvance).toBe(false)
  })

  // Test Case: Count unconfirmed actions correctly
  // Validates accurate counting of pending confirmations
  it('should count unconfirmed actions correctly', () => {
    const mixedActions = [
      { player_id: 'p1', action_type: NIGHT_ACTIONS.MAFIA_KILL, confirmed: true },
      { player_id: 'p2', action_type: NIGHT_ACTIONS.DOCTOR_PROTECT, confirmed: false },
      { player_id: 'p3', action_type: NIGHT_ACTIONS.POLICE_INVESTIGATE, confirmed: false }
    ]
    
    const unconfirmedCount = getUnconfirmedActionCount(mixedActions)
    expect(unconfirmedCount).toBe(2)
  })
})

// Helper functions for God confirmation logic
function canGodAdvanceWithoutConfirming(players, actions, phase) {
  const unconfirmedActions = actions.filter(a => !a.confirmed)
  return unconfirmedActions.length === 0
}

function getConfirmationErrorMessage(players, actions) {
  const unconfirmedCount = actions.filter(a => !a.confirmed).length
  if (unconfirmedCount === 0) return null
  
  return `Please confirm all actions before advancing phase. ${unconfirmedCount} unconfirmed action(s) remaining.`
}

function getUnconfirmedActionCount(actions) {
  return actions.filter(a => !a.confirmed).length
}