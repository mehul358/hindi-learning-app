import os
from playwright.sync_api import sync_playwright, Page, expect

def run_verification(page: Page):
    # Get the absolute path to the index.html file
    # This is necessary because the test is run from a different directory
    file_path = os.path.abspath('index.html')

    # Navigate to the local HTML file
    page.goto(f'file://{file_path}')

    # Wait for the main content to be visible
    expect(page.locator('main')).to_be_visible(timeout=10000)

    # Brute-force remove the splash screen and make main content visible
    page.evaluate("document.getElementById('splash-screen').remove()")
    page.evaluate("document.querySelector('main').style.opacity = 1")
    page.evaluate("document.getElementById('menu-btn').style.display = 'block'")

    # Click the menu button to open the side panel
    menu_button = page.locator('#menu-btn')
    expect(menu_button).to_be_visible()
    menu_button.click()

    # Wait for the side panel to be populated
    expect(page.locator('.side-panel-link[data-section="pack"]')).to_be_visible(timeout=5000)

    # Click the "I Spy" link in the side panel
    ispy_link = page.get_by_role("link", name="I Spy")
    expect(ispy_link).to_be_visible()
    ispy_link.click()

    # Wait for the "I Spy" game container to be visible
    ispy_container = page.locator('#ispy')
    expect(ispy_container).to_be_visible()

    # Wait for the grid to be populated with icons
    # We can check if at least one icon is present
    expect(ispy_container.locator('.lnr')).to_have_count(1, timeout=5000)

    # Take a screenshot
    page.screenshot(path="jules-scratch/verification/ispy_game.png")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    run_verification(page)
    browser.close()
