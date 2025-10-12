# Requirements

## Functional Requirements

**FR1:** Add-in shall load as a persistent task pane in Outlook Web Access that remains open while navigating through emails.

**FR2:** Add-in shall automatically detect and populate contact/client information when an email is selected based on sender email address.

**FR3:** Add-in shall match contacts by exact email address lookup against the contacts database as the primary matching strategy.

**FR4:** Add-in shall fall back to domain-based client matching when email address does not match an existing contact, using the sender's email domain against client domain lists.

**FR5:** Add-in shall display a disambiguation UI when a contact exists at multiple clients, allowing the user to select the correct client context.

**FR6:** Add-in shall automatically create a new contact record when the sender's domain matches a client but the specific email address doesn't exist, pre-filling name from email display name and email address (editable before ticket creation).

**FR7:** Add-in shall display a warning indicator when the matched client is marked as inactive, but allow ticket creation to proceed.

**FR8:** Add-in shall automatically clear and refresh the form when the user selects a different email in Outlook.

**FR9:** Add-in shall provide a manual ticket creation form with fields: Client (dropdown), Contact (dropdown with auto-selection based on matching), Time (default 0.03 hours / 2 minutes), Description (optional), Notes (optional), and "Mark as closed immediately" checkbox.

**FR10:** Add-in form fields shall be pre-filled based on email matching but remain fully editable before ticket submission.

**FR11:** Add-in shall submit tickets to the existing ticketing system REST API using the same endpoints as the web application.

**FR12:** Add-in shall support received emails only in MVP, matching based on the sender's email address.

**FR13:** Add-in shall require authentication with the ticketing system before allowing ticket creation operations.

**FR14:** Add-in shall handle authentication errors gracefully, prompting the user to log in via the web app if session is invalid.

**FR15:** Add-in shall work on macOS using Outlook Web Access in modern browsers (Chrome, Safari, Edge).

## Non-Functional Requirements

**NFR1:** Add-in sidebar shall load and render within 2 seconds of Outlook launch.

**NFR2:** Contact/client matching shall complete within 500ms of email selection.

**NFR3:** Ticket creation submission shall complete within 1 second under normal operating conditions.

**NFR4:** Add-in shall communicate with ticketing system API over HTTPS only.

**NFR5:** Add-in shall not store email content on the backend; email data used only for transient AI processing if user explicitly triggers AI generation.

**NFR6:** Add-in shall handle network failures gracefully with clear error messages and retry capabilities.

**NFR7:** Add-in manifest shall be sideload-compatible for development and testing (no Office Store publishing required for MVP).

**NFR8:** Add-in shall be compatible with modern browsers supporting Office.js API (Chrome, Safari, Edge - latest 2 major versions).

---
