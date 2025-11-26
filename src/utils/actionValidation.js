import { ROLES } from './roleAssignment'
import { GAME_PHASES, NIGHT_ACTIONS } from './gamePhases'

export class ActionValidationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ActionValidationError'
  }
}

export function validateAction(action, player, gameState, players, existingActions) {
  const { action_type, target_player_id, phase } = action
  
  // Basic validations
  if (!player.is_alive) {
    throw new ActionValidationError('Dead players cannot act')
  }
  
  if (phase !== gameState.phase) {
    throw new ActionValidationError('Action phase mismatch')
  }
  
  // Phase-specific validations
  if (phase === GAME_PHASES.NIGHT) {
    validateNightAction(action, player, players, existingActions)
  } else if (phase === GAME_PHASES.VOTING) {
    validateVotingAction(action, player, players, existingActions)
  } else {
    throw new ActionValidationError('Invalid phase for actions')
  }
  
  return true
}

function validateNightAction(action, player, players, existingActions) {
  const { action_type, target_player_id } = action
  
  // Check if player already acted this round
  const playerActions = existingActions.filter(a => 
    a.player_id === player.player_id && 
    a.phase === GAME_PHASES.NIGHT &&
    !a.confirmed
  )
  
  if (playerActions.length > 0) {
    throw new ActionValidationError('Player already acted this round')
  }
  
  // Role-specific validations
  switch (player.role) {
    case ROLES.MAFIA:
      if (action_type !== NIGHT_ACTIONS.MAFIA_KILL) {
        throw new ActionValidationError('Mafia can only kill')
      }
      validateTarget(target_player_id, players, player.player_id)
      break
      
    case ROLES.DOCTOR:
      if (action_type !== NIGHT_ACTIONS.DOCTOR_PROTECT) {
        throw new ActionValidationError('Doctor can only protect')
      }
      validateTarget(target_player_id, players)
      
      // Check self-protection limit
      if (target_player_id === player.player_id && player.self_protected) {
        throw new ActionValidationError('Doctor can only self-protect once per game')
      }
      break
      
    case ROLES.POLICE:
      if (action_type !== NIGHT_ACTIONS.POLICE_INVESTIGATE) {
        throw new ActionValidationError('Police can only investigate')
      }
      validateTarget(target_player_id, players, player.player_id)
      break
      
    case ROLES.TERRORIST:
      if (action_type !== NIGHT_ACTIONS.TERRORIST_BOMB) {
        throw new ActionValidationError('Terrorist can only bomb')
      }
      
      if (player.terrorist_used) {
        throw new ActionValidationError('Terrorist can only bomb once per game')
      }
      
      validateTarget(target_player_id, players, player.player_id)
      break
      
    default:
      throw new ActionValidationError('Role cannot act at night')
  }
}

function validateVotingAction(action, player, players, existingActions) {
  const { target_player_id } = action
  
  // Check if player already voted
  const playerVotes = existingActions.filter(a => 
    a.player_id === player.player_id && 
    a.phase === GAME_PHASES.VOTING &&
    !a.confirmed
  )
  
  if (playerVotes.length > 0) {
    throw new ActionValidationError('Player already voted')
  }
  
  // Validate target
  const target = players.find(p => p.player_id === target_player_id)
  if (!target) {
    throw new ActionValidationError('Invalid vote target')
  }
  
  if (!target.is_alive) {
    throw new ActionValidationError('Cannot vote for dead player')
  }
  
  if (target.role === ROLES.GOD) {
    throw new ActionValidationError('Cannot vote out God')
  }
}

function validateTarget(targetId, players, excludeId = null) {
  if (!targetId) {
    throw new ActionValidationError('Target required')
  }
  
  const target = players.find(p => p.player_id === targetId)
  if (!target) {
    throw new ActionValidationError('Invalid target')
  }
  
  if (!target.is_alive) {
    throw new ActionValidationError('Cannot target dead player')
  }
  
  if (excludeId && targetId === excludeId) {
    throw new ActionValidationError('Cannot target self')
  }
}

export function resolveNightActions(actions, players) {
  const kills = actions.filter(a => a.action_type === NIGHT_ACTIONS.MAFIA_KILL)
  const protections = actions.filter(a => a.action_type === NIGHT_ACTIONS.DOCTOR_PROTECT)
  const investigations = actions.filter(a => a.action_type === NIGHT_ACTIONS.POLICE_INVESTIGATE)
  const bombs = actions.filter(a => a.action_type === NIGHT_ACTIONS.TERRORIST_BOMB)
  
  const results = {
    deaths: [],
    protections: [],
    investigations: [],
    bombs: []
  }
  
  // Process bombs first (instant death)
  bombs.forEach(bomb => {
    const terrorist = players.find(p => p.player_id === bomb.player_id)
    const target = players.find(p => p.player_id === bomb.target_player_id)
    
    if (terrorist && target) {
      results.deaths.push(terrorist.player_id) // Terrorist dies
      results.deaths.push(target.player_id) // Target dies
      results.bombs.push({
        terrorist: terrorist.player_id,
        target: target.player_id
      })
    }
  })
  
  // Process protections
  const protectedPlayers = new Set()
  protections.forEach(protection => {
    protectedPlayers.add(protection.target_player_id)
    results.protections.push(protection.target_player_id)
  })
  
  // Process kills (check against protections)
  kills.forEach(kill => {
    const targetId = kill.target_player_id
    if (!protectedPlayers.has(targetId) && !results.deaths.includes(targetId)) {
      results.deaths.push(targetId)
    }
  })
  
  // Process investigations
  investigations.forEach(investigation => {
    const target = players.find(p => p.player_id === investigation.target_player_id)
    if (target) {
      const result = target.role === 'mafia' ? 'mafia' : 'non-mafia'
      results.investigations.push({
        investigator: investigation.player_id,
        target: target.player_id,
        result: result
      })
    }
  })
  
  return results
}