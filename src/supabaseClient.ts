import { createClient } from '@supabase/supabase-js'

const projectUrl = 'https://bzhmnsvnjwrmxfmscqfs.supabase.co'
const anonKey = 'sb_publishable_FnJrayIqUPSss66YIRC6bA_x_eOW5pf'

export const supabase = createClient(projectUrl, anonKey)
