/**
 * Page Object Model for Home page
 */
export class HomePage {
  constructor(page) {
    this.page = page;

    // Locators
    this.searchInput = page.locator('.search-input');
    this.searchButton = page.locator('.btn-search');
    this.getStartedButton = page.locator('.btn-large');
    this.mainHeading = page.locator('.main-heading');
    this.featuresSection = page.locator('.features-section');
  }

  async goto() {
    await this.page.goto('/');
  }

  async search(query) {
    await this.searchInput.fill(query);
    await this.searchButton.click();
  }

  async clickGetStarted() {
    await this.getStartedButton.click();
  }

  async getMainHeadingText() {
    return this.mainHeading.textContent();
  }

  async isOnHomePage() {
    return this.page.url() === '/' || this.page.url().endsWith(':5173/');
  }
}
