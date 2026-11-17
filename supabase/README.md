# Supabase Database Setup for CardioDiab

CardioDiab uses Supabase (PostgreSQL) for storing uploaded reports, extracted biomarkers, adaptive MCQ answers, and full clinical risk assessment reports.

## 1. Quick Setup
1. Create a project on [Supabase](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Paste the contents of `supabase/schema.sql` and click **RUN**.
4. Retrieve your **Project URL** and **anon / service_role key** from **Project Settings > API**.
5. Put them in your `backend/.env` file:
   ```env
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_KEY=your-anon-or-service-role-key
   ```

*Note: If `SUPABASE_URL` and `SUPABASE_KEY` are not set, CardioDiab automatically uses an in-memory/JSON local persistence store so the application runs 100% seamlessly right out of the box without setup barriers.*
