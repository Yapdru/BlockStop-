/**
 * E2E Authentication Tests
 *
 * Tests for complete authentication flows including:
 * - User login
 * - User registration
 * - Password reset
 * - Two-factor authentication
 * - Logout
 */

describe('Authentication Flows', () => {
  const TEST_EMAIL = 'test@example.com';
  const TEST_PASSWORD = 'SecurePassword123!';
  const BASE_URL = 'http://localhost:3000';

  beforeEach(() => {
    cy.visit(`${BASE_URL}/auth/login`);
  });

  describe('Login', () => {
    it('should display login form with email and password fields', () => {
      cy.get('input[type="email"]').should('be.visible');
      cy.get('input[type="password"]').should('be.visible');
      cy.get('button[type="submit"]').should('contain', 'Sign In');
    });

    it('should show error for invalid credentials', () => {
      cy.get('input[type="email"]').type('invalid@example.com');
      cy.get('input[type="password"]').type('wrongpassword');
      cy.get('button[type="submit"]').click();

      cy.get('[role="alert"]').should('contain', 'Invalid credentials');
    });

    it('should show error for empty fields', () => {
      cy.get('button[type="submit"]').click();

      cy.get('[role="alert"]').should('be.visible');
    });

    it('should successfully login with valid credentials', () => {
      cy.get('input[type="email"]').type(TEST_EMAIL);
      cy.get('input[type="password"]').type(TEST_PASSWORD);
      cy.get('button[type="submit"]').click();

      cy.url().should('include', '/dashboard');
      cy.get('h1').should('contain', 'Dashboard');
    });

    it('should display loading state during login', () => {
      cy.get('input[type="email"]').type(TEST_EMAIL);
      cy.get('input[type="password"]').type(TEST_PASSWORD);
      cy.get('button[type="submit"]').click();

      cy.get('button[type="submit"]').should('have.attr', 'aria-busy', 'true');
      cy.get('button[type="submit"]').should('be.disabled');
    });

    it('should persist session after login', () => {
      cy.get('input[type="email"]').type(TEST_EMAIL);
      cy.get('input[type="password"]').type(TEST_PASSWORD);
      cy.get('button[type="submit"]').click();

      cy.url().should('include', '/dashboard');

      // Verify session persists on page reload
      cy.reload();
      cy.get('h1').should('contain', 'Dashboard');
    });

    it('should remember email on failed login', () => {
      cy.get('input[type="email"]').type(TEST_EMAIL);
      cy.get('input[type="password"]').type('wrongpassword');
      cy.get('button[type="submit"]').click();

      cy.get('input[type="email"]').should('have.value', TEST_EMAIL);
    });
  });

  describe('Registration', () => {
    beforeEach(() => {
      cy.visit(`${BASE_URL}/auth/register`);
    });

    it('should display registration form', () => {
      cy.get('input[type="email"]').should('be.visible');
      cy.get('input[type="password"]').should('be.visible');
      cy.get('input[type="text"]').should('be.visible'); // name field
      cy.get('button[type="submit"]').should('contain', 'Create Account');
    });

    it('should show validation errors for invalid inputs', () => {
      cy.get('input[type="password"]').type('short');
      cy.get('input[type="password"]').blur();

      cy.get('[role="alert"]').should('contain', 'at least 8 characters');
    });

    it('should show error for existing email', () => {
      cy.get('input[type="email"]').type(TEST_EMAIL);
      cy.get('input[type="text"]').type('Test User');
      cy.get('input[type="password"]').type(TEST_PASSWORD);
      cy.get('button[type="submit"]').click();

      cy.get('[role="alert"]').should('contain', 'already registered');
    });

    it('should successfully register new user', () => {
      const newEmail = `newuser-${Date.now()}@example.com`;
      cy.get('input[type="email"]').type(newEmail);
      cy.get('input[type="text"]').type('New User');
      cy.get('input[type="password"]').type(TEST_PASSWORD);
      cy.get('button[type="submit"]').click();

      cy.url().should('include', '/auth/verify-email');
      cy.get('h1').should('contain', 'Verify Email');
    });

    it('should have password strength indicator', () => {
      cy.get('input[type="password"]').type('weak');
      cy.get('[aria-label="password-strength"]').should('have.class', 'weak');

      cy.get('input[type="password"]').clear().type(TEST_PASSWORD);
      cy.get('[aria-label="password-strength"]').should('have.class', 'strong');
    });
  });

  describe('Logout', () => {
    beforeEach(() => {
      // Login first
      cy.get('input[type="email"]').type(TEST_EMAIL);
      cy.get('input[type="password"]').type(TEST_PASSWORD);
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/dashboard');
    });

    it('should logout user and redirect to login', () => {
      cy.get('button[aria-label="user-menu"]').click();
      cy.get('a[href*="logout"]').click();

      cy.url().should('include', '/auth/login');
    });

    it('should clear session after logout', () => {
      cy.get('button[aria-label="user-menu"]').click();
      cy.get('a[href*="logout"]').click();

      cy.visit(`${BASE_URL}/dashboard`);
      cy.url().should('include', '/auth/login');
    });
  });

  describe('Two-Factor Authentication', () => {
    beforeEach(() => {
      cy.visit(`${BASE_URL}/auth/login`);
      cy.get('input[type="email"]').type(TEST_EMAIL);
      cy.get('input[type="password"]').type(TEST_PASSWORD);
      cy.get('button[type="submit"]').click();
    });

    it('should show 2FA setup page', () => {
      cy.visit(`${BASE_URL}/settings/security`);
      cy.get('button[aria-label="enable-2fa"]').click();

      cy.get('[aria-label="qr-code"]').should('be.visible');
      cy.get('input[placeholder="123456"]').should('be.visible');
    });

    it('should verify 2FA code', () => {
      cy.visit(`${BASE_URL}/settings/security`);
      cy.get('button[aria-label="enable-2fa"]').click();

      cy.get('input[placeholder="123456"]').type('123456');
      cy.get('button[type="submit"]').click();

      cy.get('[role="alert"]').should('contain', 'enabled');
    });

    it('should require 2FA on subsequent login', () => {
      // Setup 2FA first (assume already set up in previous test)
      cy.visit(`${BASE_URL}/auth/login`);
      cy.get('input[type="email"]').type(TEST_EMAIL);
      cy.get('input[type="password"]').type(TEST_PASSWORD);
      cy.get('button[type="submit"]').click();

      cy.url().should('include', '/auth/2fa');
      cy.get('input[placeholder="000000"]').should('be.visible');
    });
  });

  describe('Password Reset', () => {
    it('should display forgot password link', () => {
      cy.get('a[href*="forgot-password"]').should('be.visible');
    });

    it('should request password reset with email', () => {
      cy.get('a[href*="forgot-password"]').click();
      cy.url().should('include', '/auth/forgot-password');

      cy.get('input[type="email"]').type(TEST_EMAIL);
      cy.get('button[type="submit"]').click();

      cy.get('[role="alert"]').should('contain', 'Check your email');
    });

    it('should validate password reset token', () => {
      cy.visit(`${BASE_URL}/auth/reset-password?token=invalid-token`);

      cy.get('[role="alert"]').should('contain', 'invalid or expired');
    });

    it('should successfully reset password', () => {
      cy.visit(`${BASE_URL}/auth/reset-password?token=valid-token`);

      cy.get('input[type="password"]').first().type('NewPassword123!');
      cy.get('input[type="password"]').last().type('NewPassword123!');
      cy.get('button[type="submit"]').click();

      cy.get('[role="alert"]').should('contain', 'reset successfully');
      cy.url().should('include', '/auth/login');
    });
  });

  describe('Session Management', () => {
    it('should handle session timeout', () => {
      cy.get('input[type="email"]').type(TEST_EMAIL);
      cy.get('input[type="password"]').type(TEST_PASSWORD);
      cy.get('button[type="submit"]').click();

      // Simulate session timeout
      cy.window().then((win) => {
        win.sessionStorage.clear();
      });

      cy.visit(`${BASE_URL}/dashboard`);
      cy.url().should('include', '/auth/login');
    });

    it('should refresh token automatically', () => {
      cy.get('input[type="email"]').type(TEST_EMAIL);
      cy.get('input[type="password"]').type(TEST_PASSWORD);
      cy.get('button[type="submit"]').click();

      // Wait for token refresh interval
      cy.wait(60000); // 1 minute

      cy.get('h1').should('contain', 'Dashboard');
    });
  });
});
