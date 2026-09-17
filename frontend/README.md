# Medpro React frontend

A frontend practice recreation of https://medpro.vn/ using React, React Router, and plain CSS. No login or backend is needed.

## Run

From this folder:

```sh
npm install
npm run dev
```

`npm run build` creates the production build. `npm run preview` serves it locally.

## Structure

- `src/components/`: shared header, footer, search, cards, and homepage sections.
- `src/pages/`: home, medical facilities, services, doctors, details, booking preview, news, guides, and contact/information pages.
- `src/data/reference.json`: static snapshot of public facility names, service labels, and image paths.
- `src/data/mockData.js`: exports the local data and contains sample articles and navigation labels.
- `src/index.css`: shared styles and responsive layouts.
- `public/images/`: locally saved images from the reference site.

Search, filters, pagination, tabs, carousel controls, FAQs, and page navigation work locally. Booking and contact forms only show previews; they do not submit data or create appointments. Availability, article content, descriptions, and other demo information are illustrative.

The backend is currently a Spring Boot skeleton with no medical APIs. Unused product/cart/login files and the product API have been removed. See [the completion plan](../docs/KE_HOACH_DO_AN.md) for services, APIs, database design, and milestones.

Fonts use Google Fonts with system fallbacks. All site images are local. Reference branding and images remain the property of their respective owners.

For deployment, configure the web server to fall back to `index.html` for React Router URLs.
