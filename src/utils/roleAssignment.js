/**
 * Role assignment logic for Mafia game
 * Handles variable Mafia/Citizen counts based on total player count
 * Factors in Doctor and Police as part of Citizen team
 */

export const ROLES = {
  MAFIA: 'mafia',
  DOCTOR: 'doctor',
  POLICE: 'police',
  CITIZEN: 'citizen',
  TERRORIST: 'terrorist',
  GOD: 'god'
}

/**
 * Calculates role distribution based on total player count
 * @param {number} totalPlayers - Total number of players (excluding God)
 * @returns {Object} Role distribution object
 */
export function calculateRoleDistribution(totalPlayers) {
  // God is separate, so we work with remaining players
  const playersWithoutGod = totalPlayers - 1
  
  // Base distribution rules:
  // - 1 Doctor (counted as Citizen)
  // - 1 Police (counted as Citizen)
  // - 1 Terrorist
  // - Remaining: Mafia vs Citizens (including Doctor/Police)
  
  // Typical ratio: ~30% Mafia, ~70% Citizens (including special roles)
  // Minimum 1 Mafia, minimum 2 Citizens (Doctor + Police minimum)
  
  let mafiaCount = 1
  let citizenCount = 2 // Doctor + Police minimum
  
  if (playersWithoutGod === 5) {
    // For exactly 6 players (5 + 1 God): 1 Mafia, 1 Citizen, 1 Doctor, 1 Police, 1 Terrorist
    mafiaCount = 1
    citizenCount = 1 // Regular citizen (Doctor and Police are added separately)
  } else if (playersWithoutGod >= 6) {
    // For 7+ players: ~30% Mafia
    mafiaCount = Math.max(1, Math.floor(playersWithoutGod * 0.3))
    citizenCount = playersWithoutGod - mafiaCount - 1 // -1 for Terrorist
    // Ensure we have at least 2 regular citizens for Doctor and Police slots
    if (citizenCount < 2) {
      citizenCount = 2
    }
  } else {
    // Less than 6 players not allowed (this shouldn't happen due to check in assignRoles)
    mafiaCount = 1
    citizenCount = 1
  }
  
  // For exactly 6 players, we have exact distribution
  if (playersWithoutGod === 5) {
    return {
      mafia: 1,
      citizen: 1, // Regular citizen (Doctor and Police are separate)
      doctor: 1,
      police: 1,
      terrorist: 1,
      god: 1
    }
  }
  
  // Adjust if total doesn't match (for 7+ players)
  const total = mafiaCount + citizenCount + 1 // +1 for Terrorist
  if (total !== playersWithoutGod) {
    const diff = playersWithoutGod - total
    if (diff > 0) {
      // Add extra to citizens
      citizenCount += diff
    } else {
      // Remove from citizens if needed, but keep at least 2 for Doctor and Police
      citizenCount = Math.max(2, citizenCount + diff)
    }
  }
  
  return {
    mafia: mafiaCount,
    citizen: citizenCount - 2, // Exclude Doctor and Police (they're added separately)
    doctor: 1,
    police: 1,
    terrorist: 1,
    god: 1
  }
}

/**
 * Assigns roles to players randomly
 * @param {Array<string>} playerIds - Array of player IDs
 * @returns {Object} Map of playerId -> role
 */
export function assignRoles(playerIds) {
  if (playerIds.length < 6) {
    throw new Error('Need at least 6 players to start')
  }
  
  const distribution = calculateRoleDistribution(playerIds.length)
  const roles = []
  
  // Add roles based on distribution
  for (let i = 0; i < distribution.mafia; i++) {
    roles.push(ROLES.MAFIA)
  }
  for (let i = 0; i < distribution.citizen; i++) {
    roles.push(ROLES.CITIZEN)
  }
  roles.push(ROLES.DOCTOR)
  roles.push(ROLES.POLICE)
  roles.push(ROLES.TERRORIST)
  
  // Randomly select one player to be God
  const godIndex = Math.floor(Math.random() * playerIds.length)
  const godId = playerIds[godIndex]
  
  // Shuffle remaining roles
  const shuffledRoles = roles.sort(() => Math.random() - 0.5)
  
  // Assign roles
  const assignments = {}
  let roleIndex = 0
  
  playerIds.forEach((playerId, index) => {
    if (index === godIndex) {
      assignments[playerId] = ROLES.GOD
    } else {
      assignments[playerId] = shuffledRoles[roleIndex]
      roleIndex++
    }
  })
  
  return assignments
}

/**
 * Gets team for a role
 * @param {string} role - Player role
 * @returns {string} Team name ('mafia', 'citizen', or 'neutral')
 */
export function getTeam(role) {
  if (role === ROLES.MAFIA) return 'mafia'
  if ([ROLES.CITIZEN, ROLES.DOCTOR, ROLES.POLICE].includes(role)) return 'citizen'
  if (role === ROLES.TERRORIST) return 'neutral'
  return 'neutral'
}

/**
 * Gets display name for role
 * @param {string} role - Role constant
 * @returns {string} Display name
 */
export function getRoleDisplayName(role) {
  const names = {
    [ROLES.MAFIA]: 'Mafia',
    [ROLES.DOCTOR]: 'Doctor',
    [ROLES.POLICE]: 'Police',
    [ROLES.CITIZEN]: 'Citizen',
    [ROLES.TERRORIST]: 'Terrorist',
    [ROLES.GOD]: 'God'
  }
  return names[role] || role
}

