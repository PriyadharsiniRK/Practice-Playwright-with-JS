// This file describes the "Add User" page — the form you land on after
// clicking the "+ Add" button on the System Users page.

const { expect } = require('@playwright/test');

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
    // Exclude the "No Records Found" AND "Searching...." placeholder rows -
    // both render with the same class as real suggestions. Without this,
    // employeeSuggestions.first() can click "Searching...." while its
    // request is still in flight, which does nothing but leaves the field
    // holding our typed text as an Invalid, unselected value.
    this.employeeSuggestions = page
      .locator('.oxd-autocomplete-option')
      .filter({ hasNotText: 'No Records Found' })
      .filter({ hasNotText: 'Searching' });

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
  // the time this test runs. This tries the exact name, then just its first
  // word, then a couple of single common letters that are virtually certain
  // to match some real employee on the demo.
  //
  // Clicking a suggestion doesn't always register (the autocomplete's async
  // filtering can race the click, especially under this shared demo's
  // heavier CI load), leaving the box showing our typed text as an Invalid,
  // unselected value. So after each click this verifies the box actually
  // now holds the clicked suggestion's text before accepting it, and moves
  // on to the next candidate query otherwise.
  async selectEmployeeName(employeeName) {
    const candidates = [employeeName, employeeName.trim().split(' ')[0], 'a', 'e', 'o'];

    for (const query of candidates) {
      await this.employeeNameBox.fill(query);

      // Poll instead of a fixed sleep - the live demo's autocomplete
      // request can take anywhere from a few hundred ms to several
      // seconds, and employeeSuggestions already excludes the
      // "Searching...." placeholder, so a non-zero count here means real
      // suggestions have actually landed.
      let count = 0;
      for (let attempt = 0; attempt < 10; attempt++) {
        count = await this.employeeSuggestions.count();
        if (count > 0) break;
        await this.page.waitForTimeout(500);
      }
      if (count === 0) continue;

      const picked = (await this.employeeSuggestions.first().innerText()).trim();
      await this.employeeSuggestions.first().click();

      try {
        await expect(this.employeeNameBox).toHaveValue(picked, { timeout: 3000 });
        return;
      } catch {
        // The click didn't actually register a selection - try the next
        // candidate query instead of leaving the field Invalid.
      }
    }

    throw new Error(
      `No real employee selection could be confirmed for any of: ${candidates.join(', ')}`
    );
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
