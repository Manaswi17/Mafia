import { describe, it, expect } from 'vitest'
import { checkWinCondition, getWinningPlayers } from '../utils/winConditions'
import { ROLES } from '../utils/roleAssignment'

describe('Win Conditions', () => {
  describe('checkWinCondition', () => {
    // Test Case: Detect mafia victory when they equal citizen count
    // Validates mafia win condition when mafia count >= citizen count
    it('should detect mafia win when mafia equals citizens', () => {
      const players = [
        { player_id: 'p1', role: ROLES.MAFIA, is_alive: true },
        { player_id: 'p2', role: ROLES.CITIZEN, is_alive: true },
        { player_id: 'p3', role: ROLES.GOD, is_alive: true }
      ]

      const result = checkWinCondition(players)
      expect(result.winner).toBe('mafia')
      expect(result.reason).toBe('Mafia equals or outnumbers other players')
    })

    // Test Case: Detect mafia victory when they outnumber citizens
    // Validates mafia win condition when mafia count > citizen count
    it('should detect mafia win when mafia outnumbers citizens', () => {
      const players = [
        { player_id: 'p1', role: ROLES.MAFIA, is_alive: true },
        { player_id: 'p2', role: ROLES.MAFIA, is_alive: true },
        { player_id: 'p3', role: ROLES.CITIZEN, is_alive: true },
        { player_id: 'p4', role: ROLES.GOD, is_alive: true }
      ]

      const result = checkWinCondition(players)
      expect(result.winner).toBe('mafia')
    })

    // Test Case: Detect citizen victory when all mafia eliminated
    // Validates citizen win condition when no mafia remain alive
    it('should detect citizen win when all mafia eliminated', () => {
      const players = [
        { player_id: 'p1', role: ROLES.MAFIA, is_alive: false },
        { player_id: 'p2', role: ROLES.CITIZEN, is_alive: true },
        { player_id: 'p3', role: ROLES.DOCTOR, is_alive: true },
        { player_id: 'p4', role: ROLES.POLICE, is_alive: true },
        { player_id: 'p5', role: ROLES.GOD, is_alive: true }
      ]

      const result = checkWinCondition(players)
      expect(result.winner).toBe('citizen')
      expect(result.reason).toBe('All Mafia eliminated')
    })

    // Test Case: Continue game when no win condition is met
    // Validates game continues when both mafia and citizens remain
    it('should continue game when neither win condition met', () => {
      const players = [
        { player_id: 'p1', role: ROLES.MAFIA, is_alive: true },
        { player_id: 'p2', role: ROLES.CITIZEN, is_alive: true },
        { player_id: 'p3', role: ROLES.DOCTOR, is_alive: true },
        { player_id: 'p4', role: ROLES.POLICE, is_alive: true },
        { player_id: 'p5', role: ROLES.GOD, is_alive: true }
      ]

      const result = checkWinCondition(players)
      expect(result.winner).toBe(null)
      expect(result.reason).toBe('Game continues')
    })

    // Test Case: Validate terrorist impact on win calculations
    // Ensures neutral roles (terrorist) don't prevent mafia victory
    it('should handle terrorist impact on win conditions', () => {
      const players = [
        { player_id: 'p1', role: ROLES.MAFIA, is_alive: true },
        { player_id: 'p2', role: ROLES.CITIZEN, is_alive: true },
        { player_id: 'p3', role: ROLES.TERRORIST, is_alive: true },
        { player_id: 'p4', role: ROLES.GOD, is_alive: true }
      ]

      const result = checkWinCondition(players)
      expect(result.winner).toBe('mafia') // 1 mafia vs 1 citizen + 1 neutral
    })

    // Test Case: Exclude God from win condition calculations
    // Ensures moderator role doesn't affect game outcome
    it('should ignore God in win calculations', () => {
      const players = [
        { player_id: 'p1', role: ROLES.MAFIA, is_alive: true },
        { player_id: 'p2', role: ROLES.CITIZEN, is_alive: true },
        { player_id: 'p3', role: ROLES.GOD, is_alive: true }
      ]

      const result = checkWinCondition(players)
      expect(result.winner).toBe('mafia') // God doesn't count
    })
  })

  describe('getWinningPlayers', () => {
    const players = [
      { player_id: 'p1', role: ROLES.MAFIA, name: 'Player1' },
      { player_id: 'p2', role: ROLES.CITIZEN, name: 'Player2' },
      { player_id: 'p3', role: ROLES.DOCTOR, name: 'Player3' },
      { player_id: 'p4', role: ROLES.GOD, name: 'Player4' }
    ]

    it('should return mafia players for mafia win', () => {
      const winners = getWinningPlayers(players, 'mafia')
      expect(winners).toHaveLength(1)
      expect(winners[0].role).toBe(ROLES.MAFIA)
    })

    it('should return citizen team players for citizen win', () => {
      const winners = getWinningPlayers(players, 'citizen')
      expect(winners).toHaveLength(2)
      expect(winners.map(p => p.role)).toContain(ROLES.CITIZEN)
      expect(winners.map(p => p.role)).toContain(ROLES.DOCTOR)
    })

    it('should exclude God from winners', () => {
      const winners = getWinningPlayers(players, 'citizen')
      expect(winners.map(p => p.role)).not.toContain(ROLES.GOD)
    })

    it('should return empty array for no winner', () => {
      const winners = getWinningPlayers(players, null)
      expect(winners).toHaveLength(0)
    })
  })
})