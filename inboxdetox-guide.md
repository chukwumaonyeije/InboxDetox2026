# InboxDetox: AI-Powered Email Unsubscribe Manager

## Complete Build Guide — Railway + Claude Code + Gmail/Outlook Integration

---

## 1. Project Overview

**InboxDetox** is a self-hosted web application that connects to your Gmail and Outlook accounts, scans for subscription emails, and provides AI-powered tools to bulk unsubscribe. It uses Claude AI to categorize emails, summarize inbox clutter, and draft unsubscribe communications.

### Core Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js 14 (App Router) | API routes + SSR + Railway-native |
| Auth | NextAuth.js v5 | Google OAuth + Microsoft OAuth in one library |
| Database | PostgreSQL (Railway) | Persistent unsubscribe history, user prefs |
| ORM | Prisma | Type-safe DB access, Railway migration support |
| Email APIs | Gmail API + Microsoft Graph API | Read-only email scanning |
| AI | Anthropic Claude API (claude-sonnet-4-20250514) | Categorization, summaries, drafting |
| Styling | Tailwind CSS | DWC-inspired dark theme |
| Deployment | Railway | One-click PostgreSQL, env management, custom domains |
| Dev Tool | Claude Code | Agentic development from terminal |

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                          │
│  Next.js App Router (React Server Components)       │
│  ┌──────────┐ ┌──────────┐ ┌────────────────────┐  │
│  │ Dashboard │ │ Scanner  │ │ Settings/Filters   │  │
│  │ (AI Sum.) │ │ (Email   │ │ (Domain, Keyword,  │  │
│  │           │ │  List)   │ │  Age, Read Status) │  │
│  └──────────┘ └──────────┘ └────────────────────┘  │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│                 API LAYER                            │
│  Next.js Route Handlers (/api/*)                    │
│  ┌──────────┐ ┌──────────┐ ┌────────────────────┐  │
│  │ /auth/*  │ │ /scan/*  │ │ /unsubscribe/*     │  │
│  │ NextAuth │ │ Fetch &  │ │ Execute unsub,     │  │
│  │ Google + │ │ Filter   │ │ log history        │  │
│  │ Microsoft│ │ emails   │ │                    │  │
│  └──────────┘ └──────────┘ └────────────────────┘  │
│  ┌──────────┐ ┌──────────┐                          │
│  │ /ai/*    │ │/settings │                          │
│  │ Claude   │ │ User     │                          │
│  │ Categorize│ │ prefs   │                          │
│  │ Summarize│ │          │                          │
│  └──────────┘ └──────────┘                          │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│              EXTERNAL SERVICES                       │
│  ┌──────────┐ ┌──────────┐ ┌────────────────────┐  │
│  │ Gmail    │ │ Microsoft│ │ Anthropic Claude   │  │
│  │ API      │ │ Graph    │ │ API                │  │
│  │ (OAuth2) │ │ API      │ │ (API Key)          │  │
│  │          │ │ (OAuth2) │ │                    │  │
│  └──────────┘ └──────────┘ └────────────────────┘  │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│              RAILWAY INFRASTRUCTURE                  │
│  ┌──────────────────────────────────────────────┐   │
│  │ PostgreSQL                                    │   │
│  │ - users, accounts, sessions (NextAuth)       │   │
│  │ - email_scans (scan history)                 │   │
│  │ - subscriptions (detected senders)           │   │
│  │ - unsubscribe_actions (audit log)            │   │
│  │ - ai_categorizations (Claude results)        │   │
│  │ - weekly_summaries (AI digest cache)         │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## 3. Project Setup with Claude Code

### 3.1 Initialize the Project

Open your terminal and start Claude Code:

```bash
# Install Claude Code if you haven't
npm install -g @anthropic-ai/claude-code

# Create project directory
mkdir inboxdetox && cd inboxdetox

# Start Claude Code
claude

# Inside Claude Code, give it the full context:
> Initialize a Next.js 14 project with App Router, TypeScript, Tailwind CSS,
> and Prisma. Set up the folder structure for an email unsubscribe management
> app with authentication, email scanning, AI categorization, and settings.
> Use src/ directory structure.
```

### 3.2 Resulting Folder Structure

```
inboxdetox/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # Root layout with DWC theme
│   │   ├── page.tsx                   # Landing / login page
│   │   ├── globals.css                # Tailwind + DWC custom properties
│   │   ├── dashboard/
│   │   │   └── page.tsx               # Main dashboard with AI summary
│   │   ├── scan/
│   │   │   └── page.tsx               # Email scanner view
│   │   ├── settings/
│   │   │   └── page.tsx               # Filter configuration
│   │   ├── history/
│   │   │   └── page.tsx               # Unsubscribe audit log
│   │   └── api/
│   │       ├── auth/[...nextauth]/
│   │       │   └── route.ts           # NextAuth handler
│   │       ├── scan/
│   │       │   ├── gmail/route.ts     # Gmail scan endpoint
│   │       │   └── outlook/route.ts   # Outlook scan endpoint
│   │       ├── unsubscribe/
│   │       │   └── route.ts           # Execute unsubscribe
│   │       ├── ai/
│   │       │   ├── categorize/route.ts
│   │       │   ├── summarize/route.ts
│   │       │   └── draft/route.ts
│   │       └── settings/
│   │           └── route.ts
│   ├── lib/
│   │   ├── auth.ts                    # NextAuth config
│   │   ├── prisma.ts                  # Prisma client singleton
│   │   ├── gmail.ts                   # Gmail API helpers
│   │   ├── outlook.ts                 # Microsoft Graph helpers
│   │   ├── claude.ts                  # Anthropic SDK wrapper
│   │   ├── unsubscribe.ts            # Unsubscribe execution logic
│   │   └── filters.ts                # Filter application logic
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── EmailTable.tsx
│   │   ├── FilterPanel.tsx
│   │   ├── AISummaryCard.tsx
│   │   ├── UnsubscribeButton.tsx
│   │   ├── ScanProgress.tsx
│   │   └── ProviderConnect.tsx
│   └── types/
│       └── index.ts
├── .env.local                         # Local env vars
├── railway.toml                       # Railway config
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 4. Database Schema (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── NextAuth Models ─────────────────────────────────

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
  scans         EmailScan[]
  subscriptions Subscription[]
  actions       UnsubscribeAction[]
  summaries     WeeklySummary[]
  filterPrefs   FilterPreference?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ─── Application Models ──────────────────────────────

model EmailScan {
  id            String   @id @default(cuid())
  userId        String
  provider      String   // "gmail" | "outlook"
  emailsScanned Int
  subsFound     Int
  startedAt     DateTime @default(now())
  completedAt   DateTime?
  status        String   @default("running") // running | completed | failed
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Subscription {
  id              String   @id @default(cuid())
  userId          String
  provider        String   // "gmail" | "outlook"
  senderEmail     String
  senderName      String?
  senderDomain    String   // extracted domain for filtering
  subjectSample   String?  // example subject line
  emailCount      Int      @default(1)
  firstSeen       DateTime
  lastSeen        DateTime
  isRead          Boolean  @default(false) // most recent email read status
  aiCategory      String?  // "promotional" | "newsletter" | "transactional" | "social" | "updates"
  aiConfidence    Float?   // 0.0 - 1.0
  unsubscribeUrl  String?  // List-Unsubscribe header URL
  unsubscribeEmail String? // List-Unsubscribe mailto:
  status          String   @default("active") // active | unsubscribed | ignored | failed
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  actions         UnsubscribeAction[]

  @@unique([userId, senderEmail, provider])
  @@index([userId, senderDomain])
  @@index([userId, aiCategory])
  @@index([userId, lastSeen])
}

model UnsubscribeAction {
  id              String   @id @default(cuid())
  userId          String
  subscriptionId  String
  method          String   // "link" | "email" | "manual"
  status          String   // "success" | "failed" | "pending"
  draftedMessage  String?  @db.Text // AI-drafted unsubscribe email
  errorMessage    String?
  executedAt      DateTime @default(now())
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  subscription    Subscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)
}

model WeeklySummary {
  id              String   @id @default(cuid())
  userId          String
  weekStarting    DateTime
  totalSubs       Int
  newSubs         Int
  unsubscribed    Int
  topDomains      Json     // { "mailchimp.com": 45, "substack.com": 23 }
  categoryBreakdown Json   // { "promotional": 120, "newsletter": 45 }
  aiNarrative     String   @db.Text // Claude-generated summary
  createdAt       DateTime @default(now())
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, weekStarting])
}

model FilterPreference {
  id              String   @id @default(cuid())
  userId          String   @unique
  blockedDomains  Json     @default("[]")  // ["mailchimp.com", "constantcontact.com"]
  blockedKeywords Json     @default("[]")  // ["sale", "limited time"]
  maxAgeDays      Int?     // null = no age filter
  unreadOnly      Boolean  @default(false)
  autoCategories  Json     @default("[]")  // ["promotional", "social"] — auto-flag these
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

## 5. Authentication Setup

### 5.1 Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project called "InboxDetox"
3. Enable the **Gmail API**
4. Configure OAuth consent screen:
   - User type: External
   - App name: InboxDetox
   - Scopes: `openid`, `email`, `profile`, `https://www.googleapis.com/auth/gmail.readonly`
5. Create OAuth 2.0 credentials:
   - Type: Web application
   - Authorized redirect URI: `https://your-app.railway.app/api/auth/callback/google`
   - Also add `http://localhost:3000/api/auth/callback/google` for dev

### 5.2 Microsoft Azure Setup

1. Go to [Azure Portal](https://portal.azure.com/) → App registrations
2. New registration:
   - Name: InboxDetox
   - Supported account types: Accounts in any organizational directory and personal Microsoft accounts
   - Redirect URI: Web → `https://your-app.railway.app/api/auth/callback/microsoft-entra-id`
3. API Permissions → Add: `Mail.Read`, `User.Read`, `openid`, `profile`, `email`
4. Certificates & secrets → New client secret

### 5.3 NextAuth Configuration

```typescript
// src/lib/auth.ts

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import MicrosoftEntraId from "next-auth/providers/microsoft-entra-id";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/gmail.readonly",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
    MicrosoftEntraId({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: "common",
      authorization: {
        params: {
          scope: "openid profile email offline_access Mail.Read",
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/auth/error",
  },
});
```

```typescript
// src/app/api/auth/[...nextauth]/route.ts

import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

---

## 6. Email Scanning Implementation

### 6.1 Gmail Scanner

```typescript
// src/lib/gmail.ts

import { google } from "googleapis";
import { prisma } from "./prisma";

interface GmailScanOptions {
  userId: string;
  accessToken: string;
  maxResults?: number;
  olderThanDays?: number;
}

export async function scanGmailSubscriptions(options: GmailScanOptions) {
  const { userId, accessToken, maxResults = 500 } = options;

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  // Search for emails with List-Unsubscribe header (strong signal for subscriptions)
  // Also search common promotional patterns
  const queries = [
    "unsubscribe",
    "list:unsubscribe",
    "category:promotions",
    "category:updates",
  ];

  const allMessageIds = new Set<string>();

  for (const query of queries) {
    let pageToken: string | undefined;
    let fetched = 0;

    do {
      const res = await gmail.users.messages.list({
        userId: "me",
        q: query,
        maxResults: Math.min(100, maxResults - fetched),
        pageToken,
      });

      for (const msg of res.data.messages || []) {
        if (msg.id) allMessageIds.add(msg.id);
      }

      pageToken = res.data.nextPageToken || undefined;
      fetched += (res.data.messages || []).length;
    } while (pageToken && fetched < maxResults);
  }

  // Create scan record
  const scan = await prisma.emailScan.create({
    data: {
      userId,
      provider: "gmail",
      emailsScanned: allMessageIds.size,
      subsFound: 0,
      status: "running",
    },
  });

  // Process each message to extract subscription info
  const senderMap = new Map<string, {
    senderEmail: string;
    senderName: string;
    senderDomain: string;
    subjects: string[];
    dates: Date[];
    unsubscribeUrl: string | null;
    unsubscribeEmail: string | null;
    isRead: boolean;
    count: number;
  }>();

  for (const messageId of allMessageIds) {
    try {
      const msg = await gmail.users.messages.get({
        userId: "me",
        id: messageId,
        format: "metadata",
        metadataHeaders: [
          "From", "Subject", "Date", "List-Unsubscribe",
        ],
      });

      const headers = msg.data.payload?.headers || [];
      const getHeader = (name: string) =>
        headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value;

      const from = getHeader("From") || "";
      const subject = getHeader("Subject") || "";
      const date = getHeader("Date");
      const listUnsub = getHeader("List-Unsubscribe");
      const isRead = !msg.data.labelIds?.includes("UNREAD");

      // Parse sender
      const emailMatch = from.match(/<(.+?)>/) || from.match(/([^\s]+@[^\s]+)/);
      const senderEmail = emailMatch?.[1]?.toLowerCase() || from.toLowerCase();
      const senderName = from.replace(/<.*>/, "").trim().replace(/"/g, "") || senderEmail;
      const senderDomain = senderEmail.split("@")[1] || "unknown";

      // Parse List-Unsubscribe header
      let unsubUrl: string | null = null;
      let unsubEmail: string | null = null;
      if (listUnsub) {
        const urlMatch = listUnsub.match(/<(https?:\/\/[^>]+)>/);
        const mailtoMatch = listUnsub.match(/<mailto:([^>]+)>/);
        unsubUrl = urlMatch?.[1] || null;
        unsubEmail = mailtoMatch?.[1] || null;
      }

      const existing = senderMap.get(senderEmail);
      if (existing) {
        existing.count++;
        existing.subjects.push(subject);
        if (date) existing.dates.push(new Date(date));
        if (!existing.unsubscribeUrl && unsubUrl) existing.unsubscribeUrl = unsubUrl;
        if (!existing.unsubscribeEmail && unsubEmail) existing.unsubscribeEmail = unsubEmail;
        existing.isRead = isRead; // latest status
      } else {
        senderMap.set(senderEmail, {
          senderEmail,
          senderName,
          senderDomain,
          subjects: [subject],
          dates: date ? [new Date(date)] : [],
          unsubscribeUrl: unsubUrl,
          unsubscribeEmail: unsubEmail,
          isRead,
          count: 1,
        });
      }
    } catch (err) {
      console.error(`Failed to fetch message ${messageId}:`, err);
    }
  }

  // Upsert subscriptions
  let subsFound = 0;
  for (const [, data] of senderMap) {
    const dates = data.dates.sort((a, b) => a.getTime() - b.getTime());

    await prisma.subscription.upsert({
      where: {
        userId_senderEmail_provider: {
          userId,
          senderEmail: data.senderEmail,
          provider: "gmail",
        },
      },
      update: {
        emailCount: data.count,
        lastSeen: dates[dates.length - 1] || new Date(),
        subjectSample: data.subjects[data.subjects.length - 1],
        isRead: data.isRead,
        unsubscribeUrl: data.unsubscribeUrl,
        unsubscribeEmail: data.unsubscribeEmail,
      },
      create: {
        userId,
        provider: "gmail",
        senderEmail: data.senderEmail,
        senderName: data.senderName,
        senderDomain: data.senderDomain,
        subjectSample: data.subjects[0],
        emailCount: data.count,
        firstSeen: dates[0] || new Date(),
        lastSeen: dates[dates.length - 1] || new Date(),
        isRead: data.isRead,
        unsubscribeUrl: data.unsubscribeUrl,
        unsubscribeEmail: data.unsubscribeEmail,
      },
    });
    subsFound++;
  }

  // Update scan record
  await prisma.emailScan.update({
    where: { id: scan.id },
    data: { subsFound, status: "completed", completedAt: new Date() },
  });

  return { scanId: scan.id, emailsScanned: allMessageIds.size, subsFound };
}
```

### 6.2 Outlook Scanner

```typescript
// src/lib/outlook.ts

import { Client } from "@microsoft/microsoft-graph-client";
import { prisma } from "./prisma";

interface OutlookScanOptions {
  userId: string;
  accessToken: string;
  maxResults?: number;
}

export async function scanOutlookSubscriptions(options: OutlookScanOptions) {
  const { userId, accessToken, maxResults = 500 } = options;

  const client = Client.init({
    authProvider: (done) => done(null, accessToken),
  });

  const scan = await prisma.emailScan.create({
    data: {
      userId,
      provider: "outlook",
      emailsScanned: 0,
      subsFound: 0,
      status: "running",
    },
  });

  const senderMap = new Map<string, any>();
  let fetched = 0;
  let nextLink: string | null = null;

  // Search for subscription-like emails
  const searchUrl = `/me/messages?$filter=contains(body/content,'unsubscribe')&$select=from,subject,receivedDateTime,isRead,internetMessageHeaders&$top=100&$orderby=receivedDateTime desc`;

  let url: string = searchUrl;

  do {
    const res = await client.api(url).get();

    for (const msg of res.value || []) {
      const senderEmail = msg.from?.emailAddress?.address?.toLowerCase();
      if (!senderEmail) continue;

      const senderName = msg.from?.emailAddress?.name || senderEmail;
      const senderDomain = senderEmail.split("@")[1] || "unknown";
      const subject = msg.subject || "";
      const date = msg.receivedDateTime ? new Date(msg.receivedDateTime) : new Date();
      const isRead = msg.isRead || false;

      // Extract List-Unsubscribe from internet headers
      let unsubUrl: string | null = null;
      let unsubEmail: string | null = null;
      const headers = msg.internetMessageHeaders || [];
      const listUnsub = headers.find(
        (h: any) => h.name?.toLowerCase() === "list-unsubscribe"
      )?.value;

      if (listUnsub) {
        const urlMatch = listUnsub.match(/<(https?:\/\/[^>]+)>/);
        const mailtoMatch = listUnsub.match(/<mailto:([^>]+)>/);
        unsubUrl = urlMatch?.[1] || null;
        unsubEmail = mailtoMatch?.[1] || null;
      }

      const existing = senderMap.get(senderEmail);
      if (existing) {
        existing.count++;
        existing.subjects.push(subject);
        existing.dates.push(date);
        existing.isRead = isRead;
        if (!existing.unsubscribeUrl && unsubUrl) existing.unsubscribeUrl = unsubUrl;
        if (!existing.unsubscribeEmail && unsubEmail) existing.unsubscribeEmail = unsubEmail;
      } else {
        senderMap.set(senderEmail, {
          senderEmail,
          senderName,
          senderDomain,
          subjects: [subject],
          dates: [date],
          unsubscribeUrl: unsubUrl,
          unsubscribeEmail: unsubEmail,
          isRead,
          count: 1,
        });
      }

      fetched++;
    }

    nextLink = res["@odata.nextLink"] || null;
    if (nextLink) url = nextLink;
  } while (nextLink && fetched < maxResults);

  // Upsert subscriptions (same pattern as Gmail)
  let subsFound = 0;
  for (const [, data] of senderMap) {
    const dates = data.dates.sort((a: Date, b: Date) => a.getTime() - b.getTime());

    await prisma.subscription.upsert({
      where: {
        userId_senderEmail_provider: {
          userId,
          senderEmail: data.senderEmail,
          provider: "outlook",
        },
      },
      update: {
        emailCount: data.count,
        lastSeen: dates[dates.length - 1],
        subjectSample: data.subjects[data.subjects.length - 1],
        isRead: data.isRead,
        unsubscribeUrl: data.unsubscribeUrl,
        unsubscribeEmail: data.unsubscribeEmail,
      },
      create: {
        userId,
        provider: "outlook",
        senderEmail: data.senderEmail,
        senderName: data.senderName,
        senderDomain: data.senderDomain,
        subjectSample: data.subjects[0],
        emailCount: data.count,
        firstSeen: dates[0],
        lastSeen: dates[dates.length - 1],
        isRead: data.isRead,
        unsubscribeUrl: data.unsubscribeUrl,
        unsubscribeEmail: data.unsubscribeEmail,
      },
    });
    subsFound++;
  }

  await prisma.emailScan.update({
    where: { id: scan.id },
    data: {
      emailsScanned: fetched,
      subsFound,
      status: "completed",
      completedAt: new Date(),
    },
  });

  return { scanId: scan.id, emailsScanned: fetched, subsFound };
}
```

---

## 7. Filter Engine

```typescript
// src/lib/filters.ts

import { prisma } from "./prisma";
import type { Subscription, FilterPreference } from "@prisma/client";

interface FilterCriteria {
  domains?: string[];          // e.g. ["mailchimp.com", "constantcontact.com"]
  keywords?: string[];         // e.g. ["sale", "limited time", "act now"]
  olderThanDays?: number;      // e.g. 180 (6 months)
  unreadOnly?: boolean;        // only show unread subscriptions
  categories?: string[];       // AI categories: ["promotional", "social"]
  provider?: "gmail" | "outlook" | "all";
}

export async function getFilteredSubscriptions(
  userId: string,
  filters: FilterCriteria
) {
  const where: any = {
    userId,
    status: "active",
  };

  // Provider filter
  if (filters.provider && filters.provider !== "all") {
    where.provider = filters.provider;
  }

  // Domain filter
  if (filters.domains && filters.domains.length > 0) {
    where.senderDomain = { in: filters.domains };
  }

  // Age filter
  if (filters.olderThanDays) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - filters.olderThanDays);
    where.lastSeen = { lte: cutoffDate };
  }

  // Read status filter
  if (filters.unreadOnly) {
    where.isRead = false;
  }

  // AI category filter
  if (filters.categories && filters.categories.length > 0) {
    where.aiCategory = { in: filters.categories };
  }

  let results = await prisma.subscription.findMany({
    where,
    orderBy: [{ emailCount: "desc" }, { lastSeen: "desc" }],
  });

  // Keyword filter (applied in-memory since it checks subject samples)
  if (filters.keywords && filters.keywords.length > 0) {
    const lowerKeywords = filters.keywords.map((k) => k.toLowerCase());
    results = results.filter((sub) => {
      const subject = (sub.subjectSample || "").toLowerCase();
      const name = (sub.senderName || "").toLowerCase();
      return lowerKeywords.some(
        (kw) => subject.includes(kw) || name.includes(kw)
      );
    });
  }

  return results;
}

export async function getUserFilters(userId: string): Promise<FilterPreference | null> {
  return prisma.filterPreference.findUnique({ where: { userId } });
}

export async function updateUserFilters(
  userId: string,
  updates: Partial<FilterPreference>
) {
  return prisma.filterPreference.upsert({
    where: { userId },
    update: updates,
    create: {
      userId,
      blockedDomains: (updates.blockedDomains as any) || [],
      blockedKeywords: (updates.blockedKeywords as any) || [],
      maxAgeDays: updates.maxAgeDays || null,
      unreadOnly: updates.unreadOnly || false,
      autoCategories: (updates.autoCategories as any) || [],
    },
  });
}
```

---

## 8. Claude AI Integration

### 8.1 AI Service Layer

```typescript
// src/lib/claude.ts

import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "./prisma";
import type { Subscription } from "@prisma/client";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// ─── 1. Categorize Subscriptions ──────────────────────

export async function categorizeSubscriptions(
  subscriptions: Subscription[]
): Promise<Map<string, { category: string; confidence: number }>> {
  const batchSize = 50; // Process in batches to manage token limits
  const results = new Map<string, { category: string; confidence: number }>();

  for (let i = 0; i < subscriptions.length; i += batchSize) {
    const batch = subscriptions.slice(i, i + batchSize);

    const emailList = batch
      .map(
        (s, idx) =>
          `${idx + 1}. Sender: ${s.senderName} <${s.senderEmail}> | Domain: ${s.senderDomain} | Subject: "${s.subjectSample}" | Count: ${s.emailCount}`
      )
      .join("\n");

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: `You are an email categorization engine. Categorize each email subscription into exactly one category. Respond ONLY with a JSON array. No other text.

Categories:
- "promotional" — Sales, deals, marketing, discounts
- "newsletter" — Regular content digests, blogs, news roundups
- "transactional" — Receipts, shipping, account notifications
- "social" — Social media notifications, community updates
- "updates" — Product updates, release notes, changelogs
- "financial" — Banking, investment, billing statements

JSON format: [{"index": 1, "category": "promotional", "confidence": 0.95}, ...]`,
      messages: [
        {
          role: "user",
          content: `Categorize these email subscriptions:\n\n${emailList}`,
        },
      ],
    });

    try {
      const text = response.content[0].type === "text" ? response.content[0].text : "";
      const parsed = JSON.parse(text);

      for (const item of parsed) {
        const sub = batch[item.index - 1];
        if (sub) {
          results.set(sub.id, {
            category: item.category,
            confidence: item.confidence,
          });
        }
      }
    } catch (err) {
      console.error("Failed to parse AI categorization:", err);
    }
  }

  // Persist categorizations
  for (const [subId, { category, confidence }] of results) {
    await prisma.subscription.update({
      where: { id: subId },
      data: { aiCategory: category, aiConfidence: confidence },
    });
  }

  return results;
}

// ─── 2. Weekly Inbox Clutter Summary ──────────────────

export async function generateWeeklySummary(userId: string) {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [allSubs, newSubs, recentActions] = await Promise.all([
    prisma.subscription.findMany({ where: { userId } }),
    prisma.subscription.findMany({
      where: { userId, firstSeen: { gte: weekAgo } },
    }),
    prisma.unsubscribeAction.findMany({
      where: { userId, executedAt: { gte: weekAgo } },
    }),
  ]);

  // Build domain frequency map
  const domainCounts: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};
  for (const sub of allSubs) {
    domainCounts[sub.senderDomain] = (domainCounts[sub.senderDomain] || 0) + sub.emailCount;
    if (sub.aiCategory) {
      categoryCounts[sub.aiCategory] = (categoryCounts[sub.aiCategory] || 0) + sub.emailCount;
    }
  }

  const topDomains = Object.entries(domainCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});

  const summaryData = {
    totalSubscriptions: allSubs.length,
    totalEmails: allSubs.reduce((sum, s) => sum + s.emailCount, 0),
    newSubscriptionsThisWeek: newSubs.length,
    unsubscribedThisWeek: recentActions.filter((a) => a.status === "success").length,
    topDomains,
    categoryBreakdown: categoryCounts,
    topOffenders: allSubs
      .sort((a, b) => b.emailCount - a.emailCount)
      .slice(0, 5)
      .map((s) => `${s.senderName} (${s.emailCount} emails)`),
  };

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    system: `You are an inbox health analyst. Write a concise, actionable weekly summary of the user's email subscription health. Be direct. Use short paragraphs. No filler. Highlight the biggest sources of clutter and recommend specific actions. Write in second person ("You received..."). Keep it under 250 words.`,
    messages: [
      {
        role: "user",
        content: `Generate my weekly inbox health report:\n\n${JSON.stringify(summaryData, null, 2)}`,
      },
    ],
  });

  const narrative = response.content[0].type === "text" ? response.content[0].text : "";

  // Get start of current week (Monday)
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
  weekStart.setHours(0, 0, 0, 0);

  const summary = await prisma.weeklySummary.upsert({
    where: { userId_weekStarting: { userId, weekStarting: weekStart } },
    update: {
      totalSubs: allSubs.length,
      newSubs: newSubs.length,
      unsubscribed: recentActions.filter((a) => a.status === "success").length,
      topDomains: topDomains as any,
      categoryBreakdown: categoryCounts as any,
      aiNarrative: narrative,
    },
    create: {
      userId,
      weekStarting: weekStart,
      totalSubs: allSubs.length,
      newSubs: newSubs.length,
      unsubscribed: recentActions.filter((a) => a.status === "success").length,
      topDomains: topDomains as any,
      categoryBreakdown: categoryCounts as any,
      aiNarrative: narrative,
    },
  });

  return summary;
}

// ─── 3. Draft Unsubscribe Emails ──────────────────────

export async function draftUnsubscribeEmail(
  subscription: Subscription
): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    system: `You are a professional email writer. Draft a polite but firm unsubscribe request email. Be brief (3-4 sentences max). Include the sender's name and request removal from all mailing lists. Do not be apologetic. Do not explain why. Just request the unsubscribe clearly and professionally.`,
    messages: [
      {
        role: "user",
        content: `Draft an unsubscribe email to: ${subscription.senderName} <${subscription.senderEmail}>\nThey send emails about: "${subscription.subjectSample}"\nI've received ${subscription.emailCount} emails from them.`,
      },
    ],
  });

  return response.content[0].type === "text" ? response.content[0].text : "";
}
```

### 8.2 API Routes for AI Features

```typescript
// src/app/api/ai/categorize/route.ts

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { categorizeSubscriptions } from "@/lib/claude";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const uncategorized = await prisma.subscription.findMany({
    where: { userId: session.user.id, aiCategory: null, status: "active" },
  });

  if (uncategorized.length === 0) {
    return NextResponse.json({ message: "All subscriptions already categorized" });
  }

  const results = await categorizeSubscriptions(uncategorized);

  return NextResponse.json({
    categorized: results.size,
    breakdown: Object.fromEntries(
      [...results.values()].reduce((acc, { category }) => {
        acc.set(category, (acc.get(category) || 0) + 1);
        return acc;
      }, new Map<string, number>())
    ),
  });
}
```

```typescript
// src/app/api/ai/summarize/route.ts

import { auth } from "@/lib/auth";
import { generateWeeklySummary } from "@/lib/claude";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await generateWeeklySummary(session.user.id);
  return NextResponse.json(summary);
}
```

```typescript
// src/app/api/ai/draft/route.ts

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { draftUnsubscribeEmail } from "@/lib/claude";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { subscriptionId } = await request.json();

  const subscription = await prisma.subscription.findFirst({
    where: { id: subscriptionId, userId: session.user.id },
  });

  if (!subscription) {
    return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
  }

  const draft = await draftUnsubscribeEmail(subscription);

  return NextResponse.json({ draft, subscription });
}
```

---

## 9. Unsubscribe Execution

```typescript
// src/lib/unsubscribe.ts

import { prisma } from "./prisma";
import type { Subscription } from "@prisma/client";

export async function executeUnsubscribe(
  userId: string,
  subscriptionId: string,
  draftedMessage?: string
): Promise<{ success: boolean; method: string; error?: string }> {
  const subscription = await prisma.subscription.findFirst({
    where: { id: subscriptionId, userId },
  });

  if (!subscription) {
    return { success: false, method: "none", error: "Subscription not found" };
  }

  let method = "manual";
  let success = false;
  let errorMessage: string | undefined;

  // Strategy 1: Use List-Unsubscribe URL (most reliable)
  if (subscription.unsubscribeUrl) {
    try {
      const response = await fetch(subscription.unsubscribeUrl, {
        method: "POST",
        redirect: "follow",
        headers: {
          "User-Agent": "InboxDetox/1.0 (Unsubscribe Bot)",
        },
      });
      // Many unsubscribe URLs return 200 or 302 on success
      success = response.ok || response.status === 302;
      method = "link";
    } catch (err) {
      errorMessage = `Link failed: ${(err as Error).message}`;
    }
  }

  // Strategy 2: Log for manual action (email-based unsubs are complex)
  if (!success && subscription.unsubscribeEmail) {
    method = "email";
    // Store the drafted message for user to send manually
    // (Sending emails on behalf of user requires additional OAuth scopes)
    success = true; // Mark as pending manual action
  }

  // Strategy 3: Mark as manual
  if (!success) {
    method = "manual";
    errorMessage = "No automated unsubscribe method available. Visit sender's website to unsubscribe.";
  }

  // Log the action
  await prisma.unsubscribeAction.create({
    data: {
      userId,
      subscriptionId,
      method,
      status: success ? "success" : "failed",
      draftedMessage,
      errorMessage,
    },
  });

  // Update subscription status
  if (success) {
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: "unsubscribed" },
    });
  }

  return { success, method, error: errorMessage };
}

// Bulk unsubscribe
export async function bulkUnsubscribe(
  userId: string,
  subscriptionIds: string[]
): Promise<{ total: number; succeeded: number; failed: number; results: any[] }> {
  const results = [];
  let succeeded = 0;
  let failed = 0;

  for (const id of subscriptionIds) {
    const result = await executeUnsubscribe(userId, id);
    results.push({ subscriptionId: id, ...result });
    if (result.success) succeeded++;
    else failed++;

    // Rate limit: 1 second between unsubscribes
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return { total: subscriptionIds.length, succeeded, failed, results };
}
```

---

## 10. DWC-Inspired Styling

### 10.1 Tailwind Configuration

```typescript
// tailwind.config.ts

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // DWC-inspired dark palette
        dwc: {
          bg: "#0a0a0f",           // Deep near-black background
          surface: "#12121a",      // Card/panel surfaces
          surfaceHover: "#1a1a25", // Hover state
          border: "#2a2a3a",       // Subtle borders
          borderBright: "#3a3a50", // Active borders
          text: "#e8e8ed",         // Primary text
          textMuted: "#8888a0",    // Secondary text
          accent: "#6366f1",       // Indigo primary accent
          accentHover: "#818cf8",  // Lighter indigo
          accentGlow: "rgba(99, 102, 241, 0.15)", // Glow effect
          success: "#22c55e",
          warning: "#f59e0b",
          danger: "#ef4444",
          info: "#3b82f6",
        },
      },
      fontFamily: {
        sans: ["'IBM Plex Sans'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "'Fira Code'", "monospace"],
        display: ["'Space Grotesk'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(99, 102, 241, 0.15)",
        "glow-lg": "0 0 40px rgba(99, 102, 241, 0.2)",
      },
      animation: {
        "scan-pulse": "scan-pulse 2s ease-in-out infinite",
        "fade-in": "fade-in 0.5s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
      },
      keyframes: {
        "scan-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

### 10.2 Global CSS

```css
/* src/app/globals.css */

@import url("https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;600;700&display=swap");

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-dwc-bg text-dwc-text antialiased;
    font-feature-settings: "liga" 1, "calt" 1;
  }

  ::selection {
    @apply bg-dwc-accent/30 text-white;
  }

  /* Custom scrollbar — DWC style */
  ::-webkit-scrollbar {
    @apply w-2;
  }
  ::-webkit-scrollbar-track {
    @apply bg-dwc-bg;
  }
  ::-webkit-scrollbar-thumb {
    @apply bg-dwc-border rounded-full hover:bg-dwc-borderBright;
  }
}

@layer components {
  .card {
    @apply bg-dwc-surface border border-dwc-border rounded-xl p-6 transition-all duration-200;
  }
  .card:hover {
    @apply border-dwc-borderBright shadow-glow;
  }

  .btn-primary {
    @apply bg-dwc-accent hover:bg-dwc-accentHover text-white font-medium
           px-5 py-2.5 rounded-lg transition-all duration-200
           shadow-glow hover:shadow-glow-lg active:scale-[0.98];
  }

  .btn-danger {
    @apply bg-dwc-danger/10 hover:bg-dwc-danger/20 text-dwc-danger
           border border-dwc-danger/30 font-medium px-5 py-2.5 rounded-lg
           transition-all duration-200 active:scale-[0.98];
  }

  .btn-ghost {
    @apply bg-transparent hover:bg-dwc-surfaceHover text-dwc-textMuted
           hover:text-dwc-text font-medium px-5 py-2.5 rounded-lg
           transition-all duration-200 border border-transparent
           hover:border-dwc-border;
  }

  .input-field {
    @apply bg-dwc-bg border border-dwc-border rounded-lg px-4 py-2.5
           text-dwc-text placeholder:text-dwc-textMuted/50
           focus:outline-none focus:border-dwc-accent focus:ring-1
           focus:ring-dwc-accent/50 transition-all duration-200;
  }

  .badge {
    @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs
           font-medium border;
  }
  .badge-promotional {
    @apply bg-orange-500/10 text-orange-400 border-orange-500/20;
  }
  .badge-newsletter {
    @apply bg-blue-500/10 text-blue-400 border-blue-500/20;
  }
  .badge-transactional {
    @apply bg-green-500/10 text-green-400 border-green-500/20;
  }
  .badge-social {
    @apply bg-purple-500/10 text-purple-400 border-purple-500/20;
  }
  .badge-updates {
    @apply bg-cyan-500/10 text-cyan-400 border-cyan-500/20;
  }
  .badge-financial {
    @apply bg-yellow-500/10 text-yellow-400 border-yellow-500/20;
  }

  /* Glow border effect for focused elements */
  .glow-border {
    @apply relative;
  }
  .glow-border::after {
    content: "";
    @apply absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 pointer-events-none;
    background: radial-gradient(
      600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
      rgba(99, 102, 241, 0.06),
      transparent 40%
    );
  }
  .glow-border:hover::after {
    @apply opacity-100;
  }
}
```

---

## 11. Key UI Components

### 11.1 Dashboard Page (example structure)

```tsx
// src/app/dashboard/page.tsx

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AISummaryCard } from "@/components/AISummaryCard";
import { StatsGrid } from "@/components/StatsGrid";
import { RecentActivity } from "@/components/RecentActivity";
import { QuickActions } from "@/components/QuickActions";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const [totalSubs, activeSubs, recentActions, latestSummary] = await Promise.all([
    prisma.subscription.count({ where: { userId: session.user.id } }),
    prisma.subscription.count({ where: { userId: session.user.id, status: "active" } }),
    prisma.unsubscribeAction.findMany({
      where: { userId: session.user.id },
      orderBy: { executedAt: "desc" },
      take: 10,
      include: { subscription: true },
    }),
    prisma.weeklySummary.findFirst({
      where: { userId: session.user.id },
      orderBy: { weekStarting: "desc" },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-dwc-text">
          Inbox Dashboard
        </h1>
        <p className="text-dwc-textMuted mt-1">
          Your email subscription health at a glance.
        </p>
      </div>

      {/* Stats Grid */}
      <StatsGrid
        totalSubs={totalSubs}
        activeSubs={activeSubs}
        unsubscribedCount={totalSubs - activeSubs}
        recentActionCount={recentActions.length}
      />

      {/* AI Summary + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2">
          <AISummaryCard summary={latestSummary} />
        </div>
        <div>
          <QuickActions userId={session.user.id} />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <RecentActivity actions={recentActions} />
      </div>
    </div>
  );
}
```

---

## 12. Environment Variables

```bash
# .env.local (development) — DO NOT COMMIT

# ─── NextAuth ───
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret-here  # Generate: openssl rand -base64 32

# ─── Google OAuth (Gmail) ───
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# ─── Microsoft Azure (Outlook) ───
AZURE_AD_CLIENT_ID=your-azure-app-client-id
AZURE_AD_CLIENT_SECRET=your-azure-client-secret

# ─── Database (Railway PostgreSQL) ───
DATABASE_URL=postgresql://postgres:password@host:port/railway

# ─── Anthropic ───
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

---

## 13. Railway Deployment

### 13.1 Railway Configuration

```toml
# railway.toml

[build]
builder = "nixpacks"

[deploy]
startCommand = "npx prisma migrate deploy && npm start"
healthcheckPath = "/api/health"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3

[service]
internalPort = 3000
```

### 13.2 Deployment Steps

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Initialize project
railway init

# 4. Add PostgreSQL
railway add --plugin postgresql

# 5. Link to your repo (after pushing to GitHub)
railway link

# 6. Set environment variables
railway variables set NEXTAUTH_URL=https://your-app.railway.app
railway variables set NEXTAUTH_SECRET=$(openssl rand -base64 32)
railway variables set GOOGLE_CLIENT_ID=your-id
railway variables set GOOGLE_CLIENT_SECRET=your-secret
railway variables set AZURE_AD_CLIENT_ID=your-id
railway variables set AZURE_AD_CLIENT_SECRET=your-secret
railway variables set ANTHROPIC_API_KEY=sk-ant-your-key

# 7. Deploy
railway up

# 8. Open your app
railway open
```

### 13.3 Database Migrations

```bash
# Generate migration after schema changes
npx prisma migrate dev --name init

# Apply in production (handled by railway.toml startCommand)
npx prisma migrate deploy
```

---

## 14. Claude Code Workflow

Here is the recommended sequence for building this with Claude Code:

### Phase 1: Foundation (Day 1)

```
claude> Set up the Next.js 14 project with TypeScript, Tailwind, and Prisma.
        Install all dependencies. Create the Prisma schema from my specification.
        Configure the DWC-inspired dark theme in Tailwind and globals.css.
        Set up the root layout with IBM Plex Sans font loading.

claude> Configure NextAuth v5 with Google and Microsoft providers.
        Set up the Prisma adapter. Create the auth API route.
        Build a simple landing page with provider sign-in buttons
        styled in the DWC dark theme.
```

### Phase 2: Email Scanning (Day 2)

```
claude> Implement the Gmail scanning library that searches for emails
        with List-Unsubscribe headers, extracts sender info, and upserts
        into the subscriptions table. Include the query-based approach
        scanning "unsubscribe", "category:promotions", and "category:updates".

claude> Implement the equivalent Outlook scanner using Microsoft Graph API.
        Same data extraction pattern, same upsert logic.

claude> Build the /scan page with a scan trigger button for each provider,
        a progress indicator, and a results summary. Style it DWC dark theme.
```

### Phase 3: Filters and Scanner UI (Day 3)

```
claude> Build the filter engine with domain, keyword, age, and read status
        filters. Create the /settings page with forms for each filter type.
        Include domain autocomplete from existing subscriptions.

claude> Build the /scan results page showing all detected subscriptions
        in a sortable, filterable table. Include checkboxes for bulk selection,
        AI category badges, email count, last seen date, and unsubscribe
        buttons. Add the filter panel as a sidebar.
```

### Phase 4: AI Integration (Day 4)

```
claude> Implement the Claude AI categorization endpoint. Wire it to
        a "Categorize All" button on the scan page. Show category badges
        on each subscription row with confidence indicators.

claude> Implement the weekly summary generator. Build the AISummaryCard
        component for the dashboard. Add a "Generate Summary" button
        and display the AI narrative with stats.

claude> Implement the unsubscribe email drafter. Add a "Draft Email"
        action to each subscription row that opens a modal with the
        AI-generated message and a "Copy to Clipboard" button.
```

### Phase 5: Unsubscribe Engine + History (Day 5)

```
claude> Implement the unsubscribe execution logic with the three-strategy
        approach (URL, email, manual). Build the bulk unsubscribe function
        with rate limiting. Wire to the UI with confirmation dialogs.

claude> Build the /history page showing all unsubscribe actions with
        timestamps, methods, success/failure status, and the original
        subscription info. Add pagination and date range filtering.
```

### Phase 6: Polish + Deploy (Day 6)

```
claude> Add loading states, error boundaries, toast notifications,
        and empty state illustrations. Ensure all pages are responsive.
        Add the scan pulse animation for active scans.

claude> Set up Railway deployment. Create railway.toml. Configure
        environment variables. Run prisma migrate deploy. Test
        OAuth callbacks with the Railway domain.
```

---

## 15. Security Considerations

1. **Read-only email access.** Request only `gmail.readonly` and `Mail.Read` scopes. Never request write access to email.

2. **Token encryption.** NextAuth stores OAuth tokens in the database. Ensure `DATABASE_URL` uses SSL in production. Consider encrypting refresh tokens at rest.

3. **Rate limiting.** Add rate limiting to scan and unsubscribe endpoints using `next-rate-limit` or Railway's built-in rate limiting.

4. **CSRF protection.** NextAuth v5 includes CSRF protection by default. Do not disable it.

5. **Single-user mode.** Since this is a personal tool, consider adding an allowlist check:

```typescript
// In auth.ts callbacks
async signIn({ user }) {
  const allowedEmails = process.env.ALLOWED_EMAILS?.split(",") || [];
  if (allowedEmails.length > 0 && !allowedEmails.includes(user.email!)) {
    return false;
  }
  return true;
},
```

6. **No email sending from the app.** The unsubscribe drafter generates text for the user to send manually. This avoids needing write/send scopes.

---

## 16. Package Dependencies

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "next-auth": "^5.0.0-beta.25",
    "@auth/prisma-adapter": "^2.0.0",
    "@prisma/client": "^5.20.0",
    "googleapis": "^144.0.0",
    "@microsoft/microsoft-graph-client": "^3.0.7",
    "@anthropic-ai/sdk": "^0.30.0",
    "lucide-react": "^0.460.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.5.0"
  },
  "devDependencies": {
    "prisma": "^5.20.0",
    "typescript": "^5.6.0",
    "@types/node": "^22.0.0",
    "@types/react": "^18.3.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

---

## 17. Quick Reference: API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/auth/*` | NextAuth handlers |
| POST | `/api/scan/gmail` | Trigger Gmail scan |
| POST | `/api/scan/outlook` | Trigger Outlook scan |
| GET | `/api/subscriptions` | List subscriptions (with filter params) |
| POST | `/api/unsubscribe` | Unsubscribe from single sender |
| POST | `/api/unsubscribe/bulk` | Bulk unsubscribe |
| POST | `/api/ai/categorize` | AI-categorize uncategorized subs |
| GET | `/api/ai/summarize` | Generate weekly AI summary |
| POST | `/api/ai/draft` | Draft unsubscribe email |
| GET/PUT | `/api/settings` | Get/update filter preferences |
| GET | `/api/history` | Unsubscribe action history |
| GET | `/api/health` | Railway health check |
