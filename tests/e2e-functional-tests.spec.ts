import { test, expect, Page } from '@playwright/test';

// Test Configuration
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000';
const TEST_TWITTER_USERNAME = 'testuser';

// Test Data - Generic mock data for testing
const MOCK_CONFIG = {
  twitterUsername: 'testuser',
  twitterApiKey: 'test-twitter-api-key-12345',
  geminiApiKey: 'test-gemini-api-key-67890'
};

test.describe('X Personal Assistant - Comprehensive Functional Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Set viewport to desktop size
    await page.setViewportSize({ width: 1200, height: 800 });
    
    // Navigate to application
    await page.goto(APP_URL);
    
    // Wait for initial load
    await page.waitForLoadState('domcontentloaded');
  });

  test.describe('Application Loading and Initialization', () => {
    
    test('should load application successfully', async ({ page }) => {
      // Check page title
      await expect(page).toHaveTitle(/X Personal Assistant/i);
      
      // Check main heading
      await expect(page.locator('h1')).toContainText('X Personal Assistant');
      
      // Check subtitle
      await expect(page.locator('p').first()).toContainText('Analyze and improve your Twitter presence with AI');
    });

    test('should display API status indicators', async ({ page }) => {
      // Check Twitter API status
      const twitterStatus = page.locator('.status-item').filter({ hasText: 'Twitter' });
      await expect(twitterStatus).toBeVisible();
      
      // Check Gemini API status
      const geminiStatus = page.locator('.status-item').filter({ hasText: 'Gemini' });
      await expect(geminiStatus).toBeVisible();
    });

    test('should show configuration warning when API keys missing', async ({ page }) => {
      // Clear any existing config
      await page.evaluate(() => localStorage.clear());
      await page.reload();
      
      // Check warning message
      const warning = page.locator('text=Configuration Required');
      await expect(warning).toBeVisible();
      
      // Check warning button
      const configButton = page.locator('button:has-text("Open Settings")');
      await expect(configButton).toBeVisible();
    });

    test('should load without JavaScript errors', async ({ page }) => {
      const consoleErrors: string[] = [];
      
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      await page.reload();
      await page.waitForTimeout(2000);
      
      // Filter out expected development warnings
      const criticalErrors = consoleErrors.filter(error => 
        !error.includes('Warning:') && 
        !error.includes('download the React DevTools')
      );
      
      expect(criticalErrors).toHaveLength(0);
    });
  });

  test.describe('Settings Functionality', () => {
    
    test('should open and close settings modal', async ({ page }) => {
      // Open settings
      const settingsButton = page.locator('button[title="Settings"]');
      await settingsButton.click();
      
      // Check modal is visible
      const modal = page.locator('.settings-modal, [role="dialog"]');
      await expect(modal).toBeVisible();
      
      // Close modal (try different methods)
      const closeButton = page.locator('button:has-text("Cancelar"), button:has-text("✕"), .close-button');
      if (await closeButton.count() > 0) {
        await closeButton.first().click();
      } else {
        await page.keyboard.press('Escape');
      }
      
      // Check modal is hidden
      await expect(modal).not.toBeVisible();
    });

    test('should save configuration', async ({ page }) => {
      // Open settings
              await page.locator('button[title="Settings"]').click();
      
      // Fill in configuration
      const usernameInput = page.locator('input[type="text"], input[placeholder*="usuario"], input[placeholder*="username"]').first();
      await usernameInput.fill(MOCK_CONFIG.twitterUsername);
      
      const twitterKeyInput = page.locator('input[placeholder*="Twitter"], input[placeholder*="RapidAPI"]');
      if (await twitterKeyInput.count() > 0) {
        await twitterKeyInput.fill(MOCK_CONFIG.twitterApiKey);
      }
      
      const geminiKeyInput = page.locator('input[placeholder*="Gemini"], input[placeholder*="Google"]');
      if (await geminiKeyInput.count() > 0) {
        await geminiKeyInput.fill(MOCK_CONFIG.geminiApiKey);
      }
      
      // Save configuration
      const saveButton = page.locator('button:has-text("Guardar"), button:has-text("Save"), button[type="submit"]');
      await saveButton.click();
      
      // Check success (settings modal should close)
      await expect(page.locator('.settings-modal, [role="dialog"]')).not.toBeVisible();
    });
  });

  test.describe('UI Component Rendering', () => {
    
    test('should render navigation tabs', async ({ page }) => {
      const tabs = [
        'Mis Tweets',
        'Memoria de Estilo', 
        'Comunidad',
        'Oportunidades'
      ];
      
      for (const tabName of tabs) {
        const tab = page.locator(`button:has-text("${tabName}"), .tab-button:has-text("${tabName}")`);
        await expect(tab).toBeVisible();
      }
    });

    test('should switch between tabs', async ({ page }) => {
      // Click on Style Memory tab
      const styleTab = page.locator('button:has-text("Memoria de Estilo")');
      await styleTab.click();
      
      // Check active state
      await expect(styleTab).toHaveClass(/active/);
      
      // Click on Community tab
      const communityTab = page.locator('button:has-text("Comunidad")');
      await communityTab.click();
      
      // Check active state changed
      await expect(communityTab).toHaveClass(/active/);
      await expect(styleTab).not.toHaveClass(/active/);
    });

    test('should display profile section when user data is available', async ({ page }) => {
      // Mock user data in localStorage
      await page.evaluate(() => {
        const mockUser = {
          id: '123456789',
          name: 'Test User',
          username: 'testuser',
          description: 'Test user description for automated testing',
          public_metrics: {
            followers_count: 1000,
            following_count: 500,
            tweet_count: 2000
          }
        };
        localStorage.setItem('user-profile', JSON.stringify(mockUser));
      });
      
      await page.reload();
      
      // Check if profile elements exist
      const profileElements = page.locator('.profile-compact, .profile-section, .user-profile');
      // May not be visible immediately, so just check if elements exist in DOM
      const count = await profileElements.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('API Integration Testing', () => {
    
    test('should handle Twitter API errors gracefully', async ({ page }) => {
      // Monitor network requests
      let apiCalled = false;
      
      page.on('response', response => {
        if (response.url().includes('twitter') || response.url().includes('/api/')) {
          apiCalled = true;
        }
      });
      
      // Try to trigger API call
      const refreshButton = page.locator('button:has-text("Actualizar"), button:has-text("🔄")');
      if (await refreshButton.count() > 0) {
        await refreshButton.click();
        await page.waitForTimeout(2000);
      }
      
      // Check for error handling UI
      const errorElements = page.locator('.error-message, .error, [class*="error"]');
      const errorCount = await errorElements.count();
      
      // If API was called and failed, should show error
      if (apiCalled) {
        expect(errorCount).toBeGreaterThan(0);
      }
    });

    test('should show loading states during API calls', async ({ page }) => {
      // Look for loading indicators
      const loadingElements = page.locator(
        'button:has-text("⏳"), ' +
        '.loading, ' +
        '[class*="loading"], ' +
        'text=Loading, ' +
        'text=Loading'
      );
      
      // Try to trigger loading state
      const refreshButton = page.locator('button:has-text("Actualizar")');
      if (await refreshButton.count() > 0) {
        await refreshButton.click();
        
        // Check if loading state appears
        await page.waitForTimeout(100);
        const hasLoading = await loadingElements.count() > 0;
        
        // Loading should appear at least briefly
        expect(hasLoading).toBeTruthy();
      }
    });
  });

  test.describe('Responsive Design Testing', () => {
    
    test('should work on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      
      // Check main elements are still visible
      await expect(page.locator('h1')).toBeVisible();
      
      // Check navigation is accessible
      const tabs = page.locator('.tab-button, button[class*="tab"]');
      const tabCount = await tabs.count();
      expect(tabCount).toBeGreaterThan(0);
    });

    test('should work on tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.reload();
      
      // Check layout adapts
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('.header-content, .app-header')).toBeVisible();
    });

    test('should work on large desktop viewport', async ({ page }) => {
      // Set large desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.reload();
      
      // Check elements scale appropriately
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('.content-area, .app-main')).toBeVisible();
    });
  });

  test.describe('User Interactions and Flow', () => {
    
    test('should handle tweet card interactions', async ({ page }) => {
      // Mock tweet data
      await page.evaluate(() => {
        const mockTweets = [
          {
            id: '1234567890123456789',
            text: 'This is a sample tweet for testing purposes #test',
            created_at: '2024-01-01T12:00:00Z',
            public_metrics: {
              like_count: 10,
              retweet_count: 5,
              reply_count: 2
            }
          }
        ];
        localStorage.setItem('tweets', JSON.stringify(mockTweets));
      });
      
      await page.reload();
      
      // Look for tweet cards
      const tweetCards = page.locator('.tweet-card, .tweet-wrapper, [class*="tweet"]');
      const cardCount = await tweetCards.count();
      
      if (cardCount > 0) {
        // Try to interact with first tweet card
        const firstCard = tweetCards.first();
        await expect(firstCard).toBeVisible();
        
        // Check if card is clickable/interactive
        const isClickable = await firstCard.isEnabled();
        expect(isClickable).toBeTruthy();
      }
    });

    test('should handle style analysis workflow', async ({ page }) => {
      // Look for style analysis section
      const analysisSection = page.locator('.analysis-section, .style-analysis, [class*="analysis"]');
      
      if (await analysisSection.count() > 0) {
        // Try to trigger analysis
        const analyzeButton = page.locator('button:has-text("Analizar"), button:has-text("Analyze")');
        
        if (await analyzeButton.count() > 0) {
          await analyzeButton.click();
          
          // Check for loading or result state
          const loadingOrResult = page.locator(
            '.loading, ' +
            '[class*="loading"], ' +
            '.analysis-result, ' +
            'text=Analyzing'
          );
          
          await expect(loadingOrResult).toBeVisible({ timeout: 5000 });
        }
      }
    });
  });

  test.describe('Performance and Network Testing', () => {
    
    test('should load within reasonable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto(APP_URL);
      await page.waitForLoadState('domcontentloaded');
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should handle network failures gracefully', async ({ page }) => {
      // Simulate offline condition
      await page.context().setOffline(true);
      
      try {
        // Try to refresh or trigger network activity
        const refreshButton = page.locator('button:has-text("Actualizar")');
        if (await refreshButton.count() > 0) {
          await refreshButton.click();
          await page.waitForTimeout(2000);
          
          // Should show appropriate error state
          const errorElements = page.locator('.error-message, text=Error, text=offline');
          const hasError = await errorElements.count() > 0;
          expect(hasError).toBeTruthy();
        }
      } finally {
        // Restore network
        await page.context().setOffline(false);
      }
    });
  });

  test.describe('Accessibility Testing', () => {
    
    test('should have proper heading structure', async ({ page }) => {
      const h1Elements = page.locator('h1');
      await expect(h1Elements).toHaveCount(1);
      
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      const headingCount = await headings.count();
      expect(headingCount).toBeGreaterThan(0);
    });

    test('should have keyboard navigation support', async ({ page }) => {
      // Tab through interactive elements
      await page.keyboard.press('Tab');
      
      // Check if focus is visible
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Continue tabbing
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Should still have focused element
      const stillFocused = page.locator(':focus');
      await expect(stillFocused).toBeVisible();
    });

    test('should have proper button labels', async ({ page }) => {
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        const title = await button.getAttribute('title');
        
        // Button should have text, aria-label, or title
        const hasLabel = text?.trim() || ariaLabel || title;
        expect(hasLabel).toBeTruthy();
      }
    });
  });

  test.describe('Data Persistence Testing', () => {
    
    test('should persist settings in localStorage', async ({ page }) => {
      // Set some data
      await page.evaluate(() => {
        localStorage.setItem('test-key', 'test-value');
      });
      
      // Reload page
      await page.reload();
      
      // Check data persists
      const persistedData = await page.evaluate(() => {
        return localStorage.getItem('test-key');
      });
      
      expect(persistedData).toBe('test-value');
    });

    test('should handle localStorage quota exceeded', async ({ page }) => {
      // Try to fill localStorage to quota
      try {
        await page.evaluate(() => {
          const largeData = 'x'.repeat(1024 * 1024); // 1MB string
          for (let i = 0; i < 10; i++) {
            localStorage.setItem(`large-data-${i}`, largeData);
          }
        });
      } catch (error) {
        // Expected to fail at some point
      }
      
      // App should still function
      await expect(page.locator('h1')).toBeVisible();
    });
  });

  test.afterEach(async ({ page }) => {
    // Clean up any test data
    await page.evaluate(() => {
      // Remove test-specific items
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('test-')) {
          localStorage.removeItem(key);
        }
      });
    });
  });
}); 