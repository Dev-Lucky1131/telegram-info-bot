




// import express, { Request, Response } from "express";
// import bodyParser from "body-parser";
// import { TelegramClient } from "telegram";
// import { StringSession } from "telegram/sessions";
// import dotenv from "dotenv";
// import cors from "cors";

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 5000;

// // Enable CORS for frontend origin
// app.use(
//   cors({
//     origin: "http://localhost:3000", // Allow requests from the frontend
//   })
// );

// app.use(bodyParser.json());

// // Telegram API credentials
// const API_ID = Number(26764778);
// const API_HASH = "982cdb0610908478274285cd659dbc3a";
// const STRING_SESSION =
//   "1ApWapzMBu1xAm4Vy5-rVrBQpkJYpwhdf4AkbzhhwD0qxs20tRu-BN_A55wk5HV-R_CCzAvi3rIBIMSEiSBREsFWqGgQOce8CTQbKeog9LDrikg5UeFI4Fa7cvvM5qDeUyorLxpkNtbLRa3QVb9yeprPWaGx9mBKx3nW6T4xSyQsue_idT94ZouSS_S64JtVDQ46c-UP17HFpLzWSPAzLzI0A_IzChc1qsbanpj0-y8BCalaOV_Nxoo2wCZXs-LNMixX7GGNdaH8X39V2wCVGph8zYCUzZme8-Zx5WYKSQ3czPXfvwle6T50WwH73ZABaolfxOrZOdUVj5tp5rHjApog2xm5PJ3A=";

// if (!API_ID || !API_HASH || !STRING_SESSION) {
//   throw new Error(
//     "Missing TELEGRAM_API_ID, TELEGRAM_API_HASH, or TELEGRAM_SESSION_STRING in environment variables."
//   );
// }

// app.post("/api/extract", async (req: Request, res: Response) => {
//   const { emails }: { emails: string[] } = req.body;

//   if (!emails || !Array.isArray(emails)) {
//     res.status(400).json({ error: "Invalid email list" });
//     return;
//   }

//   const client = new TelegramClient(
//     new StringSession(STRING_SESSION),
//     API_ID,
//     API_HASH,
//     {}
//   );

//   try {
//     await client.connect();
//     console.log("Telegram client connected successfully.");

//     let output = "";

//     for (const email of emails) {
//       // Extract the part after the `;`
//       const telegramIdentifier = email.split(";").pop()?.trim();
//       if (!telegramIdentifier) {
//         output += `${email}\nError: Invalid email format\n\n`;
//         continue;
//       }

//       try {
//         // Use the extracted part as the Telegram identifier
//         const user: any = await client.getEntity(telegramIdentifier);
//         const phoneNumber = user.phone || "No phone found";
//         const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
//         output += `email:${email}\nPhone: ${phoneNumber}\nName: ${fullName}\n\n`;
//       } catch (err: any) {
//         output += `${email}\nTelegram Identifier: ${telegramIdentifier}\nError: ${err.message}\n\n`;
//       }
//     }

//     await client.disconnect();
//     res.status(200).send(output);
//   } catch (err: any) {
//     console.error("Error processing emails:", err.message);
//     res.status(500).json({ error: "Failed to process emails" });
//   }
// });

// app.listen(PORT, () => {
//   console.log(`Backend server running on http://localhost:${PORT}`);
// });





















import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(bodyParser.json());
app.use(cors({ origin: "http://localhost:3000" }));

const API_ID = 26764778;
const API_HASH = "982cdb0610908478274285cd659dbc3a";
const STRING_SESSION = "1ApWapzMBu1xAm4Vy5-rVrBQpkJYpwhdf4AkbzhhwD0qxs20tRu-BN_A55wk5HV-R_CCzAvi3rIBIMSEiSBREsFWqGgQOce8CTQbKeog9LDrikg5UeFI4Fa7cvvM5qDeUyorLxpkNtbLRa3QVb9yeprPWaGx9mBKx3nW6T4xSyQsue_idT94ZouSS_S64JtVDQ46c-UP17HFpLzWSPAzLzI0A_IzChc1qsbanpj0-y8BCalaOV_Nxoo2wCZXs-LNMixX7GGNdaH8X39V2wCVGph8zYCUzZme8-Zx5WYKSQ3czPXfvwle6T50WwH73ZABaolfxOrZOdUVj5tp5rHjApog2xm5PJ3A=";

// Function to fetch city and country from IP address
const getLocationFromIP = async (ip: string) => {
  try {
    console.log(`Fetching location for IP: ${ip}`);
    const response = await axios.get(`http://ip-api.com/json/${ip}`);
    const { country, city, status, message } = response.data;
    if (status === "success") {
      return { country, city };
    } else {
      console.warn(`IP API returned error: ${message}`);
      return { country: "Unknown", city: "Unknown" };
    }
  } catch (err) {
    console.error(`Error fetching location for IP ${ip}:`, (err as Error).message);
    return { country: "Unknown", city: "Unknown" };
  }
};

// Handler for the route
const extractHandler = async (req: Request, res: Response): Promise<void> => {
  const { emails }: { emails: string[] } = req.body;

  if (!emails || !Array.isArray(emails)) {
    res.status(400).json({ error: "Invalid email list provided." });
    return;
  }

  const client = new TelegramClient(
    new StringSession(STRING_SESSION),
    API_ID,
    API_HASH,
    {}
  );

  try {
    await client.connect();
    console.log("Telegram client connected successfully.");

    let output = "";

    for (const email of emails) {
      const telegramIdentifier = email.split(";").pop()?.trim();
      if (!telegramIdentifier) continue;

      try {
        const user: any = await client.getEntity(telegramIdentifier);
        const phoneNumber = user.phone || "No phone found";
        const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();

        const ipRegex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
        const ipMatch = email.match(ipRegex);
        const ip = ipMatch ? ipMatch[0] : "No IP found";

        let location = { country: "Unknown", city: "Unknown" };
        if (ip !== "No IP found") {
          location = await getLocationFromIP(ip);
        }

        // Append results in the desired format
        output += `${email}\nPhone: ${phoneNumber}\n`;
        output += `Name: ${fullName}\nIP: ${ip}\nCity: ${location.city}\nCountry: ${location.country}\n\n`;
      } catch (err) {
        console.warn(`Error processing email ${email}:`, (err as Error).message);
        output += `${email}\nTelegram Identifier: ${telegramIdentifier}\nError: ${(err as Error).message}\n\n`;
      }
    }

    await client.disconnect();
    res.status(200).send(output.trim()); // Send the formatted string
  } catch (err) {
    console.error("Error processing request:", (err as Error).message);
    res.status(500).json({ error: "Failed to process emails." });
  }
};

// Attach the handler to the route
app.post("/api/extract", extractHandler);

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
