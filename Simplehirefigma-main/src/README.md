# Simplehire - Candidate Verification Platform UI

A modern, clean React + TypeScript UI for a professional verification platform that helps job candidates get verified through skill interviews, ID/visa checks, and reference verification.

## Features

### Authentication
- Login page with email and Google authentication
- Signup page with terms acceptance
- Protected routes with authentication state management

### Dashboard
- Purchase verification plans:
  - Skill verification ($49)
  - ID + Visa verification ($15)
  - Reference check ($10)
  - Complete combo package ($60)

### My Products
- Track verification progress with status indicators
- Progress steppers for each verification type
- Quick actions to continue pending verifications

### Verification Flows

#### 1. Skill Interview
- System checks (camera, microphone, internet)
- Live video call interface
- AI-powered skill assessment

#### 2. ID + Visa Verification
- **Step 1**: Upload ID document (Passport or State ID/Driver's License)
- **Step 2**: Dynamic visa status selector with exact document requirements for:
  - US Citizen, Green Card, H-1B, H-4, H-4 EAD
  - F-1 Student, F-1 CPT, F-1 OPT, F-1 STEM OPT
  - L-1, L-2, L-2 EAD, and Other statuses
- **Step 3**: Selfie capture for face matching
- **Step 4**: Review and submit
- Separate front/back uploads for EAD cards

#### 3. Reference Check
- Add up to 3 professional references
- Form fields: Name, Email, Company, Relation (dropdown with Manager, Colleague, etc.)
- Reference list management
- Automated email notifications

### Certificates
- View earned certificates with preview
- Download as PDF
- Share verification links
- Certificate display with branding

### Submission Confirmations
- Success pages after completing verifications
- Clear next steps and timeline information
- Navigation back to dashboard

## Tech Stack

- **React 18** with TypeScript
- **Tailwind CSS v4** for styling
- **shadcn/ui** components (Radix UI primitives)
- **Lucide React** for icons
- **Recharts** for data visualization
- **React Router** (ready for integration)

## Design System

- **Primary Color**: Blue (#2563eb)
- **Neutrals**: Slate color palette
- **Style**: Clean, modern SaaS aesthetic
- **Components**: Rounded cards, soft shadows, generous white space
- **Typography**: Predefined styles in globals.css

## Project Structure

```
/
├── components/
│   ├── ui/                          # shadcn/ui components
│   ├── login-page.tsx               # Login with email & Google
│   ├── signup-page.tsx              # Signup with email & Google
│   ├── dashboard-page.tsx           # Main dashboard with plans
│   ├── my-products-page.tsx         # Verification tracking
│   ├── skill-interview-page.tsx     # Skill interview flow
│   ├── id-verification-page.tsx     # ID + Visa verification
│   ├── reference-check-page.tsx     # Reference check flow
│   ├── certificates-page.tsx        # Certificates display
│   ├── top-bar.tsx                  # Navigation bar
│   └── ...                          # Supporting components
├── styles/
│   └── globals.css                  # Tailwind config + custom tokens
├── App.tsx                          # Main app with routing logic
├── INTEGRATION_GUIDE.md             # Detailed integration instructions
└── README.md                        # This file
```

## Installation

### Prerequisites
- Node.js 16+ and npm

### Install Dependencies

```bash
npm install
```

### Required Packages

```bash
# Core dependencies
npm install react react-dom
npm install lucide-react recharts react-slick react-responsive-masonry

# Radix UI components (shadcn/ui)
npm install @radix-ui/react-accordion @radix-ui/react-alert-dialog
npm install @radix-ui/react-aspect-ratio @radix-ui/react-avatar
npm install @radix-ui/react-checkbox @radix-ui/react-collapsible
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install @radix-ui/react-label @radix-ui/react-popover
npm install @radix-ui/react-progress @radix-ui/react-select
npm install @radix-ui/react-separator @radix-ui/react-slider
npm install @radix-ui/react-switch @radix-ui/react-tabs
npm install @radix-ui/react-tooltip

# Utilities
npm install sonner@2.0.3
npm install class-variance-authority clsx tailwind-merge

# Tailwind CSS v4
npm install tailwindcss@next @tailwindcss/postcss@next
```

## Development

```bash
npm run dev
```

## Building for Production

```bash
npm run build
```

## Integration with Existing App

See **INTEGRATION_GUIDE.md** for detailed instructions on integrating this UI into your existing React + Node.js application.

### Quick Integration Steps:
1. Copy `/components/` and `/styles/` to your React app
2. Install dependencies
3. Set up routing with React Router
4. Connect to your backend API
5. Configure CORS and authentication

## Backend API Requirements

This UI expects the following API endpoints:

### Authentication
- `POST /api/auth/login` - Email/password login
- `POST /api/auth/signup` - User registration
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - Get user's purchased products
- `POST /api/products/purchase` - Purchase verification plan

### Verifications
- `POST /api/verifications/id` - Submit ID + Visa verification
- `POST /api/verifications/skill` - Submit skill interview data
- `POST /api/verifications/references` - Submit references

### Certificates
- `GET /api/certificates` - Get user's certificates
- `GET /api/certificates/:id/download` - Download certificate PDF

## Environment Variables

```env
REACT_APP_API_URL=http://localhost:3001/api
```

## Features Checklist

- ✅ Login page with email & Google authentication
- ✅ Signup page with terms acceptance
- ✅ Dashboard with pricing plans
- ✅ My Products page with progress tracking
- ✅ Skill interview flow with system checks
- ✅ ID + Visa verification with dynamic document requirements
- ✅ 13 visa status types with exact document requirements
- ✅ Separate front/back uploads for EAD cards
- ✅ Reference check flow with form and list management
- ✅ Certificates page with preview and download
- ✅ Submission confirmation pages
- ✅ Full navigation between all pages
- ✅ Responsive design (desktop-optimized)
- ✅ Clean, modern Simplehire design system

## Customization

### Colors
Update colors in `/styles/globals.css`:
```css
@theme {
  --color-primary: #2563eb;
  --color-secondary: #64748b;
  /* ... */
}
```

### Typography
Font styles are defined in `/styles/globals.css` for each HTML element.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT License - feel free to use this in your projects.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Support

For questions or issues, please open a GitHub issue.

---

**Built with ❤️ for Simplehire**
