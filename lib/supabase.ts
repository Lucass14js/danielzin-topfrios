import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Para uso no servidor com service role key
export const supabaseAdmin = (() => {
  // Só criar no servidor
  if (typeof window === 'undefined') {
    return createClient(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  // No cliente, retornar null
  return null
})()
