import { ROLES } from './roleAssignment'

export function getInvestigationResult(targetPlayer) {
  return targetPlayer.role === ROLES.MAFIA ? 'mafia' : 'non-mafia'
}

export function createPoliceNotification(investigatorId, targetPlayer) {
  const result = getInvestigationResult(targetPlayer)
  
  return {
    recipient: investigatorId,
    message: `Investigation result: The target is ${result}`,
    type: 'investigation_result',
    result: result
  }
}

export function processPoliceInvestigation(action, players) {
  const target = players.find(p => p.player_id === action.target_player_id)
  if (!target) return null
  
  return {
    investigator: action.player_id,
    target: target.player_id,
    result: getInvestigationResult(target)
  }
}