# 💞 Couple Cards + Dares (Gamified) — MVP v1 Spec (Updated)

## 1) Core Game Rules (What “feels right”)
- You both receive a **small base credit grant each week** (just enough to keep things moving).
- **Most credits are earned by completing dares/cards** (rewarding follow-through, not just proposing).
- To prevent cheating, **the person who proposed the dare must confirm completion** (not the person who receives the credits).
- Each dare can be answered with:
  - ✅ **Yes**
  - 🕒 **Maybe later** (soft reject / snooze)
  - ❌ **Not at all** (hard reject)
- Cards have a **credit value** based on how *difficult / effortful / “hot”* they are.

---

## 2) Entities

### 2.1 Card
A Card is an idea prompt that can be proposed as a “dare for this week”.

**Fields**
- `id`
- `title`
- `description`
- `tags`
- `spice_level` (1–3 or 1–5)
- `difficulty_level` (1–3 or 1–5)
- `credit_value` (integer; higher = harder/hotter)
- `source` (`manual | llm`)
- `status` (`active | archived`)
- `created_at`

**Credit value guidance**
- Low effort / sweet: `1–2`
- Medium effort / playful: `3–5`
- High effort / spicy: `6–10`

> `credit_value` is the core “economy unit” used for proposing costs and completion rewards.

---

### 2.2 Preference Vote (Like/Dislike)
Each partner sets a preference per card.

**Fields**
- `user_id`, `card_id`
- `preference` (`like | dislike | neutral`)
- `updated_at`

---

### 2.3 Period
A repeating game period: `1 week`, `1 month`, `2 months`.

**Fields**
- `id`
- `period_type` (`week | month | two_month`)
- `status` (`setup | active | done`)
- `start_date`, `end_date`
- `weekly_base_credits` (small, e.g. `3`)
- `cards_to_play_per_week` (e.g. `3`)
- `created_at`

---

### 2.4 Proposal (Weekly Dare)
A proposal is a card selected for a specific week of an active period.

**Fields**
- `id`
- `period_id`
- `week_index`
- `proposed_by_user_id`
- `proposed_to_user_id`
- `card_id`
- `status`:
  - `proposed`
  - `accepted`
  - `maybe_later`
  - `rejected`
  - `completed_pending_confirmation`
  - `completed_confirmed`
  - `expired`
- `created_at`
- `responded_at`
- `completed_requested_at` (optional)
- `completed_confirmed_at` (optional)

---

### 2.5 Credits (Balances + Ledger)

#### Balance
- `user_id`
- `balance`

#### Ledger (immutable)
- `id`
- `user_id`
- `period_id` (optional)
- `proposal_id` (optional)
- `type`
- `amount`
- `created_at`
- `note`

**Ledger types**
- `weekly_base_grant` (+small amount)
- `proposal_cost` (-X)
- `completion_reward` (+Y)
- `admin_adjustment` (debug)

---

## 3) Economy (Credits Logic)

### 3.1 Weekly Base Credits (Small)
- Each user gets `weekly_base_credits` every week (e.g. **3**).
- Purpose: allow proposing to continue even in slower weeks.

### 3.2 Proposing Costs Credits
- When you propose a card, **you pay its `credit_value`** immediately:
  - ledger: `proposal_cost = -card.credit_value`

This discourages spam and forces thoughtful proposals.

### 3.3 Completing Earns Credits (Main income)
- When a proposal is completed and confirmed, **the recipient earns credits**:
  - ledger: `completion_reward = +card.credit_value` to the recipient

> This makes completion the primary way to earn, matching your goal.

### 3.4 Completion Confirmation to Prevent Cheating
Completion happens in two steps:

1) Recipient clicks **“Mark as done”**  
   → status becomes `completed_pending_confirmation`
2) Proposer must click **“Confirm completion”**  
   → status becomes `completed_confirmed`  
   → completion credits are awarded to recipient

This prevents self-awarding and keeps the game fair.

---

## 4) Responses to Dares (Consent UX)

When a partner receives a proposal, they can respond:

### ✅ Yes
- status → `accepted`

### 🕒 Maybe later (Soft reject)
- status → `maybe_later`
- optional: snooze period (`7 days`, `14 days`, “next period”)

### ❌ Not at all (Hard reject)
- status → `rejected`
- optionally: this card is hidden from future proposals to this user (MVP optional)

---

## 5) MVP Feature Set (Updated)

### Must-have
- [ ] Card library browse + add
- [ ] Vote/like/dislike per card
- [ ] LLM generates new cards into library
- [ ] Reports (preferences + outcomes)
- [ ] Period creation: 1 week / 1 month / 2 months
- [ ] Weekly plan: propose N cards per week (e.g. 3)
- [ ] Credits system:
  - small weekly base
  - proposal costs credits
  - completion rewards credits (main income)
  - proposer confirms completion
- [ ] Dare responses: yes / maybe later / not at all

### Nice-to-have (still small)
- [ ] Auto-filter proposals based on dislikes
- [ ] “Maybe later” queue view
- [ ] Card difficulty/spice sliders with automatic credit suggestions
- [ ] Report: “most completed”, “most rejected”, “most divisive”

---

## 6) Reports (What you can view)
### Card Library Reports
- Top liked cards overall
- Cards with strongest disagreement (one likes, other dislikes)
- Unvoted cards
- Cards by difficulty/spice distribution

### Gameplay Reports
- Proposed / accepted / maybe later / rejected counts
- Completed confirmed count
- Credits earned vs spent per user
- Cards most completed (favorites in practice)

---

## 7) Suggested Defaults (Tune later)
- `weekly_base_credits`: **3**
- `cards_to_play_per_week`: **3**
- `credit_value`: **1–10** based on difficulty/spice
- Propose cost: `credit_value`
- Completion reward: `credit_value` to the recipient
- “Maybe later” snooze: default **14 days**

---

## 8) Open Decisions (Small but important)
- If a dare is rejected/maybe-later, do proposer credits refund?
  - MVP recommendation: **no refund** (keeps proposing meaningful).
- Should “Not at all” hide the card permanently from future proposals?
  - MVP recommendation: **yes, hide by default** (can be reset in settings).
