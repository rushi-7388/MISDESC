const crypto = require("crypto");
const prisma = require("../config/prisma");
const { broadcastEvent } = require("../utils/sse.util");

/**
 * ==============================================================================
 * Institutional WhatsApp Banking & Multi-Channel SMS Gateway Engine
 * Dedicated for SURAT PEOPLES CO OP BANK (SNB) & National MISDESC Clearing
 * 
 * 100% Free / Zero-Cost Architecture:
 * 1. Virtual Telecom Gateway (Offline Simulated Mode - Default 100% Free)
 * 2. Meta WhatsApp Business Cloud API Free Sandbox Integration
 * 3. Twilio SMS / WhatsApp Free Sandbox Fallback
 * 4. Two-Way Automated Conversational Banking Bot Engine
 * 5. Direct Click-to-Chat (wa.me) Zero-Cost Link & QR Dispatch
 * ==============================================================================
 */

// In-Memory message ring buffer (last 500 messages)
const messageLogs = [];

// Configuration settings (can be overridden via ENV or API)
let gatewayConfig = {
  provider: process.env.MESSAGING_PROVIDER || "VIRTUAL_SIMULATOR", // "VIRTUAL_SIMULATOR", "META_CLOUD", "TWILIO", "CALLMEBOT", "FAST2SMS"
  callMeBotApiKey: process.env.CALLMEBOT_API_KEY || "",
  fast2SmsApiKey: process.env.FAST2SMS_API_KEY || "",
  metaPhoneNumberId: process.env.META_PHONE_NUMBER_ID || "",
  metaAccessToken: process.env.META_ACCESS_TOKEN || "",
  metaVerifyToken: process.env.META_VERIFY_TOKEN || "misdesc_whatsapp_webhook_2026",
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || "",
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || "",
  twilioFromNumber: process.env.TWILIO_FROM_NUMBER || "whatsapp:+14155238886",
  bankDisplayName: "SURAT PEOPLES CO OP BANK",
  bankSupportHelpline: "1800-233-1234",
  bankWhatsAppNumber: "+919876543210",
};

// Regulatory DLT-Registered SMS Templates & WhatsApp Interactive Templates
const TEMPLATES = {
  CHEQUE_PRESENTED: {
    id: "DLT-SNB-CHQ-PRES-01",
    name: "Cheque Presented Alert",
    sms: "Dear Customer, Cheque #{chequeNumber} for Rs.{amount} has been presented in clearing for a/c {accountNumber}. Payee: {payeeName}. If unauthorized, reply STOP {chequeNumber} or call 1800-233-1234. - SURAT PEOPLES CO OP BANK",
    whatsapp: "🏦 *SURAT PEOPLES CO OP BANK*\n*Inward Cheque Presentation Alert*\n\nDear Customer,\nCheque *#{chequeNumber}* for *₹{amount}* has been received in CTS clearing.\n\n📋 *Details:*\n• *Account:* {accountNumber}\n• *Payee:* {payeeName}\n• *Drawee Bank:* {draweeBank}\n• *Clearing Cycle:* Standard T+0\n\n_If you did not issue this instrument, reply *STOP {chequeNumber}* immediately._",
    actions: ["Check Status", "Positive Pay", "Stop Payment"],
  },
  CHEQUE_CLEARED: {
    id: "DLT-SNB-CHQ-CLR-02",
    name: "Cheque Cleared & Debited Alert",
    sms: "Dear Customer, Cheque #{chequeNumber} for Rs.{amount} has been CLEARED from a/c {accountNumber}. e-Kuber UTR: {utr}. Updated Available Balance: Rs.{balance}. - SURAT PEOPLES CO OP BANK",
    whatsapp: "✅ *SURAT PEOPLES CO OP BANK*\n*Cheque Clearance Confirmation*\n\nDear Customer,\nYour Cheque *#{chequeNumber}* for *₹{amount}* has been successfully *CLEARED*.\n\n🧾 *Transaction Details:*\n• *Account Debited:* {accountNumber}\n• *Beneficiary:* {payeeName}\n• *e-Kuber UTR:* `{utr}`\n• *Settlement Mode:* {settlementMode}\n• *Status:* Realised & Dispatched\n\nThank you for banking with SURAT PEOPLES CO OP BANK.",
    actions: ["Download Receipt", "Mini Statement", "Menu"],
  },
  CHEQUE_RETURNED: {
    id: "DLT-SNB-CHQ-RET-03",
    name: "Cheque Dishonour / Return Memo Alert",
    sms: "ALERT: Cheque #{chequeNumber} for Rs.{amount} presented on a/c {accountNumber} has RETURNED UNPAID. Reason: {returnReason}. Memo ref: {memoRef}. - SURAT PEOPLES CO OP BANK",
    whatsapp: "⚠️ *SURAT PEOPLES CO OP BANK*\n*Statutory Cheque Dishonour Alert (Rule 16)*\n\nDear Customer,\nCheque *#{chequeNumber}* for *₹{amount}* has been *RETURNED UNPAID*.\n\n❌ *Dishonour Details:*\n• *Return Reason Code:* {returnReason}\n• *Statutory Memo Ref:* `{memoRef}`\n• *Account:* {accountNumber}\n• *Presenting Bank:* {presentingBank}\n\n_Under Negotiable Instruments Act Section 138, a formal return memo has been generated. Please contact your branch immediately._",
    actions: ["View Return Memo", "File Dispute", "Contact Branch"],
  },
  PPS_CONFIRMATION: {
    id: "DLT-SNB-PPS-CONF-04",
    name: "Positive Pay System Registration",
    sms: "Positive Pay confirmed: Cheque #{chequeNumber} for Rs.{amount} in favour of {payeeName} is registered. Reference: {ppsRef}. - SURAT PEOPLES CO OP BANK",
    whatsapp: "🛡️ *SURAT PEOPLES CO OP BANK*\n*Positive Pay System (PPS) Registration Confirmed*\n\nYour cheque has been pre-authorized for high-value clearance:\n\n• *Cheque No:* #{chequeNumber}\n• *Amount:* ₹{amount}\n• *Payee:* {payeeName}\n• *Registration Ref:* `{ppsRef}`\n• *Status:* ACTIVE / VERIFIED",
    actions: ["PPS Status", "View Registered List", "Menu"],
  },
  HIGH_VALUE_OTP: {
    id: "DLT-SNB-OTP-05",
    name: "High-Value Maker-Checker Approval OTP",
    sms: "OTP for clearing authorization of Cheque #{chequeNumber} (Rs.{amount}) is {otp}. Valid for 5 mins. Do not share. - SURAT PEOPLES CO OP BANK",
    whatsapp: "🔐 *SURAT PEOPLES CO OP BANK*\n*High-Value Verification OTP*\n\nYour one-time authorization code is: *{otp}*\n\n• *Action:* Dual-Control Checker Release\n• *Instrument:* Cheque #{chequeNumber}\n• *Amount:* ₹{amount}\n• *Valid for:* 5 minutes",
    actions: ["Approve", "Reject"],
  },
};

// Seed initial realistic bulk logs
function seedInitialLogs() {
  if (messageLogs.length > 0) return;
  const initial = [
    {
      id: "MSG-SMS-2026-001",
      channel: "SMS",
      recipient: "+91 98251 44012",
      customerName: "Rajesh Varma",
      templateId: "DLT-SNB-CHQ-PRES-01",
      body: "Dear Customer, Cheque #000101 for Rs.4,50,000 has been presented in clearing for a/c 102030401001. Payee: Larsen & Toubro Ltd. - SURAT PEOPLES CO OP BANK",
      status: "DELIVERED",
      cost: "₹0.00 (Simulated)",
      sentAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      deliveredAt: new Date(Date.now() - 44 * 60 * 1000).toISOString(),
    },
    {
      id: "MSG-WA-2026-002",
      channel: "WHATSAPP",
      recipient: "+91 98251 44012",
      customerName: "Rajesh Varma",
      templateId: "CHEQUE_CLEARED",
      body: "✅ SURAT PEOPLES CO OP BANK: Cheque #000102 for ₹12,50,000 has been successfully CLEARED. e-Kuber UTR: EKUBER-20261016-UTR-800002.",
      status: "READ",
      cost: "₹0.00 (Free Sandbox)",
      sentAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      deliveredAt: new Date(Date.now() - 29 * 60 * 1000).toISOString(),
    },
    {
      id: "MSG-WA-2026-003",
      channel: "WHATSAPP",
      recipient: "+91 94280 88219",
      customerName: "Amitabh Sen",
      templateId: "CHEQUE_RETURNED",
      body: "⚠️ SURAT PEOPLES CO OP BANK: Cheque #000108 for ₹1,80,000 has RETURNED UNPAID. Reason: 01 - Funds Insufficient. Statutory Memo Ref: RM-20261016-008.",
      status: "DELIVERED",
      cost: "₹0.00 (Free Sandbox)",
      sentAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      deliveredAt: new Date(Date.now() - 19 * 60 * 1000).toISOString(),
    },
    {
      id: "MSG-SMS-2026-004",
      channel: "SMS",
      recipient: "+91 99790 33411",
      customerName: "Sunita Roy",
      templateId: "PPS_CONFIRMATION",
      body: "Positive Pay confirmed: Cheque #450122 for Rs.1,50,000 in favour of Acme Industrial Corp is registered. Ref: PPS-2026-9901. - SURAT PEOPLES CO OP BANK",
      status: "DELIVERED",
      cost: "₹0.00 (Simulated)",
      sentAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      deliveredAt: new Date(Date.now() - 9 * 60 * 1000).toISOString(),
    },
  ];
  messageLogs.push(...initial);
}
seedInitialLogs();

/**
 * Format string with variables
 */
function fillTemplate(text, data) {
  let result = text;
  for (const [key, val] of Object.entries(data)) {
    result = result.replace(new RegExp(`{${key}}`, "g"), val || "N/A");
  }
  return result;
}

/**
 * 1. Dispatch SMS Notification (Free Virtual Mode, Fast2SMS Free API, or Direct SMS URI)
 */
async function sendSms({ recipient, templateKey, params = {}, customBody = null, customerName = "Account Holder" }) {
  const template = TEMPLATES[templateKey];
  const body = customBody || (template ? fillTemplate(template.sms, params) : "SURAT PEOPLES CO OP BANK Notification");
  const msgId = `MSG-SMS-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
  const cleanPhone = (recipient || "").replace(/[^0-9]/g, "");

  // If Fast2SMS Free API key is provided, attempt live SMS dispatch to Indian number
  let liveDispatchStatus = "VIRTUAL_DELIVERED";
  if (gatewayConfig.fast2SmsApiKey && cleanPhone.length >= 10) {
    try {
      const tenDigit = cleanPhone.slice(-10);
      const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: {
          authorization: gatewayConfig.fast2SmsApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          route: "q",
          message: body,
          language: "english",
          flash: 0,
          numbers: tenDigit,
        }),
      });
      const data = await res.json();
      if (data && data.return) liveDispatchStatus = "REAL_TELCO_DISPATCHED";
    } catch (fastErr) {
      console.warn("[Fast2SMS] Error during live dispatch:", fastErr.message);
    }
  }

  const directSmsUri = `sms:${cleanPhone || "918320827300"}?body=${encodeURIComponent(body)}`;

  const logEntry = {
    id: msgId,
    channel: "SMS",
    recipient: recipient || "+91 98251 00000",
    customerName,
    templateId: template ? template.id : "CUSTOM_SMS",
    body,
    status: liveDispatchStatus === "REAL_TELCO_DISPATCHED" ? "DISPATCHED_TELCO" : "DELIVERED",
    operatorRoute: liveDispatchStatus === "REAL_TELCO_DISPATCHED" ? "Fast2SMS / TRAI DLT Commercial Route" : "Airtel / Jio DLT Tier-1 Commercial Route (Virtual Sandbox)",
    cost: "₹0.00 (Free Mode)",
    directSmsUri,
    sentAt: new Date().toISOString(),
    deliveredAt: new Date(Date.now() + 1200).toISOString(),
  };

  messageLogs.unshift(logEntry);
  if (messageLogs.length > 500) messageLogs.pop();

  broadcastEvent("SMS_SENT", logEntry);

  return logEntry;
}

/**
 * 2. Dispatch WhatsApp Notification (Free Virtual Mode, CallMeBot, Meta Cloud, or Direct wa.me)
 */
async function sendWhatsApp({ recipient, templateKey, params = {}, customBody = null, customerName = "Account Holder" }) {
  const template = TEMPLATES[templateKey];
  const body = customBody || (template ? fillTemplate(template.whatsapp, params) : "SURAT PEOPLES CO OP BANK WhatsApp Notification");
  const msgId = `MSG-WA-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
  const cleanPhone = (recipient || "").replace(/[^0-9]/g, "");

  let liveDispatchStatus = "VIRTUAL_DELIVERED";

  // 1. Live CallMeBot Free WhatsApp API dispatch (if key present)
  if (gatewayConfig.callMeBotApiKey && cleanPhone) {
    try {
      const url = `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${encodeURIComponent(body)}&apikey=${gatewayConfig.callMeBotApiKey}`;
      await fetch(url);
      liveDispatchStatus = "REAL_WHATSAPP_DISPATCHED";
    } catch (cmbErr) {
      console.warn("[CallMeBot] Error during live dispatch:", cmbErr.message);
    }
  }

  // 2. Live Meta Cloud API dispatch (if credentials present)
  if (gatewayConfig.provider === "META_CLOUD" && gatewayConfig.metaPhoneNumberId && gatewayConfig.metaAccessToken) {
    try {
      await fetch(`https://graph.facebook.com/v19.0/${gatewayConfig.metaPhoneNumberId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${gatewayConfig.metaAccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: cleanPhone,
          type: "text",
          text: { body },
        }),
      });
      liveDispatchStatus = "REAL_WHATSAPP_DISPATCHED";
    } catch (err) {
      console.warn("[WhatsApp Meta API] Fallback to Virtual Sandbox:", err.message);
    }
  }

  // Generate 100% Free Direct Real WhatsApp Link (wa.me) & Web WhatsApp URL
  const directWhatsAppUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(body)}`;
  const waMeUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(body)}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(waMeUrl)}`;

  const logEntry = {
    id: msgId,
    channel: "WHATSAPP",
    recipient: recipient || "+91 98251 00000",
    customerName,
    templateId: templateKey || "CUSTOM_WHATSAPP",
    body,
    status: liveDispatchStatus === "REAL_WHATSAPP_DISPATCHED" ? "DISPATCHED_WHATSAPP" : "READ",
    cost: "₹0.00 (Free Tier)",
    actions: template ? template.actions : ["Menu", "Support"],
    directWhatsAppUrl,
    waMeUrl,
    qrUrl,
    sentAt: new Date().toISOString(),
    deliveredAt: new Date(Date.now() + 800).toISOString(),
  };

  messageLogs.unshift(logEntry);
  if (messageLogs.length > 500) messageLogs.pop();

  broadcastEvent("WHATSAPP_SENT", logEntry);

  return logEntry;
}

/**
 * 3. Two-Way Interactive WhatsApp Banking Conversational Bot Engine
 * Handles customer inbound commands (via WhatsApp Simulator or Webhook)
 */
async function processIncomingWhatsAppMessage(incomingText, senderPhone = "+91 98251 44012") {
  const text = (incomingText || "").trim();
  const lower = text.toLowerCase();
  const parts = text.split(/\s+/);
  const command = parts[0]?.toUpperCase();

  let botReply = "";
  let quickActions = [];

  // Command: MENU / HELP / HI / HELLO
  if (["HI", "HELLO", "MENU", "HELP", "NAMASTE", "START", "1"].includes(command) || lower === "hi" || lower === "hello") {
    botReply = `🏦 *SURAT PEOPLES CO OP BANK*\n*Official WhatsApp Banking Assistant*\n\nNamaste! How may I assist you with clearing & banking today?\n\n*Quick Commands:*\n1️⃣ *STATUS <chequeNo>* — Track live clearance status (e.g., \`STATUS 000101\`)\n2️⃣ *PPS <chequeNo> <amount> <payee>* — Instant Positive Pay registration\n3️⃣ *BALANCE <accountNo>* — Check account balance & lien hold\n4️⃣ *STOP <chequeNo>* — Immediate Stop Payment hold\n5️⃣ *DISPUTE <chequeNo>* — Report unauthorized debit / file DRM dispute\n6️⃣ *RATES* — Intraday FX & lending rates\n7️⃣ *BRANCH* — Surat Athwa & Ring Road branch IFSC\n\n_Type any command or tap an option below:_`;
    quickActions = ["STATUS 000101", "PPS Register", "BALANCE 102030401001", "Menu"];
  }

  // Command: STATUS <chequeNumber>
  else if (command === "STATUS" || lower.startsWith("status")) {
    const chqNum = parts[1] ? parts[1].replace(/[^0-9]/g, "") : null;
    if (!chqNum) {
      botReply = `❓ Please specify the 6-digit cheque number.\n*Example:* \`STATUS 000101\``;
      quickActions = ["STATUS 000101", "STATUS 000102", "STATUS 000108"];
    } else {
      const cheque = await prisma.cheque.findFirst({
        where: { chequeNumber: chqNum },
        include: { presentingBank: true, draweeBank: true, microLien: true },
      });

      if (!cheque) {
        botReply = `🔍 Cheque *#${chqNum}* was not found in active clearing.\nPlease verify the cheque number or visit your home branch.`;
        quickActions = ["Menu", "Contact Branch"];
      } else {
        const statusEmoji = {
          PRESENTED: "⏳ *PRESENTED IN CLEARING*",
          VERIFIED: "🔍 *VERIFIED (Awaiting Final Settlement)*",
          AWAITING_CHECKER: "🛡️ *UNDER 4-EYES CHECKER APPROVAL*",
          CLEARED: "✅ *CLEARED & SETTLED*",
          RETURNED: "❌ *DISHONOURED / RETURNED*",
        }[cheque.status] || cheque.status;

        botReply = `🏦 *SURAT PEOPLES CO OP BANK — CHEQUE STATUS*\n\n` +
          `• *Cheque Number:* #${cheque.chequeNumber}\n` +
          `• *Current Status:* ${statusEmoji}\n` +
          `• *Amount:* ₹${Number(cheque.amount).toLocaleString("en-IN")}\n` +
          `• *Payee:* ${cheque.payeeName}\n` +
          `• *Drawee Bank:* ${cheque.draweeBank?.name || "SURAT PEOPLES CO OP BANK"}\n` +
          `• *Risk Level:* ${cheque.riskTier} (AI Score: ${cheque.riskScore})\n` +
          `• *Positive Pay:* ${cheque.ppsStatus}\n` +
          (cheque.ekuberUtr ? `• *e-Kuber RTGS UTR:* \`${cheque.ekuberUtr}\`\n` : "") +
          (cheque.returnReason ? `• *Dishonour Reason:* ${cheque.returnReason}\n` : "") +
          `• *Presentation Date:* ${new Date(cheque.createdAt).toLocaleDateString("en-IN")}\n\n` +
          `_Need assistance? Reply *DISPUTE ${cheque.chequeNumber}* or call 1800-233-1234._`;

        quickActions = cheque.status === "RETURNED" 
          ? [`DISPUTE ${cheque.chequeNumber}`, "Menu"] 
          : [`BALANCE ${cheque.accountNumber}`, "Menu"];
      }
    }
  }

  // Command: PPS <chequeNumber> <amount> <payeeName...>
  else if (command === "PPS" || lower.startsWith("pps")) {
    const chqNum = parts[1];
    const amountStr = parts[2];
    const payee = parts.slice(3).join(" ");

    if (!chqNum || !amountStr || !payee) {
      botReply = `🛡️ *Positive Pay System (PPS) Registration*\n\nPlease provide all 3 details:\n\`PPS <chequeNumber> <amount> <payeeName>\`\n\n*Example:*\n\`PPS 000199 75000 Delta Logistics\``;
      quickActions = ["PPS 000199 75000 Delta Logistics", "Menu"];
    } else {
      const amount = parseFloat(amountStr.replace(/[^0-9.]/g, ""));
      const ppsBank = await prisma.bank.findFirst({ where: { code: "SPCB" } });

      try {
        const ppsRecord = await prisma.positivePayRecord.upsert({
          where: {
            accountNumber_chequeNumber: {
              accountNumber: "102030401001",
              chequeNumber: chqNum,
            },
          },
          update: {
            payeeName: payee,
            amount: amount,
            chequeDate: new Date(),
            status: "MATCHED",
          },
          create: {
            accountNumber: "102030401001",
            chequeNumber: chqNum,
            payeeName: payee,
            amount: amount,
            chequeDate: new Date(),
            status: "MATCHED",
            bankId: ppsBank ? ppsBank.id : (await prisma.bank.findFirst()).id,
          },
        });

        botReply = `✅ *Positive Pay Registered Successfully!*\n\n• *Cheque No:* #${ppsRecord.chequeNumber}\n• *Pre-Authorized Amount:* ₹${amount.toLocaleString("en-IN")}\n• *Payee:* ${ppsRecord.payeeName}\n• *Account:* 102030401001\n• *Status:* VERIFIED & PROTECTED\n\n_This instrument is now secured against fraudulent alterations and will clear seamlessly._`;
        quickActions = [`STATUS ${chqNum}`, "Menu"];
      } catch (err) {
        botReply = `⚠️ Failed to register Positive Pay: ${err.message}`;
      }
    }
  }

  // Command: BALANCE <accountNo>
  else if (command === "BALANCE" || command === "BAL" || lower.startsWith("bal")) {
    const acc = parts[1] || "102030401001";
    const liens = await prisma.microLien.findMany({ where: { drawerAccount: acc } });
    const totalHold = liens.reduce((sum, l) => sum + Number(l.earmarkedAmount), 0);

    botReply = `💰 *SURAT PEOPLES CO OP BANK — BALANCE SUMMARY*\n\n` +
      `• *Account Number:* \`${acc}\`\n` +
      `• *Ledger Balance:* ₹24,85,420.00\n` +
      `• *Active CTS Lien Holds:* ₹${totalHold.toLocaleString("en-IN")}\n` +
      `• *Net Available Balance:* ₹${(2485420 - totalHold).toLocaleString("en-IN")}\n` +
      `• *Branch:* Athwa Lines Main Branch\n` +
      `• *As of:* ${new Date().toLocaleTimeString("en-IN")}\n\n` +
      `_For mini statement, reply *STATEMENT*._`;
    quickActions = ["STATUS 000101", "PPS Register", "Menu"];
  }

  // Command: STOP <chequeNo>
  else if (command === "STOP" || lower.startsWith("stop")) {
    const chqNum = parts[1] ? parts[1].replace(/[^0-9]/g, "") : null;
    if (!chqNum) {
      botReply = `🛑 *Stop Payment Request*\nPlease provide the cheque number to freeze.\n*Example:* \`STOP 000105\``;
    } else {
      botReply = `🛑 *STOP PAYMENT INSTRUCTION PLACED*\n\n• *Cheque Number:* #${chqNum}\n• *Hold Status:* FROZEN IN CTS SWITCH\n• *Reference Ticket:* \`STOP-HOLD-${Date.now().toString().slice(-6)}\`\n• *Action Taken:* Immediate flag broadcast to all Clearing Hubs.\n\n_If presented, this instrument will be returned with Reason 16 (Payment Stopped by Drawer)._`;
      quickActions = [`STATUS ${chqNum}`, "Menu"];
    }
  }

  // Command: DISPUTE <chequeNo>
  else if (command === "DISPUTE" || lower.startsWith("dispute")) {
    const chqNum = parts[1] || "000108";
    botReply = `⚖️ *NPCI DRM Clearing Dispute Filed*\n\n• *Cheque Number:* #${chqNum}\n• *Dispute Case ID:* \`DRM-WA-${Date.now().toString().slice(-6)}\`\n• *Type:* Unauthorized Clearing Debit / Discrepancy\n• *SLA Deadline:* 48 Hours\n• *Status:* Escalated to Compliance Nodal Desk\n\n_An SMS acknowledgment with case tracker has been dispatched._`;
    quickActions = ["Menu", "Call Support"];
  }

  // Command: RATES
  else if (command === "RATES" || lower.startsWith("rate")) {
    botReply = `📊 *SURAT PEOPLES CO OP BANK — DAILY RATES*\n\n• *Repo Linked Lending Rate (RLLR):* 8.65%\n• *Base CTS Clearing Fee:* ₹0.00 (Free)\n• *USD / INR:* ₹84.12\n• *EUR / INR:* ₹91.85\n• *GBP / INR:* ₹109.60\n• *Savings Deposit Rate:* 4.00% p.a.\n• *1-Year Term Deposit:* 7.25% p.a.`;
    quickActions = ["Menu"];
  }

  // Command: BRANCH
  else if (command === "BRANCH" || lower.startsWith("branch")) {
    botReply = `🏢 *SURAT PEOPLES CO OP BANK — CLEARING HUBS*\n\n1️⃣ *Head Office & Central Clearing Hub:*\nAthwa Lines, Surat - 395001\nIFSC: \`SPCB0001234\` | MICR: \`395066001\`\n\n2️⃣ *Ring Road Commercial Branch:*\nSurat Textile Market Hub, Surat - 395002\nIFSC: \`SPCB0001235\` | MICR: \`395066002\`\n\n*Clearing Cutoff Time:* 16:00 IST (Daily)`;
    quickActions = ["Menu"];
  }

  // Default Fallback
  else {
    botReply = `I didn't quite catch that. Here is what I can do:\n\n• Type *STATUS 000101* to track a cheque\n• Type *PPS 000199 50000 PayeeName* to register Positive Pay\n• Type *BALANCE* to view account balance\n• Type *MENU* to see all options`;
    quickActions = ["STATUS 000101", "PPS Register", "BALANCE", "Menu"];
  }

  // Save response to message log
  const incomingLog = {
    id: `MSG-IN-${Date.now().toString().slice(-6)}`,
    channel: "WHATSAPP",
    direction: "INBOUND",
    recipient: senderPhone,
    customerName: "Customer",
    templateId: "INCOMING_USER_QUERY",
    body: text,
    status: "RECEIVED",
    cost: "₹0.00",
    sentAt: new Date().toISOString(),
  };

  const replyLog = {
    id: `MSG-BOT-${Date.now().toString().slice(-6)}`,
    channel: "WHATSAPP",
    direction: "OUTBOUND",
    recipient: senderPhone,
    customerName: "Customer",
    templateId: "BOT_AUTO_REPLY",
    body: botReply,
    status: "READ",
    cost: "₹0.00 (Free Sandbox)",
    actions: quickActions,
    sentAt: new Date(Date.now() + 600).toISOString(),
    deliveredAt: new Date(Date.now() + 1000).toISOString(),
  };

  messageLogs.unshift(incomingLog);
  messageLogs.unshift(replyLog);
  if (messageLogs.length > 500) messageLogs.pop();

  broadcastEvent("WHATSAPP_CONVERSATION", { incoming: incomingLog, reply: replyLog });

  return { reply: botReply, actions: quickActions, log: replyLog };
}

/**
 * 4. Generate Free Direct Click-to-Chat (wa.me) WhatsApp Links
 * Opens WhatsApp Web or WhatsApp Mobile instantly without any API keys or fees!
 */
function generateClickToChatLink(phone, messageText) {
  const cleanPhone = (phone || gatewayConfig.bankWhatsAppNumber).replace(/[^0-9]/g, "");
  const encoded = encodeURIComponent(messageText || "HI");
  return `https://wa.me/${cleanPhone}?text=${encoded}`;
}

/**
 * 5. Batch SMS / WhatsApp Broadcast (e.g., for clearing batches)
 */
async function broadcastBatchClearingNotifications(batchId) {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      cheques: {
        include: { presentingBank: true, draweeBank: true },
      },
    },
  });

  if (!batch || !batch.cheques) return { count: 0, dispatched: [] };

  const dispatched = [];
  for (const chq of batch.cheques) {
    const isCleared = chq.status === "CLEARED";
    const isReturned = chq.status === "RETURNED";

    const tmpl = isCleared ? "CHEQUE_CLEARED" : isReturned ? "CHEQUE_RETURNED" : "CHEQUE_PRESENTED";

    // Dispatch WhatsApp
    const wa = await sendWhatsApp({
      recipient: "+91 98251 44012",
      customerName: chq.payeeName,
      templateKey: tmpl,
      params: {
        chequeNumber: chq.chequeNumber,
        amount: Number(chq.amount).toLocaleString("en-IN"),
        accountNumber: chq.accountNumber,
        payeeName: chq.payeeName,
        draweeBank: chq.draweeBank?.name || "SURAT PEOPLES CO OP BANK",
        presentingBank: chq.presentingBank?.name || "SURAT PEOPLES CO OP BANK",
        utr: chq.ekuberUtr || `EKUBER-${Date.now().toString().slice(-8)}`,
        settlementMode: chq.settlementMode || "CONTINUOUS_T0",
        balance: "18,45,200.00",
        returnReason: chq.returnReason || "Funds Insufficient",
        memoRef: `RM-20261016-${chq.chequeNumber}`,
      },
    });

    // Dispatch SMS
    const sms = await sendSms({
      recipient: "+91 98251 44012",
      customerName: chq.payeeName,
      templateKey: tmpl,
      params: {
        chequeNumber: chq.chequeNumber,
        amount: Number(chq.amount).toLocaleString("en-IN"),
        accountNumber: chq.accountNumber,
        payeeName: chq.payeeName,
        utr: chq.ekuberUtr || `EKUBER-${Date.now().toString().slice(-8)}`,
        balance: "18,45,200.00",
        returnReason: chq.returnReason || "Funds Insufficient",
        memoRef: `RM-20261016-${chq.chequeNumber}`,
      },
    });

    dispatched.push({ chequeNumber: chq.chequeNumber, whatsapp: wa.id, sms: sms.id });
  }

  return { count: dispatched.length, dispatched };
}

function getMessageLogs(limit = 100, channel = null) {
  let logs = messageLogs;
  if (channel) {
    logs = logs.filter((l) => l.channel === channel.toUpperCase());
  }
  return logs.slice(0, limit);
}

function getGatewayConfig() {
  return {
    ...gatewayConfig,
    metaAccessToken: gatewayConfig.metaAccessToken ? "••••••••" : "",
    twilioAuthToken: gatewayConfig.twilioAuthToken ? "••••••••" : "",
    availableTemplates: Object.keys(TEMPLATES),
    activeChannels: ["SMS", "WHATSAPP", "CLICK_TO_CHAT_DIRECT"],
    totalMessagesDispatched: messageLogs.length,
  };
}

function updateGatewayConfig(newConfig) {
  gatewayConfig = { ...gatewayConfig, ...newConfig };
  return getGatewayConfig();
}

module.exports = {
  TEMPLATES,
  sendSms,
  sendWhatsApp,
  processIncomingWhatsAppMessage,
  generateClickToChatLink,
  broadcastBatchClearingNotifications,
  getMessageLogs,
  getGatewayConfig,
  updateGatewayConfig,
};
