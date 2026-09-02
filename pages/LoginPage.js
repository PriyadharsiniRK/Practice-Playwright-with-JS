// This file describes the Login page: what's on it, and what you can do on it.
// "POM" (Page Object Model) just means: one file per page, listing its fields
// and actions, so your tests can call simple methods like loginPage.login(...)
// instead of repeating locators everywhere.

class LoginPage {
  constructor(page) {
    // Save the Playwright "page" so every method below can use it.
    this.page = page;

    // The web address of the login page.
    this.url = 'https://opensource-demo.orangehrmlive.com/web/index.php/auth/login';

    // The 3 things on this page we need: username box, password box, login button.
    this.usernameBox = page.locator('input[name="username"]');
    this.passwordBox = page.locator('input[name="password"]');
    this.loginButton = page.locator('button[type="submit"]');
  }

  // Open the login page in the browser.
  async goto() {
    await this.page.goto(this.url);
  }

  // Type the username and password, then click Login.
  async login(username, password) {
    await this.usernameBox.fill(username);
    await this.passwordBox.fill(password);
    await this.loginButton.click();
  }
}

module.exports = { LoginPage };
