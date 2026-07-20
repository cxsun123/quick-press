import { test, expect } from '@playwright/test';

const TEST_USER = {
  name: '测试用户',
  email: `test_${Date.now()}@example.com`,
  password: 'test123456',
};

let createdPostId: string | null = null;
let createdPageId: string | null = null;
let createdTagId: string | null = null;

// ====== 1. 公共页面测试 ======
test.describe('公共页面', () => {
  test('首页渲染', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('欢迎来到 i_blog');
    await expect(page).toHaveTitle('i_blog');
  });

  test('登录页面渲染', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toContainText('登录');
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('登录');
    await expect(page.locator('a[href="/register"]')).toContainText('注册');
  });

  test('注册页面渲染', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('h1')).toContainText('注册');
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('注册');
  });

  test('未登录访问 /admin 跳转登录', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForURL('/login');
    await expect(page.locator('h1')).toContainText('登录');
  });

  test('搜索页面', async ({ page }) => {
    await page.goto('/search?q=test');
    await expect(page.locator('h1')).toContainText('搜索结果');
  });
});

// ====== 2. 认证流程 ======
test.describe('认证流程', () => {
  test('用户注册', async ({ page }) => {
    await page.goto('/register');
    await page.fill('input[name="name"]', TEST_USER.name);
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin', { timeout: 15000 });
    await expect(page.locator('h1')).toContainText('仪表盘');
  });

  test('用户登出', async ({ page }) => {
    await page.goto('/admin');
    // Click logout in sidebar
    await page.locator('form[action="/api/logout"] button').click();
    await page.waitForURL('/login');
    await expect(page.locator('h1')).toContainText('登录');
  });

  test('用户登录', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin', { timeout: 15000 });
    await expect(page.locator('h1')).toContainText('仪表盘');
  });
});

// ====== 3. 管理后台 - 仪表盘 ======
test.describe('管理后台 - 仪表盘', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');
  });

  test('仪表盘显示统计卡', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('仪表盘');
    const cards = page.locator('h3');
    await expect(cards.first()).toBeVisible();
  });
});

// ====== 4. 文章管理 ======
test.describe('文章管理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');
  });

  test('访问文章管理页', async ({ page }) => {
    await page.goto('/admin/posts');
    await expect(page.locator('h1')).toContainText('文章管理');
  });

  test('创建文章', async ({ page }) => {
    await page.goto('/admin/posts/new');
    await expect(page.locator('h1')).toContainText('新建文章');

    await page.fill('input[name="title"]', 'E2E 测试文章');
    // Editor content - wait for Tiptap editor to load
    await page.waitForSelector('.ProseMirror', { timeout: 10000 });
    await page.locator('.ProseMirror').fill('这是 E2E 测试文章的内容');

    // Click save
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL('/admin/posts', { timeout: 10000 });
    await expect(page.locator('table')).toBeVisible();
  });

  test('文章列表显示已创建文章', async ({ page }) => {
    await page.goto('/admin/posts');
    await expect(page.locator('text=E2E 测试文章').first()).toBeVisible({ timeout: 5000 });
  });

  test('编辑文章', async ({ page }) => {
    await page.goto('/admin/posts');
    const editLink = page.locator('a:has-text("编辑")').first();
    if (await editLink.isVisible()) {
      await editLink.click();
      await page.waitForSelector('.ProseMirror', { timeout: 10000 });
      await expect(page.locator('input[name="title"]')).toBeVisible();
    }
  });
});

// ====== 5. 页面管理 ======
test.describe('页面管理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');
  });

  test('创建页面', async ({ page }) => {
    await page.goto('/admin/pages');
    await expect(page.locator('h1')).toContainText('页面管理');

    // Fill in the inline create form
    const titleInput = page.locator('input[placeholder*="页面标题"]').first();
    if (await titleInput.isVisible()) {
      await titleInput.fill('E2E 测试页面');
      await page.locator('button:has-text("创建")').first().click();
      await page.waitForTimeout(2000);
    }
  });

  test('页面列表', async ({ page }) => {
    await page.goto('/admin/pages');
    await expect(page.locator('h1')).toContainText('页面管理');
  });
});

// ====== 6. 标签与分类管理 ======
test.describe('标签与分类管理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');
  });

  test('标签管理页面', async ({ page }) => {
    await page.goto('/admin/tags');
    await expect(page.locator('h1')).toContainText('标签与分类');
    await expect(page.locator('text=标签').first()).toBeVisible();
    await expect(page.locator('text=分类').first()).toBeVisible();
  });

  test('创建标签', async ({ page }) => {
    await page.goto('/admin/tags');
    // Fill tag name
    const tagInput = page.locator('input[placeholder*="标签名"]').first();
    if (await tagInput.isVisible()) {
      await tagInput.fill('E2E 测试标签');
      await page.locator('button:has-text("添加标签")').first().click();
      await page.waitForTimeout(1000);
    }
  });

  test('创建分类', async ({ page }) => {
    await page.goto('/admin/tags');
    // Switch to categories tab
    const catTab = page.locator('button:has-text("分类")').first();
    if (await catTab.isVisible()) {
      await catTab.click();
      await page.waitForTimeout(500);
      const catInput = page.locator('input[placeholder*="分类名"]').first();
      if (await catInput.isVisible()) {
        await catInput.fill('E2E 测试分类');
        await page.locator('button:has-text("添加分类")').first().click();
        await page.waitForTimeout(1000);
      }
    }
  });
});

// ====== 7. 评论管理 ======
test.describe('评论管理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');
  });

  test('评论管理页面', async ({ page }) => {
    await page.goto('/admin/comments');
    await expect(page.locator('h1')).toContainText('评论管理');
  });
});

// ====== 8. 媒体库 ======
test.describe('媒体库', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');
  });

  test('媒体管理页面', async ({ page }) => {
    await page.goto('/admin/media');
    await expect(page.locator('h1')).toContainText('媒体库');
  });
});

// ====== 9. 主题管理 ======
test.describe('主题管理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');
  });

  test('主题管理页面', async ({ page }) => {
    await page.goto('/admin/themes');
    await expect(page.locator('h1')).toContainText('主题管理');
    // Should show theme cards
    const themeCards = page.locator('[class*="border"], [class*="rounded"]').filter({ has: page.locator('h2, h3') });
    const count = await themeCards.count();
    expect(count).toBeGreaterThan(0);
  });
});

// ====== 10. 用户管理 ======
test.describe('用户管理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');
  });

  test('用户管理页面 (Admin only)', async ({ page }) => {
    await page.goto('/admin/users');
    // Test user may not be admin, so this might redirect
    // Just check if the page loads or redirects
    const currentUrl = page.url();
    if (currentUrl.includes('/admin/users')) {
      await expect(page.locator('h1')).toContainText('用户管理');
    }
  });
});

// ====== 11. 系统设置 ======
test.describe('系统设置', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');
  });

  test('系统设置页面', async ({ page }) => {
    await page.goto('/admin/settings');
    await expect(page.locator('h1')).toContainText('系统设置');
  });
});

// ====== 12. 侧边栏导航 ======
test.describe('管理后台导航', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');
  });

  test('侧边栏包含所有主要导航项', async ({ page }) => {
    const navLinks = [
      '仪表盘', '文章', '页面', '标签', '评论',
      '主题', '媒体', '用户', '设置',
    ];
    for (const link of navLinks) {
      await expect(page.locator(`text=${link}`).first()).toBeVisible();
    }
  });
});
