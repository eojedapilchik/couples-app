# Card Tagging Specification

This document defines the **tag taxonomy** and **intensity scale** used to classify cards (questions, prompts, or challenges).

The goal is to enable:
- Flexible filtering
- Dynamic regrouping
- Scalable categorization (hundreds or thousands of cards)
- Safe and respectful handling of sensitive topics

Cards may have **multiple tags**.

---

## 1. Tag Structure Overview

Each card can be tagged across **multiple independent dimensions**:

1. Theme (what kind of content it is)
2. Sexual Category (what sexual topic it relates to, if any)
3. Dynamics (how partners interact)
4. Context (where / when it can happen)
5. Level (progression or depth)
6. Intensity (how explicit or demanding it is)

Tags are **descriptive, not prescriptive**.

---

## 2. Theme Tags (Required – at least one)

Defines the primary nature of the card.

- `romantic` – emotional connection, affection, bonding
- `sexual` – sexual desire, arousal, erotic exploration
- `sensual` – physical closeness without explicit sexual acts
- `communication` – talking, sharing feelings, reflection
- `playful` – humor, light teasing, games
- `fantasy` – imagined scenarios or “what if” questions

---

## 3. Sexual Category Tags (Optional)

Used only if the card clearly relates to a sexual topic.

### Core categories (high-level)

- `basics` – conventional sexual activities
- `bdsm` – power dynamics, control, restraint (any intensity)
- `anal` – any reference to anal curiosity or activity
- `toys` – sex toys or accessories
- `public` – public or semi-public situations
- `group` – more than two people (fantasy or real)
- `fetish` – specific non-mainstream interests

> Note: BDSM, anal, group, and fetish tags should be used conservatively and only when clearly relevant.

---

## 4. Dynamic / Interaction Tags (Optional)

Describes **how partners relate to each other** in the card.

- `control` – one partner directs or leads
- `submission` – one partner yields or follows
- `dominance` – explicit leadership or authority
- `bondage` – physical restraint (soft or implied)
- `pleasure_focus` – focus on one partner’s pleasure
- `reciprocal` – mutual, balanced interaction
- `voyeur` – watching or being watched
- `anticipation` – waiting, teasing, delayed gratification

---

## 5. Context Tags (Optional but recommended)

Indicates practical constraints.

- `home`
- `home_alone`
- `hotel`
- `escape`
- `car`
- `short_time`
- `low_energy`

These help adapt cards to real-life situations (e.g. couples with kids).

---

## 6. Level Tags (Optional)

Used for progression or filtering.

- `level_1` – introductory, low risk
- `level_2` – exploratory, moderate depth
- `level_3` – advanced, high trust required

Levels should reflect **emotional and relational depth**, not just sexual explicitness.

---

## 7. Intensity Scale (Required)

Every card must have **exactly one intensity tag**.

### Intensity definitions

- `standard`  
  Safe, accessible, emotionally or lightly sexual.  
  No explicit acts, no pressure.

- `spicy`  
  Clearly erotic or suggestive, but still comfortable for many couples.

- `very_spicy`  
  Strong sexual tension, power dynamics, or explicit desire.  
  Requires trust and consent.

- `extreme`  
  Very explicit or niche interests.  
  Use sparingly and never by default.

> Intensity is **independent** of category.  
> Example: `bdsm` can be `standard` or `very_spicy`.

---

## 8. Tagging Rules for LLM Classification

When categorizing a card:

1. Always assign:
   - At least one `theme`
   - Exactly one `intensity`

2. Assign sexual category tags **only if clearly applicable**

3. Prefer **fewer tags over too many**
   - Quality > quantity

4. Do not infer extreme tags unless explicitly suggested

5. If uncertain:
   - Default to lower intensity
   - Omit sensitive categories

---

## 9. Example Card Classification

```json
{
  "text": "Tonight we take time to reconnect, talk, and cuddle without distractions.",
  "tags": [
    "romantic",
    "sensual",
    "communication",
    "home_alone",
    "level_1"
  ],
  "intensity": "standard"
}
