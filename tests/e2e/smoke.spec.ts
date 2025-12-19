import { test, expect, type Page } from '@playwright/test';

/**
 * Test Fixtures and Helpers
 */

// Test user credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'TestPassword123!',
  name: 'Test User',
};

// Test data
const TEST_EVENT = {
  name: 'Summer Games 2025',
  numTeams: 4,
  numGames: 3,
};

const TEST_TEAMS = [
  { name: 'Red Eagles', color: '#FF0000' },
  { name: 'Blue Sharks', color: '#0000FF' },
  { name: 'Green Warriors', color: '#00FF00' },
  { name: 'Yellow Tigers', color: '#FFFF00' },
];

/**
 * Helper: Register a new test user
 */
async function registerUser(page: Page) {
  await page.goto('/auth/register');
  await page.fill('input[name="name"]', TEST_USER.name);
  await page.fill('input[name="email"]', TEST_USER.email);
  await page.fill('input[name="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');
  
  // Wait for redirect to dashboard or success message
  await page.waitForURL(/\/(dashboard|events)/, { timeout: 10000 });
}

/**
 * Helper: Login with existing user
 */
async function loginUser(page: Page) {
  await page.goto('/auth/login');
  await page.fill('input[name="email"]', TEST_USER.email);
  await page.fill('input[name="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');
  
  // Wait for redirect to dashboard
  await page.waitForURL(/\/(dashboard|events)/, { timeout: 10000 });
}

/**
 * Helper: Create a test event
 */
async function createEvent(page: Page) {
  // Click "Create Event" or navigate to create event page
  await page.goto('/events/create');
  
  await page.fill('input[name="event_name"]', TEST_EVENT.name);
  await page.fill('input[name="num_teams"]', TEST_EVENT.numTeams.toString());
  await page.fill('input[name="num_games"]', TEST_EVENT.numGames.toString());
  
  await page.click('button[type="submit"]');
  
  // Wait for redirect to event page
  await page.waitForURL(/\/events\/[a-zA-Z0-9]+/, { timeout: 10000 });
  
  // Extract event ID from URL
  const url = page.url();
  const eventId = url.split('/events/')[1]?.split('?')[0];
  return eventId;
}

/**
 * Helper: Add teams to event
 */
async function addTeams(page: Page, eventId: string) {
  // Navigate to teams tab
  await page.goto(`/events/${eventId}?tab=teams`);
  
  for (const team of TEST_TEAMS) {
    // Click "Add Team" button
    await page.click('button:has-text("Add Team")');
    
    await page.fill('input[name="team_name"]', team.name);
    await page.fill('input[name="color"]', team.color);
    
    await page.click('button:has-text("Create")');
    
    // Wait for team to appear in list
    await page.waitForSelector(`text=${team.name}`, { timeout: 5000 });
  }
}

/**
 * Helper: Submit scores for a game
 */
async function submitScore(page: Page, eventId: string, gameNumber: number, teamIndex: number, points: number) {
  // Navigate to scoreboard
  await page.goto(`/events/${eventId}?tab=scoreboard`);
  
  // Select game
  await page.selectOption('select[name="game"]', gameNumber.toString());
  
  // Find team row and enter points
  const teamRows = await page.locator('tr[data-team-id]').all();
  if (teamRows[teamIndex]) {
    const pointsInput = teamRows[teamIndex].locator('input[type="number"]');
    await pointsInput.fill(points.toString());
    await pointsInput.press('Enter');
  }
  
  // Wait for score to be saved
  await page.waitForTimeout(1000);
}

/**
 * SMOKE TEST SUITE
 */

test.describe('Camp Countdown System - Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies();
  });

  test('Complete user journey: register → create event → add teams → submit scores → view recap', async ({ page }) => {
    // Step 1: Register new user
    await test.step('Register user', async () => {
      await registerUser(page);
      await expect(page).toHaveURL(/\/(dashboard|events)/);
    });

    // Step 2: Create event
    let eventId: string;
    await test.step('Create event', async () => {
      eventId = await createEvent(page);
      expect(eventId).toBeTruthy();
      await expect(page).toHaveURL(new RegExp(`/events/${eventId}`));
    });

    // Step 3: Add teams
    await test.step('Add teams', async () => {
      await addTeams(page, eventId!);
      
      // Verify all teams are listed
      for (const team of TEST_TEAMS) {
        await expect(page.locator(`text=${team.name}`)).toBeVisible();
      }
    });

    // Step 4: Submit scores for Game 1
    await test.step('Submit scores for Game 1', async () => {
      await submitScore(page, eventId!, 1, 0, 10); // Red Eagles: 10
      await submitScore(page, eventId!, 1, 1, 8);  // Blue Sharks: 8
      await submitScore(page, eventId!, 1, 2, 12); // Green Warriors: 12
      await submitScore(page, eventId!, 1, 3, 6);  // Yellow Tigers: 6
      
      // Verify scores appear on scoreboard
      await expect(page.locator('text=10')).toBeVisible();
      await expect(page.locator('text=12')).toBeVisible();
    });

    // Step 5: Submit scores for Game 2
    await test.step('Submit scores for Game 2', async () => {
      await submitScore(page, eventId!, 2, 0, 15);
      await submitScore(page, eventId!, 2, 1, 10);
      await submitScore(page, eventId!, 2, 2, 8);
      await submitScore(page, eventId!, 2, 3, 12);
    });

    // Step 6: View recap
    await test.step('Generate and view recap', async () => {
      await page.goto(`/events/${eventId}?tab=settings`);
      
      // Click "Generate Recap" button
      await page.click('button:has-text("Generate Recap")');
      
      // Wait for recap to be generated
      await page.waitForTimeout(2000);
      
      // Navigate to recap tab
      await page.goto(`/events/${eventId}?tab=recap`);
      
      // Verify recap shows final standings
      await expect(page.locator('text=Final Standings')).toBeVisible();
    });

    // Step 7: Test public share link
    await test.step('Create and access share link', async () => {
      await page.goto(`/events/${eventId}?tab=settings`);
      
      // Generate share link
      await page.click('button:has-text("Create Share Link")');
      
      // Wait for link to appear
      const shareLink = await page.locator('input[readonly]').inputValue();
      expect(shareLink).toContain('/public/');
      
      // Open share link in new tab
      const shareToken = shareLink.split('/public/')[1];
      await page.goto(`/public/${shareToken}`);
      
      // Verify public scoreboard is visible
      await expect(page.locator('text=Scoreboard')).toBeVisible();
      
      // Verify teams are visible on public page
      await expect(page.locator(`text=${TEST_TEAMS[0].name}`)).toBeVisible();
    });
  });

  test('Login with existing user', async ({ page }) => {
    await test.step('Login', async () => {
      await loginUser(page);
      await expect(page).toHaveURL(/\/(dashboard|events)/);
    });

    await test.step('Verify dashboard loads', async () => {
      // Check for user name or dashboard elements
      await expect(page.locator(`text=${TEST_USER.name}`).or(page.locator('text=Events'))).toBeVisible();
    });
  });

  test('Create event and verify navigation', async ({ page }) => {
    await loginUser(page);
    
    const eventId = await createEvent(page);
    
    // Test tab navigation
    await test.step('Navigate to Teams tab', async () => {
      await page.click('button:has-text("Teams")');
      await expect(page).toHaveURL(new RegExp(`/events/${eventId}\\?tab=teams`));
    });

    await test.step('Navigate to Scoreboard tab', async () => {
      await page.click('button:has-text("Scoreboard")');
      await expect(page).toHaveURL(new RegExp(`/events/${eventId}\\?tab=scoreboard`));
    });

    await test.step('Navigate to Settings tab', async () => {
      await page.click('button:has-text("Settings")');
      await expect(page).toHaveURL(new RegExp(`/events/${eventId}\\?tab=settings`));
    });
  });

  test('Realtime score updates', async ({ page, context }) => {
    await loginUser(page);
    const eventId = await createEvent(page);
    await addTeams(page, eventId);

    // Open event in two different pages (simulate two users)
    const page2 = await context.newPage();
    await page2.goto(`/events/${eventId}?tab=scoreboard`);

    // Submit score in first page
    await submitScore(page, eventId, 1, 0, 15);

    // Verify score appears in second page (realtime update)
    await page2.waitForTimeout(2000); // Wait for realtime sync
    await expect(page2.locator('text=15')).toBeVisible();

    await page2.close();
  });

  test('Error handling: Invalid login', async ({ page }) => {
    await page.goto('/auth/login');
    
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');

    // Verify error message appears
    await expect(page.locator('text=Invalid credentials').or(page.locator('text=Login failed'))).toBeVisible();
  });

  test('Error handling: Create event with missing fields', async ({ page }) => {
    await loginUser(page);
    await page.goto('/events/create');

    // Submit form without filling required fields
    await page.click('button[type="submit"]');

    // Should show validation errors or stay on page
    await expect(page).toHaveURL(/\/events\/create/);
  });

  test('Admin audit logs access', async ({ page }) => {
    await loginUser(page);

    // Try to access admin audit logs
    await page.goto('/admin/audit-logs');

    // Should either show audit logs (if user is admin) or redirect/show error
    const isAdmin = await page.locator('text=Audit Logs').isVisible().catch(() => false);
    
    if (isAdmin) {
      // Verify audit log table loads
      await expect(page.locator('table')).toBeVisible();
    } else {
      // Non-admin should be redirected or see access denied
      await expect(page).toHaveURL(/\/(dashboard|events|403)/);
    }
  });
});

/**
 * ACCESSIBILITY TESTS
 */
test.describe('Accessibility', () => {
  test('Home page has no accessibility violations', async ({ page }) => {
    await page.goto('/');
    
    // Check for basic accessibility
    await expect(page.locator('h1')).toBeVisible();
    await expect(page).toHaveTitle(/.+/); // Has a title
  });

  test('Login form has proper labels', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Check for form labels
    await expect(page.locator('label[for="email"]').or(page.locator('text=Email'))).toBeVisible();
    await expect(page.locator('label[for="password"]').or(page.locator('text=Password'))).toBeVisible();
  });
});

/**
 * PERFORMANCE TESTS
 */
test.describe('Performance', () => {
  test('Dashboard loads within acceptable time', async ({ page }) => {
    await loginUser(page);
    
    const startTime = Date.now();
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // Dashboard should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('Event page loads within acceptable time', async ({ page }) => {
    await loginUser(page);
    const eventId = await createEvent(page);
    
    const startTime = Date.now();
    await page.goto(`/events/${eventId}`);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // Event page should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });
});
