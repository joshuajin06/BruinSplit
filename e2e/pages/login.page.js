/**
 * Page Object Model for Login/Signup page
 */
export class LoginPage {
  constructor(page) {
    this.page = page;

    // Locators - based on actual UI from loginsignup.jsx
    this.usernameInput = page.locator('input[placeholder="Username"]');
    this.emailInput = page.locator('input[placeholder="Email"]');
    this.passwordInput = page.locator('input[placeholder="Password"]');
    this.firstNameInput = page.locator('input[placeholder="First Name"]');
    this.lastNameInput = page.locator('input[placeholder="Last Name"]');
    this.submitButton = page.locator('.login-signup-button');
    // The toggle link shows "Don't have an account?" for login mode
    this.toggleLink = page.locator('.toggle-action-button');
    this.errorMessage = page.locator('.error-message');
    this.headerText = page.locator('.header .text h1');
  }

  async goto() {
    try {
      await this.page.goto('/login');
      try {
        await this.page.waitForLoadState('load');
      } catch (error) {
        if (!error.message.includes('closed')) {
          throw error;
        }
      }
    } catch (error) {
      if (!error.message.includes('closed')) {
        throw error;
      }
    }
  }

  async login(username, email, password) {
    // Ensure we're in login mode
    await this.switchToLogin();

    await this.usernameInput.fill(username);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async signup(username, firstName, lastName, email, password) {
    // Switch to signup mode if not already
    await this.switchToSignup();

    // Fill in signup form
    await this.usernameInput.fill(username);
    await this.firstNameInput.fill(firstName);
    await this.lastNameInput.fill(lastName);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async switchToSignup() {
    // Check if we're already in signup mode by looking for First Name input
    const isSignupMode = await this.firstNameInput.isVisible().catch(() => false);
    if (!isSignupMode) {
      await this.toggleLink.click();
      // Wait for signup fields to appear
      for (let i = 0; i < 10; i++) {
        const isVisible = await this.firstNameInput.isVisible().catch(() => false);
        if (isVisible) break;
        await this.page.waitForTimeout(500);
      }
    }
  }

  async switchToLogin() {
    // Check if we're in signup mode by looking for First Name input
    const isSignupMode = await this.firstNameInput.isVisible().catch(() => false);
    if (isSignupMode) {
      await this.toggleLink.click();
      // Wait for signup fields to disappear
      for (let i = 0; i < 10; i++) {
        const isHidden = await this.firstNameInput.isHidden().catch(() => true);
        if (isHidden) break;
        await this.page.waitForTimeout(500);
      }
    }
  }

  async getErrorMessage() {
    // Wait for error to appear
    for (let i = 0; i < 10; i++) {
      const isVisible = await this.errorMessage.isVisible().catch(() => false);
      if (isVisible) break;
      await this.page.waitForTimeout(500);
    }
    return this.errorMessage.textContent();
  }

  async isOnLoginPage() {
    return this.page.url().includes('/login');
  }

  async waitForAuthRedirect() {
    // Wait to be redirected away from login page (to home)
    await this.page.waitForURL('/', { timeout: 10000 });

    // Wait for token to be stored
    await this.page.waitForFunction(() => {
      return localStorage.getItem('token') !== null;
    }, { timeout: 10000 });
  }
}
