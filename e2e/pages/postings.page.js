/**
 * Page Object Model for Postings page
 */
export class PostingsPage {
    constructor(page) {
      this.page = page;
  
      // Locators
      this.pageTitle = page.locator('.posts-title-section h1');
      this.addPostButton = page.locator('.add-post');
      this.searchBar = page.locator('.search-bar input, input[type="text"]').first();
      this.friendsFilterButton = page.locator('.friends-filter-button');
      this.rideCards = page.locator('.card');
      this.emptyMessage = page.locator('.empty-message');
      this.skeletonCards = page.locator('.skeleton-card');
  
      // Modal locators
      this.modal = page.locator('.ride-form');
      this.modalCloseButton = page.locator('.modal-close');
      this.originInput = page.locator('input[name="origin_text"]');
      this.destinationInput = page.locator('input[name="destination_text"]');
      this.departureInput = page.locator('input[name="depart_at"]');
      this.platformSelect = page.locator('select[name="platform"]');
      this.maxSeatsInput = page.locator('input[name="max_seats"]');
      this.notesTextarea = page.locator('textarea[name="notes"]');
      this.createButton = page.locator('.form-actions button[type="submit"]');
      this.resetButton = page.locator('.form-actions button[type="button"]');
      this.modalError = page.locator('.modal-content .error');
    }
  
    async goto() {
      try {
        await this.page.goto('/postings');
        // Handle auth redirect - wait for either postings page or login page
        try {
          await this.page.waitForLoadState('load');
        } catch (error) {
          if (!error.message.includes('closed')) {
            throw error;
          }
        }
  
        // If redirected to login, we need to wait for auth then retry
        if (this.page.url().includes('/login')) {
          // Wait for potential auth state to restore
          try {
            await this.page.waitForTimeout(1000);
          } catch (error) {
            // Page may have closed
            return;
          }
          try {
            await this.page.goto('/postings');
            await this.page.waitForLoadState('load');
          } catch (error) {
            if (error.message.includes('closed')) {
              return;
            }
          }
        }
      } catch (error) {
        // If page is closed or navigation failed, throw with helpful message
        if (error.message.includes('closed')) {
          throw new Error('Browser/page closed during navigation to /postings');
        }
        throw error;
      }
    }
  
    async gotoAuthenticated() {
      // Navigate and ensure we stay on postings (for authenticated users)
      await this.page.goto('/postings');
      await this.page.waitForLoadState('load').catch(() => {});

      // If we ended up on login, throw an error
      if (this.page.url().includes('/login')) {
        throw new Error('User is not authenticated - redirected to login');
      }
    }
  
    async gotoWithSearch(query) {
      await this.page.goto(`/postings?q=${encodeURIComponent(query)}`);
      try {
        await this.page.waitForLoadState('load');
      } catch (error) {
        if (!error.message.includes('closed')) {
          throw error;
        }
      }
    }
  
    async openCreateRideModal() {
      await this.addPostButton.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
      await this.addPostButton.click();
      await this.modal.waitFor({ state: 'visible' });
    }
  
    async closeModal() {
      await this.modalCloseButton.click();
      await this.modal.waitFor({ state: 'hidden' }).catch(() => {});
    }
  
    async createRide({ origin, destination, departure, platform = 'LYFT', maxSeats = 2, notes = '' }) {
      await this.openCreateRideModal();

      await this.originInput.fill(origin);
      await this.destinationInput.fill(destination);
      await this.departureInput.fill(departure);
      await this.platformSelect.selectOption(platform);
      await this.maxSeatsInput.fill(String(maxSeats));
      if (notes) {
        await this.notesTextarea.fill(notes);
      }

      await this.createButton.click();

      // Wait for modal to close (success) or error to appear
      try {
        await this.modal.waitFor({ state: 'hidden', timeout: 10000 });
      } catch (error) {
        // If modal doesn't hide, check if there's an error message
        const errorVisible = await this.modalError.isVisible().catch(() => false);
        if (!errorVisible) {
          throw error;
        }
      }
    }    async getRideCards() {
      return this.rideCards.all();
    }
  
    async getRideCardCount() {
      return this.rideCards.count();
    }
  
    async waitForRidesToLoad() {
      // Wait for page to be fully loaded first
      try {
        await this.page.waitForLoadState('load');
      } catch (error) {
        if (!error.message.includes('closed')) {
          throw error;
        }
      }
      
      // Wait for skeleton cards to disappear or timeout
      try {
        await this.skeletonCards.first().waitFor({ state: 'hidden', timeout: 10000 });
      } catch (error) {
        // Skeleton might not exist or page closing
        if (error.message.includes('closed')) {
          throw error;
        }
      }
  
      // Small delay to ensure DOM is fully rendered
      try {
        await this.page.waitForTimeout(500);
      } catch (error) {
        if (error.message.includes('closed')) {
          throw error;
        }
      }
    }
  
    async findRideCard(destination) {
      return this.page.locator('.card').filter({ hasText: destination }).first();
    }
  
    async clickJoinOnRide(destination) {
      const card = await this.findRideCard(destination);
      const joinButton = card.locator('button:has-text("Request to Join"), button:has-text("Join")');
      await joinButton.click();
    }
  
    async toggleFriendsFilter() {
      await this.friendsFilterButton.click();
    }
  
    async isModalVisible() {
      return this.modal.isVisible();
    }
  
    async getModalError() {
      return this.modalError.textContent();
    }
  
    async isOnPostingsPage() {
      return this.page.url().includes('/postings');
    }
  }