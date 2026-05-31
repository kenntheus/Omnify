"""
Job Application Automation Service
Uses Playwright for browser automation to auto-fill and submit job applications.
"""

import asyncio
from typing import Dict, Any, Optional, List
import logging

logger = logging.getLogger(__name__)


class ApplicationAutomation:
    """
    Browser automation for job applications using Playwright.
    Supports LinkedIn Easy Apply, Indeed, Glassdoor, and custom forms.
    """

    def __init__(self):
        self.playwright = None
        self.browser = None

    async def initialize(self):
        """Initialize Playwright browser"""
        try:
            from playwright.async_api import async_playwright
            self.playwright = await async_playwright().start()
            self.browser = await self.playwright.chromium.launch(
                headless=True,
                args=[
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-accelerated-2d-canvas",
                ]
            )
            logger.info("Browser automation initialized")
        except ImportError:
            logger.warning("Playwright not installed. Install with: playwright install chromium")

    async def cleanup(self):
        """Close browser"""
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()

    async def download_resume(self, url: str) -> str:
        """Download a resume from a URL to a temp file; returns the local path."""
        import tempfile
        import httpx
        try:
            async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
                response = await client.get(url)
                response.raise_for_status()
                content_type = response.headers.get("content-type", "")
                suffix = ".pdf" if "pdf" in content_type else ".docx"
                tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
                tmp.write(response.content)
                tmp.close()
                logger.info(f"Resume downloaded to {tmp.name}")
                return tmp.name
        except Exception as e:
            logger.warning(f"Could not download resume from {url}: {e}")
            return ""

    async def apply_to_job(
        self,
        job_url: str,
        user_data: Dict[str, Any],
        resume_path: str,
        cover_letter: Optional[str] = None,
        custom_answers: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """
        Automatically apply to a job posting.
        Returns application status and any errors.
        """
        result = {
            "success": False,
            "jobUrl": job_url,
            "message": "",
            "screenshots": [],
            "fieldsFilledCount": 0,
        }

        if not self.browser:
            result["message"] = "Browser automation not available"
            return result

        context = await self.browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        )
        page = await context.new_page()

        try:
            await page.goto(job_url, wait_until="networkidle", timeout=30000)

            # Detect platform and use appropriate strategy
            if "linkedin.com" in job_url:
                result = await self._apply_linkedin(page, user_data, resume_path, cover_letter)
            elif "indeed.com" in job_url:
                result = await self._apply_indeed(page, user_data, resume_path, cover_letter)
            else:
                result = await self._apply_generic(page, user_data, resume_path, cover_letter, custom_answers)

        except Exception as e:
            result["message"] = f"Automation error: {str(e)}"
            logger.error(f"Application automation failed: {e}")
        finally:
            await context.close()

        return result

    async def _apply_linkedin(self, page, user_data: Dict, resume_path: str, cover_letter: Optional[str]) -> Dict:
        """Handle LinkedIn Easy Apply — navigates multi-step modal and submits."""
        try:
            await page.click('button:has-text("Easy Apply")', timeout=5000)
            await page.wait_for_selector('.jobs-easy-apply-modal', timeout=5000)

            fields_filled = 0

            for _ in range(10):
                await page.wait_for_timeout(800)

                # Phone
                phone = page.locator('input[name="phoneNumber"]')
                if await phone.count() > 0 and user_data.get("phone"):
                    await phone.fill(user_data["phone"])
                    fields_filled += 1

                # Resume upload
                if resume_path:
                    file_input = page.locator('input[type="file"]')
                    if await file_input.count() > 0:
                        await file_input.set_input_files(resume_path)
                        fields_filled += 1
                        await page.wait_for_timeout(1500)

                # Cover letter
                if cover_letter:
                    cl_area = page.locator('textarea[id*="cover"], textarea[placeholder*="cover" i]')
                    if await cl_area.count() > 0:
                        await cl_area.first.fill(cover_letter)
                        fields_filled += 1

                # Submit
                submit = page.locator('button:has-text("Submit application")')
                if await submit.count() > 0:
                    await submit.click()
                    await page.wait_for_timeout(2000)
                    return {"success": True, "message": "LinkedIn Easy Apply submitted",
                            "fieldsFilledCount": fields_filled, "platform": "linkedin"}

                # Review step before submit
                review = page.locator('button:has-text("Review")')
                if await review.count() > 0:
                    await review.click()
                    continue

                # Next step
                next_btn = page.locator('button:has-text("Next")')
                if await next_btn.count() > 0:
                    await next_btn.click()
                else:
                    break

            return {"success": False, "message": "LinkedIn: submit button not reached", "platform": "linkedin"}
        except Exception as e:
            return {"success": False, "message": f"LinkedIn apply failed: {str(e)}", "platform": "linkedin"}

    async def _apply_indeed(self, page, user_data: Dict, resume_path: str, cover_letter: Optional[str]) -> Dict:
        """Handle Indeed application — clicks Apply now, fills fields, submits."""
        try:
            apply_btn = page.locator('button:has-text("Apply now"), a:has-text("Apply now")').first
            if await apply_btn.count() > 0:
                await apply_btn.click()
                await page.wait_for_load_state("networkidle", timeout=10000)

            fields_filled = 0
            field_mappings = [
                ('input[name*="name"], input[id*="name"]', user_data.get("name", "")),
                ('input[type="email"]', user_data.get("email", "")),
                ('input[type="tel"], input[name*="phone"]', user_data.get("phone", "")),
            ]
            for selector, value in field_mappings:
                if value:
                    try:
                        el = page.locator(selector).first
                        if await el.count() > 0:
                            await el.fill(str(value))
                            fields_filled += 1
                    except Exception:
                        pass

            if resume_path:
                file_input = page.locator('input[type="file"]').first
                if await file_input.count() > 0:
                    await file_input.set_input_files(resume_path)
                    fields_filled += 1
                    await page.wait_for_timeout(2000)

            if cover_letter:
                cl = page.locator('textarea[name*="cover"], textarea[id*="cover"]').first
                if await cl.count() > 0:
                    await cl.fill(cover_letter)
                    fields_filled += 1

            submit = page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Apply")').first
            if await submit.count() > 0:
                await submit.click()
                await page.wait_for_timeout(2000)
                return {"success": True, "message": f"Indeed application submitted ({fields_filled} fields filled)",
                        "fieldsFilledCount": fields_filled, "platform": "indeed"}

            return {"success": False, "message": "Indeed: submit button not found", "platform": "indeed"}
        except Exception as e:
            return {"success": False, "message": f"Indeed apply failed: {str(e)}", "platform": "indeed"}

    async def _apply_generic(self, page, user_data: Dict, resume_path: str, cover_letter: Optional[str], custom_answers: Optional[Dict]) -> Dict:
        """Handle generic application forms — fills fields, uploads resume, submits."""
        fields_filled = 0
        field_mappings = [
            ('input[name*="name"], input[placeholder*="name" i]', user_data.get("name", "")),
            ('input[type="email"], input[name*="email"]', user_data.get("email", "")),
            ('input[type="tel"], input[name*="phone"]', user_data.get("phone", "")),
            ('input[name*="linkedin"], input[placeholder*="linkedin" i]', user_data.get("linkedin", "")),
            ('input[name*="portfolio"], input[name*="website"]', user_data.get("portfolio", "")),
        ]
        for selector, value in field_mappings:
            if value:
                try:
                    el = page.locator(selector).first
                    if await el.count() > 0:
                        await el.fill(str(value))
                        fields_filled += 1
                except Exception:
                    pass

        if resume_path:
            try:
                file_input = page.locator('input[type="file"]').first
                if await file_input.count() > 0:
                    await file_input.set_input_files(resume_path)
                    fields_filled += 1
                    await page.wait_for_timeout(1000)
            except Exception:
                pass

        if cover_letter:
            for sel in ['textarea[name*="cover"]', 'textarea[id*="cover"]', 'textarea[placeholder*="cover" i]', 'textarea']:
                try:
                    el = page.locator(sel).first
                    if await el.count() > 0:
                        await el.fill(cover_letter)
                        fields_filled += 1
                        break
                except Exception:
                    pass

        if custom_answers:
            for key, answer in custom_answers.items():
                try:
                    el = page.locator(f'input[name*="{key}"], textarea[name*="{key}"]').first
                    if await el.count() > 0:
                        await el.fill(answer)
                        fields_filled += 1
                except Exception:
                    pass

        submitted = False
        for sel in ['button[type="submit"]', 'input[type="submit"]',
                    'button:has-text("Submit")', 'button:has-text("Apply")',
                    'button:has-text("Send application")', 'button:has-text("Send Application")']:
            try:
                btn = page.locator(sel).first
                if await btn.count() > 0:
                    await btn.click()
                    await page.wait_for_timeout(2000)
                    submitted = True
                    break
            except Exception:
                pass

        return {
            "success": submitted and fields_filled > 0,
            "message": f"Filled {fields_filled} fields" + (" and submitted" if submitted else " — submit button not found"),
            "fieldsFilledCount": fields_filled,
            "platform": "generic",
        }
