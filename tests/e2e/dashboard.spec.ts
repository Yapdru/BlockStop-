/**
 * E2E Dashboard Tests
 *
 * Tests for complete dashboard flows including:
 * - Dashboard data loading
 * - Statistics display
 * - Navigation
 * - Data refresh
 * - Responsive behavior
 */

describe('Dashboard', () => {
  const BASE_URL = 'http://localhost:3000';
  const TEST_EMAIL = 'test@example.com';
  const TEST_PASSWORD = 'SecurePassword123!';

  beforeEach(() => {
    // Login before each test
    cy.visit(`${BASE_URL}/auth/login`);
    cy.get('input[type="email"]').type(TEST_EMAIL);
    cy.get('input[type="password"]').type(TEST_PASSWORD);
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
  });

  describe('Dashboard Layout', () => {
    it('should display main dashboard content', () => {
      cy.get('h1').should('contain', 'Dashboard');
      cy.get('[role="main"]').should('be.visible');
    });

    it('should display sidebar navigation', () => {
      cy.get('[aria-label="sidebar"]').should('be.visible');
      cy.get('[aria-label="sidebar"] a[href*="dashboard"]').should('exist');
      cy.get('[aria-label="sidebar"] a[href*="email"]').should('exist');
      cy.get('[aria-label="sidebar"] a[href*="files"]').should('exist');
    });

    it('should display top navigation', () => {
      cy.get('header').should('be.visible');
      cy.get('button[aria-label="user-menu"]').should('be.visible');
      cy.get('button[aria-label="notifications"]').should('be.visible');
    });

    it('should be responsive on mobile', () => {
      cy.viewport('iphone-x');
      cy.get('[aria-label="mobile-menu"]').should('be.visible');
      cy.get('[aria-label="sidebar"]').should('not.be.visible');

      cy.get('[aria-label="mobile-menu"]').click();
      cy.get('[aria-label="sidebar"]').should('be.visible');
    });
  });

  describe('Statistics Display', () => {
    it('should display statistics cards', () => {
      cy.get('[aria-label="total-scans"]').should('be.visible');
      cy.get('[aria-label="threats-detected"]').should('be.visible');
      cy.get('[aria-label="files-analyzed"]').should('be.visible');
    });

    it('should display correct statistic values', () => {
      cy.get('[aria-label="total-scans"]').should('contain', '156');
      cy.get('[aria-label="threats-detected"]').should('contain', '42');
      cy.get('[aria-label="files-analyzed"]').should('contain', '198');
    });

    it('should display trend chart', () => {
      cy.get('[aria-label="trend-chart"]').should('be.visible');
      cy.get('svg[role="img"]').should('have.length.at.least', 1);
    });

    it('should update statistics in real-time', () => {
      const initialValue = cy.get('[aria-label="total-scans"]').invoke('text');

      // Simulate new scan
      cy.get('button[aria-label="refresh-stats"]').click();

      cy.get('[aria-label="total-scans"]').invoke('text').should('exist');
    });
  });

  describe('Recent Scans List', () => {
    it('should display recent scans section', () => {
      cy.get('[aria-label="recent-scans"]').should('be.visible');
      cy.get('[aria-label="recent-scans"] table tbody tr').should('have.length.at.least', 1);
    });

    it('should display scan details in table', () => {
      cy.get('[aria-label="recent-scans"] table tbody tr').first().within(() => {
        cy.get('td').eq(0).should('contain', 'test-file');
        cy.get('td').eq(1).should('exist'); // Risk score
        cy.get('td').eq(2).should('exist'); // Date
      });
    });

    it('should navigate to scan details on row click', () => {
      cy.get('[aria-label="recent-scans"] table tbody tr').first().click();

      cy.url().should('include', '/scans/');
      cy.get('h1').should('contain', 'Scan Details');
    });

    it('should display threat badge for threats', () => {
      cy.get('[aria-label="recent-scans"] [aria-label="threat-badge"]')
        .should('be.visible')
        .should('have.class', 'threat-detected');
    });

    it('should handle empty scans list', () => {
      cy.intercept('GET', '**/dashboard/recent-scans', {
        scans: [],
      }).as('getEmptyScans');

      cy.get('[aria-label="refresh-scans"]').click();
      cy.wait('@getEmptyScans');

      cy.get('[aria-label="empty-state"]').should('contain', 'No scans yet');
    });
  });

  describe('Quick Actions', () => {
    it('should display quick action buttons', () => {
      cy.get('button[aria-label="scan-email"]').should('be.visible');
      cy.get('button[aria-label="upload-file"]').should('be.visible');
      cy.get('button[aria-label="invite-team"]').should('be.visible');
    });

    it('should navigate to email scanner on button click', () => {
      cy.get('button[aria-label="scan-email"]').click();

      cy.url().should('include', '/email-checker');
    });

    it('should open file upload modal on button click', () => {
      cy.get('button[aria-label="upload-file"]').click();

      cy.get('[role="dialog"]').should('be.visible');
      cy.get('input[type="file"]').should('be.visible');
    });

    it('should navigate to invite page on button click', () => {
      cy.get('button[aria-label="invite-team"]').click();

      cy.url().should('include', '/settings/team');
    });
  });

  describe('User Menu', () => {
    it('should display user menu when clicked', () => {
      cy.get('button[aria-label="user-menu"]').click();

      cy.get('[role="menu"]').should('be.visible');
      cy.get('[role="menu"] a').should('have.length.at.least', 3);
    });

    it('should contain settings link', () => {
      cy.get('button[aria-label="user-menu"]').click();

      cy.get('[role="menu"] a[href*="settings"]').should('exist');
    });

    it('should contain logout link', () => {
      cy.get('button[aria-label="user-menu"]').click();

      cy.get('[role="menu"] a[href*="logout"]').should('exist');
    });

    it('should close menu on escape key', () => {
      cy.get('button[aria-label="user-menu"]').click();
      cy.get('[role="menu"]').should('be.visible');

      cy.get('body').type('{esc}');
      cy.get('[role="menu"]').should('not.be.visible');
    });
  });

  describe('Notifications', () => {
    it('should display notifications badge', () => {
      cy.get('button[aria-label="notifications"]').should('be.visible');
      cy.get('button[aria-label="notifications"] [aria-label="badge"]')
        .should('contain', /\d+/);
    });

    it('should display notifications dropdown', () => {
      cy.get('button[aria-label="notifications"]').click();

      cy.get('[role="menu"]').should('be.visible');
      cy.get('[role="menu"] [role="menuitem"]').should('have.length.at.least', 1);
    });

    it('should navigate to notification on click', () => {
      cy.get('button[aria-label="notifications"]').click();

      cy.get('[role="menu"] [role="menuitem"]').first().click();

      cy.url().should('not.include', '/dashboard');
    });

    it('should clear notifications', () => {
      cy.get('button[aria-label="notifications"]').click();
      cy.get('[aria-label="clear-notifications"]').click();

      cy.get('[aria-label="badge"]').should('not.exist');
    });
  });

  describe('Data Refresh', () => {
    it('should refresh dashboard data on refresh button click', () => {
      cy.get('button[aria-label="refresh-data"]').click();

      cy.get('[aria-label="loading"]').should('be.visible');
      cy.get('[aria-label="loading"]').should('not.exist');
    });

    it('should auto-refresh data periodically', () => {
      const initialTime = new Date().getTime();

      cy.wait(30000); // Wait 30 seconds

      cy.get('[aria-label="last-updated"]').invoke('text')
        .should('not.equal', initialTime.toString());
    });

    it('should handle refresh errors gracefully', () => {
      cy.intercept('GET', '**/dashboard/stats', {
        statusCode: 500,
        body: { error: 'Server error' },
      }).as('getStatsError');

      cy.get('button[aria-label="refresh-data"]').click();
      cy.wait('@getStatsError');

      cy.get('[role="alert"]').should('contain', 'Error');
      cy.get('button[aria-label="retry"]').should('be.visible');
    });
  });

  describe('Filters and Sorting', () => {
    it('should display filter options', () => {
      cy.get('[aria-label="filter-button"]').should('be.visible');
      cy.get('[aria-label="sort-button"]').should('be.visible');
    });

    it('should filter scans by date range', () => {
      cy.get('[aria-label="filter-button"]').click();
      cy.get('input[placeholder="Start date"]').type('01/01/2024');
      cy.get('input[placeholder="End date"]').type('12/31/2024');

      cy.get('button:contains("Apply")').click();

      cy.url().should('include', 'startDate=');
      cy.url().should('include', 'endDate=');
    });

    it('should sort scans by risk score', () => {
      cy.get('[aria-label="sort-button"]').click();
      cy.get('button[data-sort="riskScore"]').click();

      cy.url().should('include', 'sortBy=riskScore');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should navigate using keyboard', () => {
      cy.get('body').type('{tab}');
      cy.focused().should('have.attr', 'aria-label');
    });

    it('should activate button with enter key', () => {
      cy.get('button[aria-label="scan-email"]').focus();
      cy.get('body').type('{enter}');

      cy.url().should('include', '/email-checker');
    });

    it('should open menu with arrow keys', () => {
      cy.get('button[aria-label="user-menu"]').focus();
      cy.get('body').type('{downarrow}');

      cy.get('[role="menu"]').should('be.visible');
    });
  });
});
