const OWNER_EMAIL = "bublooscientist2023@gmail.com";
const OWNER_PHONE = "+923378324258";

function sendJson(response, status, body) {
  response.setHeader("Content-Type", "application/json");
  response.status(status).send(JSON.stringify(body));
}

function readBody(request) {
  if (request.body) {
    return Promise.resolve(typeof request.body === "string" ? JSON.parse(request.body) : request.body);
  }

  return new Promise((resolve, reject) => {
    let raw = "";
    request.on("data", (chunk) => {
      raw += chunk;
    });
    request.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

function truncateSms(message) {
  return message.length > 1200 ? `${message.slice(0, 1197)}...` : message;
}

async function sendEmail({ subject, message }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }

  const from = process.env.ORDER_EMAIL_FROM || "Bubloo Scientist Store <onboarding@resend.dev>";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: OWNER_EMAIL,
      subject,
      text: message
    })
  });

  if (!response.ok) {
    throw new Error(`Resend email failed with status ${response.status}`);
  }

  return "email";
}

async function sendSms({ message }) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !from) {
    return null;
  }

  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const body = new URLSearchParams({
    To: OWNER_PHONE,
    From: from,
    Body: truncateSms(message)
  });

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  if (!response.ok) {
    throw new Error(`Twilio SMS failed with status ${response.status}`);
  }

  return "SMS";
}

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    sendJson(response, 405, { ok: false, error: "Method not allowed" });
    return;
  }

  try {
    const body = await readBody(request);
    const subject = body.subject || "New Bubloo Scientist Store order";
    const message = body.message || "";

    if (!message.trim()) {
      sendJson(response, 400, { ok: false, error: "Order message is required" });
      return;
    }

    const channels = [];
    const emailChannel = await sendEmail({ subject, message });
    if (emailChannel) {
      channels.push(emailChannel);
    }

    const smsChannel = await sendSms({ message });
    if (smsChannel) {
      channels.push(smsChannel);
    }

    if (!channels.length) {
      sendJson(response, 501, {
        ok: false,
        error: "No notification provider is configured"
      });
      return;
    }

    sendJson(response, 200, { ok: true, channels });
  } catch (error) {
    sendJson(response, 500, {
      ok: false,
      error: error.message || "Notification failed"
    });
  }
};
