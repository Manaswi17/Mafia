import { ROLES } from './roleAssignment'
import { GAME_PHASES } from './gamePhases'

export function isGod(player) {
  return player && player.role === ROLES.GOD
}

export function canSeeAllRoles(player) {
  return isGod(player)
}

export function canConfirmActions(player) {
  return isGod(player)
}

export function canAdvancePhase(player) {
  return isGod(player)
}

export function canResetGame(player) {
  return isGod(player)
}

export function reassignGod(players) {
  const alivePlayers = players.filter(p => p.is_alive && p.role !== ROLES.GOD)
  if (alivePlayers.length === 0) return null
  
  // Randomly select new God
  const randomIndex = Math.floor(Math.random() * alivePlayers.length)
  return alivePlayers[randomIndex].player_id
}

export function validateGodAction(action, player) {
  if (!isGod(player)) {
    throw new Error('Only God can perform this action')
  }
  
  const validActions = ['confirm_actions', 'advance_phase', 'reset_game', 'start_game']
  if (!validActions.includes(action)) {
    throw new Error('Invalid God action')
  }
  
  return true
}