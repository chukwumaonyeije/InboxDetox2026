import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMicrosoftAccessToken } from "@/lib/provider-tokens";
import { Client } from "@microsoft/microsoft-graph-client";

export async function POST() {
  let scanId: string | null = null;
  let fetched = 0;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const accessToken = await getMicrosoftAccessToken(userId);

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
    scanId = scan.id;

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

    const maxResults = 500;
    let url =
      `/me/messages?$filter=contains(body/content,'unsubscribe')` +
      `&$select=from,subject,receivedDateTime,isRead,internetMessageHeaders` +
      `&$top=100&$orderby=receivedDateTime desc`;

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

        let unsubUrl: string | null = null;
        let unsubEmail: string | null = null;
        const headers = msg.internetMessageHeaders || [];
        const listUnsub = headers.find(
          (h: { name: string; value: string }) =>
            h.name?.toLowerCase() === "list-unsubscribe"
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

      const nextLink = res["@odata.nextLink"] || null;
      if (nextLink) url = nextLink;
      else break;
    } while (fetched < maxResults);

    let subsFound = 0;
    for (const [, data] of senderMap) {
      const dates = data.dates.sort((a, b) => a.getTime() - b.getTime());

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

    return NextResponse.json({
      data: { scanId: scan.id, emailsScanned: fetched, subsFound },
    });
  } catch (err) {
    console.error("Outlook scan error:", err);
    if (scanId) {
      await prisma.emailScan.update({
        where: { id: scanId },
        data: {
          emailsScanned: fetched,
          status: "failed",
          completedAt: new Date(),
        },
      });
    }
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
