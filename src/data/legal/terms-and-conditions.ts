import { l, ol, p, t } from "@/data/legal/builders";
import type { LegalDocument } from "@/types/legal";

export const termsAndConditionsDocument: LegalDocument = {
  title: "Prophet Terms and Conditions",
  preamble: [
    p(
      t(
        'These Terms and Conditions (the "Terms") govern your access to and use of Prophet, including the website, web application, dashboards, analytics tools, market data pages, team pages, watchlist or tracking features, trading-related interfaces, APIs, and related services that link to these Terms (collectively, the "Service").'
      )
    ),
    p(
      t(
        "The Service is operated by {legalEntityName}, a {entityJurisdiction} with its principal place of business at {principalAddress} (\"Prophet,\" \"we,\" \"us,\" or \"our\")."
      )
    ),
    p(
      t(
        "Please read these Terms carefully. By accessing or using the Service, connecting a wallet, creating or using an account, clicking to accept these Terms, or otherwise using any part of the Service, you agree to be bound by these Terms. If you do not agree, do not use the Service."
      )
    ),
    p(
      t(
        "These Terms contain important disclaimers, eligibility requirements, risk disclosures, and limitations of liability. They also include an arbitration agreement and class action waiver where permitted by law."
      )
    ),
  ],
  sections: [
    {
      id: "product-notice",
      title: "1. Important Product Notice",
      blocks: [
        p(
          t(
            "Prophet is a consumer-facing World Cup prediction market data analysis and user-owned trading interface. The Service is designed to help users view, analyze, and understand market sentiment, probabilities, market movement, team-level context, news context, odds comparisons, watchlists, portfolio information, and related analytics."
          )
        ),
        p(
          t(
            "Prophet is not a sportsbook, broker-dealer, investment adviser, financial adviser, commodity trading adviser, exchange, prediction market, custodian, wallet provider, or gambling operator. Prophet does not create, operate, or settle Polymarket markets. Prophet does not custody user funds and does not pool user funds."
          )
        ),
        p(
          t(
            "Any trading-related functionality is intended to help eligible users interact with third-party services using their own account, wallet, signer, credentials, and funds. Prophet does not guarantee that any transaction, order, trade, transfer, wallet connection, deposit, withdrawal, or market interaction will be accepted, executed, matched, settled, or profitable."
          )
        ),
      ],
    },
    {
      id: "no-advice",
      title: "2. No Investment, Financial, Gambling, Betting, Legal, or Tax Advice",
      blocks: [
        p(
          t(
            "All content, analytics, probabilities, odds, market signals, dashboards, team rankings, news context, summaries, alerts, watchlist information, order previews, estimated payouts, or other outputs made available through the Service are provided for informational and educational purposes only."
          )
        ),
        p(
          t(
            "Prophet does not provide investment advice, financial advice, gambling advice, betting advice, legal advice, tax advice, or recommendations to buy, sell, hold, trade, deposit, withdraw, or otherwise transact. Nothing in the Service should be interpreted as a recommendation, solicitation, guarantee, endorsement, or prediction of any outcome."
          )
        ),
        p(
          t(
            "Market probabilities, prices, odds, and signals are estimates derived from third-party data or market information and may be incomplete, stale, inaccurate, delayed, unavailable, or misinterpreted. You are solely responsible for your own decisions."
          )
        ),
      ],
    },
    {
      id: "eligibility",
      title: "3. Eligibility",
      blocks: [
        p(
          t(
            "You may use the Service only if you are legally permitted to do so under all laws, rules, and regulations applicable to you."
          )
        ),
        p(t("By using the Service, you represent and warrant that:")),
        ol([
          "You are at least 18 years old or the age of legal majority in your jurisdiction, whichever is higher.",
          "You have full legal capacity and authority to enter into these Terms.",
          "You are not located in, ordinarily resident in, incorporated in, or otherwise subject to the laws of any jurisdiction where access to the Service, prediction markets, Polymarket, wallet-based trading, or related activity is prohibited or restricted.",
          "You are not subject to any sanctions administered or enforced by the United States, the United Nations, the European Union, the United Kingdom, or any other applicable sanctions authority.",
          "You will not use the Service on behalf of any prohibited person or entity.",
          "You will comply with all applicable laws, including laws relating to commodities, derivatives, financial markets, gambling, gaming, sanctions, anti-money laundering, consumer protection, privacy, and taxation.",
        ]),
        p(
          t(
            "We may restrict, suspend, or terminate access to the Service or any trading-related functionality at any time if we believe, in our sole discretion, that you are ineligible, restricted, or using the Service in violation of these Terms or applicable law."
          )
        ),
      ],
    },
    {
      id: "geographic-restrictions",
      title: "4. Geographic Restrictions and Polymarket Eligibility",
      blocks: [
        p(
          t(
            "The Service may include interfaces or links that allow eligible users to interact with Polymarket or other third-party market infrastructure. Polymarket and related third-party services may impose their own eligibility rules, geographic restrictions, sanctions screening, account requirements, wallet requirements, and trading restrictions."
          )
        ),
        p(
          t(
            "You are solely responsible for determining whether you are eligible to access or use Polymarket or any other third-party service. Orders or transactions may be blocked, rejected, cancelled, or otherwise unavailable based on geographic eligibility, sanctions screening, account status, market status, insufficient funds, stale prices, market limits, technical issues, or third-party rules."
          )
        ),
        p(
          t(
            "Prophet may perform eligibility checks, geolocation checks, wallet checks, or other compliance-related checks before enabling trading-related functionality. These checks are not a guarantee that you are legally permitted to trade or that a third-party service will accept any order or transaction."
          )
        ),
        p(
          t(
            "You must not attempt to circumvent geoblocking, eligibility checks, sanctions controls, third-party restrictions, wallet restrictions, or any other access control, including through VPNs, proxies, false information, or unauthorized accounts."
          )
        ),
      ],
    },
    {
      id: "third-party",
      title: "5. Third-Party Services",
      blocks: [
        p(
          t(
            "The Service may display or interact with data, APIs, protocols, wallets, relayers, market venues, blockchain networks, exchanges, news providers, odds providers, analytics services, data vendors, or other third-party services, including Polymarket, API-Football, GDELT, The Odds API, wallet providers, Polygon, and other services."
          )
        ),
        p(
          t(
            "Third-party services are not controlled by Prophet. Your use of third-party services is governed by their own terms, policies, fees, restrictions, and risk disclosures. Prophet is not responsible for third-party services, third-party content, third-party data, third-party market outcomes, third-party order execution, third-party settlement, third-party wallet behavior, third-party fees, outages, errors, losses, or restrictions."
          )
        ),
        p(
          t(
            "Links, integrations, market data, odds, or references to third-party services do not imply endorsement, sponsorship, partnership, or recommendation unless expressly stated in writing."
          )
        ),
      ],
    },
    {
      id: "wallets",
      title: "6. User-Owned Wallets, Accounts, Credentials, and Funds",
      blocks: [
        p(
          t(
            "Real order flows, if enabled, must use the user's own wallet, account, signer, deposit wallet or funder, funds, and explicit confirmation. Prophet does not permit user trades to be signed with a shared platform wallet, server private key, pooled funds, or deployment-level credentials."
          )
        ),
        p(t("You are solely responsible for:")),
        ol([
          "Maintaining the security of your wallet, private keys, seed phrases, passkeys, devices, accounts, API credentials, and authentication methods.",
          "Reviewing all order details before confirmation, including market, outcome, side, limit price, size, estimated cost, potential outcome, fees if shown, account, wallet, and network.",
          "Ensuring that you have sufficient funds, balances, approvals, and allowances.",
          "Understanding blockchain, wallet, market, and prediction market risks.",
          "Complying with any third-party terms and eligibility requirements.",
        ]),
        p(
          t(
            "Prophet will never ask you to disclose your private key or seed phrase. If you disclose private keys, seed phrases, or sensitive credentials to any person, website, application, or third party, you may permanently lose access to your assets."
          )
        ),
      ],
    },
    {
      id: "trading-risks",
      title: "7. Trading and Market Risks",
      blocks: [
        p(
          t(
            "Prediction markets, blockchain transactions, wallet-based transactions, and market data tools involve significant risks. You may lose the entire amount you choose to commit to a position. Market outcomes are uncertain. Prices may move rapidly. Liquidity may be limited. Markets may be suspended, resolved unexpectedly, disputed, cancelled, delayed, or otherwise affected by third-party rules or technical issues."
          )
        ),
        p(
          t(
            "Order previews and estimated outcomes are estimates only. They may not reflect final execution price, fees, slippage, partial fills, stale prices, rejected orders, market resolution, wallet status, network conditions, or third-party errors."
          )
        ),
        p(
          t(
            "You acknowledge and accept all risks arising from your use of the Service and any third-party services."
          )
        ),
      ],
    },
    {
      id: "market-data",
      title: "8. Market Data, Odds, News, and Analytics",
      blocks: [
        p(
          t(
            "The Service may display market prices, probabilities, volume, liquidity, price changes, market signals, odds, news, team data, historical data, rankings, schedules, injuries, squads, alerts, and other analytics. Such information may be sourced from third parties, generated by our systems, curated manually, cached, estimated, delayed, incomplete, inaccurate, stale, or unavailable."
          )
        ),
        p(
          t(
            "We do not guarantee the accuracy, completeness, timeliness, availability, or reliability of any data. We may label data as live, cached, fallback, mock, unavailable, or error state when known, but those labels may themselves be delayed or inaccurate."
          )
        ),
        p(
          t(
            "News impact, sentiment, odds mismatch, market signals, or similar features are analytical context only. They should not be treated as causal conclusions, trading advice, betting advice, or recommendations."
          )
        ),
      ],
    },
    {
      id: "accounts",
      title: "9. Accounts and Authentication",
      blocks: [
        p(
          t(
            "Certain features may require authentication, wallet connection, account creation, or third-party authorization. You agree to provide accurate information and to keep your account and authentication methods secure."
          )
        ),
        p(
          t(
            "We may refuse, suspend, restrict, or terminate access to accounts or features if we believe that your use is unlawful, harmful, fraudulent, abusive, ineligible, restricted, or otherwise violates these Terms."
          )
        ),
      ],
    },
    {
      id: "acceptable-use",
      title: "10. Acceptable Use",
      blocks: [
        p(t("You agree not to:")),
        ol([
          "Use the Service in violation of any law, regulation, sanctions program, third-party terms, or these Terms.",
          "Use the Service if you are ineligible, geoblocked, sanctioned, or otherwise restricted.",
          "Circumvent eligibility, geolocation, sanctions, rate limit, wallet, authentication, or security controls.",
          "Use bots, scrapers, crawlers, automated trading systems, or automated access methods without our prior written consent.",
          "Interfere with, disrupt, overload, or compromise the Service or related systems.",
          "Attempt to access non-public systems, data, accounts, credentials, keys, logs, or infrastructure.",
          "Reverse engineer, decompile, or otherwise attempt to derive source code except where permitted by law.",
          "Upload or transmit malicious code, spam, phishing content, or harmful materials.",
          "Misrepresent your identity, location, eligibility, affiliation, or authority.",
          "Use the Service to facilitate fraud, market manipulation, wash trading, illegal gambling, money laundering, sanctions evasion, or other unlawful activity.",
          "Remove, obscure, or alter legal notices, risk disclosures, or data source labels.",
        ]),
      ],
    },
    {
      id: "fees",
      title: "11. Fees, Gas, Network Costs, and Third-Party Charges",
      blocks: [
        p(
          t(
            "Prophet may display estimated costs, order amounts, potential outcomes, or other economic information. Such estimates may exclude or inaccurately reflect fees, spread, slippage, gas, network charges, third-party fees, relayer costs, wallet fees, or taxes."
          )
        ),
        p(
          t(
            "Third-party services may charge fees. Blockchain networks may require gas or transaction fees. You are solely responsible for all fees, costs, taxes, and charges associated with your activity."
          )
        ),
      ],
    },
    {
      id: "taxes",
      title: "12. Taxes",
      blocks: [
        p(
          t(
            "You are solely responsible for determining, reporting, and paying any taxes, duties, or governmental charges arising from your use of the Service, third-party services, wallet activity, market activity, or transactions."
          )
        ),
        p(
          t(
            "Prophet does not provide tax advice and does not guarantee that any information displayed through the Service is suitable for tax reporting."
          )
        ),
      ],
    },
    {
      id: "ip",
      title: "13. Intellectual Property",
      blocks: [
        p(
          t(
            "The Service, including software, design, interfaces, logos, graphics, text, data compilations, analytics, and other content, is owned by Prophet or its licensors and is protected by intellectual property laws."
          )
        ),
        p(
          t(
            "Subject to these Terms, we grant you a limited, revocable, non-exclusive, non-transferable, non-sublicensable license to access and use the Service for your personal, lawful, non-commercial use, unless otherwise agreed in writing."
          )
        ),
        p(
          t(
            "You may not copy, modify, distribute, sell, lease, sublicense, create derivative works from, or exploit any part of the Service except as expressly permitted by these Terms or applicable law."
          )
        ),
      ],
    },
    {
      id: "feedback",
      title: "14. Feedback",
      blocks: [
        p(
          t(
            "If you provide feedback, suggestions, ideas, or recommendations, you grant Prophet a worldwide, perpetual, irrevocable, royalty-free, sublicensable, transferable license to use, reproduce, modify, distribute, display, and otherwise exploit that feedback without restriction or compensation."
          )
        ),
      ],
    },
    {
      id: "privacy",
      title: "15. Privacy",
      blocks: [
        p(
          t("Your use of the Service is subject to our "),
          l("Privacy Policy", "/privacy-policy"),
          t(
            ", which explains how we collect, use, disclose, and protect information. By using the Service, you acknowledge our Privacy Policy."
          )
        ),
      ],
    },
    {
      id: "availability",
      title: "16. Service Availability and Changes",
      blocks: [
        p(
          t(
            "We may modify, suspend, restrict, discontinue, or remove any part of the Service at any time, with or without notice. We do not guarantee continuous, uninterrupted, secure, or error-free availability."
          )
        ),
        p(
          t(
            "We may update market coverage, data sources, features, pricing displays, analytics, trading interfaces, eligibility checks, and other parts of the Service at any time."
          )
        ),
      ],
    },
    {
      id: "disclaimers",
      title: "17. Disclaimers",
      blocks: [
        p(
          t(
            'THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. TO THE MAXIMUM EXTENT PERMITTED BY LAW, PROPHET DISCLAIMS ALL WARRANTIES, WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, NON-INFRINGEMENT, ACCURACY, AVAILABILITY, SECURITY, RELIABILITY, AND COURSE OF DEALING.'
          )
        ),
        p(
          t(
            "WE DO NOT WARRANT THAT THE SERVICE, DATA, ANALYTICS, THIRD-PARTY SERVICES, WALLET CONNECTIONS, ORDER FLOWS, OR MARKET INFORMATION WILL BE ACCURATE, COMPLETE, TIMELY, AVAILABLE, SECURE, ERROR-FREE, UNINTERRUPTED, OR SUITABLE FOR YOUR PURPOSES."
          )
        ),
      ],
    },
    {
      id: "limitation-of-liability",
      title: "18. Limitation of Liability",
      blocks: [
        p(
          t(
            "TO THE MAXIMUM EXTENT PERMITTED BY LAW, PROPHET AND ITS AFFILIATES, DIRECTORS, OFFICERS, EMPLOYEES, CONTRACTORS, AGENTS, LICENSORS, AND SERVICE PROVIDERS WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, ENHANCED, OR PUNITIVE DAMAGES, LOST PROFITS, LOST REVENUE, LOST DATA, LOSS OF GOODWILL, TRADING LOSSES, MARKET LOSSES, LOST OPPORTUNITIES, WALLET LOSSES, UNAUTHORIZED ACCESS, THIRD-PARTY FAILURES, OR OTHER DAMAGES ARISING OUT OF OR RELATING TO THE SERVICE OR THESE TERMS, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES."
          )
        ),
        p(
          t(
            "TO THE MAXIMUM EXTENT PERMITTED BY LAW, OUR TOTAL LIABILITY FOR ALL CLAIMS ARISING OUT OF OR RELATING TO THE SERVICE OR THESE TERMS WILL NOT EXCEED THE GREATER OF US$100 OR THE AMOUNT YOU PAID DIRECTLY TO PROPHET FOR THE SERVICE IN THE THREE MONTHS BEFORE THE EVENT GIVING RISE TO THE CLAIM."
          )
        ),
        p(
          t(
            "Some jurisdictions do not allow certain limitations of liability. In such jurisdictions, liability will be limited to the maximum extent permitted by law."
          )
        ),
      ],
    },
    {
      id: "indemnification",
      title: "19. Indemnification",
      blocks: [
        p(
          t(
            "You agree to defend, indemnify, and hold harmless Prophet and its affiliates, directors, officers, employees, contractors, agents, licensors, and service providers from and against any claims, damages, losses, liabilities, costs, and expenses, including reasonable attorneys' fees, arising out of or relating to:"
          )
        ),
        ol([
          "Your use of the Service.",
          "Your use of third-party services.",
          "Your wallet, account, credentials, funds, orders, transactions, or market activity.",
          "Your violation of these Terms.",
          "Your violation of applicable law or third-party rights.",
          "Your misrepresentation of eligibility, location, identity, or authority.",
        ]),
      ],
    },
    {
      id: "termination",
      title: "20. Termination",
      blocks: [
        p(
          t(
            "We may suspend, restrict, or terminate your access to the Service at any time, with or without notice, if we believe you violated these Terms, are ineligible, present risk to the Service or other users, or for any other lawful reason."
          )
        ),
        p(
          t(
            "Upon termination, your right to use the Service will immediately cease. Sections that by their nature should survive termination will survive, including risk disclosures, disclaimers, limitations of liability, indemnification, dispute resolution, intellectual property, and privacy-related provisions."
          )
        ),
      ],
    },
    {
      id: "governing-law",
      title: "21. Governing Law",
      blocks: [
        p(
          t(
            "These Terms are governed by the laws of {governingLawJurisdiction}, without regard to conflict of law principles, except to the extent that applicable law requires otherwise."
          )
        ),
      ],
    },
    {
      id: "dispute-resolution",
      title: "22. Dispute Resolution; Arbitration; Class Action Waiver",
      blocks: [
        p(
          t(
            "Please review this section with legal counsel before publication."
          )
        ),
        p(
          t(
            "To the maximum extent permitted by law, any dispute, claim, or controversy arising out of or relating to these Terms or the Service will be resolved by binding arbitration administered by {arbitrationProvider} under its applicable rules. The seat, venue, and language of arbitration will be {arbitrationSeatLanguage}."
          )
        ),
        p(
          t(
            "You and Prophet agree that disputes will be resolved only on an individual basis and not as a class, collective, consolidated, representative, or private attorney general action, except where prohibited by law."
          )
        ),
        p(
          t(
            "Either party may seek injunctive or equitable relief in a court of competent jurisdiction to protect intellectual property, confidential information, security, or unauthorized use of the Service."
          )
        ),
        p(
          t(
            "If this arbitration or class action waiver section is found unenforceable, the unenforceable portion will be severed and the remainder of these Terms will remain in effect."
          )
        ),
      ],
    },
    {
      id: "changes",
      title: "23. Changes to These Terms",
      blocks: [
        p(
          t(
            'We may update these Terms from time to time. The updated Terms will be posted on the Service with a revised "Last Updated" date. If we make material changes, we may provide additional notice where required by law.'
          )
        ),
        p(
          t(
            "Your continued use of the Service after updated Terms become effective means you accept the updated Terms. If you do not agree, you must stop using the Service."
          )
        ),
      ],
    },
    {
      id: "miscellaneous",
      title: "24. Miscellaneous",
      blocks: [
        p(
          t(
            "These Terms, together with the Privacy Policy and any additional terms incorporated by reference, constitute the entire agreement between you and Prophet regarding the Service."
          )
        ),
        p(
          t(
            "If any provision is found invalid or unenforceable, the remaining provisions will remain in full force and effect. Our failure to enforce any provision is not a waiver. You may not assign these Terms without our prior written consent. We may assign these Terms as part of a merger, acquisition, corporate reorganization, sale of assets, or by operation of law."
          )
        ),
      ],
    },
    {
      id: "contact",
      title: "25. Contact",
      blocks: [
        p(t("For questions about these Terms, contact:")),
        p(t("{legalEntityName}")),
        p(t("{principalAddress}")),
        p(t("Email: {legalEmail}")),
      ],
    },
  ],
};
