// This file describes the "Admin > Organization > General Information" page.
//
// Unlike every other Admin page in this project (System Users, Job Titles),
// this page is NOT a list of many rows — it's a single global settings
// record for the whole OrangeHRM installation (Organization Name,
// Registration Number, Tax ID, address, Notes, etc). See the big comment in
// the spec file for why that matters on a shared public demo.

class GeneralInformationPage {
  constructor(page) {
    this.page = page;

    // The "Organization" tab in the Admin sub-navigation bar, and the
    // "General Information" link inside its dropdown (same pattern as the
    // "Job" tab / "Job Titles" link used for the Add Job Title test).
    this.organizationNavTab = page.locator('.oxd-topbar-body-nav-tab', { hasText: 'Organization' });
    this.generalInformationLink = page.locator('a', { hasText: 'General Information' });

    // The "General Information" title at the top of the form.
    //
    // Note: like every other Admin page, there's more than one <h6> here
    // ("Admin", "Organization", "General Information"), so we match the one
    // that says "General Information".
    this.pageHeading = page.locator('h6', { hasText: 'General Information' });

    // The "Edit" toggle switch at the top-right of the form. All the fields
    // below start out disabled (view-only); flipping this switch on makes
    // them editable and reveals the Save button.
    this.editToggle = page.locator('.oxd-switch-input');

    // The 3 fields this test actually changes. (There are more fields on
    // this form — Organization Name, Phone, Email, Address, etc. — but this
    // test only touches these three; see the spec for why.)
    this.registrationNumberBox = page
      .locator('.oxd-input-group', { has: page.locator('label', { hasText: 'Registration Number' }) })
      .locator('input');
    this.taxIdBox = page
      .locator('.oxd-input-group', { has: page.locator('label', { hasText: 'Tax ID' }) })
      .locator('input');
    this.notesBox = page
      .locator('.oxd-input-group', { has: page.locator('label', { hasText: 'Notes' }) })
      .locator('textarea');

    this.saveButton = page.getByRole('button', { name: 'Save' });
  }

  // From any Admin page, open the "Organization" dropdown and click
  // "General Information".
  async navigateToGeneralInformation() {
    await this.organizationNavTab.click();
    await this.generalInformationLink.click();
    await this.pageHeading.waitFor({ state: 'visible' });
  }

  // Wait until the General Information form has actually finished loading.
  async waitUntilLoaded() {
    await this.pageHeading.waitFor({ state: 'visible' });
  }

  // Read the 3 fields this test cares about, without changing anything.
  // Used both to capture the "before" values (so they can be restored
  // later) and to confirm a save actually took effect.
  async readEditableValues() {
    return {
      registrationNumber: await this.registrationNumberBox.inputValue(),
      taxId: await this.taxIdBox.inputValue(),
      notes: await this.notesBox.inputValue(),
    };
  }

  // Flip the "Edit" switch on, so the fields become editable.
  async clickEdit() {
    await this.editToggle.click();
  }

  // Fill in the 3 editable fields this test uses. Call clickEdit() first.
  async fillEditableValues({ registrationNumber, taxId, notes }) {
    await this.registrationNumberBox.fill(registrationNumber);
    await this.taxIdBox.fill(taxId);
    await this.notesBox.fill(notes);
  }

  // Click the Save button.
  async save() {
    await this.saveButton.click();
  }
}

module.exports = { GeneralInformationPage };
