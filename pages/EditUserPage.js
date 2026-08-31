// This file describes the "Edit User" page — the form you land on after
// clicking the pencil (edit) icon on a row in the System Users list.
//
// It looks almost exactly like the Add User form, with two differences:
// the Username box already has a value in it (editable), and there's a
// "Change Password ?" checkbox that reveals the Password / Confirm Password
// boxes only once it's ticked.

class EditUserPage {
  constructor(page) {
    this.page = page;

    // The "Edit User" title at the top of the form.
    //
    // Note: just like the Add User page, this page has TWO <h6> headings —
    // "Admin" (the top orange bar) and "Edit User" (the form title). We only
    // match the one that says "Edit User".
    this.pageHeading = page.locator('h6', { hasText: 'Edit User' });

    // User Role and Status: same custom dropdowns as on the Add User form,
    // always in the same order (User Role first, Status second).
    this.userRoleDropdown = page.locator('.oxd-select-text').nth(0);
    this.statusDropdown = page.locator('.oxd-select-text').nth(1);

    // Employee Name: same "type to search, then pick a suggestion" box as
    // on the Add User form.
    this.employeeNameBox = page.locator('.oxd-autocomplete-text-input input');
    // Exclude the "No Records Found" placeholder option - it renders with
    // the same class as real suggestions, so without this filter, clicking
    // employeeSuggestions.first() when there are no real matches clicks
    // that placeholder instead, leaving the field text-filled but Invalid.
    this.employeeSuggestions = page
      .locator('.oxd-autocomplete-option')
      .filter({ hasNotText: 'No Records Found' });

    // Username: already filled in with the current value, but still a
    // normal editable box.
    this.usernameBox = page
      .locator('.oxd-input-group', { has: page.locator('label', { hasText: 'Username' }) })
      .locator('input');

    // The "Change Password ?" checkbox. Ticking it reveals the Password and
    // Confirm Password boxes below.
    this.changePasswordCheckbox = page.locator('.oxd-checkbox-wrapper input[type="checkbox"]');

    // Password and Confirm Password only exist in the page AFTER the
    // checkbox above is ticked, so we look them up fresh each time instead
    // of storing them here.
    this.passwordBox = page.locator('input[type="password"]').nth(0);
    this.confirmPasswordBox = page.locator('input[type="password"]').nth(1);

    this.saveButton = page.getByRole('button', { name: 'Save' });
  }

  // Wait until the Edit User form has actually finished loading.
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
  // Same shared-demo caveat as AddUserPage.selectEmployeeName(): the exact
  // name in our test data may not be a real employee anymore. Tries the
  // exact name, then just its first word, then a single common letter
  // that's virtually certain to match some real employee on the demo -
  // only clicking once real suggestions (not the "No Records Found"
  // placeholder) are actually present, so the form never ends up with an
  // Invalid, unselected Employee Name.
  async selectEmployeeName(employeeName) {
    const candidates = [employeeName, employeeName.trim().split(' ')[0], 'a'];

    for (const query of candidates) {
      await this.employeeNameBox.fill(query);
      await this.page.waitForTimeout(1500);

      if (await this.employeeSuggestions.count() > 0) {
        await this.employeeSuggestions.first().click();
        return;
      }
    }

    throw new Error(
      `No real employee suggestions found for any of: ${candidates.join(', ')}`
    );
  }

  // Clear the Username box and type a new value.
  async fillUsername(username) {
    await this.usernameBox.fill(username);
  }

  // Tick "Change Password ?" and type the same new password into both the
  // Password and Confirm Password boxes.
  async changePassword(newPassword) {
    await this.changePasswordCheckbox.check();
    await this.passwordBox.fill(newPassword);
    await this.confirmPasswordBox.fill(newPassword);
  }

  // Click the Save button.
  async save() {
    await this.saveButton.click();
  }
}

module.exports = { EditUserPage };
