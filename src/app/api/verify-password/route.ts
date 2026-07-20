import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/server/db/client';
import { verifyPassword } from '@/server/utils/password';
import { markdownToHtml } from '@chengxinsun26/editor';

export async function POST(req: NextRequest) {
  try {
    const { postId, password } = await req.json();
    if (!postId || !password) {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: post } = await supabase
      .from('posts')
      .select('id, title, content, published_at, visibility, password_hash')
      .eq('id', postId)
      .single();

    if (!post || post.visibility !== 'password') {
      return NextResponse.json({ error: '文章不存在或未设置密码保护' }, { status: 404 });
    }

    const valid = await verifyPassword(password, post.password_hash);
    if (!valid) {
      return NextResponse.json({ error: '密码错误' }, { status: 401 });
    }

    const htmlContent = markdownToHtml(post.content || '');

    const response = NextResponse.json({
      success: true,
      post: {
        id: post.id,
        title: post.title,
        htmlContent,
        published_at: post.published_at,
      },
    });

    response.cookies.set(`post_access_${post.id}`, 'true', {
      httpOnly: true,
      maxAge: 3600,
      path: '/',
      sameSite: 'lax',
    });

    return response;
  } catch {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
