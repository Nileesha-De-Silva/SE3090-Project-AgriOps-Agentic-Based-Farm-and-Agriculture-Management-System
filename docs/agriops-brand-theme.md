# AgriOps brand theme

The reference palette is used across the React web dashboard and Flutter app:

| Colour | Purpose |
| --- | --- |
| `#091413` | Main text and darkest surfaces |
| `#285A48` | Primary actions, navigation and headings on light surfaces |
| `#408A71` | Secondary accents |
| `#B0E4CC` | Selection backgrounds and soft highlights |

Light backgrounds and intermediate shades are derived from these four colours. Error and warning colours retain their semantic meaning. Use dark text on mint surfaces and white text on dark forest surfaces.

Web tokens live in `frontend-web/src/styles/theme.css`. Tailwind aliases (`agri`, `forest`, `sage`, `green`, `emerald`, `teal`, `lime`) share the same scale in `frontend-web/tailwind.config.js`. Existing CSS and chart colours have been aligned with the palette. Mobile colours are centralized in `mobile/lib/widgets/app_theme.dart`.

## Typography

The user approved free alternatives to the commercial reference fonts:

- Headings: **Bricolage Grotesque**, with bold heading styles.
- Body and controls: **Source Sans 3**.

Both are bundled variable fonts, served locally by the web app and declared as assets in Flutter. They require no runtime Google Fonts request. Their SIL Open Font License files are included alongside each copy under `frontend-web/public/fonts` and `mobile/assets/fonts`.

Sources: [Bricolage Grotesque](https://github.com/google/fonts/tree/main/ofl/bricolagegrotesque) and [Source Sans 3](https://github.com/google/fonts/tree/main/ofl/sourcesans3).
