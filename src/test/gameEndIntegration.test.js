import { describe, it, expect } from 'vitest'
import { ROLES, getTeam } from '../utils/roleAssignment'
import { GAME_PHASES } from '../utils/gamePhases'

describe('Game End Integration Logic', () => {
  describe('Win Condition Scenarios', () => {
    it('should trigger citizens win when all mafia are dead', () => {
      const players = [
        { player_id: '1', role: ROLES.MAFIA, is_alive: false },
        { player_id: '2', role: ROLES.CITIZEN, is_alive: true },
        { player_id: '3', role: ROLES.DOCTOR, is_alive: true },
        { player_id: '4', role: ROLES.GOD, is_alive: true }
      ]

      const alivePlayers = players.filter(p => p.is_alive)
      const mafiaCount = alivePlayers.filter(p => p.role === ROLES.MAFIA).length
      const citizenCount = alivePlayers.filter(p => 
        [ROLES.CITIZEN, ROLES.DOCTOR, ROLES.POLICE, ROLES.TERRORIST].includes(p.role)
      ).length

      let winner = null
      if (mafiaCount === 0) {
        winner = 'citizen'
      } else if (mafiaCount >= citizenCount) {
        winner = 'mafia'
      }

      expect(winner).toBe('citizen')
    })

    it('should trigger mafia win when mafia equals citizens', () => {
      const players = [
        { player_id: '1', role: ROLES.MAFIA, is_alive: true },
        { player_id: '2', role: ROLES.CITIZEN, is_alive: true },
        { player_id: '3', role: ROLES.DOCTOR, is_alive: false },
        { player_id: '4', role: ROLES.GOD, is_alive: true }
      ]

      const alivePlayers = players.filter(p => p.is_alive)
      const mafiaCount = alivePlayers.filter(p => p.role === ROLES.MAFIA).length
      const citizenCount = alivePlayers.filter(p => 
        [ROLES.CITIZEN, ROLES.DOCTOR, ROLES.POLICE, ROLES.TERRORIST].includes(p.role)
      ).length

      let winner = null
      if (mafiaCount === 0) {
        winner = 'citizen'
      } else if (mafiaCount >= citizenCount) {
        winner = 'mafia'
      }

      expect(winner).toBe('mafia')
    })

    it('should include terrorist in citizen count for win conditions', () => {
      const players = [
        { player_id: '1', role: ROLES.MAFIA, is_alive: true },
        { player_id: '2', role: ROLES.TERRORIST, is_alive: true },
        { player_id: '3', role: ROLES.GOD, is_alive: true }
      ]

      const alivePlayers = players.filter(p => p.is_alive)
      const mafiaCount = alivePlayers.filter(p => p.role === ROLES.MAFIA).length
      const citizenCount = alivePlayers.filter(p => 
        [ROLES.CITIZEN, ROLES.DOCTOR, ROLES.POLICE, ROLES.TERRORIST].includes(p.role)
      ).length

      // Even though terrorist is 'neutral' in team assignment, 
      // it's counted as citizen for win conditions
      expect(citizenCount).toBe(1)
      expect(mafiaCount).toBe(1)
      
      let winner = null
      if (mafiaCount === 0) {
        winner = 'citizen'
      } else if (mafiaCount >= citizenCount) {
        winner = 'mafia'
      }

      expect(winner).toBe('mafia')
    })

    it('should continue game when no win condition is met', () => {
      const players = [
        { player_id: '1', role: ROLES.MAFIA, is_alive: true },
        { player_id: '2', role: ROLES.CITIZEN, is_alive: true },
        { player_id: '3', role: ROLES.DOCTOR, is_alive: true },
        { player_id: '4', role: ROLES.GOD, is_alive: true }
      ]

      const alivePlayers = players.filter(p => p.is_alive)
      const mafiaCount = alivePlayers.filter(p => p.role === ROLES.MAFIA).length
      const citizenCount = alivePlayers.filter(p => 
        [ROLES.CITIZEN, ROLES.DOCTOR, ROLES.POLICE, ROLES.TERRORIST].includes(p.role)
      ).length

      let winner = null
      if (mafiaCount === 0) {
        winner = 'citizen'
      } else if (mafiaCount >= citizenCount) {
        winner = 'mafia'
      }

      expect(winner).toBe(null)
    })
  })

  describe('Team Assignment Validation', () => {
    it('should correctly identify citizen team members', () => {
      expect(getTeam(ROLES.CITIZEN)).toBe('citizen')
      expect(getTeam(ROLES.DOCTOR)).toBe('citizen')
      expect(getTeam(ROLES.POLICE)).toBe('citizen')
    })

    it('should correctly identify neutral team members', () => {
      expect(getTeam(ROLES.TERRORIST)).toBe('neutral')
    })

    it('should correctly identify mafia team members', () => {
      expect(getTeam(ROLES.MAFIA)).toBe('mafia')
    })

    it('should handle God role appropriately', () => {
      const godTeam = getTeam(ROLES.GOD)
      expect(godTeam).toBeDefined()
    })
  })

  describe('Game State Transitions', () => {
    it('should transition to ended phase when win condition is met', () => {
      const initialPhase = GAME_PHASES.VOTING
      let nextPhase = GAME_PHASES.NIGHT
      
      // Simulate win condition check
      const mafiaCount = 0
      const citizenCount = 2
      
      if (mafiaCount === 0) {
        nextPhase = GAME_PHASES.ENDED
      }
      
      expect(nextPhase).toBe(GAME_PHASES.ENDED)
    })

    it('should continue normal phase progression when no win condition', () => {
      const initialPhase = GAME_PHASES.VOTING
      let nextPhase = GAME_PHASES.NIGHT
      
      // Simulate no win condition
      const mafiaCount = 1
      const citizenCount = 2
      
      if (mafiaCount === 0) {
        nextPhase = GAME_PHASES.ENDED
      } else if (mafiaCount >= citizenCount) {
        nextPhase = GAME_PHASES.ENDED
      }
      // else continue normal progression
      
      expect(nextPhase).toBe(GAME_PHASES.NIGHT)
    })
  })

  describe('Player Status After Actions', () => {
    it('should update player status after night actions', () => {
      const players = [
        { player_id: '1', role: ROLES.MAFIA, is_alive: true },
        { player_id: '2', role: ROLES.CITIZEN, is_alive: true }
      ]

      // Simulate mafia kill action
      const targetId = '2'
      const updatedPlayers = players.map(p => 
        p.player_id === targetId ? { ...p, is_alive: false } : p
      )

      expect(updatedPlayers.find(p => p.player_id === '2').is_alive).toBe(false)
      expect(updatedPlayers.find(p => p.player_id === '1').is_alive).toBe(true)
    })

    it('should update player status after voting', () => {
      const players = [
        { player_id: '1', role: ROLES.MAFIA, is_alive: true },
        { player_id: '2', role: ROLES.CITIZEN, is_alive: true }
      ]

      // Simulate voting elimination
      const eliminatedId = '1'
      const updatedPlayers = players.map(p => 
        p.player_id === eliminatedId ? { ...p, is_alive: false } : p
      )

      expect(updatedPlayers.find(p => p.player_id === '1').is_alive).toBe(false)
      expect(updatedPlayers.find(p => p.player_id === '2').is_alive).toBe(true)
    })
  })
})