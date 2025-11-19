/**
 * Game phase management
 * Defines the different phases of the Mafia game
 */

export const GAME_PHASES = {
  LOBBY: 'lobby',
  ROUND_START: 'round_start',
  NIGHT: 'night',
  DAY: 'day',
  VOTING: 'voting',
  ROUND_END: 'round_end',
  ENDED: 'ended'
}

export const NIGHT_ACTIONS = {
  MAFIA_KILL: 'mafia_kill',
  DOCTOR_PROTECT: 'doctor_protect',
  POLICE_INVESTIGATE: 'police_investigate',
  TERRORIST_BOMB: 'terrorist_bomb'
}

/**
 * Gets the next phase in sequence
 * @param {string} currentPhase - Current game phase
 * @returns {string} Next phase
 */
export function getNextPhase(currentPhase) {
  const phaseOrder = [
    GAME_PHASES.LOBBY,
    GAME_PHASES.NIGHT,
    GAME_PHASES.DAY,
    GAME_PHASES.VOTING,
    GAME_PHASES.DAY, // Back to day after voting (unless game ends)
    GAME_PHASES.ENDED
  ]
  
  const currentIndex = phaseOrder.indexOf(currentPhase)
  if (currentIndex === -1 || currentIndex === phaseOrder.length - 1) {
    return currentPhase
  }
  
  return phaseOrder[currentIndex + 1]
}

/**
 * Checks if a role can act in current phase
 * @param {string} role - Player role
 * @param {string} phase - Current game phase
 * @returns {boolean} Whether role can act
 */
export function canRoleAct(role, phase) {
  if (phase === GAME_PHASES.NIGHT) {
    return ['mafia', 'doctor', 'police', 'terrorist'].includes(role)
  }
  if (phase === GAME_PHASES.VOTING) {
    return true // All living players can vote
  }
  return false
}

