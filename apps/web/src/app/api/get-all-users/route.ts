import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function maskEmail(email: string) {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(local.length - 2, 3))}@${domain}`;
}

function maskName(name: string) {
  if (!name) return '○○○';
  return name[0] + '○○';
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const requesterId = searchParams.get('requesterId');

    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const users = (data.users ?? [])
      .map(u => {
        const meta = u.user_metadata ?? {};
        const name = meta.name || u.email?.split('@')[0] || '';
        const role = meta.role || 'student';
        return {
          id: u.id,
          maskedEmail: maskEmail(u.email ?? ''),
          maskedName: maskName(name),
          role,
          createdAt: u.created_at,
          passwordLength: typeof meta.password_length === 'number' ? meta.password_length : 0,
          isMe: u.id === requesterId,
        };
      });

    return NextResponse.json({ users });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
