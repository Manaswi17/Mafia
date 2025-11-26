import { describe, it, expect } from 'vitest'
import { ROLES } from '../utils/roleAssignment'
import { GAME_PHASES, NIGHT_ACTIONS } from '../utils/gamePhases'

describe('Phase Transition Requirements', () => {
  const mockPlayers = [
    { player_id: 'p1', role: ROLES.MAFIA, is_alive: true },
    { player_id: 'p2', role: ROLES.DOCTOR, is_alive: true },
    { player_id: 'p3', role: ROLES.POLICE, is_alive: true },
    { player_id: 'p4', role: ROLES.TERRORIST, is_alive: true },
    { player_id: 'p5', role: ROLES.CITIZEN, is_alive: true },
    { player_id: 'p6', role: ROLES.GOD, is_alive: true }
  ]

  // Test Case: Prevent phase transition until all night actions completed
  // Ensures all alive players with night abilities have acted before moving to day
  it('should block day phase until all night actions completed', () => {
    const incompleteActions = [
      { player_id: 'p1', action_type: NIGHT_ACTIONS.MAFIA_KILL, confirmed: false }
      // Missing doctor and police actions
    ]
    
    const canAdvance = canAdvanceToDay(mockPlayers, incompleteActions)
    expect(canAdvance).toBe(false)
  })

  // Test Case: Allow phase transition when all required actions submitted
  // Validates day phase can start when all night roles have acted
  it('should allow day phase when all night actions completed', () => {
    const completeActions = [
      { player_id: 'p1', action_type: NIGHT_ACTIONS.MAFIA_KILL, confirmed: false },
      { player_id: 'p2', action_type: NIGHT_ACTIONS.DOCTOR_PROTECT, confirmed: false },
      { player_id: 'p3', action_type: NIGHT_ACTIONS.POLICE_INVESTIGATE, confirmed: false }
      // Terrorist action is optional
    ]
    
    const canAdvance = canAdvanceToDay(mockPlayers, completeActions)
    expect(canAdvance).toBe(true)
  })

  // Test Case: Handle dead players in action completion check
  // Ensures dead players don't block phase transition
  it('should ignore dead players for action completion', () => {
    const playersWithDead = [
      { player_id: 'p1', role: ROLES.MAFIA, is_alive: false },
      { player_id: 'p2', role: ROLES.DOCTOR, is_alive: true },
      { player_id: 'p3', role: ROLES.POLICE, is_alive: true },
      { player_id: 'p6', role: ROLES.GOD, is_alive: true }
    ]
    
    const actions = [
      { player_id: 'p2', action_type: NIGHT_ACTIONS.DOCTOR_PROTECT, confirmed: false },
      { player_id: 'p3', action_type: NIGHT_ACTIONS.POLICE_INVESTIGATE, confirmed: false }
    ]
    
    const canAdvance = canAdvanceToDay(playersWithDead, actions)
    expect(canAdvance).toBe(true)
  })

  // Test Case: Mafia kill limit enforcement per round
  // Validates mafia can only kill once per night phase
  it('should enforce mafia kill once per round limit', () => {
    const mafiaActions = [
      { player_id: 'p1', action_type: NIGHT_ACTIONS.MAFIA_KILL, target_player_id: 'p5' }
    ]
    
    const canKillAgain = canMafiaKillAgain('p1', mafiaActions)
    expect(canKillAgain).toBe(false)
  })
})

// Helper functions for phase transition logic
function canAdvanceToDay(players, actions) {
  const aliveNightRoles = players.filter(p => 
    p.is_alive && 
    [ROLES.MAFIA, ROLES.DOCTOR, ROLES.POLICE].includes(p.role)
  )
  
  const requiredActions = aliveNightRoles.map(p => p.player_id)
  const submittedActions = actions.map(a => a.player_id)
  
  return requiredActions.every(playerId => submittedActions.includes(playerId))
}

function canMafiaKillAgain(mafiaId, actions) {
  return !actions.some(a => 
    a.player_id === mafiaId && 
    a.action_type === NIGHT_ACTIONS.MAFIA_KILL
  )
}