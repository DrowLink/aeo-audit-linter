# Privacy Policy for AEO Linter

*Last updated: August 2026*

**AEO Linter** ("the Extension") is committed to protecting your privacy. This Privacy Policy explains how our Chrome Extension handles user data.

---

### 1. Data Collection and Usage
- **No Personal Data Collected**: AEO Linter does not collect, store, transmit, or share any personal information, browsing history, user credentials, or IP addresses.
- **Local Execution**: All audits, evaluations, and DOM analyses are performed entirely and deterministically within your local browser environment.
- **No Remote Transmission**: The data extracted from the active web page (such as meta tags, headings, schema markup, and robots.txt rules) is processed in memory solely to display the audit report in the Chrome DevTools panel and is never sent to external servers or third-party services.

---

### 2. Permissions Justification
- **`activeTab` / `scripting`**: Used exclusively to inspect and audit the current webpage when you open the "AEO Audit" panel and initiate an evaluation.
- **`storage`**: Used strictly for local caching of user audit preferences or report histories within your local browser storage.
- **`devtools_page`**: Used solely to create and integrate the dedicated audit interface within Chrome Developer Tools.
- **Host Permissions (`<all_urls>`)**: Required to allow developers to run audits on any URL/page inspected in DevTools.

---

### 3. Third-Party Services
AEO Linter does not use third-party analytics, tracking scripts, advertising networks, or external telemetry of any kind.

---

### 4. Changes to This Policy
If we update this Privacy Policy, the revised version will be published in the open-source repository at [https://github.com/DrowLink/aeo-audit-linter](https://github.com/DrowLink/aeo-audit-linter).

---

### 5. Contact
If you have any questions or feedback about this Privacy Policy, please open an issue in the official [GitHub repository](https://github.com/DrowLink/aeo-audit-linter/issues).
