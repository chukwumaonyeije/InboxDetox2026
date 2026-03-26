import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGoogleAccessToken } from "@/lib/provider-tokens";
import { google } from "googleapis";

export async function POST() {
  let scanId: string | null = null;
  let emailsScanned = 0;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const accessToken = await getGoogleAccessToken(userId);

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({
      access_token: accessToken,
    });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

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
      const maxResults = 500;

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

    const scan = await prisma.emailScan.create({
      data: {
        userId,
        provider: "gmail",
        emailsScanned: 0,
        subsFound: 0,
        status: "running",
      },
    });
    scanId = scan.id;
    emailsScanned = allMessageIds.size;

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
          metadataHeaders: ["From", "Subject", "Date", "List-Unsubscribe"],
        });

        const headers = msg.data.payload?.headers || [];
        const getHeader = (name: string) =>
          headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value;

        const from = getHeader("From") || "";
        const subject = getHeader("Subject") || "";
        const date = getHeader("Date");
        const listUnsub = getHeader("List-Unsubscribe");
        const isRead = !msg.data.labelIds?.includes("UNREAD");

        const emailMatch = from.match(/<(.+?)>/) || from.match(/([^\s]+@[^\s]+)/);
        const senderEmail = emailMatch?.[1]?.toLowerCase() || from.toLowerCase();
        const senderName =
          from.replace(/<.*>/, "").trim().replace(/"/g, "") || senderEmail;
        const senderDomain = senderEmail.split("@")[1] || "unknown";

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
          existing.isRead = isRead;
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

    await prisma.emailScan.update({
      where: { id: scan.id },
      data: {
        emailsScanned,
        subsFound,
        status: "completed",
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      data: { scanId: scan.id, emailsScanned, subsFound },
    });
  } catch (err) {
    console.error("Gmail scan error:", err);
    if (scanId) {
      await prisma.emailScan.update({
        where: { id: scanId },
        data: {
          emailsScanned,
          status: "failed",
          completedAt: new Date(),
        },
      });
    }
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
