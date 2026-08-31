// This file describes the "Add User" page — the form you land on after
// clicking the "+ Add" button on the System Users page.

class AddUserPage {
  constructor(page) {
    this.page = page;

    // The "Add User" title at the top of the form.
    //
    // Note: this page actually has TWO <h6> headings — "Admin" (the top
    // orange bar) and "Add User" (the form title). We only match the one
    // that says "Add User" so we don't accidentally match the wrong one.
    this.pageHeading = page.locator('h6', { hasText: 'Add User' });

    // User Role and Status are NOT normal dropdowns (no <select> tag) — they
    // are custom boxes you click to open, then click an option inside. There
    // are only two of them on this page, always in the same order: User
    // Role first, Status second.
    this.userRoleDropdown = page.locator('.oxd-select-text').nth(0);
    this.statusDropdown = page.locator('.oxd-select-text').nth(1);

    // The Employee Name box: type into it, then pick a name from the list
    // of matching employees that pops up underneath.
    this.employeeNameBox = page.locator('.oxd-autocomplete-text-input input');
    this.employeeSuggestions = page.locator('.oxd-autocomplete-option');

    // Username: same trick as the System Users search page — find the small
    // box that wraps just the "Username" label and its own input field.
    this.usernameBox = page
      .locator('.oxd-input-group', { has: page.locator('label', { hasText: 'Username' }) })
      .locator('input');

    // Password and Confirm Password: both boxes are type="password", and
    // Password always comes before Confirm Password on the page, so we can
    // just pick them by position instead of matching label text.
    this.passwordBox = page.locator('input[type="password"]').nth(0);
    this.confirmPasswordBox = page.locator('input[type="password"]').nth(1);

    this.saveButton = page.getByRole('button', { name: 'Save' });
  }

  // Wait until the Add User form has actually finished loading.
  async waitUntilLoaded() {
    await this.pageHeading.waitFor({ state: 'visible' });
  }

  // Open the User Role dropdown and click the option with this name.
  async selectUserRole(roleName) {
    await this.userRoleDropdown.click();
    await this.page.locator('.oxd-select-option', { hasText: roleName }).click();
  }

  // Open the Status dropdown and click the option with this name.
  async selectStatus(statusName) {
    await this.statusDropdown.click();
    await this.page.locator('.oxd-select-option', { hasText: statusName }).click();
  }

  // Type a name into Employee Name and pick a matching employee from the
  // suggestion list.
  //
  // Important: this OrangeHRM site is a public demo that many people share,
  // so the exact employee name in our test data might not exist anymore by
  // the time this test runs. If that happens, this method falls back to
  // searching with just the first word of the name and picking whichever
  // real employee comes up first, so the test can still finish the "Add
  // User" flow instead of getting stuck with "No Records Found".
  async selectEmployeeName(employeeName) {
    await this.employeeNameBox.fill(employeeName);
    await this.page.waitForTimeout(1500); // let the search finish

    const noResults = this.page.locator('.oxd-autocomplete-option', { hasText: 'No Records Found' });
    if (await noResults.count() > 0) {
      const firstWord = employeeName.trim().split(' ')[0];
      await this.employeeNameBox.fill(firstWord);
      await this.page.waitForTimeout(1500);
    }

    await this.employeeSuggestions.first().click();
  }

  // Type the username.
  async fillUsername(username) {
    await this.usernameBox.fill(username);
  }

  // Type the same password into both the Password and Confirm Password boxes.
  async fillPassword(password) {
    await this.passwordBox.fill(password);
    await this.confirmPasswordBox.fill(password);
  }

  // Click the Save button.
  async save() {
    await this.saveButton.click();
  }
}

module.exports = { AddUserPage };
