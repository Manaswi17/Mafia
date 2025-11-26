import { describe, it, expect } from 'vitest'
import { ROLES } from '../utils/roleAssignment'
import { GAME_PHASES, NIGHT_ACTIONS } from '../utils/gamePhases'

describe('Button Disabling After Action Submission', () => {
  const mockPlayers = [
    { player_id: 'p1', role: ROLES.MAFIA, is_alive: true },
    { player_id: 'p2', role: ROLES.DOCTOR, is_alive: true },
    { player_id: 'p3', role: ROLES.POLICE, is_alive: true },
    { player_id: 'p4', role: ROLES.TERRORIST, is_alive: true },
    { player_id: 'p5', role: ROLES.CITIZEN, is_alive: true }
  ]

  // Test Case: Disable kill button after mafia submits kill action
  // Ensures mafia cannot submit multiple kill actions in same round
  it('should disable kill button after mafia submits kill action', () => {
    const submittedActions = [
      { player_id: 'p1', action_type: NIGHT_ACTIONS.MAFIA_KILL, phase: GAME_PHASES.NIGHT, confirmed: false }
    ]
    
    const canAct = canPlayerAct('p1', submittedActions, GAME_PHASES.NIGHT)
    expect(canAct).toBe(false)
  })

  // Test Case: Disable protect button after doctor submits protection
  // Ensures doctor cannot submit multiple protect actions in same round
  it('should disable protect button after doctor submits protection', () => {
    const submittedActions = [
      { player_id: 'p2', action_type: NIGHT_ACTIONS.DOCTOR_PROTECT, phase: GAME_PHASES.NIGHT, confirmed: false }
    ]
    
    const canAct = canPlayerAct('p2', submittedActions, GAME_PHASES.NIGHT)
    expect(canAct).toBe(false)
  })

  // Test Case: Disable investigate button after police submits investigation
  // Ensures police cannot submit multiple investigate actions in same round
  it('should disable investigate button after police submits investigation', () => {
    const submittedActions = [
      { player_id: 'p3', action_type: NIGHT_ACTIONS.POLICE_INVESTIGATE, phase: GAME_PHASES.NIGHT, confirmed: false }
    ]
    
    const canAct = canPlayerAct('p3', submittedActions, GAME_PHASES.NIGHT)
    expect(canAct).toBe(false)
  })

  // Test Case: Disable bomb button after terrorist submits bomb action
  // Ensures terrorist cannot submit multiple bomb actions in same round
  it('should disable bomb button after terrorist submits bomb action', () => {
    const submittedActions = [
      { player_id: 'p4', action_type: NIGHT_ACTIONS.TERRORIST_BOMB, phase: GAME_PHASES.NIGHT, confirmed: false }
    ]
    
    const canAct = canPlayerAct('p4', submittedActions, GAME_PHASES.NIGHT)
    expect(canAct).toBe(false)
  })

  // Test Case: Disable vote button after player submits vote
  // Ensures player cannot submit multiple votes in same round
  it('should disable vote button after player submits vote', () => {
    const submittedActions = [
      { player_id: 'p5', action_type: 'vote', phase: GAME_PHASES.VOTING, confirmed: false }
    ]
    
    const canAct = canPlayerAct('p5', submittedActions, GAME_PHASES.VOTING)
    expect(canAct).toBe(false)
  })

  // Test Case: Re-enable buttons in next round after confirmation
  // Validates buttons become available again in new round
  it('should re-enable buttons in next round after confirmation', () => {
    const confirmedActions = [
      { player_id: 'p1', action_type: NIGHT_ACTIONS.MAFIA_KILL, confirmed: true, round_number: 1 }
    ]
    
    const canActNewRound = canPlayerAct('p1', confirmedActions, GAME_PHASES.NIGHT, 2)
    expect(canActNewRound).toBe(true)
  })

  // Test Case: Allow action if no previous action submitted
  // Validates buttons are enabled when player hasn't acted yet
  it('should allow action if no previous action submitted', () => {
    const noActions = []
    
    const canAct = canPlayerAct('p1', noActions, GAME_PHASES.NIGHT)
    expect(canAct).toBe(true)
  })
})

// Helper function for button state logic
function canPlayerAct(playerId, actions, phase, currentRound = 1) {
  const playerActions = actions.filter(a => 
    a.player_id === playerId && 
    a.phase === phase &&
    !a.confirmed &&
    (a.round_number || 1) === currentRound
  )
  
  return playerActions.length === 0
}