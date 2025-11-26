import { GAME_PHASES } from './gamePhases'

export function canPlayerAct(playerId, actions, phase, currentRound = 1) {
  const playerActions = actions.filter(a => 
    a.player_id === playerId && 
    a.phase === phase &&
    !a.confirmed &&
    (a.round_number || 1) === currentRound
  )
  
  return playerActions.length === 0
}

export function getPlayerActionStatus(playerId, actions, phase, currentRound = 1) {
  const hasSubmitted = !canPlayerAct(playerId, actions, phase, currentRound)
  
  if (hasSubmitted) {
    return {
      canAct: false,
      message: 'Action submitted. Waiting for God to confirm.',
      buttonText: 'Submitted'
    }
  }
  
  return {
    canAct: true,
    message: null,
    buttonText: getDefaultButtonText(phase)
  }
}

function getDefaultButtonText(phase) {
  if (phase === GAME_PHASES.NIGHT) {
    return 'Submit Action'
  } else if (phase === GAME_PHASES.VOTING) {
    return 'Vote'
  }
  return 'Submit'
}

export function shouldDisableAllButtons(playerId, actions, phase, currentRound = 1) {
  return !canPlayerAct(playerId, actions, phase, currentRound)
}