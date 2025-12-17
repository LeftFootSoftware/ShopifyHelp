import { Card, Text, Box, BlockStack, AppProvider, Collapsible } from "@shopify/polaris";
import { useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import {
  fetchAvailableImages,
  fetchTranslationsFromAzure,
  fetchLatestVersion,
  getAzureImageUrl,
  parseImageAlt,
} from "./markdownUtils";

import styles from "./HelpComponent.module.css";

/** Extract first H1–H3 from markdown; return {title, bodyWithoutThatHeading}. */
function pickTitle(md: string): { title: string | null; body: string } {
  const lines = md.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^#{1,3}\s+(.+?)\s*$/);
    if (m) {
      const title = m[1].trim();
      const body = [...lines.slice(0, i), ...lines.slice(i + 1)]
        .join("\n")
        .replace(/^\s*\n/, "");
      return { title, body };
    }
  }
  return { title: null, body: md };
}

export default function HelpComponent() {
  const { t } = useTranslation();
  const { value } = useParams();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [helpSections, setHelpSections] = useState<Record<string, string> | null>(null);
  const [availableImages, setAvailableImages] = useState<string[]>([]);
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

  // 👇 per-section “tick” used to force a Collapsible remount after images load
  const [reflowTick, setReflowTick] = useState<Record<string, number>>({});

  const getLanguageCode = (): string => "en";

  // Fetch translations from Azure
  useEffect(() => {
    (async () => {
      try {
        // Fetch version first to ensure we're using the correct path
        await fetchLatestVersion();
        const translations = await fetchTranslationsFromAzure(getLanguageCode());
        if (translations) {
          setHelpSections(translations);
          // start collapsed by default
          const init: Record<string, boolean> = {};
          for (const k of Object.keys(translations)) init[k] = false;
          setOpenMap(init);
        } else {
          console.warn("⚠️ No translations found");
          setHelpSections(null);
        }
      } catch (error) {
        console.error("❌ Error loading help content:", error);
        setHelpSections(null);
      }
    })();
  }, []);

  // Fetch images (for ReactMarkdown img resolver)
  useEffect(() => {
    fetchAvailableImages(getLanguageCode()).then(setAvailableImages);
  }, []);

  // Scroll to a section id if URL param roughly matches a key
  useEffect(() => {
    if (!value || !helpSections) return;
    const lower = value.toLowerCase();
    const matchKey = Object.keys(helpSections).find((k) =>
      lower.includes(k.toLowerCase())
    );
    if (matchKey) {
      setOpenMap((m) => ({ ...m, [matchKey]: true }));
      setTimeout(() => {
        document.getElementById(matchKey)?.scrollIntoView({ behavior: "smooth" });
      }, 0);
    }
  }, [value, helpSections]);

  const toggle = (key: string) => setOpenMap((m) => ({ ...m, [key]: !m[key] }));

  // helper to bump a section's tick so its Collapsible remounts & re-measures
  const bumpReflow = (key: string) =>
    setReflowTick((ticks) => ({ ...ticks, [key]: (ticks[key] ?? 0) + 1 }));

  return (
    <AppProvider i18n={{}}>
      <Box paddingInline="200" paddingBlockStart="500">
        <BlockStack gap="400">
          <Box>
            <Text variant="headingLg" as="h1">
              {t("", { ns: "help" })}
            </Text>
          </Box>

          <div ref={containerRef} className={styles.helpContainer}>
            {!helpSections ? (
              <Box paddingBlockStart="400">
                <Text as="p" alignment="center">⏳ Loading help content...</Text>
              </Box>
            ) : (
              <BlockStack gap="400">
                {Object.entries(helpSections).map(([key, content]) => {
                  const { title, body } = pickTitle(content);
                  const heading = title ?? key;
                  const isOpen = !!openMap[key];
                  const tick = reflowTick[key] ?? 0;

                  return (
                    <Card key={key}>
                      <div id={key} className={styles.markdown}>
                        <div className={styles.sectionHeader}>
                          <div className={styles.title}>
                            <Text variant="headingMd" as="h2">
                              {heading}
                            </Text>
                          </div>
                          <button
                            className={styles.expandButton}
                            onClick={() => toggle(key)}
                            aria-expanded={isOpen}
                            aria-controls={`${key}-body`}
                            aria-label={isOpen ? "Collapse" : "Expand"}
                          >
                            <span className={`${styles.arrowIcon} ${isOpen ? styles.arrowOpen : ''}`}>
                              ▶
                            </span>
                          </button>
                        </div>

                        {/* key includes a tick so this remounts & re-measures after images load */}
                        <Collapsible open={isOpen} id={`${key}-body`} key={`${key}-${tick}`}>
                          <div style={{ marginTop: 12 }}>
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[rehypeRaw]}
                              components={{
                                img: ({ src, alt }: { src?: string; alt?: string }) => {
                                  if (!src) return null;
                                  const normalizedSrc = decodeURIComponent(src);
                                  const { cleanAlt, className } = parseImageAlt(alt);
                                  const foundImage = availableImages.find((image) =>
                                    image.endsWith(normalizedSrc)
                                  );
                                  const finalSrc = foundImage
                                    ? getAzureImageUrl(getLanguageCode(), foundImage)
                                    : src;
                                  const appliedClass = styles[className] || styles.defaultImage;
                                  return (
                                    <img
                                      src={finalSrc}
                                      alt={cleanAlt}
                                      className={appliedClass}
                                      loading="lazy"
                                      decoding="async"
                                      // 👇 when an image finishes loading, force a re-measure for this section
                                      onLoad={() => bumpReflow(key)}
                                    />
                                  );
                                },
                              }}
                            >
                              {body}
                            </ReactMarkdown>
                          </div>
                        </Collapsible>
                      </div>
                    </Card>
                  );
                })}
              </BlockStack>
            )}
          </div>
        </BlockStack>
      </Box>
    </AppProvider>
  );
}
