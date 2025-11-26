import { describe, it, expect } from 'vitest'
import {
  validateAction,
  resolveNightActions,
  ActionValidationError,
} from '../utils/actionValidation'
import { ROLES } from '../utils/roleAssignment'
import { GAME_PHASES, NIGHT_ACTIONS } from '../utils/gamePhases'

describe('Action Validation', () => {
  const mockGameState = { phase: GAME_PHASES.NIGHT }
  const mockPlayers = [
    { player_id: 'p1', role: ROLES.MAFIA, is_alive: true },
    { player_id: 'p2', role: ROLES.DOCTOR, is_alive: true, self_protected: false },
    { player_id: 'p3', role: ROLES.POLICE, is_alive: true },
    { player_id: 'p4', role: ROLES.TERRORIST, is_alive: true, terrorist_used: false },
    { player_id: 'p5', role: ROLES.CITIZEN, is_alive: true },
    { player_id: 'p6', role: ROLES.GOD, is_alive: true },
    { player_id: 'p7', role: ROLES.CITIZEN, is_alive: false }
  ]

  describe('Basic Validations', () => {
    // Test Case: Prevent dead players from taking actions
    // Ensures game integrity by blocking actions from eliminated players
    it('should reject actions from dead players', () => {
      const deadPlayer = mockPlayers.find(p => !p.is_alive)
      const action = {
        action_type: NIGHT_ACTIONS.MAFIA_KILL,
        target_player_id: 'p5',
        phase: GAME_PHASES.NIGHT
      }

      expect(() => validateAction(action, deadPlayer, mockGameState, mockPlayers, []))
        .toThrow('Dead players cannot act')
    })

    // Test Case: Enforce phase-specific action timing
    // Prevents actions from being submitted during wrong game phases
    it('should reject actions with phase mismatch', () => {
      const player = mockPlayers[0]
      const action = {
        action_type: NIGHT_ACTIONS.MAFIA_KILL,
        target_player_id: 'p5',
        phase: GAME_PHASES.DAY
      }
      
      expect(() => validateAction(action, player, mockGameState, mockPlayers, []))
        .toThrow('Action phase mismatch')
    })

    // Test Case: Prevent multiple actions per round per player
    // Ensures each player can only act once during their designated phase
    it('should reject duplicate actions in same round', () => {
      const player = mockPlayers[0]
      const action = {
        action_type: NIGHT_ACTIONS.MAFIA_KILL,
        target_player_id: 'p5',
        phase: GAME_PHASES.NIGHT
      }
      const existingActions = [{
        player_id: 'p1',
        phase: GAME_PHASES.NIGHT,
        confirmed: false
      }]

      expect(() => validateAction(action, player, mockGameState, mockPlayers, existingActions))
        .toThrow('Player already acted this round')
    })
  })

  describe('Mafia Actions', () => {
    // Test Case: Allow legitimate mafia kill actions
    // Validates that mafia can target alive, non-self players during night phase
    it('should allow valid mafia kill', () => {
      const mafiaPlayer = mockPlayers.find(p => p.role === ROLES.MAFIA)
      const action = {
        action_type: NIGHT_ACTIONS.MAFIA_KILL,
        target_player_id: 'p5',
        phase: GAME_PHASES.NIGHT
      }

      expect(() => validateAction(action, mafiaPlayer, mockGameState, mockPlayers, []))
        .not.toThrow()
    })

    // Test Case: Prevent mafia from targeting eliminated players
    // Ensures mafia cannot waste their kill on already dead players
    it('should reject mafia targeting dead player', () => {
      const mafiaPlayer = mockPlayers.find(p => p.role === ROLES.MAFIA)
      const action = {
        action_type: NIGHT_ACTIONS.MAFIA_KILL,
        target_player_id: 'p7',
        phase: GAME_PHASES.NIGHT
      }

      expect(() => validateAction(action, mafiaPlayer, mockGameState, mockPlayers, []))
        .toThrow('Cannot target dead player')
    })

    // Test Case: Prevent mafia suicide attempts
    // Blocks mafia from targeting themselves (invalid game action)
    it('should reject mafia self-targeting', () => {
      const mafiaPlayer = mockPlayers.find(p => p.role === ROLES.MAFIA)
      const action = {
        action_type: NIGHT_ACTIONS.MAFIA_KILL,
        target_player_id: 'p1',
        phase: GAME_PHASES.NIGHT
      }

      expect(() => validateAction(action, mafiaPlayer, mockGameState, mockPlayers, []))
        .toThrow('Cannot target self')
    })
  })

  describe('Doctor Actions', () => {
    // Test Case: Allow legitimate doctor protection actions
    // Validates doctor can protect other alive players during night phase
    it('should allow valid doctor protection', () => {
      const doctorPlayer = mockPlayers.find(p => p.role === ROLES.DOCTOR)
      const action = {
        action_type: NIGHT_ACTIONS.DOCTOR_PROTECT,
        target_player_id: 'p5',
        phase: GAME_PHASES.NIGHT
      }

      expect(() => validateAction(action, doctorPlayer, mockGameState, mockPlayers, []))
        .not.toThrow()
    })

    // Test Case: Allow doctor's first self-protection
    // Ensures doctor can use their one-time self-protection ability
    it('should allow first self-protection', () => {
      const doctorPlayer = mockPlayers.find(p => p.role === ROLES.DOCTOR)
      const action = {
        action_type: NIGHT_ACTIONS.DOCTOR_PROTECT,
        target_player_id: 'p2',
        phase: GAME_PHASES.NIGHT
      }

      expect(() => validateAction(action, doctorPlayer, mockGameState, mockPlayers, []))
        .not.toThrow()
    })

    // Test Case: Enforce doctor self-protection limit
    // Prevents doctor from self-protecting multiple times (game balance rule)
    it('should reject second self-protection', () => {
      const doctorPlayer = { ...mockPlayers.find(p => p.role === ROLES.DOCTOR), self_protected: true }
      const action = {
        action_type: NIGHT_ACTIONS.DOCTOR_PROTECT,
        target_player_id: 'p2',
        phase: GAME_PHASES.NIGHT
      }

      expect(() => validateAction(action, doctorPlayer, mockGameState, mockPlayers, []))
        .toThrow('Doctor can only self-protect once per game')
    })
  })

  describe('Terrorist Actions', () => {
    // Test Case: Allow terrorist's one-time bomb ability
    // Validates terrorist can use their single-use bomb action
    it('should allow first terrorist bomb', () => {
      const terroristPlayer = mockPlayers.find(p => p.role === ROLES.TERRORIST)
      const action = {
        action_type: NIGHT_ACTIONS.TERRORIST_BOMB,
        target_player_id: 'p5',
        phase: GAME_PHASES.NIGHT
      }

      expect(() => validateAction(action, terroristPlayer, mockGameState, mockPlayers, []))
        .not.toThrow()
    })

    // Test Case: Enforce terrorist single-use constraint
    // Prevents terrorist from bombing multiple times (critical game balance rule)
    it('should reject second terrorist bomb', () => {
      const terroristPlayer = { ...mockPlayers.find(p => p.role === ROLES.TERRORIST), terrorist_used: true }
      const action = {
        action_type: NIGHT_ACTIONS.TERRORIST_BOMB,
        target_player_id: 'p5',
        phase: GAME_PHASES.NIGHT
      }

      expect(() => validateAction(action, terroristPlayer, mockGameState, mockPlayers, []))
        .toThrow('Terrorist can only bomb once per game')
    })
  })

  describe('Voting Actions', () => {
    const votingGameState = { phase: GAME_PHASES.VOTING }

    // Test Case: Allow legitimate voting during voting phase
    // Validates players can vote for alive, non-God players during voting phase
    it('should allow valid vote', () => {
      const player = mockPlayers[0]
      const action = {
        action_type: 'vote',
        target_player_id: 'p5',
        phase: GAME_PHASES.VOTING
      }

      expect(() => validateAction(action, player, votingGameState, mockPlayers, []))
        .not.toThrow()
    })

    // Test Case: Prevent voting for eliminated players
    // Ensures votes cannot be wasted on already dead players
    it('should reject voting for dead player', () => {
      const player = mockPlayers[0]
      const action = {
        action_type: 'vote',
        target_player_id: 'p7',
        phase: GAME_PHASES.VOTING
      }

      expect(() => validateAction(action, player, votingGameState, mockPlayers, []))
        .toThrow('Cannot vote for dead player')
    })

    // Test Case: Protect God from elimination votes
    // Ensures moderator cannot be voted out (maintains game control)
    it('should reject voting for God', () => {
      const player = mockPlayers[0]
      const action = {
        action_type: 'vote',
        target_player_id: 'p6',
        phase: GAME_PHASES.VOTING
      }

      expect(() => validateAction(action, player, votingGameState, mockPlayers, []))
        .toThrow('Cannot vote out God')
    })
  })

  describe('Night Action Resolution', () => {
    // Test Case: Validate doctor protection blocks mafia kills
    // Ensures doctor protection successfully prevents mafia eliminations
    it('should resolve kills and protections correctly', () => {
      const actions = [
        { action_type: NIGHT_ACTIONS.MAFIA_KILL, target_player_id: 'p5' },
        { action_type: NIGHT_ACTIONS.DOCTOR_PROTECT, target_player_id: 'p5' }
      ]

      const results = resolveNightActions(actions, mockPlayers)
      expect(results.deaths).not.toContain('p5') // Protected
      expect(results.protections).toContain('p5')
    })

    // Test Case: Validate terrorist bomb mechanics
    // Ensures terrorist bomb eliminates both terrorist and target (suicide bombing)
    it('should resolve terrorist bomb correctly', () => {
      const actions = [
        {
          action_type: NIGHT_ACTIONS.TERRORIST_BOMB,
          player_id: 'p4',
          target_player_id: 'p5'
        }
      ]

      const results = resolveNightActions(actions, mockPlayers)
      expect(results.deaths).toContain('p4') // Terrorist dies
      expect(results.deaths).toContain('p5') // Target dies
    })
  })
})