// lib/test-scraper-limits.js
// Run with: node lib/test-scraper-limits.js

import store from 'app-store-scraper';

async function testLimits() {
  console.log('Testing app-store-scraper limits...\n');
  
  const testCases = [50, 100, 150, 200, 250];
  
  for (const num of testCases) {
    try {
      console.log(`Requesting ${num} apps...`);
      const apps = await store.list({
        collection: store.collection.TOP_FREE_IOS,
        country: 'us',
        num: num
      });
      console.log(`✓ Actually received: ${apps.length} apps`);
      
      // Check if we got what we asked for
      if (apps.length < num) {
        console.log(`⚠️  Library returned fewer apps than requested (${apps.length} < ${num})`);
      }
    } catch (err) {
      console.error(`✗ Error fetching ${num} apps:`, err.message);
    }
    console.log('---');
  }
}

testLimits();