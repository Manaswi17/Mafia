import { describe, it, expect } from 'vitest'
import { canGodAdvancePhase, getConfirmationErrorMessage } from '../utils/godConfirmation'
import { GAME_PHASES } from '../utils/gamePhases'

describe('Voting Phase Confirmation', () => {
  // Test Case: God can advance during voting phase even with unconfirmed actions
  // Ensures voting phase works correctly since votes are auto-confirmed
  it('should allow God to advance during voting phase regardless of confirmation status', () => {
    const unconfirmedActions = [
      { player_id: 'p1', action_type: 'vote', confirmed: false },
      { player_id: 'p2', action_type: 'vote', confirmed: false }
    ]

    const result = canGodAdvancePhase(unconfirmedActions, GAME_PHASES.VOTING)
    expect(result).toBe(true)
  })

  // Test Case: God cannot advance during night phase with unconfirmed actions
  // Ensures normal confirmation logic still works for night actions
  it('should block God from advancing during night phase with unconfirmed actions', () => {
    const unconfirmedActions = [
      { player_id: 'p1', action_type: 'mafia_kill', confirmed: false }
    ]

    const result = canGodAdvancePhase(unconfirmedActions, GAME_PHASES.NIGHT)
    expect(result).toBe(false)
  })

  // Test Case: No error message during voting phase
  // Ensures voting phase doesn't show confirmation error messages
  it('should return null error message during voting phase', () => {
    const unconfirmedActions = [
      { player_id: 'p1', action_type: 'vote', confirmed: false }
    ]

    const result = getConfirmationErrorMessage(unconfirmedActions, GAME_PHASES.VOTING)
    expect(result).toBe(null)
  })

  // Test Case: Error message during night phase with unconfirmed actions
  // Ensures normal error messaging still works for night actions
  it('should return error message during night phase with unconfirmed actions', () => {
    const unconfirmedActions = [
      { player_id: 'p1', action_type: 'mafia_kill', confirmed: false }
    ]

    const result = getConfirmationErrorMessage(unconfirmedActions, GAME_PHASES.NIGHT)
    expect(result).toContain('Please confirm all actions')
    expect(result).toContain('1 unconfirmed action(s)')
  })
})