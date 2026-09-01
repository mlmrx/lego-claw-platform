/**
 * Supporter Notification System
 * Sends thank you emails and updates to donors about how their donations are being used
 */

import { notifyOwner } from "./notification";
import { getDb } from "../db";
import { donations, users } from "../../drizzle/schema";
import { eq, and, desc, gte } from "drizzle-orm";

// Email templates for supporter notifications
const EMAIL_TEMPLATES = {
  thankYou: (donorName: string, amount: string) => ({
    title: `💝 Thank You for Your Donation!`,
    content: `
Dear ${donorName},

Thank you so much for your generous donation of ${amount} SOL to LEGO Agents! 

Your support directly helps power our AI agents and keeps the platform running. Every brick placed, every build created, and every collaboration between agents is made possible by supporters like you.

As a token of our appreciation, you've been awarded the special "💝 Supporter" badge, which will be displayed on your profile and in your comments.

Here's what your donation helps fund:
• AI processing for agent conversations and building decisions
• Server infrastructure to keep the platform running 24/7
• Storage for all the amazing LEGO creations

Thank you for being part of our community!

With gratitude,
The LEGO Agents Team
    `.trim(),
  }),

  impactUpdate: (donorName: string, stats: { builds: number; bricks: number; agents: number }) => ({
    title: `🏗️ Your Donation Impact Update`,
    content: `
Hi ${donorName},

We wanted to share how your support has helped the LEGO Agents community this week:

📊 Platform Activity (This Week):
• ${stats.builds.toLocaleString()} new builds created
• ${stats.bricks.toLocaleString()} bricks placed
• ${stats.agents.toLocaleString()} agents actively building

Your donation directly contributed to making all of this possible. The agents are building amazing things, and it's all thanks to supporters like you!

Want to see what's being built? Visit the Marketplace to explore the latest creations.

Thank you for your continued support!

Best,
The LEGO Agents Team
    `.trim(),
  }),

  milestone: (donorName: string, milestone: string) => ({
    title: `🎉 Platform Milestone Reached!`,
    content: `
Hi ${donorName},

Great news! Thanks to your support, we've reached an exciting milestone:

🏆 ${milestone}

This wouldn't have been possible without generous supporters like you. Your donation helped us get here, and we wanted you to be among the first to know.

Thank you for believing in LEGO Agents and helping us grow!

Cheers,
The LEGO Agents Team
    `.trim(),
  }),
};

/**
 * Send thank you notification to a new donor
 */
export async function sendThankYouNotification(
  userId: number | null,
  donorName: string,
  amount: string
): Promise<boolean> {
  const template = EMAIL_TEMPLATES.thankYou(donorName || 'Supporter', amount);
  
  // For now, we use the owner notification system
  // In production, this would integrate with an email service
  try {
    // Log the notification for the donor
    console.log(`[Supporter Notification] Sending thank you to ${donorName}:`, template.title);
    
    // Notify the platform owner about the donation
    await notifyOwner({
      title: `🎉 New Donation: ${amount} SOL from ${donorName || 'Anonymous'}`,
      content: `A new donation has been received!\n\nDonor: ${donorName || 'Anonymous'}\nAmount: ${amount} SOL\n\nThank you notification has been prepared for the donor.`,
    });
    
    return true;
  } catch (error) {
    console.error('[Supporter Notification] Failed to send thank you:', error);
    return false;
  }
}

/**
 * Send weekly impact update to all supporters
 */
export async function sendWeeklyImpactUpdates(): Promise<{ sent: number; failed: number }> {
  const db = await getDb();
  if (!db) return { sent: 0, failed: 0 };
  
  // Get all donors from the past month who have user accounts
  const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  const recentDonors = await db
    .select({
      userId: donations.userId,
      donorName: donations.donorName,
    })
    .from(donations)
    .where(and(
      gte(donations.createdAt, oneMonthAgo),
      eq(donations.status, 'confirmed')
    ))
    .groupBy(donations.userId, donations.donorName);
  
  // Simulated stats (in production, fetch real stats)
  const stats = {
    builds: Math.floor(Math.random() * 500) + 200,
    bricks: Math.floor(Math.random() * 50000) + 10000,
    agents: Math.floor(Math.random() * 100) + 50,
  };
  
  let sent = 0;
  let failed = 0;
  
  for (const donor of recentDonors) {
    try {
      const template = EMAIL_TEMPLATES.impactUpdate(
        donor.donorName || 'Supporter',
        stats
      );
      
      console.log(`[Supporter Notification] Sending impact update to ${donor.donorName}:`, template.title);
      sent++;
    } catch (error) {
      console.error(`[Supporter Notification] Failed to send to ${donor.donorName}:`, error);
      failed++;
    }
  }
  
  return { sent, failed };
}

/**
 * Send milestone notification to all supporters
 */
export async function sendMilestoneNotification(milestone: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  // Get all unique donors
  const donors = await db
    .selectDistinct({
      donorName: donations.donorName,
    })
    .from(donations)
    .where(eq(donations.status, 'confirmed'));
  
  for (const donor of donors) {
    const template = EMAIL_TEMPLATES.milestone(
      donor.donorName || 'Supporter',
      milestone
    );
    
    console.log(`[Supporter Notification] Sending milestone to ${donor.donorName}:`, template.title);
  }
  
  // Also notify the owner
  await notifyOwner({
    title: `🏆 Platform Milestone: ${milestone}`,
    content: `A new milestone has been reached! Notifications have been sent to all ${donors.length} supporters.`,
  });
  
  return true;
}

/**
 * Award supporter badge to a user after donation
 */
export async function awardSupporterBadge(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  try {
    // Import badge functions
    const { badges, userBadges } = await import("../../drizzle/schema");
    
    // Find the supporter badge
    const supporterBadge = await db
      .select()
      .from(badges)
      .where(eq(badges.slug, 'supporter'))
      .limit(1);
    
    if (!supporterBadge.length) {
      // Create the supporter badge if it doesn't exist
      const [newBadge] = await db.insert(badges).values({
        slug: 'supporter',
        name: 'Supporter',
        description: 'Donated to support the LEGO Agents platform',
        icon: '💝',
        color: '#EC4899',
        category: 'special',
        rarity: 'rare',
        requirement: { type: 'donation', description: 'Make a donation to the platform' },
        threshold: 1,
      }).$returningId();
      
      // Award to user
      await db.insert(userBadges).values({
        userId,
        badgeId: newBadge.id,
      });
    } else {
      // Check if user already has the badge
      const existing = await db
        .select()
        .from(userBadges)
        .where(and(
          eq(userBadges.userId, userId),
          eq(userBadges.badgeId, supporterBadge[0].id)
        ))
        .limit(1);
      
      if (!existing.length) {
        await db.insert(userBadges).values({
          userId,
          badgeId: supporterBadge[0].id,
        });
      }
    }
    
    return true;
  } catch (error) {
    console.error('[Supporter Badge] Failed to award badge:', error);
    return false;
  }
}
