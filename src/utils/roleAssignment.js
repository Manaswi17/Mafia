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
  if (totalPlayers < 6) {
    throw new Error('Need at least 6 players to start')
  }
  
  // God is separate, so we work with remaining players
  const playersWithoutGod = totalPlayers - 1
  
  // Fixed roles: 1 Doctor, 1 Police, 1 Terrorist
  const fixedRoles = 3
  const remainingPlayers = playersWithoutGod - fixedRoles
  
  // Calculate Mafia count (~30% of total non-god players, minimum 1)
  const mafiaCount = Math.max(1, Math.floor(playersWithoutGod * 0.3))
  const citizenCount = playersWithoutGod - mafiaCount - 1 - 1 - 1 // -1 for each fixed role
  
  // Ensure we have at least some citizens
  if (citizenCount < 0) {
    throw new Error('Not enough players for proper distribution')
  }
  
  return {
    mafia: mafiaCount,
    citizen: citizenCount,
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
  
  // Validate player IDs
  if (playerIds.some(id => id == null || id === undefined)) {
    throw new Error('Invalid player IDs: null or undefined values not allowed')
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
  
  // Validate total roles match expected count
  if (roles.length !== playerIds.length - 1) {
    throw new Error('Role count mismatch')
  }
  
  // Randomly select one player to be God
  const shuffledPlayerIds = [...playerIds].sort(() => Math.random() - 0.5)
  const godId = shuffledPlayerIds[0]
  const nonGodPlayers = shuffledPlayerIds.slice(1)
  
  // Shuffle roles
  const shuffledRoles = [...roles].sort(() => Math.random() - 0.5)
  
  // Assign roles
  const assignments = { [godId]: ROLES.GOD }
  
  nonGodPlayers.forEach((playerId, index) => {
    assignments[playerId] = shuffledRoles[index]
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

