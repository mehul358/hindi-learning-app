import os
from playwright.sync_api import sync_playwright, expect

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Go to the local server
        page.goto('http://localhost:8000')

        # Click the skip splash screen button
        skip_button = page.locator('#skip-splash-btn')
        expect(skip_button).to_be_visible(timeout=10000)
        skip_button.click()

        # Click the menu button to open the side panel
        menu_button = page.locator('#menu-btn')
        expect(menu_button).to_be_visible(timeout=10000)
        menu_button.click()

        # Wait for the side panel to be visible
        side_panel = page.locator('#side-panel')
        expect(side_panel).to_be_visible()

        # Wait for voices to load
        page.wait_for_timeout(5000)

        # Wait for the English voice selector to have at least one option
        english_voice_selector = page.locator('#english-voice-select')
        expect(english_voice_selector.locator('option')).to_have_count(1, timeout=25000)

        # Wait for the Hindi voice selector to have at least one option
        hindi_voice_selector = page.locator('#hindi-voice-select')
        expect(hindi_voice_selector.locator('option')).to_have_count(1, timeout=25000)

        # Take a screenshot of the side panel
        side_panel.screenshot(path='jules-scratch/verification/verification.png')

        browser.close()

if __name__ == '__main__':
    run_verification()
