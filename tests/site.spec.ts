import { expect, test } from "@playwright/test";

const coursePaths = ["acting", "speech", "improv", "custom"];

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("the home page exposes every course and a working CTA", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Актерская",
  );
  await expect(page.locator(".course-card")).toHaveCount(4);
  await expect(
    page.getByRole("link", { name: /выбрать курс/i }),
  ).toHaveAttribute("href", "#courses");
});

for (const course of coursePaths) {
  test(`${course} course page renders without horizontal overflow`, async ({
    page,
  }) => {
    await page.goto(`/courses/${course}/`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator(".course-facts")).toBeVisible();

    const widths = await page.evaluate(() => ({
      document: document.documentElement.scrollWidth,
      viewport: document.documentElement.clientWidth,
    }));
    expect(widths.document).toBeLessThanOrEqual(widths.viewport);
  });
}

test("course facts keep one shared and aligned layout", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "desktop-chromium",
    "Desktop alignment contract",
  );
  await page.goto("/courses/acting/");

  const rows = await page.locator(".course-facts__list").evaluate((list) => {
    const terms = Array.from(list.querySelectorAll("dt"));
    const descriptions = Array.from(list.querySelectorAll("dd"));
    return terms.map((term, index) => {
      const termBox = term.getBoundingClientRect();
      const descriptionBox = descriptions[index].getBoundingClientRect();
      return {
        termTop: termBox.top,
        descriptionTop: descriptionBox.top,
        termLeft: termBox.left,
        termRight: termBox.right,
        descriptionLeft: descriptionBox.left,
        termFits: term.scrollWidth <= term.clientWidth,
        whiteSpace: getComputedStyle(term).whiteSpace,
      };
    });
  });

  for (const row of rows) {
    expect(Math.abs(row.termTop - row.descriptionTop)).toBeLessThan(1);
    expect(row.descriptionLeft - row.termRight).toBeGreaterThanOrEqual(8);
  }
  expect(rows[1].termFits).toBe(true);
  expect(rows[1].whiteSpace).toBe("nowrap");
});

test("navigation and application controls meet the mobile touch target", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "mobile-chromium",
    "Mobile interaction contract",
  );
  await page.goto("/courses/improv/");

  for (const locator of [
    page.locator(".wordmark"),
    page.locator(".back-link"),
  ]) {
    const box = await locator.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }

  await expect(page.locator(".teacher-card img")).toBeVisible();
  await expect(
    page.getByRole("link", { name: /написать в telegram/i }),
  ).toHaveAttribute("href", "https://t.me/actingbcn");
});

test("course facts produce a reviewable visual artifact", async ({
  page,
}, testInfo) => {
  await page.goto("/courses/acting/");
  await page.evaluate(() => document.fonts.ready);
  const screenshot = await page.locator(".course-facts").screenshot({
    animations: "disabled",
  });
  await testInfo.attach("course-facts", {
    body: screenshot,
    contentType: "image/png",
  });
  expect(screenshot.byteLength).toBeGreaterThan(1_000);
});
