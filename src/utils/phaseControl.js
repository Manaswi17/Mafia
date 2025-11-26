import { ROLES } from './roleAssignment'
import { GAME_PHASES, NIGHT_ACTIONS } from './gamePhases'

export function canAdvancePhase(players, actions, currentPhase) {
  if (currentPhase === GAME_PHASES.NIGHT) {
    return canAdvanceFromNight(players, actions)
  } else if (currentPhase === GAME_PHASES.VOTING) {
    return canAdvanceFromVoting(players, actions)
  }
  return true
}

function canAdvanceFromNight(players, actions) {
  const requiredRoles = [ROLES.MAFIA, ROLES.DOCTOR, ROLES.POLICE]
  const aliveRequiredPlayers = players.filter(p => 
    p.is_alive && requiredRoles.includes(p.role)
  )
  
  const submittedPlayerIds = actions.map(a => a.player_id)
  
  return aliveRequiredPlayers.every(p => submittedPlayerIds.includes(p.player_id))
}

function canAdvanceFromVoting(players, actions) {
  const aliveVoters = players.filter(p => p.is_alive && p.role !== ROLES.GOD)
  const submittedVotes = actions.filter(a => a.action_type === 'vote')
  
  return aliveVoters.length === submittedVotes.length
}

export function getMissingActions(players, actions, currentPhase) {
  if (currentPhase === GAME_PHASES.NIGHT) {
    const requiredRoles = [ROLES.MAFIA, ROLES.DOCTOR, ROLES.POLICE]
    const aliveRequired = players.filter(p => 
      p.is_alive && requiredRoles.includes(p.role)
    )
    const submitted = actions.map(a => a.player_id)
    
    return aliveRequired.filter(p => !submitted.includes(p.player_id))
  }
  
  if (currentPhase === GAME_PHASES.VOTING) {
    const aliveVoters = players.filter(p => p.is_alive && p.role !== ROLES.GOD)
    const voted = actions.filter(a => a.action_type === 'vote').map(a => a.player_id)
    
    return aliveVoters.filter(p => !voted.includes(p.player_id))
  }
  
  return []
}