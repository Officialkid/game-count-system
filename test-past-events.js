#!/usr/bin/env node

/**
 * Past Events API - Test & Demo Script
 * 
 * This script demonstrates how to use the Past Events API
 * 
 * Usage:
 *   node test-past-events.js <admin-token> [api-url]
 * 
 * Example:
 *   node test-past-events.js "your-admin-token-here" "http://localhost:3000"
 */

const http = require('http');
const https = require('https');

const adminToken = process.argv[2];
const apiUrl = process.argv[3] || 'http://localhost:3000';

if (!adminToken) {
  console.error('❌ Error: Admin token required');
  console.error('\nUsage: node test-past-events.js <admin-token> [api-url]');
  console.error('\nExample:');
  console.error('  node test-past-events.js "your-admin-token-here"');
  console.error('  node test-past-events.js "your-admin-token-here" "http://localhost:3000"');
  process.exit(1);
}

// Parse URL
const url = new URL(`${apiUrl}/api/events/past`);
const isHttps = url.protocol === 'https:';
const client = isHttps ? https : http;

console.log('🧪 Testing Past Events API');
console.log('━'.repeat(50));
console.log(`📍 Endpoint: ${url.href}`);
console.log(`🔑 Admin Token: ${adminToken.substring(0, 8)}...${adminToken.substring(-4)}`);
console.log('━'.repeat(50));

// Make request
const options = {
  hostname: url.hostname,
  port: url.port,
  path: url.pathname + url.search,
  method: 'GET',
  headers: {
    'X-ADMIN-TOKEN': adminToken,
    'Content-Type': 'application/json',
  },
};

console.log('\n📤 Sending GET request...\n');

const req = client.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    const statusCode = res.statusCode;
    const isSuccess = statusCode >= 200 && statusCode < 300;

    console.log(`📥 Response Status: ${statusCode} ${res.statusMessage}`);
    console.log('━'.repeat(50));

    try {
      const parsed = JSON.parse(data);

      if (isSuccess) {
        console.log('\n✅ SUCCESS\n');
        console.log(JSON.stringify(parsed, null, 2));

        if (parsed.data && parsed.data.events) {
          console.log('\n📊 Summary:');
          console.log(`   Total Events: ${parsed.data.count}`);

          if (parsed.data.count > 0) {
            const events = parsed.data.events;
            const totalTeams = events.reduce((sum, e) => sum + e.total_teams, 0);
            const finalizedCount = events.filter(e => e.is_finalized).length;

            console.log(`   Total Teams: ${totalTeams}`);
            console.log(`   Finalized: ${finalizedCount}/${parsed.data.count}`);

            console.log('\n📋 Events:');
            events.forEach((event, i) => {
              console.log(`\n   ${i + 1}. ${event.name}`);
              console.log(`      ID: ${event.event_id}`);
              console.log(`      Mode: ${event.mode}`);
              console.log(`      Teams: ${event.total_teams}`);
              if (event.total_days) {
                console.log(`      Days: ${event.total_days}`);
              }
              console.log(`      Finalized: ${event.is_finalized ? '✓ Yes' : '✗ No'}`);
              if (event.finalized_at) {
                console.log(`      Finalized At: ${new Date(event.finalized_at).toLocaleString()}`);
              }
            });
          } else {
            console.log('\n   ℹ️  No past events found for this admin.');
          }
        }
      } else {
        console.log('\n❌ ERROR\n');
        console.log(JSON.stringify(parsed, null, 2));

        if (statusCode === 400) {
          console.log('\n⚠️  Missing header. Add X-ADMIN-TOKEN header to request.');
        } else if (statusCode === 403) {
          console.log('\n⚠️  Invalid admin token. Check your token is correct.');
        } else if (statusCode === 405) {
          console.log('\n⚠️  Method not allowed. Only GET is supported for past events.');
        }
      }
    } catch (parseError) {
      console.log('\n❌ Failed to parse response:\n');
      console.log(data);
    }

    console.log('\n' + '━'.repeat(50));
  });
});

req.on('error', (error) => {
  console.error('\n❌ Request failed:');
  console.error(`   ${error.message}`);

  if (error.code === 'ECONNREFUSED') {
    console.error('\n⚠️  Connection refused. Is the server running?');
    console.error(`   Make sure the server is running at ${apiUrl}`);
  }

  process.exit(1);
});

req.end();
