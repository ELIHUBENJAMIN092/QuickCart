alter table public.products
  add column is_offer boolean not null default false,
  add column is_new boolean not null default false;

update public.products set is_offer = true where offer_price < price;
