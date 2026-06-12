import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = path.resolve(import.meta.dirname, "..");

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function setNestedMessage(messages, keyParts, value) {
  let current = messages;

  for (let index = 0; index < keyParts.length - 1; index += 1) {
    const part = keyParts[index];
    current[part] ??= {};
    current = current[part];
  }

  current[keyParts[keyParts.length - 1]] = value;
}

function collectParagraphMessages(messages, scope, segments) {
  const converted = [];

  segments.forEach((segment, segmentIndex) => {
    if (segment.kind === "text") {
      const key = [...scope, `seg${segmentIndex}`].join(".");
      setNestedMessage(messages, key.split("."), segment.value);
      converted.push({ kind: "text", key });
      return;
    }

    const key = [...scope, `link${segmentIndex}`].join(".");
    setNestedMessage(messages, key.split("."), segment.label);
    converted.push({ kind: "link", key, href: segment.href });
  });

  return converted;
}

function collectListMessages(messages, scope, items) {
  return items.map((item, itemIndex) => {
    if (typeof item === "string") {
      const key = [...scope, `item${itemIndex}`].join(".");
      setNestedMessage(messages, key.split("."), item);
      return key;
    }

    return collectParagraphMessages(messages, [...scope, `item${itemIndex}`], item);
  });
}

function collectBlockMessages(messages, scope, block) {
  if (block.kind === "paragraph") {
    return {
      kind: "paragraph",
      segments: collectParagraphMessages(messages, scope, block.segments),
    };
  }

  const listScope = [...scope, block.kind === "orderedList" ? "orderedList" : "unorderedList"];
  return {
    kind: block.kind,
    items: collectListMessages(messages, listScope, block.items),
  };
}

function convertDocument(document, docId) {
  const messages = {};
  const converted = {
    preamble: [],
    sections: [],
  };

  document.preamble.forEach((block, blockIndex) => {
    converted.preamble.push(
      collectBlockMessages(messages, ["preamble", `block${blockIndex}`], block)
    );
  });

  document.sections.forEach((section) => {
    setNestedMessage(messages, ["sections", section.id, "title"], section.title);

    const convertedSection = {
      id: section.id,
      titleKey: `sections.${section.id}.title`,
      blocks: undefined,
      subsections: undefined,
    };

    if (section.blocks) {
      convertedSection.blocks = section.blocks.map((block, blockIndex) =>
        collectBlockMessages(messages, ["sections", section.id, "blocks", `block${blockIndex}`], block)
      );
    }

    if (section.subsections) {
      convertedSection.subsections = section.subsections.map((subsection) => {
        const subsectionSlug = slugify(subsection.title);
        setNestedMessage(
          messages,
          ["sections", section.id, "subsections", subsectionSlug, "title"],
          subsection.title
        );

        return {
          titleKey: `sections.${section.id}.subsections.${subsectionSlug}.title`,
          blocks: subsection.blocks.map((block, blockIndex) =>
            collectBlockMessages(
              messages,
              ["sections", section.id, "subsections", subsectionSlug, "blocks", `block${blockIndex}`],
              block
            )
          ),
        };
      });
    }

    converted.sections.push(convertedSection);
  });

  return { docId, messages, converted };
}

function serializeConvertedDocument(docId, converted) {
  return `import type { LegalDocumentKeys } from "@/types/legal";

export const ${docId === "privacy" ? "privacyPolicyDocumentKeys" : "termsAndConditionsDocumentKeys"}: LegalDocumentKeys = ${JSON.stringify(converted, null, 2)} as const;
`;
}

async function main() {
  const privacyModule = await import(
    pathToFileURL(path.join(ROOT, "src/data/legal/privacy-policy.ts")).href
  );
  const termsModule = await import(
    pathToFileURL(path.join(ROOT, "src/data/legal/terms-and-conditions.ts")).href
  );

  const outputs = [
    ["privacy", privacyModule.privacyPolicyDocument],
    ["terms", termsModule.termsAndConditionsDocument],
  ];

  for (const [docId, document] of outputs) {
    const { messages, converted } = convertDocument(document, docId);
    const messagesPath = path.join(ROOT, "src/i18n/legal", `${docId}.en.json`);
    const keysPath = path.join(ROOT, "src/data/legal", `${docId}-keys.ts`);

    fs.mkdirSync(path.dirname(messagesPath), { recursive: true });
    fs.writeFileSync(messagesPath, `${JSON.stringify(messages, null, 2)}\n`);
    fs.writeFileSync(keysPath, serializeConvertedDocument(docId, converted));
    console.log(`Wrote ${messagesPath} (${Object.keys(flatten(messages)).length} leaf keys)`);
    console.log(`Wrote ${keysPath}`);
  }
}

function flatten(value, prefix = "") {
  const result = {};

  for (const [key, nested] of Object.entries(value)) {
    const next = prefix ? `${prefix}.${key}` : key;
    if (typeof nested === "string") {
      result[next] = nested;
      continue;
    }
    Object.assign(result, flatten(nested, next));
  }

  return result;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
