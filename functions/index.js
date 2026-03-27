// functions/index.js
// Firebase Cloud Functions — Dipak Photo
// Triggers on new Firestore docs in 'inquiries' and 'reviews'
// Sends email via Resend API

const functions = require("firebase-functions");
const { Resend } = require("resend");

// ─── Init Resend ───────────────────────────────────────────────────
// Store your key with:  firebase functions:config:set resend.key="re_xxxxxxxx"
const resend = new Resend(functions.config().resend.key);

// ── Change these two before deploying ─────────────────────────────
const OWNER_EMAIL = "darshankamble514@gmail.com";   // owner's real email
const FROM_EMAIL  = "darshankamble514@gmail.com";  // verified domain in Resend dashboard

// ══════════════════════════════════════════════════════════════════
//  TRIGGER 1 — New Contact / Booking Enquiry
// ══════════════════════════════════════════════════════════════════
exports.onNewInquiry = functions.firestore
    .document("inquiries/{docId}")
    .onCreate(async (snap) => {
        const { name, phone, service, message, createdAt } = snap.data();

        const dateStr = createdAt
            ? new Date(createdAt.toDate()).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
            : new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

        try {
            await resend.emails.send({
                from: `Dipak Photo <${FROM_EMAIL}>`,
                to: [OWNER_EMAIL],
                subject: `📸 New Booking Enquiry from ${name}`,
                html: `
                    <div style="font-family:Georgia,serif;background:#0d0d0d;color:#e5e5e5;padding:40px;max-width:600px;margin:0 auto;border-radius:4px;">
                        <div style="border-bottom:1px solid #333;padding-bottom:20px;margin-bottom:28px;">
                            <h1 style="color:#c9a84c;font-size:26px;margin:0 0 4px;">Dipak Photo</h1>
                            <p style="color:#666;font-size:11px;margin:0;letter-spacing:2px;text-transform:uppercase;">New Session Booking Request</p>
                        </div>
                        <table style="width:100%;border-collapse:collapse;">
                            <tr>
                                <td style="padding:12px 0;color:#888;width:130px;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;vertical-align:top;">Name</td>
                                <td style="padding:12px 0;color:#fff;font-size:15px;">${name}</td>
                            </tr>
                            <tr style="border-top:1px solid #1f1f1f;">
                                <td style="padding:12px 0;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;">Phone</td>
                                <td style="padding:12px 0;font-size:15px;">
                                    <a href="tel:${phone}" style="color:#00e5ff;text-decoration:none;">${phone}</a>
                                </td>
                            </tr>
                            <tr style="border-top:1px solid #1f1f1f;">
                                <td style="padding:12px 0;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;">Service</td>
                                <td style="padding:12px 0;color:#c9a84c;font-size:15px;font-weight:bold;">${service || "Not specified"}</td>
                            </tr>
                            <tr style="border-top:1px solid #1f1f1f;">
                                <td style="padding:12px 0;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;vertical-align:top;">Message</td>
                                <td style="padding:12px 0;color:#ccc;font-size:14px;line-height:1.7;">${message}</td>
                            </tr>
                        </table>
                        <div style="margin-top:32px;padding:14px 18px;background:#1a1a1a;border-left:3px solid #c9a84c;border-radius:2px;">
                            <p style="color:#666;font-size:11px;margin:0;">Received on ${dateStr} IST via Dipak Photo Website</p>
                        </div>
                    </div>
                `,
            });
            console.log(`Inquiry email sent for: ${name}`);
        } catch (err) {
            console.error("Resend error (inquiry):", err);
        }
    });


// ══════════════════════════════════════════════════════════════════
//  TRIGGER 2 — New Review Submitted
// ══════════════════════════════════════════════════════════════════
exports.onNewReview = functions.firestore
    .document("reviews/{docId}")
    .onCreate(async (snap) => {
        const { name, text, rating, createdAt } = snap.data();

        const dateStr = createdAt
            ? new Date(createdAt.toDate()).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
            : new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

        const filledStars = "⭐".repeat(rating || 5);
        const emptyStars  = "☆".repeat(5 - (rating || 5));

        try {
            await resend.emails.send({
                from: `Dipak Photo <${FROM_EMAIL}>`,
                to: [OWNER_EMAIL],
                subject: `${filledStars} New ${rating}-Star Review from ${name}`,
                html: `
                    <div style="font-family:Georgia,serif;background:#0d0d0d;color:#e5e5e5;padding:40px;max-width:600px;margin:0 auto;border-radius:4px;">
                        <div style="border-bottom:1px solid #333;padding-bottom:20px;margin-bottom:28px;">
                            <h1 style="color:#c9a84c;font-size:26px;margin:0 0 4px;">Dipak Photo</h1>
                            <p style="color:#666;font-size:11px;margin:0;letter-spacing:2px;text-transform:uppercase;">New Client Review</p>
                        </div>
                        <p style="font-size:28px;margin:0 0 20px;letter-spacing:3px;">${filledStars}${emptyStars}</p>
                        <blockquote style="border-left:3px solid #c9a84c;padding:12px 20px;color:#ccc;font-style:italic;font-size:16px;line-height:1.8;margin:0 0 20px;background:#111;">
                            "${text}"
                        </blockquote>
                        <p style="color:#fff;font-weight:bold;font-size:15px;margin:0 0 32px;">— ${name}</p>
                        <div style="padding:14px 18px;background:#1a1a1a;border-left:3px solid #c9a84c;border-radius:2px;">
                            <p style="color:#666;font-size:11px;margin:0 0 4px;">Submitted on ${dateStr} IST</p>
                            <p style="color:#666;font-size:11px;margin:0;">
                                Approve in Firebase Console → <span style="color:#c9a84c;">reviews</span> collection → set
                                <code style="background:#222;padding:2px 6px;border-radius:2px;">approved: true</code>
                            </p>
                        </div>
                    </div>
                `,
            });
            console.log(`Review email sent for: ${name}`);
        } catch (err) {
            console.error("Resend error (review):", err);
        }
    });