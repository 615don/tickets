# Brainstorming Session Results

**Session Date:** 2025-10-12
**Facilitator:** Business Analyst Mary 📊
**Participant:** User

---

## Executive Summary

**Topic:** AI-Powered Email Summarization for Outlook Add-in Ticket Creation

**Session Goals:** Explore AI summarization feature design and implementation approaches for reducing friction in ticket note creation, with balanced focus on specifics to produce actionable PM documentation

**Techniques Used:**
- Five Whys (10 min) - Problem depth exploration
- SCAMPER Method (20 min) - Systematic feature variation
- Role Playing (15 min) - Stakeholder perspective validation

**Total Ideas Generated:** 25+ distinct concepts across feature design, implementation, and future expansion

**Key Themes Identified:**
- **Friction Reduction Over Perfection** - Feature goal is removing busywork, not creating high-quality documentation
- **Proactive Automation** - Auto-generate on contact match to eliminate manual triggers
- **Minimal UI Additions** - Outlook add-in space constraints favor invisible/automatic features
- **Leverage Existing Infrastructure** - Build on existing contact matching, open ticket display, backend settings
- **Quality Upgrade Side Effect** - AI summaries likely better than current practice (using email subject lines)
- **Future Extensibility** - Model configurability and attachment processing as Phase 2

---

## Technique Sessions

### Five Whys - 10 minutes

**Description:** Deep dive into root problem to understand true motivations beyond surface request

**Ideas Generated:**

1. **Surface problem:** Don't want to spend time/energy creating ticket notes
2. **Deeper layer:** Notes are low-importance defensive documentation for rare billing disputes - just need "something" for reference
3. **Core emotional issue:** User *hates* making notes, not just finding them inefficient
4. **Root cause:** Busywork creates friction in a job being tolerated while planning 5-year career transition
5. **Why solve it now:** Five years is long enough that reducing friction is worthwhile investment

**Insights Discovered:**

- This isn't about creating high-quality notes - it's about **removing friction from tedious tasks**
- The bar for "good enough" is intentionally low - just need memory joggers for rare billing dispute conversations
- Speed and ease of use matter far more than summary perfection or comprehensiveness
- Solution should minimize cognitive load and context switching from enjoyable work
- Emotional experience (reducing hate/frustration) is as important as time savings

**Notable Connections:**

- Career transition context explains "good enough" acceptance criteria - not building for 20-year legacy
- Rare billing disputes mean notes are defensive documentation, not primary value creation
- Current practice (using email subject lines) sets a very low quality bar that AI will easily exceed

---

### SCAMPER Method - 20 minutes

**Description:** Systematic exploration of feature variations using Substitute, Combine, Adapt, Modify, Put to other uses, Eliminate, Reverse prompts

#### S - Substitute Ideas

1. **Conditional automatic generation** - Only auto-generate when contact match exists to prevent token waste on junk/vendor/partner emails
2. **Voice-to-text substitution** - Not needed; already using Superwhisper effectively
3. **Metadata extraction** - Insufficient for notes field; need actual content summaries
4. **Proactive generation timing** - Generate immediately when contact matches (vs. just-in-time or batch)
5. **Single quality tier** - Only "quick summary" mode; no detailed/custom options needed

#### C - Combine Ideas

6. **Suggested billable hours** - AI estimates time from email content (low risk since user reviews anyway)
7. **Multi-email thread summarization** - Default behavior to create coherent single description from entire conversation
8. **Learning from past patterns** - Simple approach: include 3-5 recent similar tickets as few-shot examples in prompt (80% benefit, minimal complexity)
9. **~~Categories/tags~~** - Not applicable; system doesn't use these

#### A - Adapt Ideas

10. **Email sanitization (reader mode pattern)** - Strip signatures, disclaimers, legal footers before AI processing to reduce tokens and noise
11. **Two distinct outputs:**
    - **Description/Title:** One-line, invoice-friendly (fits on billing line item)
    - **Notes:** Summary of email thread for reference/memory jogging
12. **Minimal UI constraint** - Outlook add-in has severe space limitations, already nearly full
13. **Auto-populate immediately (Option A)** - Fill form fields right away so user can verify AI summary jogs memory before submission

#### M - Modify/Magnify Ideas

14. **Attachment summarization (Phase 2)** - Include PDFs and .doc(x) files; ignore inline images; only process attached images if identifiable as screenshots (ship later)
15. **Smart minification** - Don't over-summarize short emails; keep output proportional to input
16. **Single model strategy** - Use GPT-5 mini for everything (no dynamic model switching)
17. **Model configurability** - Build in ability to change models in future

#### P - Put to Other Uses Ideas

18. **AI for ticket updates** - Use same summarization when adding emails to existing tickets (leverage recently-shipped update capability)
19. **AI-powered ticket matching** - Determine if new email relates to existing open ticket and suggest with confidence UI: "This seems related to Ticket #123 - use this one?" with accept/reject

#### E - Eliminate Ideas

20. **System-wide API key** - Single API key (not per-user), with interface for entry/update
21. **Default system prompt with editability** - Start with good default, but make changeable over time (avoid hard-coding)
22. **Eliminate manual generation button** - Always proactive; okay creating first ticket manually per contact
23. **Keep edit capability** - Must be able to directly edit AI output (regeneration-only would be frustrating)
24. **Admin settings on website (Option A)** - Add API key + system prompt to existing settings page; store in backend DB; add-in retrieves via existing API

#### R - Reverse/Rearrange Ideas

25. No compelling reversal/rearrangement ideas identified

**Insights Discovered:**

- **Proactive + minimal UI = perfect fit** - Auto-generation on contact-match eliminates need for buttons/controls in cramped add-in space
- **Phase 2 strategy** - Ship email summarization first, add attachment processing later for faster initial value
- **Infrastructure leverage** - Existing contact matching, open ticket display, backend settings page, and API connections reduce implementation complexity
- **Single model simplicity** - GPT-5 mini for all cases avoids decision complexity while maintaining future flexibility

**Notable Connections:**

- Contact-match gating solves both token cost (no junk email processing) and UX activation (only for actual tickets)
- AI ticket matching builds naturally on existing "show open tickets for client" feature
- Website settings page already exists for accounting integration - natural home for AI config

---

### Role Playing - 15 minutes

**Description:** Consider feature from different stakeholder perspectives to identify missed concerns or opportunities

#### Perspective 1: Future You (2-3 years, closer to career exit)

**Ideas Generated:**

- Grateful for time saved on busywork that doesn't matter
- Wish I'd automated/offloaded even more business processes in general
- No specific future-proofing concerns identified

**Insights:**
- Core value proposition holds over time
- Suggests appetite for additional automation features beyond this initial AI implementation

#### Perspective 2: Your Client (receiving invoices)

**Ideas Generated:**

- Won't likely notice AI vs. manual generation (AI quality is excellent in 2025)
- **Probably prefer AI descriptions** over current default practice (using email subject line)
- Most people write terrible email subjects, so AI is quality upgrade not just time-saver
- Manual override capability for line items provides trust/safety net for incorrect entries

**Insights:**
- **AI summaries are a quality improvement** for clients, not just an efficiency gain for user
- Current practice (email subject as ticket description) is acknowledged as poor quality
- Validates that "good enough" bar is actually quite low

#### Perspective 3: IT Security/Privacy Conscious User

**Ideas Generated:**

- No major concerns - user is third-party IT so confidential/personal info shouldn't be in emails anyway
- Email sanitization (signature stripping) is sufficient
- No special compliance requirements (GDPR, etc.)
- No opt-out mechanism needed

**Insights:**
- Security/privacy concerns are minimal for this use case
- Third-party IT context means less sensitive data exposure risk
- Simplifies implementation - no need for complex PII detection or opt-out flows

**Notable Connections:**

- Future automation appetite suggests this could be pilot for broader AI integration
- Client quality perspective reframes this from "automation" to "quality improvement"
- Security simplicity removes potential implementation blockers

---

## Idea Categorization

### Immediate Opportunities
*Ideas ready to implement now*

1. **Proactive AI Generation on Contact Match**
   - Description: Automatically generate ticket description + notes when email sender matches existing contact; no manual button needed
   - Why immediate: Leverages existing contact-matching logic; eliminates UI space problem; solves token waste on junk emails
   - Resources needed: OpenAI API integration, contact-match event hook, email sanitization logic

2. **Two-Output Generation (Description + Notes)**
   - Description: Generate one-line invoice-friendly description AND detailed notes from same email thread
   - Why immediate: Core requirement; both outputs use same AI call (efficient); clear user need
   - Resources needed: Dual-purpose prompt engineering, form field auto-population

3. **Email Sanitization Pipeline**
   - Description: Strip signatures, disclaimers, legal footers before sending to AI (reader mode pattern)
   - Why immediate: Reduces token costs, improves summary quality, relatively straightforward parsing
   - Resources needed: Email parsing library, signature detection patterns

4. **Multi-Email Thread Summarization**
   - Description: Combine entire email chain into single coherent summary (default behavior)
   - Why immediate: Email threads are common; single summary more useful than just latest email; Outlook API provides thread access
   - Resources needed: Thread retrieval logic, prompt engineering for coherence across messages

5. **Immediate Auto-Population (Option A)**
   - Description: Fill description + notes fields immediately after generation so user can verify memory-jogging effectiveness
   - Why immediate: Critical UX validation step; prevents frustration of unhelpful summaries; simple form population
   - Resources needed: Form field access from API response

6. **Admin Settings UI for API Key + System Prompt**
   - Description: Add configuration fields to existing website settings page; store in backend DB; add-in retrieves via API
   - Why immediate: Must exist for feature to function; leverages existing settings infrastructure; enables future iteration
   - Resources needed: Backend settings table/fields, frontend settings form additions, API endpoint for retrieval

7. **Direct Edit Capability**
   - Description: Allow user to directly edit AI-generated description + notes before submission
   - Why immediate: Critical safety valve for incorrect summaries; prevents regeneration frustration; standard form behavior
   - Resources needed: Editable form fields (likely already exists)

8. **GPT-5 Mini as Default Model**
   - Description: Use GPT-5 mini for all summarization tasks
   - Why immediate: Current best balance of quality/cost; user preference; simplifies initial implementation
   - Resources needed: OpenAI API credentials, GPT-5 mini endpoint integration

---

### Future Innovations
*Ideas requiring development/research*

9. **Suggested Billable Hours from Email Content**
   - Description: AI estimates time based on email complexity/scope and populates time field
   - Development needed: Prompt engineering for time estimation, calibration against historical data, accuracy testing
   - Timeline estimate: Phase 1.5 or Phase 2 (after core summarization proven)

10. **AI-Powered Ticket Matching with Confidence UI**
    - Description: When new email arrives, AI suggests existing open ticket it relates to: "This seems related to Ticket #123 - use this one?" with accept/reject
    - Development needed: Semantic similarity logic, confidence scoring, UI for suggestion/acceptance, integration with existing open-ticket display
    - Timeline estimate: Phase 2 (requires core summarization working well first)

11. **AI Summarization for Ticket Updates**
    - Description: Apply same AI generation when adding new emails to existing tickets (recently shipped update capability)
    - Development needed: Extend summarization to update flow, prompt adjustment for "additional context" vs. "new ticket"
    - Timeline estimate: Phase 2 (natural extension after initial implementation)

12. **Simple Pattern Learning (Few-Shot Examples)**
    - Description: Include 3-5 recent similar tickets in AI prompt as examples to match user's style
    - Development needed: Similarity search for relevant past tickets, prompt template for few-shot examples, performance testing to ensure no slowdown
    - Timeline estimate: Phase 2 or 3 (optimization after core value proven)

13. **Smart Minification for Short Emails**
    - Description: Adjust summary length/detail proportionally to input length (don't over-summarize 2-sentence emails)
    - Development needed: Email length classification, conditional prompt templates, quality testing across email sizes
    - Timeline estimate: Phase 2 (quality enhancement)

14. **Model Configurability**
    - Description: Build setting to change AI model in future (not just hard-code GPT-5 mini)
    - Development needed: Model selection dropdown in settings, dynamic API endpoint routing, testing across models
    - Timeline estimate: Phase 1 or 2 (architectural decision - easier if built from start)

---

### Moonshots
*Ambitious, transformative concepts*

15. **Attachment Summarization (PDFs, .doc(x), Screenshots)**
    - Description: Include document and image attachments in summarization; ignore inline images; detect screenshots among attached images
    - Transformative potential: Captures full context of ticket (email + supporting docs); handles common "see attached" emails; significantly improves memory-jogging
    - Challenges to overcome: OCR/document parsing complexity, image analysis (screenshot detection), token costs for large documents, processing latency, multimodal model requirements
    - Timeline estimate: Phase 3+ (significant complexity increase)

16. **Broader Business Process Automation**
    - Description: Apply AI automation to other repetitive business tasks beyond ticket creation
    - Transformative potential: Addresses "wish I'd automated more" future regret; compounds time savings; reduces overall job friction
    - Challenges to overcome: Identifying highest-value automation opportunities, integration complexity, scope creep management
    - Timeline estimate: Post-Phase 3 (based on learnings from ticket AI)

---

### Insights & Learnings
*Key realizations from the session*

- **Emotional Design Matters**: The solution must address the "hate" of busywork, not just save time. User experience of friction removal is primary success metric.

- **Good Enough is a Feature**: Low bar for quality ("just need something") enables aggressive simplification. Don't over-engineer for perfection.

- **Proactive > Manual**: Auto-triggering on contact-match solves three problems simultaneously: eliminates button (UI space), prevents token waste (only real tickets), removes decision fatigue (one less thing to think about).

- **Existing Infrastructure is Gold**: Contact matching, open ticket display, backend settings page, and API connections make this feature much simpler than greenfield. Always check what already exists.

- **AI as Quality Upgrade**: Reframing from "automation" to "quality improvement" (better than email subject lines) strengthens value proposition to clients, not just user.

- **Phase 2 Discipline**: Clear separation of Phase 1 (email summarization) vs. Phase 2 (attachments, ticket matching, updates) prevents scope creep while maintaining future vision.

- **Model Flexibility Future-Proofs**: Even while choosing GPT-5 mini now, building configurability prepares for rapid AI model evolution without code changes.

- **Career Context Informs Design**: 5-year timeline and career transition plans explain "good enough" acceptance criteria and hint at broader automation appetite.

---

## Action Planning

### Top 3 Priority Ideas

#### #1 Priority: Core Proactive Email Summarization (MVP)

**Rationale:** This is the foundational feature that delivers immediate friction reduction. Includes: contact-match triggering, email sanitization, dual output (description + notes), thread summarization, immediate auto-population, edit capability, GPT-5 mini integration.

**Next steps:**
1. Set up OpenAI API integration with GPT-5 mini
2. Implement email sanitization pipeline (signature/footer stripping)
3. Build prompt template for dual output (one-line description + notes)
4. Hook into contact-match event to trigger generation
5. Auto-populate form fields with immediate display
6. Test with real email threads across various lengths/complexities

**Resources needed:**
- OpenAI API account and credits
- Access to Outlook add-in codebase and contact-match logic
- Email parsing library for sanitization
- Prompt engineering expertise
- QA testing with real user emails

**Timeline:** Phase 1 - 2-4 weeks for MVP

---

#### #2 Priority: Admin Settings Configuration UI

**Rationale:** Required infrastructure for MVP to function. Enables API key management and system prompt iteration without code deployments. Leverages existing settings page.

**Next steps:**
1. Add database fields for AI API key and system prompt
2. Create settings form UI on existing website settings page
3. Build backend API endpoint for add-in to retrieve config
4. Implement secure storage for API key (encryption at rest)
5. Document default system prompt and editing guidelines

**Resources needed:**
- Backend database access
- Frontend settings page code access
- Security review for API key storage
- Documentation for system prompt customization

**Timeline:** Phase 1 - Parallel with core feature development (1-2 weeks)

---

#### #3 Priority: Model Configurability + Smart Minification

**Rationale:** Low-effort additions during initial build that provide future flexibility (model selection) and quality improvement (proportional summaries). Much easier to build now than retrofit later.

**Next steps:**
1. Add model selection dropdown to admin settings (default: GPT-5 mini)
2. Implement dynamic model routing based on setting
3. Build email length classification (short/medium/long)
4. Create conditional prompt templates for proportional output
5. Test quality across email sizes and model options

**Resources needed:**
- Model comparison testing (GPT-5 mini vs. micro vs. future models)
- Prompt template variations for different email lengths
- Quality benchmarking across combinations

**Timeline:** Phase 1.5 - Add during or immediately after MVP (1 week)

---

## Reflection & Follow-up

### What Worked Well

- Five Whys uncovered emotional/contextual factors (career transition, hate vs. inefficiency) that shaped design priorities
- SCAMPER systematically generated diverse ideas while maintaining focus on implementation specifics
- Role Playing validated client-facing quality improvement angle and eliminated security concerns
- Balanced approach kept exploration grounded in actionable features vs. pure ideation
- User's existing system knowledge enabled quick identification of infrastructure leverage opportunities

### Areas for Further Exploration

- **Billable hours estimation accuracy**: How well can AI predict time from email content? What calibration is needed?
- **Ticket matching semantic similarity**: What algorithm/approach for determining email-to-ticket relevance? Confidence thresholds?
- **Attachment processing complexity**: What's realistic for Phase 2? PDF text extraction vs. full document understanding vs. screenshot OCR?
- **Pattern learning effectiveness**: Do few-shot examples actually improve style matching? What's performance impact?
- **Broader automation opportunities**: What other business processes have similar "hate the busywork" profiles worth addressing?

### Recommended Follow-up Techniques

- **Morphological Analysis**: Systematically explore combinations of configuration options (model × email length × output detail × trigger timing) to find optimal parameter sets
- **Assumption Reversal**: Challenge "must store API key in backend" or "must use external AI" assumptions - are there alternative architectures?
- **User Journey Mapping**: Detailed flow mapping for edge cases (failed API calls, timeout handling, regeneration UX, first-time setup)

### Questions That Emerged

- What happens when OpenAI API is unavailable or times out? Fallback behavior?
- How to handle rate limits or token quotas? Warning system? Graceful degradation?
- Should there be usage analytics/monitoring for AI feature adoption and quality?
- What's the regeneration UX if user doesn't like AI output? New button? Or just manual edit?
- How to communicate AI vs. manual ticket creation to clients (if at all)?
- Should system prompt have version control or change history for iteration tracking?
- What's the error message UX for missing/invalid API key configuration?
- How to handle multi-language emails? Does GPT-5 mini handle well enough?

### Next Session Planning

- **Suggested topics:**
  - Technical architecture deep-dive (API integration patterns, error handling, caching strategies)
  - Prompt engineering workshop (craft and test actual prompts for dual output generation)
  - Phase 2 feature prioritization (billable hours vs. ticket matching vs. updates - which first?)

- **Recommended timeframe:** After MVP implementation begins, reconvene for prompt refinement and Phase 2 planning (2-3 weeks)

- **Preparation needed:**
  - Sample email threads (various lengths, complexities) for prompt testing
  - Initial API integration POC to validate technical approach
  - User feedback from early manual testing of generated summaries

---

*Session facilitated using the BMAD-METHOD™ brainstorming framework*
