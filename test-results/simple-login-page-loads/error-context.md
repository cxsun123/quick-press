# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: simple.spec.ts >> login page loads
- Location: e2e/simple.spec.ts:8:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
Call log:
  - navigating to "http://localhost:3000/login", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('home page loads', async ({ page }) => {
  4  |   await page.goto('/');
  5  |   await expect(page.locator('h1')).toContainText('欢迎来到 i_blog');
  6  | });
  7  | 
  8  | test('login page loads', async ({ page }) => {
> 9  |   await page.goto('/login');
     |              ^ Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
  10 |   await expect(page.locator('h1')).toContainText('登录');
  11 | });
  12 | 
```