// types_db.ts (This is what's generated)
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      lessons: { // <-- It found our table!
        Row: {
          id: string
          created_at: string
          outline: string | null
          status: string
          content: string | null
        }
        Insert: { // Types for inserting new rows
          id?: string
          created_at?: string
          outline?: string | null
          status?: string
          content?: string | null
        }
      }
    }
  }
}