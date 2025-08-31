import { supabase } from './supabase'

export type UserType = 'job_seeker' | 'company'

export async function getUserType(userId?: string): Promise<UserType | null> {
  if (!userId) return null

  // 1) Try auth metadata (fast)
  const { data } = await supabase.auth.getSession()
  const meta = data.session?.user?.user_metadata as Record<string, any> | undefined
  if (meta?.user_type) return meta.user_type as UserType

  // 2) Fallback to DB
  const { data: row, error } = await supabase
    .from('profiles')
    .select('user_type')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.warn('getUserType(): profiles lookup error', error)
    return null
  }
  return (row?.user_type ?? null) as UserType | null
}

// Optional: hard gates for profile completion (tune fields for your schema)
export async function isCompanyProfileComplete(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('companies')
    .select('name,uic,contact_email')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) return false
  return !!(data?.name && data?.uic && data?.contact_email)
}

export async function isSeekerProfileComplete(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name,phone')
    .eq('id', userId)
    .maybeSingle()
  if (error) return false
  return !!(data?.full_name && data?.phone)
}
