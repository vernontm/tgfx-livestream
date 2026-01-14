import { supabaseAdmin } from './supabase'

export interface WhopUser {
  id: string
  whop_user_id: string
  username: string
  email?: string
  created_at?: string
  updated_at?: string
}

// Save or update Whop user in database
export async function saveWhopUser(whopUserId: string, username: string, email?: string): Promise<void> {
  if (!supabaseAdmin) {
    console.error('Supabase admin client not configured')
    return
  }

  try {
    const { error } = await supabaseAdmin
      .from('whop_users')
      .upsert({
        whop_user_id: whopUserId,
        username: username,
        email: email || null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'whop_user_id'
      })

    if (error) {
      console.error('Error saving Whop user:', error)
    } else {
      console.log('Saved Whop user:', whopUserId, username)
    }
  } catch (err) {
    console.error('Failed to save Whop user:', err)
  }
}

// Get Whop user from database
export async function getWhopUser(whopUserId: string): Promise<WhopUser | null> {
  if (!supabaseAdmin) {
    console.error('Supabase admin client not configured')
    return null
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('whop_users')
      .select('*')
      .eq('whop_user_id', whopUserId)
      .single()

    if (error) {
      if (error.code !== 'PGRST116') { // Not found error
        console.error('Error getting Whop user:', error)
      }
      return null
    }

    return data as WhopUser
  } catch (err) {
    console.error('Failed to get Whop user:', err)
    return null
  }
}
