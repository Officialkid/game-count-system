// Test SSE updates by adding a score
const baseUrl = 'http://localhost:3002';

// Event and team data from check-teams.js
const eventId = 'f9ce5d4f-89bc-41d9-b491-9dd2f1d1a8c4';
const teamId = '7a2b339b-1b4e-47b4-83f8-8ba0576c541d'; // team "ads"
const shareToken = 'yBNS4Rx9JT_j-neM';

async function testSSE() {
  try {
    // Step 1: Login to get auth token
    console.log('1️⃣ Logging in...');
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    if (!loginRes.ok) {
      console.error('❌ Login failed:', loginRes.status);
      return;
    }
    
    const { accessToken } = await loginRes.json();
    console.log('✅ Logged in successfully');
    
    // Step 2: Fetch current scoreboard state
    console.log('\n2️⃣ Fetching current scoreboard...');
    const scoreboardBefore = await fetch(`${baseUrl}/api/public/scoreboard/${shareToken}`);
    const beforeData = await scoreboardBefore.json();
    console.log('Current scores:', beforeData.data?.scores?.length || 0);
    console.log('Current teams:', beforeData.data?.teams?.map(t => `${t.team_name}: ${t.total_points}`));
    
    // Step 3: Add a score
    console.log('\n3️⃣ Adding score (10 points to team "ads" for game 1)...');
    const scoreRes = await fetch(`${baseUrl}/api/events/${eventId}/scores`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        team_id: teamId,
        game_number: 1,
        points: 10
      })
    });
    
    if (!scoreRes.ok) {
      console.error('❌ Score addition failed:', scoreRes.status, await scoreRes.text());
      return;
    }
    
    const scoreData = await scoreRes.json();
    console.log('✅ Score added:', scoreData);
    
    // Step 4: Wait a moment and check scoreboard again
    console.log('\n4️⃣ Waiting 2 seconds for cache/SSE to propagate...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('5️⃣ Fetching updated scoreboard...');
    const scoreboardAfter = await fetch(`${baseUrl}/api/public/scoreboard/${shareToken}`);
    const afterData = await scoreboardAfter.json();
    console.log('Updated scores:', afterData.data?.scores?.length || 0);
    console.log('Updated teams:', afterData.data?.teams?.map(t => `${t.team_name}: ${t.total_points}`));
    
    console.log('\n✅ SSE test complete!');
    console.log('📊 Open http://localhost:3002/scoreboard/' + shareToken + ' in a browser');
    console.log('👀 Watch for the "Live" indicator and real-time score updates');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSSE();
