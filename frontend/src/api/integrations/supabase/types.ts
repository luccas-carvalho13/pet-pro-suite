export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          slug: string
          cnpj: string | null
          email: string
          phone: string | null
          address: Json | null
          logo: string | null
          settings: Json | null
          subscription: Json | null
          is_active: boolean | null
          custom_domain: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          cnpj?: string | null
          email: string
          phone?: string | null
          address?: Json | null
          logo?: string | null
          settings?: Json | null
          subscription?: Json | null
          is_active?: boolean | null
          custom_domain?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          cnpj?: string | null
          email?: string
          phone?: string | null
          address?: Json | null
          logo?: string | null
          settings?: Json | null
          subscription?: Json | null
          is_active?: boolean | null
          custom_domain?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          name: string
          email: string
          password: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          tenant_id: string | null
          avatar: string | null
          is_active: boolean | null
          is_email_verified: boolean | null
          email_verification_token: string | null
          password_reset_token: string | null
          password_reset_expires: string | null
          last_login: string | null
          permissions: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          email: string
          password: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id?: string | null
          avatar?: string | null
          is_active?: boolean | null
          is_email_verified?: boolean | null
          email_verification_token?: string | null
          password_reset_token?: string | null
          password_reset_expires?: string | null
          last_login?: string | null
          permissions?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string
          password?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id?: string | null
          avatar?: string | null
          is_active?: boolean | null
          is_email_verified?: boolean | null
          email_verification_token?: string | null
          password_reset_token?: string | null
          password_reset_expires?: string | null
          last_login?: string | null
          permissions?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string
          cpf: string | null
          address: Json | null
          notes: string | null
          tenant_id: string
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone: string
          cpf?: string | null
          address?: Json | null
          notes?: string | null
          tenant_id: string
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string
          cpf?: string | null
          address?: Json | null
          notes?: string | null
          tenant_id?: string
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pets: {
        Row: {
          id: string
          name: string
          species: Database["public"]["Enums"]["pet_species"]
          breed: string | null
          gender: Database["public"]["Enums"]["pet_gender"]
          birth_date: string | null
          weight: number | null
          color: string | null
          photo: string | null
          microchip: string | null
          medical_history: Json | null
          vaccines: Json | null
          allergies: string[] | null
          medications: Json | null
          client_id: string
          tenant_id: string
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          species?: Database["public"]["Enums"]["pet_species"]
          breed?: string | null
          gender?: Database["public"]["Enums"]["pet_gender"]
          birth_date?: string | null
          weight?: number | null
          color?: string | null
          photo?: string | null
          microchip?: string | null
          medical_history?: Json | null
          vaccines?: Json | null
          allergies?: string[] | null
          medications?: Json | null
          client_id: string
          tenant_id: string
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          species?: Database["public"]["Enums"]["pet_species"]
          breed?: string | null
          gender?: Database["public"]["Enums"]["pet_gender"]
          birth_date?: string | null
          weight?: number | null
          color?: string | null
          photo?: string | null
          microchip?: string | null
          medical_history?: Json | null
          vaccines?: Json | null
          allergies?: string[] | null
          medications?: Json | null
          client_id?: string
          tenant_id?: string
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          id: string
          name: string
          description: string | null
          category: Database["public"]["Enums"]["service_category"]
          duration: number
          price: number
          commission: number | null
          is_active: boolean | null
          tenant_id: string
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category?: Database["public"]["Enums"]["service_category"]
          duration?: number
          price: number
          commission?: number | null
          is_active?: boolean | null
          tenant_id: string
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: Database["public"]["Enums"]["service_category"]
          duration?: number
          price?: number
          commission?: number | null
          is_active?: boolean | null
          tenant_id?: string
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          id: string
          date: string
          start_time: string
          end_time: string
          service_id: string
          pet_id: string
          client_id: string
          veterinarian_id: string | null
          status: Database["public"]["Enums"]["appointment_status"]
          notes: string | null
          price: number | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          tenant_id: string
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          date: string
          start_time: string
          end_time: string
          service_id: string
          pet_id: string
          client_id: string
          veterinarian_id?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          notes?: string | null
          price?: number | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          tenant_id: string
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          date?: string
          start_time?: string
          end_time?: string
          service_id?: string
          pet_id?: string
          client_id?: string
          veterinarian_id?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          notes?: string | null
          price?: number | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          tenant_id?: string
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_veterinarian_id_fkey"
            columns: ["veterinarian_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          id: string
          type: Database["public"]["Enums"]["transaction_type"]
          category: string
          description: string
          amount: number
          payment_method: Database["public"]["Enums"]["payment_method"]
          date: string
          appointment_id: string | null
          supplier: string | null
          invoice: string | null
          notes: string | null
          tenant_id: string
          created_by: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          type: Database["public"]["Enums"]["transaction_type"]
          category: string
          description: string
          amount: number
          payment_method?: Database["public"]["Enums"]["payment_method"]
          date?: string
          appointment_id?: string | null
          supplier?: string | null
          invoice?: string | null
          notes?: string | null
          tenant_id: string
          created_by: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          type?: Database["public"]["Enums"]["transaction_type"]
          category?: string
          description?: string
          amount?: number
          payment_method?: Database["public"]["Enums"]["payment_method"]
          date?: string
          appointment_id?: string | null
          supplier?: string | null
          invoice?: string | null
          notes?: string | null
          tenant_id?: string
          created_by?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          sku: string | null
          category: Database["public"]["Enums"]["product_category"]
          unit: Database["public"]["Enums"]["product_unit"]
          cost_price: number | null
          sale_price: number
          stock: number | null
          min_stock: number | null
          max_stock: number | null
          supplier: Json | null
          image: string | null
          is_active: boolean | null
          tenant_id: string
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          sku?: string | null
          category?: Database["public"]["Enums"]["product_category"]
          unit?: Database["public"]["Enums"]["product_unit"]
          cost_price?: number | null
          sale_price?: number
          stock?: number | null
          min_stock?: number | null
          max_stock?: number | null
          supplier?: Json | null
          image?: string | null
          is_active?: boolean | null
          tenant_id: string
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          sku?: string | null
          category?: Database["public"]["Enums"]["product_category"]
          unit?: Database["public"]["Enums"]["product_unit"]
          cost_price?: number | null
          sale_price?: number
          stock?: number | null
          min_stock?: number | null
          max_stock?: number | null
          supplier?: Json | null
          image?: string | null
          is_active?: boolean | null
          tenant_id?: string
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          id: string
          product_id: string
          type: Database["public"]["Enums"]["stock_movement_type"]
          quantity: number
          unit_cost: number | null
          reason: string | null
          supplier: string | null
          notes: string | null
          tenant_id: string
          created_by: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          product_id: string
          type: Database["public"]["Enums"]["stock_movement_type"]
          quantity: number
          unit_cost?: number | null
          reason?: string | null
          supplier?: string | null
          notes?: string | null
          tenant_id: string
          created_by: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          product_id?: string
          type?: Database["public"]["Enums"]["stock_movement_type"]
          quantity?: number
          unit_cost?: number | null
          reason?: string | null
          supplier?: string | null
          notes?: string | null
          tenant_id?: string
          created_by?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: "super_admin" | "admin" | "veterinarian" | "attendant" | "financial" | "stock"
      pet_species: "dog" | "cat" | "bird" | "rabbit" | "reptile" | "other"
      pet_gender: "male" | "female" | "unknown"
      service_category: "veterinary" | "grooming" | "hotel" | "retail" | "other"
      appointment_status: "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show"
      payment_status: "pending" | "paid" | "partial" | "cancelled"
      transaction_type: "income" | "expense"
      payment_method: "cash" | "credit_card" | "debit_card" | "pix" | "bank_transfer" | "other"
      product_category: "food" | "medicine" | "accessory" | "toy" | "hygiene" | "other"
      product_unit: "unit" | "kg" | "g" | "l" | "ml" | "box" | "pack"
      stock_movement_type: "entry" | "exit" | "adjustment" | "loss"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
