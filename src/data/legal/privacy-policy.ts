import { l, ol, p, t } from "@/data/legal/builders";
import type { LegalDocument } from "@/types/legal";

export const privacyPolicyDocument: LegalDocument = {
  title: "Prophet Privacy Policy",
  preamble: [
    p(
      t(
        'This Privacy Policy explains how {legalEntityName} ("Prophet," "we," "us," or "our") collects, uses, discloses, stores, and protects information when you access or use Prophet, including our website, web application, dashboards, analytics tools, market data pages, team pages, watchlist or tracking features, trading-related interfaces, APIs, and related services that link to this Privacy Policy (collectively, the "Service").'
      )
    ),
    p(
      t("This Privacy Policy should be read together with our "),
      l("Terms and Conditions", "/terms-of-service"),
      t(".")
    ),
    p(
      t("If you do not agree with this Privacy Policy, do not use the Service.")
    ),
  ],
  sections: [
    {
      id: "scope",
      title: "1. Scope",
      blocks: [
        p(
          t(
            "This Privacy Policy applies to information we collect through the Service and related communications. It does not apply to third-party websites, wallets, applications, protocols, market venues, exchanges, data vendors, analytics providers, or services that we do not control."
          )
        ),
        p(
          t(
            "Third-party services, including Polymarket, wallet providers, blockchain networks, API-Football, GDELT, The Odds API, Cloudflare, hosting providers, analytics providers, and other integrations, may process information under their own privacy policies."
          )
        ),
      ],
    },
    {
      id: "information-we-collect",
      title: "2. Information We Collect",
      blocks: [
        p(t("We may collect the following categories of information.")),
      ],
      subsections: [
        {
          title: "2.1 Information You Provide",
          blocks: [
            p(
              t("You may provide information directly to us, including:")
            ),
            ol([
              "Contact information, such as email address, name, Telegram handle, Discord handle, or other contact details if you choose to provide them.",
              "Account or support information, such as requests, feedback, bug reports, preferences, or communications.",
              "Watchlist or tracking preferences, such as teams, markets, alerts, or saved views.",
              "Order-related user inputs, such as order side, market, outcome, limit price, size, amount bucket, and confirmation actions, when trading-related functionality is enabled.",
            ]),
            p(
              t(
                "We do not ask for, and you must not provide, private keys, seed phrases, CLOB secrets, wallet recovery phrases, or sensitive authentication credentials."
              )
            ),
          ],
        },
        {
          title: "2.2 Wallet and Trading-Related Information",
          blocks: [
            p(
              t(
                "If you connect a wallet or use trading-related features, we may process:"
              )
            ),
            ol([
              "Public wallet address.",
              "Hashed wallet address.",
              "Wallet type or provider.",
              "User-specific trading session status.",
              "Eligibility check status.",
              "Balance, allowance, order preview, order status, order history, position, cancellation, and transaction-related metadata.",
              "Market ID, outcome ID, token ID, side, price, size bucket, amount bucket, estimated cost, potential outcome, and error codes.",
            ]),
            p(
              t(
                "We do not custody your funds. We do not store your private keys or seed phrases. We do not use a shared platform wallet or deployment private key to submit user trades."
              )
            ),
            p(
              t(
                "Some wallet and transaction information may be publicly available on blockchain networks or processed by third-party services."
              )
            ),
          ],
        },
        {
          title: "2.3 Automatically Collected Information",
          blocks: [
            p(t("When you use the Service, we may automatically collect:")),
            ol([
              "Device information, such as device type, browser, operating system, language, screen size, and user agent.",
              "Usage information, such as pages viewed, buttons clicked, tabs selected, chart interactions, section exposure, scroll depth, team card impressions, market data loaded, error states, and session duration.",
              "Log information, such as IP address, approximate location derived from IP address, timestamps, request paths, referrers, and diagnostic data.",
              "Performance information, such as latency, page load time, API response time, Web Vitals, frontend errors, backend errors, and provider failures.",
              "Analytics identifiers, such as anonymous ID, session ID, event ID, and hashed user or wallet identifiers.",
            ]),
          ],
        },
        {
          title: "2.4 Market, Sports, News, and Data Provider Information",
          blocks: [
            p(
              t(
                "The Service may collect, receive, or process third-party data, including:"
              )
            ),
            ol([
              "Prediction market data, probabilities, prices, volume, liquidity, order and market metadata.",
              "Football data, team profiles, squads, fixtures, standings, injuries, and schedules.",
              "News metadata, titles, URLs, source names, publication timestamps, snippets, matched teams, and matched keywords.",
              "Odds data, bookmaker names, decimal odds, implied probability, market keys, and update times.",
            ]),
            p(
              t(
                "This data may include public information about teams, players, matches, and markets."
              )
            ),
          ],
        },
        {
          title: "2.5 Cookies, Local Storage, and Similar Technologies",
          blocks: [
            p(
              t(
                "We may use cookies, local storage, session storage, pixels, and similar technologies to:"
              )
            ),
            ol([
              "Maintain sessions.",
              "Remember preferences.",
              "Generate anonymous analytics IDs.",
              "Improve performance and security.",
              "Understand product usage.",
              "Support wallet connection and account functionality.",
            ]),
            p(
              t(
                "You can control cookies through your browser settings, but disabling cookies or storage may affect the Service."
              )
            ),
          ],
        },
      ],
    },
    {
      id: "how-we-use",
      title: "3. How We Use Information",
      blocks: [
        p(t("We may use information to:")),
        ol([
          "Provide, operate, maintain, and improve the Service.",
          "Display market data, team data, odds, news, analytics, dashboards, watchlists, alerts, and portfolio information.",
          "Support user-owned wallet connection, eligibility checks, order previews, order submission status, order history, and portfolio views.",
          "Authenticate users and maintain sessions.",
          "Analyze product usage, growth funnels, feature adoption, conversion, retention, data quality, and performance.",
          "Debug errors, prevent abuse, enforce rate limits, protect security, and monitor system health.",
          "Detect, prevent, investigate, or respond to fraud, unauthorized activity, sanctions risk, abuse, market manipulation, or legal violations.",
          "Communicate with you, respond to requests, and provide support.",
          "Comply with legal obligations, enforce our Terms, and protect rights, safety, and property.",
          "Conduct research, analytics, testing, and product development.",
        ]),
      ],
    },
    {
      id: "analytics",
      title: "4. Analytics and Product Measurement",
      blocks: [
        p(
          t(
            "We use analytics to understand how users interact with the Service and to improve product growth and reliability."
          )
        ),
        p(t("Analytics events may include:")),
        ol([
          "Page views.",
          "Market data loading status.",
          "Data provider failures and fallback usage.",
          "Team detail clicks.",
          "Quick Bid or Bid clicks.",
          "Login clicks.",
          "Wallet connection status.",
          "Section views and team card impressions.",
          "Chart range changes.",
          "Track or watchlist actions.",
          "Order ticket, order preview, order confirmation, and order submission status where enabled.",
        ]),
        p(
          t(
            "Analytics events are intended to avoid sensitive secrets. Wallet addresses should be hashed where used for analytics. Amounts should be bucketed where detailed amounts are not required."
          )
        ),
      ],
    },
    {
      id: "legal-bases",
      title: "5. Legal Bases for Processing",
      blocks: [
        p(
          t(
            "Where applicable privacy laws require a legal basis, we may process personal information based on:"
          )
        ),
        ol([
          "Contract: to provide the Service and perform our Terms.",
          "Legitimate interests: to operate, secure, improve, analyze, and protect the Service.",
          "Consent: where required for cookies, marketing, or certain analytics.",
          "Legal obligations: to comply with applicable laws, sanctions, regulatory obligations, law enforcement requests, and dispute resolution.",
          "Vital or public interests: where necessary to protect safety or prevent harm, if applicable.",
        ]),
      ],
    },
    {
      id: "how-we-share",
      title: "6. How We Share Information",
      blocks: [
        p(t("We may share information with:")),
        ol([
          "Service providers: hosting, infrastructure, database, analytics, security, monitoring, customer support, email, communications, and development vendors.",
          "Third-party integrations: wallet providers, Polymarket, market infrastructure, blockchain networks, relayers, data providers, odds providers, and news providers when needed to provide requested functionality.",
          "Compliance and safety providers: providers that help with eligibility checks, geolocation, sanctions screening, fraud prevention, abuse prevention, and security.",
          "Professional advisers: lawyers, auditors, accountants, insurers, and consultants.",
          "Authorities or legal parties: regulators, courts, law enforcement, government agencies, or other parties when we believe disclosure is required or appropriate under law.",
          "Business transfers: in connection with a merger, acquisition, financing, reorganization, bankruptcy, sale of assets, or similar transaction.",
          "With your direction or consent: when you request or authorize sharing.",
        ]),
        p(
          t(
            "We may also share aggregated, de-identified, or anonymized information that does not reasonably identify you."
          )
        ),
      ],
    },
    {
      id: "blockchain",
      title: "7. Blockchain and Public Data",
      blocks: [
        p(
          t(
            "Blockchain networks are public or semi-public systems. Transactions, wallet addresses, token movements, approvals, positions, and related activity may be visible to third parties and may be permanent or difficult to delete."
          )
        ),
        p(
          t(
            "Prophet does not control blockchain networks, wallet providers, Polymarket, or other third-party market infrastructure. Your interactions with such services may be subject to their own privacy policies and terms."
          )
        ),
      ],
    },
    {
      id: "data-retention",
      title: "8. Data Retention",
      blocks: [
        p(
          t(
            "We retain information for as long as reasonably necessary to provide the Service, comply with legal obligations, resolve disputes, enforce agreements, prevent fraud or abuse, maintain security, support audits, and improve the Service."
          )
        ),
        p(t("Retention periods may vary depending on the type of information:")),
        ol([
          "Analytics event data may be retained for product analysis and growth measurement.",
          "Trading-related audit records may be retained for compliance, security, support, and dispute resolution.",
          "Logs may be retained for security, debugging, monitoring, and fraud prevention.",
          "Account or support communications may be retained as needed to respond to requests and maintain records.",
        ]),
        p(
          t(
            "We may retain aggregated or de-identified information for longer periods."
          )
        ),
      ],
    },
    {
      id: "security",
      title: "9. Security",
      blocks: [
        p(
          t(
            "We use reasonable administrative, technical, and organizational measures designed to protect information. However, no system is completely secure. We cannot guarantee that information will be secure, error-free, or protected from unauthorized access."
          )
        ),
        p(
          t(
            "You are responsible for securing your wallet, private keys, seed phrases, devices, accounts, and credentials. Prophet will never ask you for your private key or seed phrase."
          )
        ),
      ],
    },
    {
      id: "international-transfers",
      title: "10. International Transfers",
      blocks: [
        p(
          t(
            "We may process and store information in the United States and other countries. These countries may have privacy laws different from those in your jurisdiction. Where required, we use appropriate safeguards for international transfers."
          )
        ),
      ],
    },
    {
      id: "your-choices",
      title: "11. Your Choices",
      blocks: [
        p(
          t(
            "Depending on your location and applicable law, you may have choices regarding your information, including:"
          )
        ),
        ol([
          "Accessing, correcting, or deleting certain information.",
          "Objecting to or restricting certain processing.",
          "Withdrawing consent where processing is based on consent.",
          "Opting out of marketing communications.",
          "Managing cookies and local storage through browser settings.",
          "Requesting a copy of certain information.",
        ]),
        p(
          t(
            "To exercise rights, contact us using the information below. We may need to verify your request before responding."
          )
        ),
      ],
    },
    {
      id: "us-state-rights",
      title: "12. U.S. State Privacy Rights",
      blocks: [
        p(
          t(
            "If you are a resident of a U.S. state with applicable privacy laws, including California, Colorado, Connecticut, Utah, Virginia, or other states, you may have rights to:"
          )
        ),
        ol([
          "Know or access personal information collected about you.",
          "Correct inaccurate personal information.",
          "Delete personal information.",
          "Obtain a portable copy of personal information.",
          'Opt out of certain targeted advertising, sale, or sharing of personal information.',
          "Limit the use or disclosure of sensitive personal information where applicable.",
          "Appeal a denied privacy request where required by law.",
        ]),
        p(
          t(
            'We do not knowingly sell personal information for money. We may use analytics or advertising technologies that could be considered "sharing" or targeted advertising under certain state laws. If applicable, we will provide required opt-out mechanisms.'
          )
        ),
        p(t("California Notice at Collection")),
        p(
          t(
            "For California residents, we may collect the categories of personal information described in Section 2, including identifiers, internet or electronic network activity, geolocation at an approximate level, commercial or transaction-related information, inferences, and communications. We collect and use this information for the purposes described in Sections 3 and 4, retain it as described in Section 8, and share it as described in Section 6."
          )
        ),
        p(
          t(
            "California residents may contact us to exercise rights under the California Consumer Privacy Act, as amended by the California Privacy Rights Act."
          )
        ),
      ],
    },
    {
      id: "eea-uk-swiss",
      title: "13. EEA, UK, and Swiss Privacy Rights",
      blocks: [
        p(
          t(
            "If you are located in the European Economic Area, United Kingdom, or Switzerland, you may have rights under applicable data protection laws, including rights to access, rectification, erasure, restriction, portability, objection, and withdrawal of consent."
          )
        ),
        p(
          t(
            "You may also have the right to lodge a complaint with your local data protection authority."
          )
        ),
      ],
    },
    {
      id: "children",
      title: "14. Children's Privacy",
      blocks: [
        p(
          t(
            "The Service is not intended for children or anyone under the age of 18. We do not knowingly collect personal information from children. If you believe a child has provided personal information, contact us and we will take appropriate steps to delete it."
          )
        ),
      ],
    },
    {
      id: "do-not-track",
      title: "15. Do Not Track",
      blocks: [
        p(
          t(
            'Some browsers offer "Do Not Track" signals. There is no uniform industry standard for responding to such signals. Unless required by law, we do not currently respond to Do Not Track signals.'
          )
        ),
      ],
    },
    {
      id: "changes",
      title: "16. Changes to This Privacy Policy",
      blocks: [
        p(
          t(
            'We may update this Privacy Policy from time to time. The updated Privacy Policy will be posted on the Service with a revised "Last Updated" date. If required by law, we may provide additional notice or request consent.'
          )
        ),
        p(
          t(
            "Your continued use of the Service after an updated Privacy Policy becomes effective means you acknowledge the updated Privacy Policy."
          )
        ),
      ],
    },
    {
      id: "contact",
      title: "17. Contact Us",
      blocks: [
        p(t("For privacy questions or requests, contact:")),
        p(t("{legalEntityName}")),
        p(t("{principalAddress}")),
        p(t("Email: {privacyEmail}")),
        p(
          t(
            "If you are located in a jurisdiction that requires a data protection representative or data protection officer, include:"
          )
        ),
        p(t("Data Protection Contact: {dpoContact}")),
      ],
    },
  ],
};
