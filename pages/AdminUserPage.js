// This file describes the "Admin > System Users" page — the search form
// and the results table.

const { expect } = require('@playwright/test');

class AdminUserPage {
  constructor(page) {
    this.page = page;

    // The "System Users" title at the top of the search box.
    this.pageHeading = page.locator('h5', { hasText: 'System Users' });

    // Finding the Username search box:
    // On this page, ALL the search fields (Username, User Role, Employee
    // Name, Status) sit inside one shared row, so we can't just search the
    // whole row for "an input" — that would find more than one. Instead we
    // narrow down to the small box that wraps just the "Username" label and
    // its own input field.
    this.usernameBox = page
      .locator('.oxd-input-group', { has: page.locator('label', { hasText: 'Username' }) })
      .locator('input');

    // The User Role filter dropdown (a custom box, not a real <select>, same
    // kind of control as on the Add/Edit User forms). It's the only dropdown
    // in the search filters, so we can find it by that alone.
    this.userRoleFilterDropdown = page.locator('.oxd-select-text').first();

    this.searchButton = page.getByRole('button', { name: 'Search' });

    // The "+ Add" button that opens the Add User form.
    this.addButton = page.getByRole('button', { name: 'Add' });

    // The "(X) Records Found" text above the results table.
    this.recordsFoundText = page.locator('.orangehrm-horizontal-padding.orangehrm-vertical-padding span');

    // Every row in the results table.
    this.resultRows = page.locator('.oxd-table-body .oxd-table-row');
  }

  // Wait until the page has finished loading.
  async waitUntilLoaded() {
    await this.pageHeading.waitFor({ state: 'visible' });
  }

  // Click the "+ Add" button to open the Add User form.
  async clickAdd() {
    await this.addButton.click();
  }

  // Open the User Role filter dropdown and click the option with this name.
  async selectUserRoleFilter(roleName) {
    await this.userRoleFilterDropdown.click();
    await this.page.locator('.oxd-select-option', { hasText: roleName }).click();
  }

  // Type a username into the search box and click Search.
  async searchByUsername(username) {
    await this.usernameBox.fill(username);
    await this.searchButton.click();

    // Wait for the results text to show up, so we know the search finished.
    await this.recordsFoundText.waitFor({ state: 'visible' });
  }

  // Click the pencil (edit) icon on the first row of the results table.
  //
  // Each row's Actions cell has two icon buttons: a trash icon (delete)
  // first, then a pencil icon (edit) second. We find the pencil icon by its
  // "bi-pencil-fill" class rather than by position, so we never risk
  // clicking Delete by mistake.
  async clickEditFirstRow() {
    const firstRow = this.resultRows.first();
    await firstRow.locator('.bi-pencil-fill').click();
  }

  // How many rows are in the results table right now.
  async getRowCount() {
    return this.resultRows.count();
  }

  // Read the first result row and return it as a simple object.
  //
  // Each row actually has 6 cells, in this order:
  //   1. a checkbox (always empty)
  //   2. Username
  //   3. User Role
  //   4. Employee Name
  //   5. Status
  //   6. Actions buttons (always empty text)
  //
  // So we grab all 6 cells, then just pick out the 4 we actually care about
  // by their position in the list.
  async getFirstRowData() {
    const firstRow = this.resultRows.first();
    const cells = firstRow.locator('.oxd-table-cell');

    // A row can briefly exist in the DOM (making getRowCount() > 0) before
    // its cells have all rendered, which would otherwise read back
    // incomplete data. Wait for all 6 to be there before reading.
    await expect(cells).toHaveCount(6, { timeout: 5000 });
    const allCells = await cells.allTextContents();

    return {
      username: allCells[1],
      userRole: allCells[2],
      employeeName: allCells[3],
      status: allCells[4],
    };
  }
}

module.exports = { AdminUserPage };
