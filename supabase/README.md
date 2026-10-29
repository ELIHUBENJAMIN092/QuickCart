# Supabase setup

This application now uses Supabase Auth, Postgres, and Storage for new accounts and catalog data. Existing MongoDB Atlas and Clerk data is not copied or deleted by this change; no export files were available during implementation.

## Configure and deploy

1. The base schema migration referenced by earlier setup instructions (`migrations/20261020140000_initial_schema.sql`) is not present in this checkout. Do not treat this repository alone as sufficient to create or verify the production schema. Restore the authoritative baseline migration from the Supabase project history before provisioning a new environment. The checked-in `migrations/20261027160000_category_heroes.sql` only extends an existing `categories` table.
2. After restoring and applying the authoritative base schema, apply `migrations/20261028170000_commerce_visibility.sql` to create the seller-controlled store switch.
3. Apply `migrations/20261028190000_trusted_brands.sql` to create the brand carousel catalog and import the eight existing logo entries. New logo files use the existing `product-media` bucket and seller-owned storage paths.
4. Enable the `pg_cron` extension in Supabase, then apply `migrations/20261029190000_chat_phase2.sql`. The migration schedules daily cleanup for expired conversations, events, and feedback (90-day retention).
5. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the local and deployment environments. Never expose a secret/service-role key to the browser. Configure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` for shared production rate limiting; chat, lead, feedback, and event endpoints fail closed if this service is unavailable.
6. Configure an SMTP provider in Supabase Auth settings so confirmation and password-recovery messages can be delivered.
7. Set the site's allowed redirect URL in Supabase Auth, then deploy the `send-order-email` Edge Function with JWT verification enabled (`supabase functions deploy send-order-email`). Set the Edge Function secrets `RESEND_API_KEY` and `RESEND_FROM_EMAIL`; these remain private in Supabase and are not needed in the Next.js app. Configure a custom SMTP provider in Supabase Auth for confirmation and password-recovery emails. An external email delivery provider is still required for transactional messages.
8. Create the first account through `/sign-up`. Seller access is granted by an administrator in the SQL Editor, for example:

   ```sql
   update public.profiles
   set role = 'seller'
   where email = 'admin@example.com';
   ```

9. Verify email confirmation, login, catalog reads, seller-only product changes, media uploads, order creation, and order email delivery before routing production traffic to the new app.

The storefront exposes prices and shopping actions only to authenticated users while the seller-controlled commerce switch is enabled. Turning it off hides prices and cart controls and also blocks cart updates and new order creation at the API layer. The migration also restricts anonymous direct reads of the product table to non-price catalog fields; storefront RPCs return price fields only when the caller is authenticated and the switch is enabled. The switch is polled every 30 seconds and refreshed when a browser tab regains focus.

The seller dashboard's **Marcas de confianza** page manages the logo carousel. Uploaded JPG, PNG, and WebP logos are optimized in the browser, and sellers can add, reorder, and remove entries.

The application expects a public product-media bucket, seller-restricted storage writes, and an atomic order-creation RPC that records item snapshots and clears the user's cart. Verify these controls against the deployed Supabase policies and function before relying on them; their definitions are not checked into this repository.

## Database security verification before release

The base schema, RLS policies, storage policies, and `create_order` RPC definition are not included in this checkout, so their deployed behavior cannot be confirmed from the application source. Before a release, verify them in the target Supabase project:

- Users can read and update only their own profile, cart, addresses, and orders; profile updates must not let users grant themselves the `seller` role.
- Public catalog reads expose only published products, while seller-only writes require the intended role.
- Storage policies restrict writes and deletes to authorized seller-owned paths and enforce the expected media constraints.
- `create_order` derives prices from trusted product records, checks availability and stock, records the authenticated user's ownership, and changes the order and cart atomically.
- The stored order amount follows the displayed checkout rule: a 15% IVA charge, with shipping excluded until it is quoted separately.

## Existing data

No base-schema migration is available in this checkout, and no data migration is performed here. Before retiring Atlas or Clerk, export and separately migrate the products, orders, addresses, user profiles, and any product media that must be retained. New Supabase accounts do not inherit Clerk passwords or seller roles. The fixed marketing illustrations in `assets/assets.js` still reference existing Cloudinary URLs; only newly managed product media is uploaded to Supabase Storage in this change.
