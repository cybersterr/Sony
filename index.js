const axios = require("axios");
const fs = require("fs");

const STREAM_URL = "https://netx.streamstar18.workers.dev/soni";
const OUTPUT_FILE = "stream.json";

async function fetchAndSaveJson() {
  try {
    const response = await axios.get(STREAM_URL, { responseType: "text" });
    const lines = response.data.split("\n");

    const result = {};

    let currentTvgId = null;
    let currentGroup = null;
    let currentLogo = null;
    let currentChannel = null;

    let skipFirst = true; // ✅ to skip first entry

    for (const line of lines) {
      const trimmed = line.trim();

      // Extract info from #EXTINF
      if (trimmed.startsWith("#EXTINF:")) {
        const tvgIdMatch = trimmed.match(/tvg-id="([^"]+)"/);
        const groupMatch = trimmed.match(/group-title="([^"]+)"/);
        const logoMatch = trimmed.match(/tvg-logo="([^"]+)"/);
        const channelMatch = trimmed.match(/,(.*)$/);

        currentTvgId = tvgIdMatch ? tvgIdMatch[1] : null;
        currentGroup = groupMatch ? groupMatch[1] : null;
        currentLogo = logoMatch ? logoMatch[1] : null;
        currentChannel = channelMatch ? channelMatch[1] : null;
      }

      // Extract URL
      else if (trimmed.startsWith("http") && currentTvgId) {

        // ❌ Skip first entry (sf-top)
        if (skipFirst && currentTvgId === "sf-top") {
          skipFirst = false;

          currentTvgId = null;
          currentGroup = null;
          currentLogo = null;
          currentChannel = null;
          continue;
        }

        result[currentTvgId] = {
          url: trimmed,
          group_title: currentGroup,
          tvg_logo: currentLogo,
          channel_name: currentChannel
        };

        // Reset
        currentTvgId = null;
        currentGroup = null;
        currentLogo = null;
        currentChannel = null;
      }
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2), "utf-8");
    console.log("✅ stream.json saved successfully.");

  } catch (err) {
    console.error("❌ Failed to fetch M3U:", err.message);
    process.exit(1);
  }
}

fetchAndSaveJson();
