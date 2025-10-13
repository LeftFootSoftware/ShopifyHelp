import {
  Card,
  Text,
  Box,
  BlockStack,
} from "@shopify/polaris";
import { useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
//import { useGlobalContext } from "../../Contexts/GlobalContext";
//import { baseUrl } from "../../Utils/common";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  fetchAvailableImages,
  fetchTranslationsFromAzure,
  getAzureImageUrl,
  parseImageAlt,
} from "./markdownUtils";

//import { getLanguageCode } from "../../locales/i18n";
import styles from './HelpComponent.module.css';


export default function HelpComponent() {
  const { t, i18n } = useTranslation();
  //const { globalSelectedLanguage } = useGlobalContext();
  const { value } = useParams();
  const containerRef = useRef<any>(null);

  const [availableImages, setAvailableImages] = useState<string[]>([]);
  const [helpSections, setHelpSections] = useState<Record<string, string> | null>(null); // ✅ Store translations in state

  //  const languageCode = getLanguageCode(); 
  const getLanguageCode = (): string => {
    //console.log("globalSelectedLanguage", globalSelectedLanguage);
    //const match = globalSelectedLanguage.match(/\(([^)]+)\)/);
    //if (match) {
    //  const code = match[1].toLowerCase();
    //  return code === 'us' ? 'en' : code;
    //}

    return 'en';
  };

  // Fetch images from Azure
  useEffect(() => {
    const languageCode = getLanguageCode();
    console.log("languageCode", languageCode);
    fetchAvailableImages(languageCode).then(setAvailableImages);
  }, []);


  // Fetch translations from Azure
  useEffect(() => {
    const loadAzureTranslations = async () => {
      const languageCode = getLanguageCode();
      //      console.log(`🌍 Fetching translations for language: ${languageCode}`);
      //      console.log(globalSelectedLanguage);
      const translations = await fetchTranslationsFromAzure(languageCode);
      if (translations) {
        //i18n.addResourceBundle(languageCode, "help", translations, true, true);
        //        i18n.changeLanguage(languageCode);
        //        console.log("✅ Loaded translations from Azure:", translations);
        setHelpSections(translations); // ✅ Store in state
      } else {
        console.warn("⚠️ No translations found for", languageCode);
        setHelpSections(null); // Handle missing translations
      }
    };

    loadAzureTranslations();
  }, []); // ✅ Runs only once on component mount

  // Scroll to relevant section based on URL params
  useEffect(() => {
    if (!value || !helpSections) return; // ✅ Avoid running if helpSections is null

    const lowerValue = value.toLowerCase();
    const matchingKey = Object.keys(helpSections).find((key) =>
      lowerValue.includes(key.toLowerCase())
    );

    if (matchingKey) {
      document.getElementById(matchingKey)?.scrollIntoView({ behavior: "smooth" });
    }
  }, [value, helpSections]);

  return (
    <Box paddingInline="200" paddingBlockStart="500">
      <BlockStack gap="400">
        <Box>
          <Text variant="headingLg" as="h1">
            {t("", { ns: "help" })}
          </Text>
        </Box>

        <div ref={containerRef}>
          {/* Show Loading Message if translations are not yet loaded */}
          {!helpSections ? (
            <Box paddingBlockStart="400">
              <Text as="p" alignment="center">
                ⏳ Loading help content...
              </Text>
            </Box>
          ) : (
            <BlockStack gap="400">
              {Object.entries(helpSections).map(([key, content]) => (
                <Card key={key}>
                  <div id={key} className={styles.markdown}>
                    <ReactMarkdown
                      //className={styles.markdown}
                      remarkPlugins={[remarkGfm]}
                      components={{
                        img: ({ src, alt }: { src?: string; alt?: string }) => {
                          if (!src) return null;

                          const normalizedSrc = decodeURIComponent(src);
                          const { cleanAlt, className } = parseImageAlt(alt);
                          const foundImage = availableImages.find((image) =>
                            image.endsWith(normalizedSrc)
                          );
                          const finalSrc = foundImage ? getAzureImageUrl(getLanguageCode(), foundImage) : src;
                          const appliedClass = styles[className] || styles.defaultImage;

                          //const imgStyle = { height: '500px' };

                          return <img
                            src={finalSrc}
                            alt={cleanAlt}
                            //style={imgStyle}
                            className={appliedClass}
                          />;
                        },
                      }}
                    >
                      {content}
                    </ReactMarkdown>
                  </div>
                </Card>
              ))}
            </BlockStack>
          )}
        </div>

        {/* Footer */}
        {/* <Box paddingBlockStart="400">
          <InlineStack align="center">
            <Text as="p">
              {t("moreInformation")}
              <a target="_blank" rel="noopener noreferrer" href={`${baseUrl}/gs1assistant`}>
                GS1Assistant
              </a>
              .
            </Text>
          </InlineStack>
        </Box> */}
      </BlockStack>
    </Box>
  );
}
