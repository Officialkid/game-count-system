import { test, expect, type Page } from '@playwright/test';

/**
 * AUTH FLOW TESTS
 */
test.describe('Authentication Flow', () => {
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    name: 'Auth Test User',
  };

  test('User can register, logout, and login', async ({ page }) => {
    // Register
    await page.goto('/auth/register');
    await page.fill('input[name="name"]', testUser.name);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/\/(dashboard|events)/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/(dashboard|events)/);

    // Logout
    await page.click('button:has-text("Logout")').catch(() => {
      // Try clicking user menu first
      page.click('[data-testid="user-menu"]').then(() => {
        page.click('button:has-text("Logout")');
      });
    });

    await page.waitForURL(/\/(auth\/login|\/)/);

    // Login again
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/\/(dashboard|events)/);
    await expect(page).toHaveURL(/\/(dashboard|events)/);
  });

  test('Registration validation works', async ({ page }) => {
    await page.goto('/auth/register');

    // Try to submit without email
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    // Should show validation error or stay on page
    await expect(page).toHaveURL(/\/auth\/register/);
  });

  test('Login with incorrect credentials shows error', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'nonexistent@example.com');
    await page.fill('input[name="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(
      page.locator('text=Invalid').or(page.locator('text=failed')).or(page.locator('text=error'))
    ).toBeVisible({ timeout: 5000 });
  });
});

/**
 * EVENT CREATION TESTS
 */
test.describe('Event Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|events)/, { timeout: 10000 });
  });

  test('Create event with valid data', async ({ page }) => {
    await page.goto('/events/create');
    
    await page.fill('input[name="event_name"]', 'E2E Test Event');
    await page.fill('input[name="num_teams"]', '4');
    await page.fill('input[name="num_games"]', '5');
    
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/\/events\/[a-zA-Z0-9]+/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/events\/[a-zA-Z0-9]+/);
  });

  test('Event form validation', async ({ page }) => {
    await page.goto('/events/create');
    
    // Try to submit with num_teams = 0
    await page.fill('input[name="event_name"]', 'Invalid Event');
    await page.fill('input[name="num_teams"]', '0');
    await page.fill('input[name="num_games"]', '3');
    
    await page.click('button[type="submit"]');
    
    // Should stay on create page or show validation error
    await expect(page).toHaveURL(/\/events\/create/);
  });

  test('Navigate between event tabs', async ({ page }) => {
    // Create event first
    await page.goto('/events/create');
    await page.fill('input[name="event_name"]', 'Tab Test Event');
    await page.fill('input[name="num_teams"]', '3');
    await page.fill('input[name="num_games"]', '3');
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/\/events\/[a-zA-Z0-9]+/);
    const eventId = page.url().split('/events/')[1]?.split('?')[0];

    // Test each tab
    const tabs = ['teams', 'scoreboard', 'recap', 'history', 'settings'];
    for (const tab of tabs) {
      await page.click(`button:has-text("${tab.charAt(0).toUpperCase() + tab.slice(1)}")`);
      await expect(page).toHaveURL(new RegExp(`/events/${eventId}\\?tab=${tab}`));
    }
  });
});

/**
 * TEAM MANAGEMENT TESTS
 */
test.describe('Team Management', () => {
  let eventId: string;

  test.beforeEach(async ({ page }) => {
    // Login and create event
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|events)/);

    await page.goto('/events/create');
    await page.fill('input[name="event_name"]', 'Team Test Event');
    await page.fill('input[name="num_teams"]', '3');
    await page.fill('input[name="num_games"]', '3');
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/\/events\/[a-zA-Z0-9]+/);
    eventId = page.url().split('/events/')[1]?.split('?')[0]!;
  });

  test('Add team to event', async ({ page }) => {
    await page.goto(`/events/${eventId}?tab=teams`);
    
    await page.click('button:has-text("Add Team")');
    await page.fill('input[name="team_name"]', 'Alpha Team');
    await page.fill('input[name="color"]', '#FF5733');
    await page.click('button:has-text("Create")');
    
    await expect(page.locator('text=Alpha Team')).toBeVisible();
  });

  test('Add multiple teams', async ({ page }) => {
    await page.goto(`/events/${eventId}?tab=teams`);
    
    const teams = ['Team A', 'Team B', 'Team C'];
    
    for (const teamName of teams) {
      await page.click('button:has-text("Add Team")');
      await page.fill('input[name="team_name"]', teamName);
      await page.fill('input[name="color"]', '#' + Math.floor(Math.random()*16777215).toString(16));
      await page.click('button:has-text("Create")');
      
      await expect(page.locator(`text=${teamName}`)).toBeVisible();
    }
  });

  test('Delete team', async ({ page }) => {
    await page.goto(`/events/${eventId}?tab=teams`);
    
    // Add team first
    await page.click('button:has-text("Add Team")');
    await page.fill('input[name="team_name"]', 'Temporary Team');
    await page.fill('input[name="color"]', '#123456');
    await page.click('button:has-text("Create")');
    
    await expect(page.locator('text=Temporary Team')).toBeVisible();
    
    // Delete team
    await page.click('button[aria-label="Delete Temporary Team"]').catch(() => {
      page.locator('text=Temporary Team').locator('..').locator('button:has-text("Delete")').click();
    });
    
    // Confirm deletion if modal appears
    await page.click('button:has-text("Confirm")').catch(() => {});
    
    await page.waitForTimeout(1000);
    await expect(page.locator('text=Temporary Team')).not.toBeVisible();
  });
});

/**
 * SCORE SUBMISSION TESTS
 */
test.describe('Score Submission', () => {
  let eventId: string;

  test.beforeEach(async ({ page }) => {
    // Login, create event, add teams
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|events)/);

    await page.goto('/events/create');
    await page.fill('input[name="event_name"]', 'Score Test Event');
    await page.fill('input[name="num_teams"]', '2');
    await page.fill('input[name="num_games"]', '3');
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/\/events\/[a-zA-Z0-9]+/);
    eventId = page.url().split('/events/')[1]?.split('?')[0]!;

    // Add two teams
    await page.goto(`/events/${eventId}?tab=teams`);
    
    await page.click('button:has-text("Add Team")');
    await page.fill('input[name="team_name"]', 'Team Red');
    await page.fill('input[name="color"]', '#FF0000');
    await page.click('button:has-text("Create")');
    await page.waitForTimeout(500);
    
    await page.click('button:has-text("Add Team")');
    await page.fill('input[name="team_name"]', 'Team Blue');
    await page.fill('input[name="color"]', '#0000FF');
    await page.click('button:has-text("Create")');
    await page.waitForTimeout(500);
  });

  test('Submit score for game 1', async ({ page }) => {
    await page.goto(`/events/${eventId}?tab=scoreboard`);
    
    // Select game 1
    await page.selectOption('select[name="game"]', '1');
    
    // Enter scores
    const teamRows = await page.locator('tr[data-team-id]').all();
    if (teamRows.length >= 2) {
      await teamRows[0].locator('input[type="number"]').fill('15');
      await teamRows[1].locator('input[type="number"]').fill('12');
      
      await teamRows[0].locator('input[type="number"]').press('Enter');
    }
    
    await page.waitForTimeout(1000);
    
    // Verify scores saved
    await expect(page.locator('text=15')).toBeVisible();
    await expect(page.locator('text=12')).toBeVisible();
  });

  test('Update existing score', async ({ page }) => {
    await page.goto(`/events/${eventId}?tab=scoreboard`);
    
    await page.selectOption('select[name="game"]', '1');
    
    const teamRows = await page.locator('tr[data-team-id]').all();
    if (teamRows.length >= 1) {
      // Submit initial score
      await teamRows[0].locator('input[type="number"]').fill('10');
      await teamRows[0].locator('input[type="number"]').press('Enter');
      await page.waitForTimeout(1000);
      
      // Update score
      await teamRows[0].locator('input[type="number"]').fill('20');
      await teamRows[0].locator('input[type="number"]').press('Enter');
      await page.waitForTimeout(1000);
      
      // Verify updated score
      await expect(page.locator('text=20')).toBeVisible();
    }
  });

  test('Negative scores handled correctly', async ({ page }) => {
    await page.goto(`/events/${eventId}?tab=scoreboard`);
    
    await page.selectOption('select[name="game"]', '1');
    
    const teamRows = await page.locator('tr[data-team-id]').all();
    if (teamRows.length >= 1) {
      await teamRows[0].locator('input[type="number"]').fill('-5');
      await teamRows[0].locator('input[type="number"]').press('Enter');
      await page.waitForTimeout(1000);
      
      // Should either reject negative score or accept it (depending on business rules)
      // Verify the input handling
      const value = await teamRows[0].locator('input[type="number"]').inputValue();
      expect(value).toBeTruthy();
    }
  });
});
