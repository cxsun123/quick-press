#!/usr/bin/env bash
# i_blog E2E 全量测试脚本
# 使用方法: bash e2e/test-all.sh
set -e

PCLI="npx --ignore-engines playwright-cli"
BASE="http://127.0.0.1:3000"
PASS=0
FAIL=0
ERRORS=""

TEST_EMAIL="e2e_$(date +%s)@example.com"
TEST_PASS="e2etest123"
POST_SLUG=""

cleanup() {
  $PCLI close-all 2>/dev/null || true
}

assert_snapshot() {
  local label="$1"
  local expected="$2"
  if echo "$SNAP" | grep -q "$expected"; then
    echo "  ✅ $label"
    PASS=$((PASS + 1))
  else
    echo "  ❌ $label (expected: $expected)"
    FAIL=$((FAIL + 1))
    ERRORS="$ERRORS\n  ❌ $label"
  fi
}

assert_not_snapshot() {
  local label="$1"
  local unexpected="$2"
  if ! echo "$SNAP" | grep -q "$unexpected"; then
    echo "  ✅ $label"
    PASS=$((PASS + 1))
  else
    echo "  ❌ $label (unexpected: $unexpected found)"
    FAIL=$((FAIL + 1))
    ERRORS="$ERRORS\n  ❌ $label"
  fi
}

run_test() {
  local label="$1"
  local command="$2"
  local assertion="$3"
  local expected="$4"

  echo ""
  echo "━━━ $label ━━━"
  OUTPUT=$($PCLI $command 2>/dev/null)
  SNAP=$(echo "$OUTPUT" | sed -n '/### Snapshot/,/### Events/p' | sed '1d;$d')

  if [ -n "$assertion" ]; then
    case "$assertion" in
      text) assert_snapshot "$label" "$expected" ;;
      notext) assert_not_snapshot "$label" "$expected" ;;
      url)
        if echo "$OUTPUT" | grep -q "Page URL:.*$expected"; then
          echo "  ✅ $label"
          PASS=$((PASS + 1))
        else
          echo "  ❌ $label"
          FAIL=$((FAIL + 1))
          ERRORS="$ERRORS\n  ❌ $label"
        fi
        ;;
      eval)
        local result=$(echo "$OUTPUT" | grep "### Result" -A5 | tail -n +2 | head -1)
        if echo "$result" | grep -q "$expected"; then
          echo "  ✅ $label"
          PASS=$((PASS + 1))
        else
          echo "  ❌ $label (got: $result)"
          FAIL=$((FAIL + 1))
          ERRORS="$ERRORS\n  ❌ $label"
        fi
        ;;
    esac
  fi
  LAST_SNAP="$SNAP"
  LAST_OUTPUT="$OUTPUT"
}

echo "=========================================="
echo "  i_blog E2E 全量测试"
echo "  时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "  测试用户: $TEST_EMAIL"
echo "=========================================="

trap cleanup EXIT

# ====== 1. 公共页面 ======
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   1. 公共页面测试                        ║"
echo "╚══════════════════════════════════════════╝"

run_test "首页标题" \
  "goto $BASE" \
  text "欢迎来到 i_blog"

run_test "首页导航栏" \
  "snapshot" \
  text "首页"

run_test "登录页面" \
  "goto $BASE/login && snapshot" \
  text "登录"

run_test "登录页面有邮箱输入框" \
  "snapshot" \
  text "邮箱"

run_test "登录页面有密码输入框" \
  "snapshot" \
  text "密码"

run_test "登录页面有注册链接" \
  "snapshot" \
  text "注册"

# ====== 2. 注册 ======
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   2. 用户注册测试                        ║"
echo "╚══════════════════════════════════════════╝"

run_test "注册页面" \
  "goto $BASE/register && snapshot" \
  text "注册"

run_test "注册表单有昵称字段" \
  "snapshot" \
  text "昵称"

# 执行注册 - 使用 fill 填入表单后提交
$($PCLI "fill" '//input[@id="name"]' "$TEST_USER_NAME" 2>/dev/null || true)
$($PCLI goto $BASE/register 2>/dev/null)
$($PCLI fill '//input[@id="name"]' "测试用户" --submit 2>/dev/null || true)
$($PCLI fill '//input[@id="email"]' "$TEST_EMAIL" --submit 2>/dev/null || true)
$($PCLI fill '//input[@id="password"]' "$TEST_PASS" --submit 2>/dev/null || true)

echo "  注册用户: $TEST_EMAIL"
OUTPUT=$($PCLI click '//button[text()="注册"]' 2>/dev/null)
sleep 3

# Check if redirected to /admin (registration success)
if echo "$OUTPUT" | grep -q "/admin"; then
  echo "  ✅ 注册成功，跳转到管理后台"
  PASS=$((PASS + 1))
else
  echo "  ⚠️ 注册可能未跳转，检查当前页面..."
  OUTPUT=$($PCLI snapshot 2>/dev/null)
  SNAP=$(echo "$OUTPUT" | sed -n '/### Snapshot/,/### Events/p' | sed '1d;$d')
  if echo "$SNAP" | grep -q "仪表盘"; then
    echo "  ✅ 已在管理后台"
    PASS=$((PASS + 1))
  else
    echo "  ❌ 注册失败"
    echo "$OUTPUT" | head -20
    FAIL=$((FAIL + 1))
    ERRORS="$ERRORS\n  ❌ 注册失败"
  fi
fi

# ====== 3. 管理后台 - 仪表盘 ======
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   3. 管理后台 - 仪表盘                    ║"
echo "╚══════════════════════════════════════════╝"

run_test "仪表盘页面" \
  "goto $BASE/admin && snapshot" \
  text "仪表盘"

run_test "侧边栏有文章管理" \
  "snapshot" \
  text "文章"

run_test "侧边栏有页面管理" \
  "snapshot" \
  text "页面"

run_test "侧边栏有标签管理" \
  "snapshot" \
  text "标签"

run_test "侧边栏有评论管理" \
  "snapshot" \
  text "评论"

run_test "侧边栏有主题管理" \
  "snapshot" \
  text "主题"

run_test "侧边栏有媒体管理" \
  "snapshot" \
  text "媒体"

run_test "侧边栏有用户管理" \
  "snapshot" \
  text "用户"

run_test "侧边栏有系统设置" \
  "snapshot" \
  text "设置"

# ====== 4. 文章管理 ======
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   4. 文章管理测试                        ║"
echo "╚══════════════════════════════════════════╝"

run_test "文章管理页面" \
  "goto $BASE/admin/posts && snapshot" \
  text "文章管理"

run_test "新建文章页面" \
  "goto $BASE/admin/posts/new && snapshot" \
  text "新建文章"

# 检查编辑器是否存在
OUTPUT=$($PCLI eval "document.querySelector('.ProseMirror') !== null" 2>/dev/null)
if echo "$OUTPUT" | grep -q "true"; then
  echo "  ✅ WYSIWYG 编辑器存在"
  PASS=$((PASS + 1))
else
  echo "  ❌ WYSIWYG 编辑器不存在"
  FAIL=$((FAIL + 1))
  ERRORS="$ERRORS\n  ❌ WYSIWYG 编辑器"
fi

# 创建文章
$($PCLI fill '//input[@name="title"]' "E2E 测试文章 - 标题包含中文" 2>/dev/null || true)
sleep 1
OUTPUT=$($PCLI eval "document.querySelector('.ProseMirror')?.focus(); document.execCommand('insertText', false, '这是 E2E 测试文章的内容，包含一些中文和 English 混合。'); true" 2>/dev/null)
sleep 1

# Click save button
OUTPUT=$($PCLI click "//button[contains(text(), '保存') or contains(text(), '发布')]" 2>/dev/null)
sleep 3

OUTPUT=$($PCLI snapshot 2>/dev/null)
SNAP=$(echo "$OUTPUT" | sed -n '/### Snapshot/,/### Events/p' | sed '1d;$d')

# Check if redirected or still on same page
CURL_OUTPUT=$($PCLI eval "window.location.pathname" --raw 2>/dev/null)
echo "  当前路径: $CURL_OUTPUT"

# ====== 5. 标签管理 ======
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   5. 标签与分类管理                      ║"
echo "╚══════════════════════════════════════════╝"

run_test "标签管理页面" \
  "goto $BASE/admin/tags && snapshot" \
  text "标签与分类"

run_test "标签 Tab 存在" \
  "snapshot" \
  text "标签"

run_test "分类 Tab 存在" \
  "snapshot" \
  text "分类"

# ====== 6. 评论管理 ======
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   6. 评论管理                            ║"
echo "╚══════════════════════════════════════════╝"

run_test "评论管理页面" \
  "goto $BASE/admin/comments && snapshot" \
  text "评论管理"

# ====== 7. 媒体库 ======
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   7. 媒体库                              ║"
echo "╚══════════════════════════════════════════╝"

run_test "媒体库页面" \
  "goto $BASE/admin/media && snapshot" \
  text "媒体库"

# ====== 8. 主题管理 ======
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   8. 主题管理                            ║"
echo "╚══════════════════════════════════════════╝"

run_test "主题管理页面" \
  "goto $BASE/admin/themes && snapshot" \
  text "主题管理"

# ====== 9. 用户管理 ======
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   9. 用户管理                            ║"
echo "╚══════════════════════════════════════════╝"

run_test "用户管理页面" \
  "goto $BASE/admin/users && snapshot" \
  text "用户管理"

# ====== 10. 系统设置 ======
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   10. 系统设置                           ║"
echo "╚══════════════════════════════════════════╝"

run_test "系统设置页面" \
  "goto $BASE/admin/settings && snapshot" \
  text "系统设置"

# ====== 11. 公开博客页面 ======
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   11. 公开博客页面                       ║"
echo "╚══════════════════════════════════════════╝"

run_test "搜索页面" \
  "goto '$BASE/search?q=test' && snapshot" \
  text "搜索结果"

# ====== 12. 登出 ======
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   12. 登出测试                           ║"
echo "╚══════════════════════════════════════════╝"

run_test "退出登录" \
  "goto $BASE/admin && snapshot" \
  text "设置"

# Click logout button
OUTPUT=$($PCLI click '//form[@action="/api/logout"]//button' 2>/dev/null)
sleep 3

OUTPUT=$($PCLI snapshot 2>/dev/null)
SNAP=$(echo "$OUTPUT" | sed -n '/### Snapshot/,/### Events/p' | sed '1d;$d')
if echo "$SNAP" | grep -q "登录"; then
  echo "  ✅ 已退出登录，回到登录页"
  PASS=$((PASS + 1))
else
  echo "  ❌ 退出登录失败"
  FAIL=$((FAIL + 1))
  ERRORS="$ERRORS\n  ❌ 退出登录失败"
fi

# ====== 13. 登录验证 ======
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   13. 重新登录验证                       ║"
echo "╚══════════════════════════════════════════╝"

$($PCLI fill '//input[@name="email"]' "$TEST_EMAIL" 2>/dev/null || true)
$($PCLI fill '//input[@name="password"]' "$TEST_PASS" 2>/dev/null || true)
OUTPUT=$($PCLI click '//button[text()="登录"]' 2>/dev/null)
sleep 3

OUTPUT=$($PCLI snapshot 2>/dev/null)
SNAP=$(echo "$OUTPUT" | sed -n '/### Snapshot/,/### Events/p' | sed '1d;$d')
if echo "$SNAP" | grep -q "仪表盘"; then
  echo "  ✅ 重新登录成功"
  PASS=$((PASS + 1))
else
  echo "  ❌ 重新登录失败"
  FAIL=$((FAIL + 1))
  ERRORS="$ERRORS\n  ❌ 重新登录失败"
fi

# ====== 汇总 ======
echo ""
echo "=========================================="
echo "  E2E 测试完成"
echo "  时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="
echo ""
echo "  通过: $PASS"
echo "  失败: $FAIL"
echo ""

if [ $FAIL -gt 0 ]; then
  echo "  失败详情:"
  echo -e "$ERRORS"
  echo ""
  exit 1
else
  echo "  所有测试通过! 🎉"
  echo ""
  exit 0
fi
