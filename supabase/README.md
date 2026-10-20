# Supabase setup

This application now uses Supabase Auth, Postgres, and Storage for new accounts and catalog data. Existing MongoDB Atlas and Clerk data is not copied or deleted by this change; no export files were available during implementation.

## Configure and deploy

1. In the Supabase project, apply `migrations/20261020140000_initial_schema.sql` using the SQL Editor or Supabase CLI.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the local and deployment environments. Never expose a secret/service-role key to the browser.
3. Configure an SMTP provider in Supabase Auth settings so confirmation and password-recovery messages can be delivered.
4. Set the site's allowed redirect URL in Supabase Auth, then deploy the `send-order-email` Edge Function with JWT verification enabled (`supabase functions deploy send-order-email`). Set the Edge Function secrets `RESEND_API_KEY` and `RESEND_FROM_EMAIL`; these remain private in Supabase and are not needed in the Next.js app. Configure a custom SMTP provider in Supabase Auth for confirmation and password-recovery emails. An external email delivery provider is still required for transactional messages.
5. Create the first account through `/sign-up`. Seller access is granted by an administrator in the SQL Editor, for example:

   ```sql
   update public.profiles
   set role = 'seller'
   where email = 'admin@example.com';
   ```

6. Verify email confirmation, login, catalog reads, seller-only product changes, media uploads, order creation, and order email delivery before routing production traffic to the new app.

The product-media bucket is public for storefront image delivery. Upload, update, and delete operations are restricted to authenticated seller accounts by Row Level Security policies. The order-creation RPC atomically records the order and its item snapshots and clears the user's cart.

## Existing data

The database migration creates a fresh schema. It does not import Atlas records or Clerk identities. Before retiring either existing service, export and separately migrate the products, orders, addresses, user profiles, and any product media that must be retained. New Supabase accounts do not inherit Clerk passwords or seller roles. The fixed marketing illustrations in `assets/assets.js` still reference existing Cloudinary URLs; only newly managed product media is uploaded to Supabase Storage in this change.
