import { ROLES } from './roleAssignment'

export function resolveVoting(votes, players) {
  if (!votes || votes.length === 0) {
    return { eliminated: [], tie: false, voteCounts: {} }
  }
  
  const voteCounts = {}
  votes.forEach(vote => {
    const targetId = vote.target_player_id
    voteCounts[targetId] = (voteCounts[targetId] || 0) + 1
  })
  
  const maxVotes = Math.max(...Object.values(voteCounts))
  const playersWithMaxVotes = Object.keys(voteCounts).filter(
    playerId => voteCounts[playerId] === maxVotes
  )
  
  return {
    eliminated: playersWithMaxVotes,
    tie: playersWithMaxVotes.length > 1,
    voteCounts
  }
}

export function canVote(player, gamePhase) {
  return player.is_alive && player.role !== ROLES.GOD && gamePhase === 'voting'
}

export function isValidVoteTarget(targetId, players) {
  const target = players.find(p => p.player_id === targetId)
  return target && target.is_alive && target.role !== ROLES.GOD
}