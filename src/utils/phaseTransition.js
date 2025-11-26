import { ROLES } from './roleAssignment'
import { NIGHT_ACTIONS } from './gamePhases'

export function canAdvanceToDay(players, actions) {
  const aliveNightRoles = players.filter(p => 
    p.is_alive && 
    [ROLES.MAFIA, ROLES.DOCTOR, ROLES.POLICE].includes(p.role)
  )
  
  const requiredPlayerIds = aliveNightRoles.map(p => p.player_id)
  const submittedPlayerIds = actions.map(a => a.player_id)
  
  return requiredPlayerIds.every(playerId => submittedPlayerIds.includes(playerId))
}

export function canMafiaKillAgain(mafiaId, actions) {
  return !actions.some(a => 
    a.player_id === mafiaId && 
    a.action_type === NIGHT_ACTIONS.MAFIA_KILL
  )
}

export function getRequiredNightActions(players) {
  return players
    .filter(p => p.is_alive && [ROLES.MAFIA, ROLES.DOCTOR, ROLES.POLICE].includes(p.role))
    .map(p => ({
      player_id: p.player_id,
      role: p.role,
      required_action: getRoleNightAction(p.role)
    }))
}

function getRoleNightAction(role) {
  const actionMap = {
    [ROLES.MAFIA]: NIGHT_ACTIONS.MAFIA_KILL,
    [ROLES.DOCTOR]: NIGHT_ACTIONS.DOCTOR_PROTECT,
    [ROLES.POLICE]: NIGHT_ACTIONS.POLICE_INVESTIGATE
  }
  return actionMap[role]
}