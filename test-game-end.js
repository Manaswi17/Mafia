#!/usr/bin/env node

/**
 * Test runner for game end screen scenarios
 * Run with: node test-game-end.js
 */

import { execSync } from 'child_process'

console.log('🎮 Running Game End Screen Tests...\n')

try {
  // Run specific test files for game end scenarios
  console.log('📋 Testing Game End Components...')
  execSync('npm run test:run -- src/test/gameEndScreens.test.js', { stdio: 'inherit' })
  
  console.log('\n🔄 Testing Game End Integration...')
  execSync('npm run test:run -- src/test/gameEndIntegration.test.js', { stdio: 'inherit' })
  
  console.log('\n✅ All game end tests completed successfully!')
  
} catch (error) {
  console.error('\n❌ Some tests failed:', error.message)
  process.exit(1)
}