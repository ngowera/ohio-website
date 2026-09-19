# Ohio Microfinance Limited

A responsive lending website with original illustrative photography, personal and business loan information, scroll animation, and a short application flow.

## Run locally

Requires Node.js 22.13 or newer. Run `npm ci`, then `npm run dev`.
Run `npm run build` to create the production build.

## Application fields

Personal: full name, phone number, amount in MWK, applicant photo, collateral photo.
Business: the same fields plus business name.
Applicants review details and consent before sending. JPG, PNG and WebP uploads are limited to 2 MB per photo. Client and server validation enforce the basic requirements. Successful submissions receive a reference; retries with the same request ID do not duplicate the application.

## Storage and operations

The server writes each application and both photos atomically into the private Sites-managed R2 binding `BUCKET`. Files are not served publicly. Local preview uses local emulated storage; local test submissions are not production applications.

This version contains the customer submission workflow. It does not yet include a staff review dashboard or email/SMS notifications. Staff access and retention procedures should be configured before public customer intake. The default deployed Site is private to its owner.

Company rates, repayment periods, address and contact information were not supplied, so no numerical lending terms, approval promises or fictitious contact details have been added. Photography is illustrative, not customer testimony.
