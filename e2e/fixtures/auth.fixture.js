import { test as base } from '@playwright/test';
import { LoginPage, HomePage, PostingsPage, MyRidesPage, ProfilePage } from '../pages/index.js';
import { generateTestUser } from './test-data.js';

/**
 * Extended test fixture with page objects and authentication helpers
 */
export const test = base.extend({
  // Page Objects
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },

  postingsPage: async ({ page }, use) => {
    await use(new PostingsPage(page));
  },

  myRidesPage: async ({ page }, use) => {
    await use(new MyRidesPage(page));
  },

  profilePage: async ({ page }, use) => {
    await use(new ProfilePage(page));
  },

  /**
   * Fixture that provides a logged-in user context
   * Creates a new user, signs them up, and provides their credentials
   */
  authenticatedUser: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    const userData = generateTestUser('auth');

    // Sign up the user
    await loginPage.goto();
    await loginPage.signup(
      userData.username,
      userData.firstName,
      userData.lastName,
      userData.email,
      userData.password
    );

    // Wait for redirect after signup
    await page.waitForURL('/', { timeout: 10000 });

    // CRITICAL: Wait for localStorage to be set and auth state to stabilize
    await page.waitForFunction(() => {
      return localStorage.getItem('token') !== null;
    }, { timeout: 10000 });

    // Give React time to update auth context state
    await page.waitForTimeout(500);

    // Verify we're actually authenticated by checking we can stay on home page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Wait for auth check to complete
    await page.waitForFunction(() => {
      return localStorage.getItem('token') !== null;
    }, { timeout: 5000 });

    await use({
      ...userData,
      page
    });
  },

  /**
   * Fixture for tests requiring two separate user contexts (e.g., ride owner and joiner)
   * Uses browser contexts to simulate two different users
   */
  twoUsers: async ({ browser }, use) => {
    // Create two separate browser contexts
    const ownerContext = await browser.newContext();
    const joinerContext = await browser.newContext();

    const ownerPage = await ownerContext.newPage();
    const joinerPage = await joinerContext.newPage();

    const ownerData = generateTestUser('owner');
    const joinerData = generateTestUser('joiner');

    // Helper function to sign up and wait for auth
    async function signUpAndWaitForAuth(page, userData) {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.signup(
        userData.username,
        userData.firstName,
        userData.lastName,
        userData.email,
        userData.password
      );

      // Wait for redirect
      await page.waitForURL('/', { timeout: 10000 });

      // Wait for localStorage token
      await page.waitForFunction(() => {
        return localStorage.getItem('token') !== null;
      }, { timeout: 10000 });

      // Wait for auth state to stabilize
      await page.waitForTimeout(500);

      // Reload to ensure auth persists
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Verify token still exists
      await page.waitForFunction(() => {
        return localStorage.getItem('token') !== null;
      }, { timeout: 5000 });
    }

    // Sign up both users
    await signUpAndWaitForAuth(ownerPage, ownerData);
    await signUpAndWaitForAuth(joinerPage, joinerData);

    await use({
      owner: {
        ...ownerData,
        page: ownerPage,
        context: ownerContext
      },
      joiner: {
        ...joinerData,
        page: joinerPage,
        context: joinerContext
      }
    });

    // Cleanup
    await ownerContext.close();
    await joinerContext.close();
  }
});

export { expect } from '@playwright/test';
