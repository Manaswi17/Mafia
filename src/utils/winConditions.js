import { ROLES, getTeam } from './roleAssignment'

export function checkWinCondition(players) {
  const alivePlayers = players.filter(p => p.is_alive && p.role !== ROLES.GOD)
  
  if (alivePlayers.length === 0) {
    return { winner: null, reason: 'No players alive' }
  }
  
  const aliveByTeam = {
    mafia: 0,
    citizen: 0,
    neutral: 0
  }
  
  alivePlayers.forEach(player => {
    const team = getTeam(player.role)
    aliveByTeam[team]++
  })
  
  // Mafia wins if they equal or outnumber citizens (neutral doesn't count for mafia win)
  if (aliveByTeam.mafia >= aliveByTeam.citizen && aliveByTeam.mafia > 0) {
    return { 
      winner: 'mafia', 
      reason: 'Mafia equals or outnumbers other players' 
    }
  }
  
  // Citizens win if all mafia are eliminated
  if (aliveByTeam.mafia === 0) {
    return { 
      winner: 'citizen', 
      reason: 'All Mafia eliminated' 
    }
  }
  
  // Game continues
  return { winner: null, reason: 'Game continues' }
}

export function getWinningPlayers(players, winnerTeam) {
  if (!winnerTeam) return []
  
  return players.filter(player => {
    if (player.role === ROLES.GOD) return false
    return getTeam(player.role) === winnerTeam
  })
}