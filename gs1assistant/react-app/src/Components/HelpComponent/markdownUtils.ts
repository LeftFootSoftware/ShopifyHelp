//import { XMLParser } from "fast-xml-parser";

// Using local help folder in public directory
const HELP_BASE_URL = "/help"; // Local path to help folder in public directory
const CONFIG_URL = `${HELP_BASE_URL}/config.json`; // URL to version config file

let cachedVersion = "v1"; // Default version
let cachedImages: Record<string, string[]> = {}; // Store fetched images per language

export const fetchLatestVersion = async (): Promise<string> => {
  try {
    //    console.log("Fetching config from:", CONFIG_URL);

    const response = await fetch(CONFIG_URL);

    if (!response.ok) {
      throw new Error(`Failed to fetch config.json: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    cachedVersion = data.latestVersion || "v1";  // Use fetched version or fallback to "v1"

    return cachedVersion;
  } catch (error) {
    console.warn("Config file missing or failed to load, falling back to default version:", error);
    return "v1";  // Always fallback to "v1"
  }
};


export const fetchAvailableImages = async (lang: string): Promise<string[]> => {
  if (cachedImages[lang]) return cachedImages[lang]; // Use cached images if available

  try {
    // Fetch the images index file for the specific language
    const imagesIndexUrl = `${HELP_BASE_URL}/${cachedVersion}/assets/${lang}/index.json`;

    console.log("Fetching images index from:", imagesIndexUrl);

    const response = await fetch(imagesIndexUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch images index: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Extract image names from the index
    const imageNames = data.images || [];

    console.log(`Found ${imageNames.length} images for language: ${lang}`);

    cachedImages[lang] = imageNames; // Cache the result
    return imageNames;

  } catch (error) {
    console.error("Error fetching images from local folder:", error);
    return [];
  }
};

export const fetchTranslationsFromLocal = async (lang: string): Promise<any> => {
  const langFileUrl = `${HELP_BASE_URL}/${cachedVersion}/locales/${lang}.json`;

  try {
    console.log(`🌍 Fetching translations from: ${langFileUrl}`);

    const response = await fetch(langFileUrl);

    console.log("Response content:", response);
    if (!response.ok) throw new Error(`Failed to fetch ${langFileUrl}: ${response.statusText}`);

    const data = await response.json();
    return data.help; // Assuming "help" is the top-level key in your JSON
  } catch (error) {
    console.error(`🚨 Error fetching translations from local:`, error);
    return null; // Return null if fetching fails
  }
};

// Keep old name for backward compatibility
export const fetchTranslationsFromAzure = fetchTranslationsFromLocal;


export const getLocalImageUrl = (lang: string, imageName: string) => {
  return `${HELP_BASE_URL}/${cachedVersion}/assets/${lang}/${imageName}`;
};

// Keep old name for backward compatibility
export const getAzureImageUrl = getLocalImageUrl;

export const parseImageAlt = (alt?: string) => {
  if (!alt) return { cleanAlt: "", className: "defaultImage" };

  let className = "defaultImage";
  let cleanAlt = alt;

  if (alt.startsWith("screenshot:")) {
    className = "screenshot";
    cleanAlt = alt.replace("screenshot:", "");
  } else if (alt.startsWith("icon:")) {
    className = "icon";
    cleanAlt = alt.replace("icon:", "");
  }

  return { cleanAlt, className };
};
