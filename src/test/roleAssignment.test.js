import { describe, it, expect } from 'vitest'
import { 
  calculateRoleDistribution, 
  assignRoles, 
  ROLES, 
  getTeam 
} from '../utils/roleAssignment'

describe('Role Assignment', () => {
  describe('calculateRoleDistribution', () => {
    // Test Case: Validate minimum player requirement enforcement
    // Ensures game cannot start with insufficient players for proper role distribution
    it('should throw error for less than 6 players', () => {
      expect(() => calculateRoleDistribution(5)).toThrow('Need at least 6 players to start')
      expect(() => calculateRoleDistribution(3)).toThrow('Need at least 6 players to start')
    })

    // Test Case: Verify exact role distribution for minimum viable game
    // Confirms that with exactly 6 players, we get 1 of each required role
    it('should assign correct roles for exactly 6 players', () => {
      const distribution = calculateRoleDistribution(6)
      expect(distribution).toEqual({
        mafia: 1,
        citizen: 1,
        doctor: 1,
        police: 1,
        terrorist: 1,
        god: 1
      })
    })

    // Test Case: Validate role scaling for larger groups
    // Ensures all required roles are present and total count matches player count
    it('should assign correct roles for 7+ players', () => {
      const distribution7 = calculateRoleDistribution(7)
      expect(distribution7.mafia).toBeGreaterThanOrEqual(1)
      expect(distribution7.doctor).toBe(1)
      expect(distribution7.police).toBe(1)
      expect(distribution7.terrorist).toBe(1)
      expect(distribution7.god).toBe(1)
      
      const total = Object.values(distribution7).reduce((sum, count) => sum + count, 0)
      expect(total).toBe(7)
    })

    // Test Case: Verify mafia percentage stays within balanced range
    // Ensures mafia count maintains ~30% ratio for game balance
    it('should maintain ~30% mafia ratio for larger groups', () => {
      const distribution10 = calculateRoleDistribution(10)
      const nonGodPlayers = 9
      const mafiaRatio = distribution10.mafia / nonGodPlayers
      expect(mafiaRatio).toBeGreaterThanOrEqual(0.2)
      expect(mafiaRatio).toBeLessThanOrEqual(0.4)
    })
  })

  describe('assignRoles', () => {
    // Test Case: Prevent game start with insufficient players
    // Validates that role assignment fails when minimum player count not met
    it('should throw error for insufficient players', () => {
      expect(() => assignRoles(['p1', 'p2', 'p3'])).toThrow('Need at least 6 players to start')
    })

    // Test Case: Ensure single God moderator per game
    // Critical for game control - exactly one player must be assigned God role
    it('should assign exactly one God per game', () => {
      const playerIds = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6']
      const assignments = assignRoles(playerIds)
      
      const godCount = Object.values(assignments).filter(role => role === ROLES.GOD).length
      expect(godCount).toBe(1)
    })

    // Test Case: Verify all essential roles are assigned
    // Ensures game has all required roles for proper gameplay mechanics
    it('should assign all required roles', () => {
      const playerIds = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6']
      const assignments = assignRoles(playerIds)
      
      const roles = Object.values(assignments)
      expect(roles).toContain(ROLES.GOD)
      expect(roles).toContain(ROLES.DOCTOR)
      expect(roles).toContain(ROLES.POLICE)
      expect(roles).toContain(ROLES.TERRORIST)
      expect(roles).toContain(ROLES.MAFIA)
    })

    // Test Case: Validate unique role constraints
    // Ensures special roles (God, Doctor, Police, Terrorist) appear exactly once
    it('should not assign duplicate roles except for citizens/mafia', () => {
      const playerIds = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7']
      const assignments = assignRoles(playerIds)
      
      const roles = Object.values(assignments)
      const uniqueRoles = [ROLES.GOD, ROLES.DOCTOR, ROLES.POLICE, ROLES.TERRORIST]
      
      uniqueRoles.forEach(role => {
        const count = roles.filter(r => r === role).length
        expect(count).toBe(1)
      })
    })

    // Test Case: Ensure complete role assignment coverage
    // Validates that every player receives a role assignment
    it('should assign roles to all players', () => {
      const playerIds = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6']
      const assignments = assignRoles(playerIds)
      
      expect(Object.keys(assignments)).toHaveLength(6)
      playerIds.forEach(id => {
        expect(assignments[id]).toBeDefined()
      })
    })

    // Test Case: Verify randomization in role assignment
    // Ensures role assignment is not deterministic (prevents predictable patterns)
    it('should produce different assignments on multiple runs', () => {
      const playerIds = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6']
      const assignments1 = assignRoles(playerIds)
      const assignments2 = assignRoles(playerIds)
      
      // Should be different (very high probability)
      const same = Object.keys(assignments1).every(id => 
        assignments1[id] === assignments2[id]
      )
      expect(same).toBe(false)
    })
  })

  describe('getTeam', () => {
    // Test Case: Validate team classification for win conditions
    // Ensures each role is correctly categorized for win condition calculations
    it('should return correct teams for all roles', () => {
      expect(getTeam(ROLES.MAFIA)).toBe('mafia')
      expect(getTeam(ROLES.CITIZEN)).toBe('citizen')
      expect(getTeam(ROLES.DOCTOR)).toBe('citizen')
      expect(getTeam(ROLES.POLICE)).toBe('citizen')
      expect(getTeam(ROLES.TERRORIST)).toBe('neutral')
      expect(getTeam(ROLES.GOD)).toBe('neutral')
    })
  })
})