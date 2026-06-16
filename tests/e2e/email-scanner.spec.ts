/**
 * E2E Email Scanner Tests
 *
 * Tests for complete email scanning flows including:
 * - Email submission
 * - Result display
 * - Threat detection
 * - History management
 * - Export functionality
 */

describe('Email Scanner', () => {
  const BASE_URL = 'http://localhost:3000';
  const TEST_EMAIL = 'test@example.com';
  const TEST_PASSWORD = 'SecurePassword123!';

  beforeEach(() => {
    // Login before each test
    cy.visit(`${BASE_URL}/auth/login`);
    cy.get('input[type="email"]').type(TEST_EMAIL);
    cy.get('input[type="password"]').type(TEST_PASSWORD);
    cy.get('button[type="submit"]').click();

    // Navigate to email scanner
    cy.visit(`${BASE_URL}/email-checker`);
    cy.url().should('include', '/email-checker');
  });

  describe('Email Scanner Interface', () => {
    it('should display email scanner form', () => {
      cy.get('[aria-label="email-scanner-form"]').should('be.visible');
      cy.get('input[placeholder="From address"]').should('be.visible');
      cy.get('input[placeholder="Subject"]').should('be.visible');
      cy.get('textarea[placeholder="Email body"]').should('be.visible');
    });

    it('should display submit button', () => {
      cy.get('button[aria-label="scan-email"]').should('be.visible');
      cy.get('button[aria-label="scan-email"]').should('contain', 'Scan Email');
    });

    it('should display example section', () => {
      cy.get('[aria-label="examples"]').should('be.visible');
      cy.get('[aria-label="examples"] button').should('have.length.at.least', 1);
    });

    it('should populate form with example email', () => {
      cy.get('[aria-label="examples"] button').first().click();

      cy.get('input[placeholder="From address"]').should('have.value');
      cy.get('input[placeholder="Subject"]').should('have.value');
      cy.get('textarea[placeholder="Email body"]').should('have.value');
    });
  });

  describe('Email Submission', () => {
    it('should show validation error for empty fields', () => {
      cy.get('button[aria-label="scan-email"]').click();

      cy.get('[role="alert"]').should('contain', 'required');
    });

    it('should show validation error for invalid email', () => {
      cy.get('input[placeholder="From address"]').type('invalid-email');
      cy.get('input[placeholder="Subject"]').type('Test Subject');
      cy.get('textarea[placeholder="Email body"]').type('Test body');
      cy.get('button[aria-label="scan-email"]').click();

      cy.get('[role="alert"]').should('contain', 'valid email');
    });

    it('should show loading state during scan', () => {
      cy.get('input[placeholder="From address"]').type('sender@example.com');
      cy.get('input[placeholder="Subject"]').type('Test Email');
      cy.get('textarea[placeholder="Email body"]').type('This is a test email');
      cy.get('button[aria-label="scan-email"]').click();

      cy.get('button[aria-label="scan-email"]').should('be.disabled');
      cy.get('[aria-label="loading-spinner"]').should('be.visible');
    });

    it('should successfully scan email', () => {
      cy.get('input[placeholder="From address"]').type('sender@example.com');
      cy.get('input[placeholder="Subject"]').type('Test Email');
      cy.get('textarea[placeholder="Email body"]').type('This is a test email');
      cy.get('button[aria-label="scan-email"]').click();

      cy.get('[aria-label="scan-results"]').should('be.visible');
    });
  });

  describe('Scan Results Display', () => {
    beforeEach(() => {
      // Submit email for scanning
      cy.get('input[placeholder="From address"]').type('sender@example.com');
      cy.get('input[placeholder="Subject"]').type('Test Email');
      cy.get('textarea[placeholder="Email body"]').type('This is a test email');
      cy.get('button[aria-label="scan-email"]').click();

      cy.get('[aria-label="scan-results"]').should('be.visible');
    });

    it('should display risk score', () => {
      cy.get('[aria-label="risk-score"]').should('be.visible');
      cy.get('[aria-label="risk-score"]').should('contain', /\d+/);
    });

    it('should display risk level badge', () => {
      cy.get('[aria-label="risk-level"]').should('be.visible');
      cy.get('[aria-label="risk-level"]').should('have.class', /risk-level-/);
    });

    it('should display threat details', () => {
      cy.get('[aria-label="threats"]').should('be.visible');
      cy.get('[aria-label="threats"] [role="listitem"]').should('have.length.at.least', 1);
    });

    it('should display phishing detection result', () => {
      cy.get('[aria-label="phishing-status"]').should('exist');
      cy.get('[aria-label="phishing-status"]').should('contain', /detected|not detected/i);
    });

    it('should display scan summary', () => {
      cy.get('[aria-label="scan-summary"]').should('be.visible');
      cy.get('[aria-label="scan-summary"]').should('contain', 'Scan completed');
    });

    it('should display threat indicators with appropriate colors', () => {
      cy.get('[aria-label="threat-indicator"]').each(($el) => {
        cy.wrap($el).should('have.class', /bg-red|bg-yellow|bg-green/);
      });
    });
  });

  describe('Advanced Analysis', () => {
    beforeEach(() => {
      cy.get('input[placeholder="From address"]').type('sender@example.com');
      cy.get('input[placeholder="Subject"]').type('Test Email');
      cy.get('textarea[placeholder="Email body"]').type('This is a test email');
      cy.get('button[aria-label="scan-email"]').click();

      cy.get('[aria-label="scan-results"]').should('be.visible');
    });

    it('should display detailed analysis tab', () => {
      cy.get('[role="tab"][aria-label="detailed-analysis"]').should('exist');
      cy.get('[role="tab"][aria-label="detailed-analysis"]').click();

      cy.get('[role="tabpanel"][aria-label="detailed-analysis"]').should('be.visible');
    });

    it('should display headers analysis', () => {
      cy.get('[role="tab"][aria-label="headers"]').click();

      cy.get('[aria-label="email-headers"]').should('be.visible');
      cy.get('[aria-label="email-headers"] [role="listitem"]').should('have.length.at.least', 1);
    });

    it('should display authentication results', () => {
      cy.get('[role="tab"][aria-label="authentication"]').click();

      cy.get('[aria-label="spf-result"]').should('exist');
      cy.get('[aria-label="dkim-result"]').should('exist');
      cy.get('[aria-label="dmarc-result"]').should('exist');
    });
  });

  describe('Scan History', () => {
    it('should display scan history section', () => {
      cy.get('[aria-label="scan-history"]').should('be.visible');
    });

    it('should list previous scans', () => {
      cy.get('[aria-label="scan-history"] table tbody tr').should('have.length.at.least', 1);
    });

    it('should display scan history details', () => {
      cy.get('[aria-label="scan-history"] table tbody tr').first().within(() => {
        cy.get('td').eq(0).should('contain', /suspicious@/);
        cy.get('td').eq(1).should('contain', /high|critical/);
        cy.get('td').eq(2).should('contain', /\d{4}-\d{2}-\d{2}/);
      });
    });

    it('should load previous scan on click', () => {
      cy.get('[aria-label="scan-history"] table tbody tr').first().click();

      cy.get('[aria-label="scan-results"]').should('be.visible');
    });

    it('should filter history by risk level', () => {
      cy.get('[aria-label="history-filter"]').click();
      cy.get('option:contains("High")').select();

      cy.get('[aria-label="scan-history"] table tbody tr').each(($row) => {
        cy.wrap($row).should('contain', 'High');
      });
    });

    it('should clear history with confirmation', () => {
      cy.get('[aria-label="clear-history-btn"]').click();

      cy.get('[role="dialog"]').should('be.visible');
      cy.get('[role="dialog"] button:contains("Clear")').click();

      cy.get('[aria-label="scan-history"] table tbody tr').should('not.exist');
    });
  });

  describe('Export Functionality', () => {
    beforeEach(() => {
      cy.get('input[placeholder="From address"]').type('sender@example.com');
      cy.get('input[placeholder="Subject"]').type('Test Email');
      cy.get('textarea[placeholder="Email body"]').type('This is a test email');
      cy.get('button[aria-label="scan-email"]').click();

      cy.get('[aria-label="scan-results"]').should('be.visible');
    });

    it('should display export button', () => {
      cy.get('[aria-label="export-results"]').should('be.visible');
    });

    it('should export as PDF', () => {
      cy.get('[aria-label="export-results"]').click();
      cy.get('button:contains("Export as PDF")').click();

      cy.readFile(`${Cypress.config('downloadsFolder')}/scan-results.pdf`)
        .should('exist');
    });

    it('should export as CSV', () => {
      cy.get('[aria-label="export-results"]').click();
      cy.get('button:contains("Export as CSV")').click();

      cy.readFile(`${Cypress.config('downloadsFolder')}/scan-results.csv`)
        .should('exist');
    });

    it('should copy results to clipboard', () => {
      cy.get('[aria-label="export-results"]').click();
      cy.get('button:contains("Copy to clipboard")').click();

      cy.get('[role="alert"]').should('contain', 'copied');
    });
  });

  describe('Threat Details', () => {
    beforeEach(() => {
      cy.get('input[placeholder="From address"]').type('suspicious@example.com');
      cy.get('input[placeholder="Subject"]').type('URGENT: Action Required');
      cy.get('textarea[placeholder="Email body"]').type('This looks suspicious');
      cy.get('button[aria-label="scan-email"]').click();

      cy.get('[aria-label="scan-results"]').should('be.visible');
    });

    it('should display threat details on click', () => {
      cy.get('[aria-label="threats"] [role="button"]').first().click();

      cy.get('[role="dialog"]').should('be.visible');
      cy.get('[aria-label="threat-description"]').should('be.visible');
    });

    it('should display threat recommendation', () => {
      cy.get('[aria-label="threats"] [role="button"]').first().click();

      cy.get('[aria-label="threat-recommendation"]').should('exist');
    });

    it('should provide action buttons for threats', () => {
      cy.get('[aria-label="threats"] [role="button"]').first().click();

      cy.get('button:contains("Mark as Safe")').should('exist');
      cy.get('button:contains("Learn More")').should('exist');
    });
  });

  describe('Responsive Design', () => {
    it('should be responsive on mobile', () => {
      cy.viewport('iphone-x');

      cy.get('[aria-label="email-scanner-form"]').should('be.visible');
      cy.get('input[placeholder="From address"]').should('be.visible');
    });

    it('should stack form fields on mobile', () => {
      cy.viewport('iphone-x');

      cy.get('input[placeholder="From address"]').should('have.css', 'width');
      cy.get('input[placeholder="Subject"]').should('have.css', 'width');
    });

    it('should adapt results display on mobile', () => {
      cy.get('input[placeholder="From address"]').type('sender@example.com');
      cy.get('input[placeholder="Subject"]').type('Test Email');
      cy.get('textarea[placeholder="Email body"]').type('This is a test email');
      cy.get('button[aria-label="scan-email"]').click();

      cy.viewport('iphone-x');

      cy.get('[aria-label="risk-score"]').should('be.visible');
      cy.get('[aria-label="threats"]').should('be.visible');
    });
  });

  describe('Performance', () => {
    it('should scan email within acceptable time', () => {
      const startTime = Date.now();

      cy.get('input[placeholder="From address"]').type('sender@example.com');
      cy.get('input[placeholder="Subject"]').type('Test Email');
      cy.get('textarea[placeholder="Email body"]').type('This is a test email');
      cy.get('button[aria-label="scan-email"]').click();

      cy.get('[aria-label="scan-results"]').should('be.visible').then(() => {
        const duration = Date.now() - startTime;
        expect(duration).to.be.lessThan(5000); // 5 seconds
      });
    });
  });
});
