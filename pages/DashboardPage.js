// This file describes the Dashboard page (the page you land on after logging in).

class DashboardPage {
  constructor(page) {
    this.page = page;

    // The "Dashboard" heading near the top of the page.
    this.dashboardHeading = page.locator('h6', { hasText: 'Dashboard' });

    // The "Admin" link in the left-side menu.
    this.adminMenuLink = page.locator('.oxd-main-menu-item', { hasText: 'Admin' });
  }

  // Wait until the Dashboard has actually finished loading.
  async waitUntilLoaded() {
    await this.dashboardHeading.waitFor({ state: 'visible' });
  }

  // Click "Admin" in the side menu to go to the Admin section.
  async goToAdmin() {
    await this.adminMenuLink.click();
  }
}

module.exports = { DashboardPage };
