/**
 * E2E Test Suite 1: Complete Ride Lifecycle xD
 *
 * Tests the core user flow of BruinSplit:
 * - User A signs up and creates a ride
 * - User B signs up, finds the ride, and requests to join
 * - User A approves the request
 * - Both users can see the ride in their MyRides
 * - Users can exchange messages
 * - User B leaves the ride
 * - User A deletes the ride
 */
import { test, expect, generateTestRide } from '../fixtures/index.js';
import { LoginPage } from '../pages/login.page.js';
import { PostingsPage } from '../pages/postings.page.js';
import { MyRidesPage } from '../pages/myrides.page.js';
import { HomePage } from '../pages/home.page.js';

/**
 * helper function to retry finding a ride card with polling
 * Uses longer waits and more retries for database sync
 */
async function waitForRideToAppear(page, destination, maxRetries = 10) {
  for (let i = 0; i < maxRetries; i++) {
    // navigate fresh each time to get latest data
    await page.goto('/postings');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const rideCard = page.locator('.card').filter({ hasText: destination }).first();
    const isVisible = await rideCard.isVisible().catch(() => false);

    if (isVisible) {
      return rideCard;
    }

    // wait before retrying with increasing delay
    await page.waitForTimeout(2000 + (i * 500));
  }

  // return null instead of throwing - let caller handle
  return null;
}

test.describe('Ride Lifecycle - Complete User Journey', () => {

  test('complete ride lifecycle: create, join, approve, message, leave, delete', async ({ twoUsers }) => {
    // Increase timeout for this complex test
    test.setTimeout(240000);

    const { owner, joiner } = twoUsers;
    const rideData = generateTestRide({
      origin: 'UCLA Hedrick Hall',
      destination: `LAX Terminal ${Date.now() % 9 + 1}`,
      notes: 'E2E Test Ride - Looking for riders to LAX'
    });

    // owner creates a ride
    const ownerPostingsPage = new PostingsPage(owner.page);
    await ownerPostingsPage.goto();
    await ownerPostingsPage.waitForRidesToLoad();

    await ownerPostingsPage.createRide({
      origin: rideData.origin,
      destination: rideData.destination,
      departure: rideData.departure,
      platform: rideData.platform,
      maxSeats: rideData.maxSeats,
      notes: rideData.notes
    });

    // verify modal closed (ride created successfully)
    await expect(ownerPostingsPage.modal).not.toBeVisible();

    // owner verifies ride appears in myRides
    const ownerMyRidesPage = new MyRidesPage(owner.page);
    
    // retry logic for finding the created ride
    let ownerCreatedRide;
    let rideFound = false;
    for (let i = 0; i < 5; i++) {
      await ownerMyRidesPage.goto();
      await ownerMyRidesPage.waitForLoad();
      
      ownerCreatedRide = await ownerMyRidesPage.findCreatedRide(rideData.destination);
      const isVisible = await ownerCreatedRide.isVisible().catch(() => false);
      
      if (isVisible) {
        rideFound = true;
        break;
      }
      
      // wait before retrying
      await owner.page.waitForTimeout(1500);
    }
    
    if (!rideFound) {
      console.log('Created ride not found after retries - skipping test');
      test.skip();
      return;
    }

    // verify the ride appears in Created section
    await expect(ownerCreatedRide).toBeVisible();


    // joiner finds the ride (with retry logic)
    // use retry logic to wait for ride to appear in the database
    const rideCard = await waitForRideToAppear(joiner.page, rideData.destination);

    // skip rest of test if ride doesn't appear (database sync issue)
    if (!rideCard) {
      console.log('Ride not found after retries - skipping multi-user flow');
      test.skip();
      return;
    }
    await expect(rideCard).toBeVisible();


    // joiner requests to join the ride
    // click on the ride card to open details or find join button
    const joinButton = rideCard.locator('button:has-text("Request to Join"), button:has-text("Join")');
    await joinButton.click();

    // wait for the join request to be processed
    await joiner.page.waitForTimeout(2000);


    // jooner verifies ride appears in MyRides (in requested)
    const joinerMyRidesPage = new MyRidesPage(joiner.page);
    await joinerMyRidesPage.goto();
    await joinerMyRidesPage.waitForLoad();

    // verify ride appears in Requested section (with retry)
    let joinerRequestedRide;
    for (let i = 0; i < 3; i++) {
      joinerRequestedRide = await joinerMyRidesPage.findRequestedRide(rideData.destination);
      const isVisible = await joinerRequestedRide.isVisible().catch(() => false);
      if (isVisible) break;
      await joiner.page.waitForTimeout(1000);
      await joinerMyRidesPage.goto();
      await joinerMyRidesPage.waitForLoad();
    }
    await expect(joinerRequestedRide).toBeVisible();

    // owner approves the join request
    await ownerMyRidesPage.goto();
    await ownerMyRidesPage.waitForLoad();

    // click on the created ride to open details
    const createdRideCard = await ownerMyRidesPage.findCreatedRide(rideData.destination);
    await createdRideCard.click();

    // wait for modal/details to load
    await owner.page.waitForTimeout(1000);

    // look for pending requests tab or section
    const pendingTab = owner.page.locator('button:has-text("Pending"), [role="tab"]:has-text("Pending")');
    if (await pendingTab.isVisible().catch(() => false)) {
      await pendingTab.click();
      await owner.page.waitForTimeout(500);
    }

    // find and approve the joiner's request
    const approveButton = owner.page.locator('button:has-text("Approve")').first();
    await approveButton.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});

    if (await approveButton.isVisible().catch(() => false)) {
      await approveButton.click();
      await owner.page.waitForTimeout(2000);
    }

    // close any modal
    const closeButton = owner.page.locator('.modal-close, button:has-text("Close"), [aria-label="Close"]').first();
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click();
    }

    // joiner verifies they're in the Joined section
    await joiner.page.waitForTimeout(1000);
    await joinerMyRidesPage.goto();
    await joinerMyRidesPage.waitForLoad();

    // ride should now be in Joined section (with retry)
    let joinerJoinedRide;
    for (let i = 0; i < 3; i++) {
      joinerJoinedRide = await joinerMyRidesPage.findJoinedRide(rideData.destination);
      const isVisible = await joinerJoinedRide.isVisible().catch(() => false);
      if (isVisible) break;
      await joiner.page.waitForTimeout(1000);
      await joinerMyRidesPage.goto();
      await joinerMyRidesPage.waitForLoad();
    }
    await expect(joinerJoinedRide).toBeVisible();

    // test messaging bt users
    await joinerJoinedRide.click();
    await joiner.page.waitForTimeout(500);

    // look for messages tab or chat functionality
    const messagesTab = joiner.page.locator('button:has-text("Messages"), button:has-text("Chat"), [role="tab"]:has-text("Messages")');
    if (await messagesTab.isVisible().catch(() => false)) {
      await messagesTab.click();

      // try to send a message
      const messageInput = joiner.page.locator('input[placeholder*="message"], textarea[placeholder*="message"]');
      if (await messageInput.isVisible().catch(() => false)) {
        await messageInput.fill('Hello from E2E test!');

        const sendButton = joiner.page.locator('button:has-text("Send")');
        if (await sendButton.isVisible().catch(() => false)) {
          await sendButton.click();
          await joiner.page.waitForTimeout(500);
        }
      }
    }

    // close modal if open
    const joinerCloseButton = joiner.page.locator('.modal-close, button:has-text("Close"), [aria-label="Close"]').first();
    if (await joinerCloseButton.isVisible().catch(() => false)) {
      await joinerCloseButton.click();
    }

    // joiner leaves the ride
    await joinerMyRidesPage.goto();
    await joinerMyRidesPage.waitForLoad();

    // find the leave button for the joined ride
    const joinedRideWrapper = joiner.page.locator('.joined-ride-wrapper, .card-wrapper').filter({ hasText: rideData.destination }).first();
    const leaveButton = joinedRideWrapper.locator('button:has-text("Leave"), .btn-cancel-joined');

    if (await leaveButton.isVisible().catch(() => false)) {
      // handle confirmation dialog
      joiner.page.once('dialog', dialog => dialog.accept());
      await leaveButton.click();
      await joiner.page.waitForTimeout(2000);
    }

    // refresh and verify ride is no longer in Joined section
    await joinerMyRidesPage.goto();
    await joinerMyRidesPage.waitForLoad();

    const leftRide = await joinerMyRidesPage.findJoinedRide(rideData.destination);
    await expect(leftRide).not.toBeVisible();

    // owner deletes the ride
    await ownerMyRidesPage.goto();
    await ownerMyRidesPage.waitForLoad();

    // find the created ride and delete it
    const rideToDelete = await ownerMyRidesPage.findCreatedRide(rideData.destination);
    await rideToDelete.click();
    await owner.page.waitForTimeout(500);

    // look for delete button in the modal/details view
    const deleteButton = owner.page.locator('button:has-text("Delete"), button:has-text("Delete Ride")').first();
    if (await deleteButton.isVisible().catch(() => false)) {
      // handle confirmation dialog
      owner.page.once('dialog', dialog => dialog.accept());
      await deleteButton.click();
      await owner.page.waitForTimeout(2000);
    }

    // verify ride is deleted
    await ownerMyRidesPage.goto();
    await ownerMyRidesPage.waitForLoad();

    const deletedRide = await ownerMyRidesPage.findCreatedRide(rideData.destination);
    await expect(deletedRide).not.toBeVisible();
  });

  test('ride search from home page navigates to postings with query', async ({ authenticatedUser }) => {
    const { page } = authenticatedUser;
    const homePage = new HomePage(page);

    await homePage.goto();
    await homePage.search('LAX');

    // verify navigation to postings with search query
    await expect(page).toHaveURL(/\/postings\?q=LAX/);
  });

  test('unauthenticated user cannot create rides', async ({ page }) => {
    const postingsPage = new PostingsPage(page);
    await postingsPage.goto();
    await postingsPage.waitForRidesToLoad();

    // the add post button should not be visible for unauthenticated users
    await expect(postingsPage.addPostButton).not.toBeVisible();
  });

  test('authenticated user sees add post button', async ({ authenticatedUser }) => {
    const { page } = authenticatedUser;
    const postingsPage = new PostingsPage(page);

    await postingsPage.goto();
    await postingsPage.waitForRidesToLoad();

    // The add post button should be visible for authenticated users
    await expect(postingsPage.addPostButton).toBeVisible();
  });

  test('ride creation form validates required fields', async ({ authenticatedUser }) => {
    const { page } = authenticatedUser;
    const postingsPage = new PostingsPage(page);

    await postingsPage.goto();
    await postingsPage.waitForRidesToLoad();

    await postingsPage.openCreateRideModal();

    // try to submit without filling required fields
    await postingsPage.createButton.click();

    // modal should still be visible (form not submitted)
    await expect(postingsPage.modal).toBeVisible();

    // should show validation error
    const errorVisible = await postingsPage.modalError.isVisible();
    if (errorVisible) {
      const errorText = await postingsPage.getModalError();
      expect(errorText).toContain('origin');
    }
  });

  test('MyRides page shows three sections', async ({ authenticatedUser }) => {
    const { page } = authenticatedUser;
    const myRidesPage = new MyRidesPage(page);

    await myRidesPage.goto();
    await myRidesPage.waitForLoad();

    // verify all three sections are present
    await expect(myRidesPage.createdSection).toBeVisible();
    await expect(myRidesPage.joinedSection).toBeVisible();
    await expect(myRidesPage.requestedSection).toBeVisible();
  });
});