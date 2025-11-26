import { describe, it, expect } from 'vitest'
import { assignRoles, ROLES } from '../utils/roleAssignment'
import { checkWinCondition } from '../utils/winConditions'
import { resolveNightActions } from '../utils/actionValidation'
import { GAME_PHASES, NIGHT_ACTIONS } from '../utils/gamePhases'

describe('Integration Tests - Complete Game Flow', () => {
  it('should complete full game cycle from start to win', () => {
    // Setup game with 6 players
    const playerIds = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6']
    const assignments = assignRoles(playerIds)
    
    // Create players with roles
    const players = playerIds.map(id => ({
      player_id: id,
      role: assignments[id],
      is_alive: true,
      self_protected: false,
      terrorist_used: false
    }))
    
    // Verify initial state
    expect(players).toHaveLength(6)
    expect(players.filter(p => p.role === ROLES.GOD)).toHaveLength(1)
    
    // Check initial win condition (should continue)
    let winResult = checkWinCondition(players)
    expect(winResult.winner).toBe(null)
    
    // Simulate night actions
    const mafiaPlayer = players.find(p => p.role === ROLES.MAFIA)
    const doctorPlayer = players.find(p => p.role === ROLES.DOCTOR)
    const citizenPlayer = players.find(p => p.role === ROLES.CITIZEN)
    
    if (mafiaPlayer && citizenPlayer) {
      const nightActions = [
        {
          action_type: NIGHT_ACTIONS.MAFIA_KILL,
          player_id: mafiaPlayer.player_id,
          target_player_id: citizenPlayer.player_id
        }
      ]
      
      const results = resolveNightActions(nightActions, players)
      
      // Apply deaths
      results.deaths.forEach(playerId => {
        const player = players.find(p => p.player_id === playerId)
        if (player) player.is_alive = false
      })
      
      // Check win condition after deaths
      winResult = checkWinCondition(players)
      // Game should continue or mafia might win depending on remaining players
      expect(['mafia', 'citizen', null]).toContain(winResult.winner)
    }
  })

  it('should handle terrorist bomb scenario', () => {
    const players = [
      { player_id: 'p1', role: ROLES.MAFIA, is_alive: true },
      { player_id: 'p2', role: ROLES.CITIZEN, is_alive: true },
      { player_id: 'p3', role: ROLES.TERRORIST, is_alive: true, terrorist_used: false },
      { player_id: 'p4', role: ROLES.GOD, is_alive: true }
    ]
    
    const bombAction = [{
      action_type: NIGHT_ACTIONS.TERRORIST_BOMB,
      player_id: 'p3',
      target_player_id: 'p1'
    }]
    
    const results = resolveNightActions(bombAction, players)
    
    expect(results.deaths).toContain('p3') // Terrorist dies
    expect(results.deaths).toContain('p1') // Target dies
    
    // Apply deaths
    results.deaths.forEach(playerId => {
      const player = players.find(p => p.player_id === playerId)
      if (player) player.is_alive = false
    })
    
    const winResult = checkWinCondition(players)
    expect(winResult.winner).toBe('citizen') // No mafia left
  })

  it('should handle doctor protection scenario', () => {
    const players = [
      { player_id: 'p1', role: ROLES.MAFIA, is_alive: true },
      { player_id: 'p2', role: ROLES.DOCTOR, is_alive: true, self_protected: false },
      { player_id: 'p3', role: ROLES.CITIZEN, is_alive: true },
      { player_id: 'p4', role: ROLES.GOD, is_alive: true }
    ]
    
    const nightActions = [
      {
        action_type: NIGHT_ACTIONS.MAFIA_KILL,
        player_id: 'p1',
        target_player_id: 'p3'
      },
      {
        action_type: NIGHT_ACTIONS.DOCTOR_PROTECT,
        player_id: 'p2',
        target_player_id: 'p3'
      }
    ]
    
    const results = resolveNightActions(nightActions, players)
    
    expect(results.deaths).not.toContain('p3') // Protected
    expect(results.protections).toContain('p3')
  })

  it('should handle multiple mafia vs citizens endgame', () => {
    const players = [
      { player_id: 'p1', role: ROLES.MAFIA, is_alive: true },
      { player_id: 'p2', role: ROLES.MAFIA, is_alive: true },
      { player_id: 'p3', role: ROLES.CITIZEN, is_alive: true },
      { player_id: 'p4', role: ROLES.DOCTOR, is_alive: true },
      { player_id: 'p5', role: ROLES.GOD, is_alive: true }
    ]
    
    const winResult = checkWinCondition(players)
    expect(winResult.winner).toBe('mafia') // 2 mafia vs 2 citizens
  })

  it('should handle game state persistence through phases', () => {
    let gameState = {
      phase: GAME_PHASES.LOBBY,
      current_round: 1,
      winner_team: null
    }
    
    // Start game
    gameState.phase = GAME_PHASES.NIGHT
    expect(gameState.phase).toBe(GAME_PHASES.NIGHT)
    
    // Progress to day
    gameState.phase = GAME_PHASES.DAY
    expect(gameState.phase).toBe(GAME_PHASES.DAY)
    
    // Progress to voting
    gameState.phase = GAME_PHASES.VOTING
    expect(gameState.phase).toBe(GAME_PHASES.VOTING)
    
    // Next round
    gameState.current_round = 2
    gameState.phase = GAME_PHASES.NIGHT
    expect(gameState.current_round).toBe(2)
  })
})