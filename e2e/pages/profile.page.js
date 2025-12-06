/**
 * Page Object Model for Profile page
 */
export class ProfilePage {
    constructor(page) {
      this.page = page;
  
      // Profile info locators
      this.profilePhoto = page.locator('.profile-photo, .avatar');
      this.userName = page.locator('.profile-name, .user-name');
      this.friendCount = page.locator('.friend-count, [class*="friend"]');
  
      // Edit profile
      this.editButton = page.locator('button:has-text("Edit"), button:has-text("Edit Profile")');
      this.firstNameInput = page.locator('input[name="first_name"], input[placeholder*="First"]');
      this.lastNameInput = page.locator('input[name="last_name"], input[placeholder*="Last"]');
      this.usernameInput = page.locator('input[name="username"]');
      this.saveButton = page.locator('button:has-text("Save")');
      this.cancelButton = page.locator('button:has-text("Cancel")');
  
      // Password change
      this.changePasswordButton = page.locator('button:has-text("Change Password")');
      this.currentPasswordInput = page.locator('input[name="currentPassword"], input[placeholder*="Current"]');
      this.newPasswordInput = page.locator('input[name="newPassword"], input[placeholder*="New Password"]');
      this.confirmPasswordInput = page.locator('input[name="confirmNewPassword"], input[placeholder*="Confirm"]');
  
      // Photo upload
      this.photoUploadInput = page.locator('input[type="file"]');
  
      // Friends
      this.friendsButton = page.locator('button:has-text("Friends"), .friend-count');
      this.friendsModal = page.locator('.friends-modal, [class*="modal"]').filter({ hasText: 'Friends' });
      this.friendsList = page.locator('.friends-list, .friend-item');
  
      // Friend requests
      this.pendingRequestsButton = page.locator('button:has-text("Pending"), button:has-text("Requests")');
      this.sendFriendRequestButton = page.locator('button:has-text("Add Friend"), button:has-text("Send Request")');
      this.acceptRequestButton = page.locator('button:has-text("Accept")');
      this.rejectRequestButton = page.locator('button:has-text("Reject"), button:has-text("Decline")');
  
      // User's rides section
      this.ridesSection = page.locator('.rides-section, [class*="rides"]');
      this.rideCards = page.locator('.card');
  
      // Error/Success messages
      this.errorMessage = page.locator('.error-message, .error');
      this.successMessage = page.locator('.success-message, .success');
  
      // Logout
      this.logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out")');
    }
  
    async goto() {
      try {
        await this.page.goto('/profile');
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
            await this.page.goto('/profile');
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
  
    async gotoUserProfile(userId) {
      try {
        await this.page.goto(`/profile/${userId}`);
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
            await this.page.goto(`/profile/${userId}`);
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
  
    async editProfile({ firstName, lastName, username }) {
      await this.editButton.waitFor({ state: 'visible', timeout: 10000 });
      await this.editButton.click();
  
      if (firstName) {
        await this.firstNameInput.clear();
        await this.firstNameInput.fill(firstName);
      }
      if (lastName) {
        await this.lastNameInput.clear();
        await this.lastNameInput.fill(lastName);
      }
      if (username) {
        await this.usernameInput.clear();
        await this.usernameInput.fill(username);
      }
  
      await this.saveButton.click();
    }
  
    async changePassword(currentPassword, newPassword, confirmPassword) {
      await this.changePasswordButton.waitFor({ state: 'visible', timeout: 10000 });
      await this.changePasswordButton.click();
      await this.currentPasswordInput.fill(currentPassword);
      await this.newPasswordInput.fill(newPassword);
      await this.confirmPasswordInput.fill(confirmPassword || newPassword);
      await this.saveButton.click();
    }
  
    async uploadPhoto(filePath) {
      await this.photoUploadInput.setInputFiles(filePath);
    }
  
    async openFriendsList() {
      await this.friendsButton.click();
      await this.friendsModal.waitFor({ state: 'visible' });
    }
  
    async sendFriendRequest() {
      await this.sendFriendRequestButton.click();
    }
  
    async acceptFriendRequest(userName) {
      const requestItem = this.page.locator('.friend-request, .request-item').filter({ hasText: userName });
      await requestItem.locator('button:has-text("Accept")').click();
    }
  
    async rejectFriendRequest(userName) {
      const requestItem = this.page.locator('.friend-request, .request-item').filter({ hasText: userName });
      await requestItem.locator('button:has-text("Reject"), button:has-text("Decline")').click();
    }
  
    async logout() {
      await this.logoutButton.waitFor({ state: 'visible', timeout: 10000 });
      await this.logoutButton.click();
    }
  
    async getFriendCount() {
      const text = await this.friendCount.textContent();
      const match = text.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    }
  
    async getUserRidesCount() {
      return this.rideCards.count();
    }
  
    async isOnProfilePage() {
      return this.page.url().includes('/profile');
    }
  
    async waitForLoad() {
      await this.page.waitForLoadState('networkidle');
      await this.page.waitForTimeout(500);
    }
  }