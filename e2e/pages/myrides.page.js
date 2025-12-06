/**
 * Page Object Model for MyRides page
 */
export class MyRidesPage {
  constructor(page) {
    this.page = page;

    // Section locators
    this.pageTitle = page.locator('.page-container h1');
    this.threeColumnLayout = page.locator('.three-column-layout');
    this.createdSection = page.locator('.rides-column').filter({ hasText: 'Created' });
    this.joinedSection = page.locator('.rides-column').filter({ hasText: 'Joined' });
    this.requestedSection = page.locator('.rides-column').filter({ hasText: 'Requested' });

    // Card locators within sections
    this.createdRides = this.createdSection.locator('.card');
    this.joinedRides = this.joinedSection.locator('.card');
    this.requestedRides = this.requestedSection.locator('.card');

    // Button locators
    this.leaveRideButtons = page.locator('.btn-cancel-joined');
    this.cancelRequestButtons = page.locator('.btn-cancel-pending');

    // Empty state messages
    this.createdEmptyMessage = this.createdSection.locator('.empty-message');
    this.joinedEmptyMessage = this.joinedSection.locator('.empty-message');
    this.requestedEmptyMessage = this.requestedSection.locator('.empty-message');

    // Loading state
    this.skeletonCards = page.locator('.skeleton-card');
  }

  async goto() {
    try {
      await this.page.goto('/myrides');
      try {
        await this.page.waitForLoadState('load');
      } catch (error) {
        if (!error.message.includes('closed')) {
          throw error;
        }
      }

      // If redirected to login, wait and retry
      if (this.page.url().includes('/login')) {
        try {
          await this.page.waitForTimeout(1000);
        } catch (error) {
          return;
        }
        try {
          await this.page.goto('/myrides');
          await this.page.waitForLoadState('load');
        } catch (error) {
          if (error.message.includes('closed')) {
            return;
          }
        }
      }
    } catch (error) {
      if (!error.message.includes('closed')) {
        throw error;
      }
    }
  }

  async waitForLoad() {
    // Wait for page to stabilize
    try {
      await this.page.waitForLoadState('load');
    } catch (error) {
      if (!error.message.includes('closed')) {
        throw error;
      }
    }

    // Wait for skeleton cards to disappear or three-column layout to appear
    for (let i = 0; i < 30; i++) {
      const skeletonHidden = await this.skeletonCards.first().isHidden().catch(() => true);
      const layoutVisible = await this.threeColumnLayout.isVisible().catch(() => false);
      
      if (skeletonHidden || layoutVisible) {
        break;
      }
      await this.page.waitForTimeout(500);
    }

    // Additional wait for content to render
    try {
      await this.page.waitForTimeout(500);
    } catch (error) {
      if (error.message.includes('closed')) {
        throw error;
      }
    }
  }

  async getCreatedRidesCount() {
    await this.waitForLoad();
    return this.createdRides.count();
  }

  async getJoinedRidesCount() {
    await this.waitForLoad();
    return this.joinedRides.count();
  }

  async getRequestedRidesCount() {
    await this.waitForLoad();
    return this.requestedRides.count();
  }

  async findCreatedRide(destination) {
    await this.waitForLoad();
    const ride = this.createdRides.filter({ hasText: destination }).first();
    // Check if ride is visible, with retry
    let attempts = 0;
    while (attempts < 3) {
      const isVisible = await ride.isVisible().catch(() => false);
      if (isVisible) break;
      await this.page.waitForTimeout(500);
      attempts++;
    }
    return ride;
  }

  async findJoinedRide(destination) {
    await this.waitForLoad();
    const ride = this.joinedRides.filter({ hasText: destination }).first();
    // Check if ride is visible, with retry
    let attempts = 0;
    while (attempts < 3) {
      const isVisible = await ride.isVisible().catch(() => false);
      if (isVisible) break;
      await this.page.waitForTimeout(500);
      attempts++;
    }
    return ride;
  }

  async findRequestedRide(destination) {
    await this.waitForLoad();
    const ride = this.requestedRides.filter({ hasText: destination }).first();
    // Check if ride is visible, with retry
    let attempts = 0;
    while (attempts < 3) {
      const isVisible = await ride.isVisible().catch(() => false);
      if (isVisible) break;
      await this.page.waitForTimeout(500);
      attempts++;
    }
    return ride;
  }

  async leaveRide(destination) {
    const rideWrapper = this.joinedSection.locator('.joined-ride-wrapper').filter({ hasText: destination });
    const leaveButton = rideWrapper.locator('.btn-cancel-joined');

    // Handle confirmation dialog
    this.page.once('dialog', dialog => dialog.accept());
    await leaveButton.click();
  }

  async cancelRequest(destination) {
    const rideWrapper = this.requestedSection.locator('.pending-ride-wrapper').filter({ hasText: destination });
    const cancelButton = rideWrapper.locator('.btn-cancel-pending');

    // Handle confirmation dialog
    this.page.once('dialog', dialog => dialog.accept());
    await cancelButton.click();
  }

  async openRideDetails(destination, section = 'created') {
    let ride;
    switch (section) {
      case 'created':
        ride = await this.findCreatedRide(destination);
        break;
      case 'joined':
        ride = await this.findJoinedRide(destination);
        break;
      case 'requested':
        ride = await this.findRequestedRide(destination);
        break;
    }
    await ride.click();
  }

  async isCreatedSectionEmpty() {
    return this.createdEmptyMessage.isVisible();
  }

  async isJoinedSectionEmpty() {
    return this.joinedEmptyMessage.isVisible();
  }

  async isRequestedSectionEmpty() {
    return this.requestedEmptyMessage.isVisible();
  }

  async isOnMyRidesPage() {
    return this.page.url().includes('/myrides');
  }
}
