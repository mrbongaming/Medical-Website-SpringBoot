# Medpro React frontend

A frontend practice recreation of https://medpro.vn/ using React, React Router, and plain CSS. All service booking and account screens use local demonstration data. No backend is required.

## Run

From this folder:

~~~sh
npm install
npm run dev
~~~

~~~sh
npm run lint
npm run build
npm run check:services
npm run check:browser
~~~

- Build before running the browser check: it serves the production output on an ephemeral localhost port.
- The data check validates all 16 categories and 60 offerings, asset paths, provider associations, schedules, dependent selection resets and prices.
- The browser check uses Node 22+ and locally installed Chrome on Windows. It runs complete service flows, auth previews, search, invalid routes and responsive overflow checks, then prints the temporary screenshot directory. It does not install browser packages.
- Set CHROME_PATH to use a different Chrome executable. The browser test leaves screenshots and its isolated browser profile in the printed temporary directory.
- npm run preview serves the production build locally.

## Service demo

The home page and /dich-vu-y-te expose 16 categories. Fifteen internal categories each have four offerings; An Khang opens its official website in a new tab.

- /dich-vu-y-te/:slug: category, keyword search and filters.
- /dich-vu-y-te/:serviceSlug/chi-tiet/:itemSlug: offering details.
- /dich-vu-y-te/:serviceSlug/dat-lich/:itemSlug: service-specific options, schedule, person/contact, review and demo result.
- /kham-suc-khoe-doanh-nghiep: business packages and consultation request preview.
- /dang-nhap and /dang-ky: form previews, always accessible.

Existing facility, doctor, package and booking routes remain available.

Special steps include home sample collection, support duration, illustrative certificate documents, vaccine appointments, corporate staff counts, evening appointments and a simulated video room. Promotion offerings retain their underlying service flow and discounted illustrative price.

The navbar always shows mockUser as logged in. Auth forms perform local field validation only; no authentication, account creation, password storage, payment or appointment submission occurs. Selection state lives in React memory and resets on page reload. Going back within a flow retains inputs; changing parent selections clears dependent availability.

## Structure

- src/components/: shared cards, account menu, booking fields, summary and simulated video room.
- src/pages/: directory, service detail, service booking, auth and existing pages.
- src/data/reference.json: reference service labels and local image paths.
- src/data/mockData.js: existing data exports, sample articles and navigation labels.
- src/data/serviceCatalog.js: service destinations, fictional providers/doctors and 60 offerings.
- src/data/serviceFlow.js: steps, dependent selection changes, validation and summary.
- src/data/mockSchedule.js: illustrative availability, with bookings from tomorrow onward.
- src/data/mockAccount.js: default signed-in profile.
- src/index.css and src/services.css: shared styles and responsive service/account layouts.
- public/images/: locally saved reference images.
- scripts/: dependency-free browser automation and Vite-backed data checks.

Provider affiliations, prices and schedules in the new service catalog are fictional demonstration data. Reference branding and images remain the property of their respective owners. Fonts use Google Fonts with system fallbacks; images are local.

For deployment, configure the web server to fall back to index.html for React Router URLs.
