export function canGodAdvancePhase(actions, currentPhase) {
  // During voting phase, votes are auto-confirmed, so God can always advance
  if (currentPhase === 'voting') {
    return true
  }
  
  const unconfirmedActions = actions.filter(a => !a.confirmed)
  return unconfirmedActions.length === 0
}

export function getConfirmationErrorMessage(actions, currentPhase) {
  // During voting phase, votes are auto-confirmed, so no error message needed
  if (currentPhase === 'voting') {
    return null
  }
  
  const unconfirmedCount = actions.filter(a => !a.confirmed).length
  if (unconfirmedCount === 0) return null
  
  return `Please confirm all actions before advancing phase. ${unconfirmedCount} unconfirmed action(s) remaining.`
}

export function getUnconfirmedActionCount(actions) {
  return actions.filter(a => !a.confirmed).length
}

export function getPendingConfirmations(actions) {
  return actions.filter(a => !a.confirmed)
}

export function validatePhaseAdvance(actions) {
  const unconfirmedActions = getPendingConfirmations(actions)
  
  if (unconfirmedActions.length > 0) {
    throw new Error(getConfirmationErrorMessage(actions))
  }
  
  return true
}