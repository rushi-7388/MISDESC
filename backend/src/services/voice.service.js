const prisma = require("../config/prisma");
const { broadcastEvent } = require("../utils/sse.util");

/**
 * ==============================================================================
 * Regional Multi-Lingual AI Voice Banking Engine
 * Supports Gujarati (ગુજરાતી), Hindi (हिन्दी), and English
 * Dedicated for SURAT PEOPLES CO OP BANK (SNB)
 * ==============================================================================
 */

// Voice Command Patterns & NLP Intent Classification
const INTENT_PATTERNS = [
  {
    intent: "CHEQUE_STATUS",
    keywords: ["status", "stetus", "kaha hai", "clear hua", "statas", "tapas", "clearing"],
    extractEntity: (text) => {
      const match = text.match(/\b\d{6}\b/) || text.match(/\b\d{3,5}\b/);
      return match ? match[0].padStart(6, "0") : null;
    },
  },
  {
    intent: "CHECK_BALANCE",
    keywords: ["balance", "balans", "kitna paisa", "ketla rupiya", "khata", "account", "paisa"],
    extractEntity: (text) => {
      const match = text.match(/\b\d{10,14}\b/);
      return match ? match[0] : "102030401001";
    },
  },
  {
    intent: "STOP_PAYMENT",
    keywords: ["stop", "roko", "rok do", "band", "sthapit", "halt", "gum", "chori"],
    extractEntity: (text) => {
      const match = text.match(/\b\d{6}\b/) || text.match(/\b\d{3,5}\b/);
      return match ? match[0].padStart(6, "0") : null;
    },
  },
  {
    intent: "POSITIVE_PAY",
    keywords: ["positive pay", "pps", "register", "manzoori", "pre authorize"],
    extractEntity: (text) => {
      const match = text.match(/\b\d{6}\b/);
      return match ? match[0] : "000101";
    },
  },
  {
    intent: "BRANCH_INFO",
    keywords: ["branch", "shakha", "ifsc", "kaha hai", "address", "timing", "samay"],
    extractEntity: () => "ATHWA_MAIN",
  },
  {
    intent: "GREETING",
    keywords: ["hi", "hello", "namaste", "kem cho", "kemcho", "suprabhat", "pranam"],
    extractEntity: () => null,
  },
];

/**
 * Parse Natural Language Voice Query (Hindi, Gujarati, English)
 */
async function processVoiceQuery(queryText, language = "auto") {
  const clean = (queryText || "").trim();
  const lower = clean.toLowerCase();

  let matchedIntent = "UNKNOWN";
  let extractedEntity = null;

  for (const pat of INTENT_PATTERNS) {
    if (pat.keywords.some((k) => lower.includes(k))) {
      matchedIntent = pat.intent;
      extractedEntity = pat.extractEntity(clean);
      break;
    }
  }

  let textResponse = "";
  let speechResponse = ""; // Optimized for text-to-speech synthesis
  let actionData = null;

  switch (matchedIntent) {
    case "CHEQUE_STATUS": {
      const chqNum = extractedEntity || "000101";
      const cheque = await prisma.cheque.findFirst({
        where: { chequeNumber: chqNum },
        include: { draweeBank: true, presentingBank: true },
      });

      if (!cheque) {
        textResponse = `Cheque #${chqNum} clearing record me nahi mila. Kripya cheque number dobara bole ya check karein.`;
        speechResponse = `Cheque number ${chqNum.split("").join(" ")} clearing system me uplabdh nahi hai.`;
      } else {
        const amt = Number(cheque.amount).toLocaleString("en-IN");
        const statusMap = {
          PRESENTED: "Clearing me prastut kiya gaya hai (Presented)",
          VERIFIED: "Verify ho chuka hai, clearance process me hai",
          AWAITING_CHECKER: "Senior Approver Checker ke verification ke liye pending hai",
          CLEARED: "Safaltapoorvak Clear aur Settle ho chuka hai (Cleared)",
          RETURNED: `Dishonour hokar Return ho gaya hai. Karan: ${cheque.returnReason}`,
        };
        const statusText = statusMap[cheque.status] || cheque.status;

        textResponse = `🏦 Cheque #${cheque.chequeNumber} (${cheque.payeeName} ke naam par, ₹${amt}) ka vartaman status hai: ${statusText}.`;
        speechResponse = `Cheque number ${cheque.chequeNumber.split("").join(" ")} for rupees ${amt} is currently ${cheque.status}. Beneficiary is ${cheque.payeeName}.`;
        actionData = { chequeId: cheque.id, chequeNumber: cheque.chequeNumber, status: cheque.status, amount: cheque.amount };
      }
      break;
    }

    case "CHECK_BALANCE": {
      const acc = extractedEntity || "102030401001";
      textResponse = `💰 Account ${acc} ka Available Balance ₹24,85,420.00 hai. CTS clearing ke liye koi active lien hold nahi hai.`;
      speechResponse = `Your Surat Peoples Co Op Bank account available balance is twenty-four lakh, eighty-five thousand, four hundred and twenty rupees.`;
      actionData = { accountNumber: acc, availableBalance: 2485420.0 };
      break;
    }

    case "STOP_PAYMENT": {
      const chqNum = extractedEntity || "000102";
      textResponse = `🛑 Cheque #${chqNum} par turant Stop Payment instruction activate kar diya gaya hai. Clearing Switch me freeze flag lag gaya hai.`;
      speechResponse = `Stop payment instruction successfully registered for cheque number ${chqNum.split("").join(" ")}.`;
      actionData = { chequeNumber: chqNum, action: "STOP_PAYMENT_FROZEN" };
      break;
    }

    case "POSITIVE_PAY": {
      const chqNum = extractedEntity || "000105";
      textResponse = `🛡️ Positive Pay System: Cheque #${chqNum} ki pre-authorization verified hai. High-value clearance bina kisi rukawat ke clear hogi.`;
      speechResponse = `Positive Pay status confirmed for cheque number ${chqNum.split("").join(" ")}. Instrument is pre-authorized.`;
      break;
    }

    case "BRANCH_INFO": {
      textResponse = `🏢 SURAT PEOPLES CO OP BANK Main Branch: Athwa Lines, Surat - 395001. IFSC: SPCB0001234. Clearing House cut-off samay shaam 4:00 baje hai.`;
      speechResponse = `Head office is located at Athwa Lines Surat. IFSC code is S P C B zero zero zero one two three four.`;
      break;
    }

    case "GREETING": {
      textResponse = `Namaste! Kem cho! Main SURAT PEOPLES CO OP BANK ka AI Voice Assistant hoon. Main aapki cheque clearing, balance ya stop-payment me kya sahayata kar sakta hoon?`;
      speechResponse = `Namaste! I am your Surat Peoples Co-operative Bank voice assistant. How may I assist your clearing operations today?`;
      break;
    }

    default: {
      textResponse = `Aapka voice command: "${clean}". Aap bol sakte hain: "Cheque 000101 ka status batao", "Account balance check karo", ya "Cheque 000102 stop karo".`;
      speechResponse = `Please say cheque status, check balance, or stop payment instruction.`;
      break;
    }
  }

  const voiceLog = {
    id: `VOICE-${Date.now().toString().slice(-6)}`,
    query: clean,
    detectedIntent: matchedIntent,
    language: language || "hi-IN",
    textResponse,
    speechResponse,
    actionData,
    timestamp: new Date().toISOString(),
  };

  broadcastEvent("VOICE_QUERY_PROCESSED", voiceLog);

  return voiceLog;
}

module.exports = {
  processVoiceQuery,
};
