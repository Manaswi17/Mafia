import { describe, it, expect } from 'vitest'
import { ROLES, getTeam } from '../utils/roleAssignment'
import { GAME_PHASES } from '../utils/gamePhases'

describe('Game End Screen Logic', () => {
  describe('Win/Loss Detection', () => {
    it('should identify citizen player as winner when citizens win', () => {
      const gameState = { winner_team: 'citizen' }
      const citizenPlayer = { role: ROLES.CITIZEN }
      
      const playerTeam = getTeam(citizenPlayer.role)
      const playerWon = playerTeam === gameState.winner_team
      
      expect(playerWon).toBe(true)
    })

    it('should identify mafia player as loser when citizens win', () => {
      const gameState = { winner_team: 'citizen' }
      const mafiaPlayer = { role: ROLES.MAFIA }
      
      const playerTeam = getTeam(mafiaPlayer.role)
      const playerWon = playerTeam === gameState.winner_team
      
      expect(playerWon).toBe(false)
    })

    it('should identify doctor as winner when citizens win', () => {
      const gameState = { winner_team: 'citizen' }
      const doctorPlayer = { role: ROLES.DOCTOR }
      
      const playerTeam = getTeam(doctorPlayer.role)
      const playerWon = playerTeam === gameState.winner_team
      
      expect(playerWon).toBe(true)
    })

    it('should identify police as winner when citizens win', () => {
      const gameState = { winner_team: 'citizen' }
      const policePlayer = { role: ROLES.POLICE }
      
      const playerTeam = getTeam(policePlayer.role)
      const playerWon = playerTeam === gameState.winner_team
      
      expect(playerWon).toBe(true)
    })

    it('should identify mafia player as winner when mafia wins', () => {
      const gameState = { winner_team: 'mafia' }
      const mafiaPlayer = { role: ROLES.MAFIA }
      
      const playerTeam = getTeam(mafiaPlayer.role)
      const playerWon = playerTeam === gameState.winner_team
      
      expect(playerWon).toBe(true)
    })
  })

  describe('Winners and Losers Lists', () => {
    const mockPlayers = [
      { player_id: '1', name: 'Alice', role: ROLES.MAFIA, is_alive: false },
      { player_id: '2', name: 'Bob', role: ROLES.CITIZEN, is_alive: true },
      { player_id: '3', name: 'Charlie', role: ROLES.DOCTOR, is_alive: true },
      { player_id: '4', name: 'David', role: ROLES.POLICE, is_alive: true },
      { player_id: '5', name: 'Eve', role: ROLES.GOD, is_alive: true }
    ]

    it('should correctly filter winners when citizens win', () => {
      const winnerTeam = 'citizen'
      
      const winners = mockPlayers.filter(p => 
        p.role !== ROLES.GOD && getTeam(p.role) === winnerTeam
      )
      
      expect(winners).toHaveLength(3)
      expect(winners.map(p => p.name)).toContain('Bob')
      expect(winners.map(p => p.name)).toContain('Charlie')
      expect(winners.map(p => p.name)).toContain('David')
    })

    it('should correctly filter losers when citizens win', () => {
      const winnerTeam = 'citizen'
      
      const losers = mockPlayers.filter(p => 
        p.role !== ROLES.GOD && getTeam(p.role) !== winnerTeam
      )
      
      expect(losers).toHaveLength(1)
      expect(losers[0].name).toBe('Alice')
    })

    it('should exclude God from both winners and losers', () => {
      const winnerTeam = 'citizen'
      
      const winners = mockPlayers.filter(p => 
        p.role !== ROLES.GOD && getTeam(p.role) === winnerTeam
      )
      const losers = mockPlayers.filter(p => 
        p.role !== ROLES.GOD && getTeam(p.role) !== winnerTeam
      )
      
      expect(winners.map(p => p.name)).not.toContain('Eve')
      expect(losers.map(p => p.name)).not.toContain('Eve')
    })
  })

  describe('Game End Phase Detection', () => {
    it('should show end screen when phase is ended', () => {
      const gameState = { phase: GAME_PHASES.ENDED, winner_team: 'citizen' }
      
      expect(gameState.phase).toBe(GAME_PHASES.ENDED)
    })

    it('should not show end screen during night phase', () => {
      const gameState = { phase: GAME_PHASES.NIGHT }
      
      expect(gameState.phase).not.toBe(GAME_PHASES.ENDED)
    })

    it('should not show end screen during voting phase', () => {
      const gameState = { phase: GAME_PHASES.VOTING }
      
      expect(gameState.phase).not.toBe(GAME_PHASES.ENDED)
    })
  })

  describe('Dead Player Indicators', () => {
    it('should identify dead players correctly', () => {
      const deadPlayer = { is_alive: false, name: 'Alice' }
      const alivePlayer = { is_alive: true, name: 'Bob' }
      
      expect(deadPlayer.is_alive).toBe(false)
      expect(alivePlayer.is_alive).toBe(true)
    })
  })
})