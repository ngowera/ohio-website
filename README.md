# Ohio Microfinance Limited

A responsive lending website with original illustrative photography, personal and business loan information, scroll animation, and a short application flow.

## Run locally

Requires Node.js 22.13 or newer. Run `npm ci`, then `npm run dev`.
Run `npm run build` to create the production build.

## Application fields

Personal: full name, phone number, amount in MWK, applicant photo, collateral photo.
Business: the same fields plus business name.
Applicants review details and consent before sending. JPG, PNG and WebP uploads are limited to 5 MB per photo. Client and server validation enforce the basic requirements. Successful submissions receive a reference; retries with the same request ID do not duplicate the application.

## Supabase and Money OS

The website server validates each application, then writes a pending Renmal Capital Limited record to `loan_applications`, uploads images into private Supabase Storage buckets, and adds linked `customer_documents` rows using the project publishable key and strict row-level policies. Applications therefore appear in the existing Money OS/ProCorporate review workflow; files are never made public.

Production submissions use the website server route, so the site must be hosted on a platform that supports the server build rather than as static GitHub Pages files.

Company rates, repayment periods, address and contact information were not supplied, so no numerical lending terms, approval promises or fictitious contact details have been added. Photography is illustrative, not customer testimony.
