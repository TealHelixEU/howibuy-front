# Verifying the SFC front-end by hand

Every screen state the compass has, in an order that reaches each one once. Roughly 15 minutes.

Two things make this possible that were not there before: a `TH_USER_PROFILE` row for the realm's
development user (without it every endpoint answers 401), and a one-minute stability window in dev
(the real one is thirty days, which puts the re-take out of reach of any sitting).

## Bring the stack up

```shell
cd ../tealhelix/tealhelix-docker/src/main/docker-compose/
docker compose -f docker-compose-peripherals.yml -p tealhelix up -d    # or `start` if they exist

cd ../../../..                                                          # tealhelix root
mvn package -Phowibuy-quarkus-dev,th-local-postgres -DskipTests          # API on :8180, dev profile

cd ../howibuy-front
npm run dev                                                             # SPA on :5175
```

Check the dev seed landed — this is what makes a login resolve to a user:

```shell
psql -h localhost -U th_howibuy tealhelix \
  -c "SELECT id, idm_id, email FROM TH_USER_PROFILE WHERE idm_id = '72fa53e0-50a9-4bc7-b6ae-07ebe1e28a2d'"
```

One row expected. If it is missing, Liquibase did not run with the `@dev` context — the API must be
started through the `howibuy-quarkus-dev` profile, which puts Quarkus in its `dev` profile. If instead
Liquibase *failed* on that changeset, a row with that id already exists from earlier hand-testing;
delete it and restart.

Then open <http://localhost:5175> and log in as `bob@krusty-krab.com`.

Read the API log while you go: nothing below should produce a 4xx except where it says so.

## A — never taken

Go to **SFC** in the top bar.

- [ ] The band reads **Sustainable Food Compass** (not the acronym).
- [ ] `0 of 43 answered · 0%`, and `about 14 min in total`.
- [ ] Five cards, in this order: **Ecological sustainability, Social sustainability, Economic
      sustainability, Health, Animal welfare** — each with its own mark, its description, an empty bar,
      `0 of N`, its own estimate, and **Start**. (The API returns them alphabetically by dimension name;
      seeing that order instead means the front-end's ordering is not being applied.)
- [ ] No offer to complete the compass, and nothing about taking it again.

## B — working through a category

Open **Economic sustainability** (three questions, the quickest way through a whole category).

- [ ] `question 1 of 3`, the question text, five options labelled *Not important* … *Extremely
      important*, nothing selected.
- [ ] **No** previous-question link on the first question.
- [ ] Pick any option. The options grey out for a moment, then `question 2 of 3` appears with nothing
      selected, and the bar has moved.
- [ ] `‹ Previous question` is now offered. Click it: question 1 comes back with **the option you
      picked already selected**, `‹ Back to where you were` instead of a further step back, and no
      previous link.
- [ ] Pick a *different* option on it. You are returned to `question 2 of 3`.
- [ ] Browser Back, then Forward — the address carries the step back, so both work and nothing 404s.
- [ ] Answer questions 2 and 3. On answering the third the page becomes the category read back, with
      no navigation of its own: three questions each with its answer, **Revisit answer** on each, and
      the other four categories along the top with `0 of N` each.
- [ ] The category you are in is **not** among those links.
- [ ] Click **Revisit answer** on question 1. The five options appear in place, the one you gave
      selected, and the other two rows are untouched. Pick another: the row settles back showing the
      new answer.

## C — part way through

Back to **SFC**.

- [ ] Economic shows `3 of 3`, a full bar, and **Review answers**; the others still **Start**.
- [ ] Overall reads `3 of 43 answered · 7%`.
- [ ] Still no offer to complete — 40 questions remain.

## D — completing

Fill the rest in the database rather than by hand, then complete through the UI, which is the part
worth exercising:

```shell
psql -h localhost -U th_howibuy tealhelix -c "
INSERT INTO TH_SFC_ANSWER (attempt_id, question_id, value)
SELECT a.id, q.id, 3 FROM TH_SFC_ATTEMPT a CROSS JOIN TH_SFC_QUESTION q
WHERE a.user_id = '72fa53e0-50a9-4bc7-b6ae-07ebe1e28a2d' AND a.status = 'IN_PROGRESS'
ON CONFLICT DO NOTHING"
```

Reload **SFC**.

- [ ] `43 of 43 answered · 100%`, every card **Review answers**.
- [ ] **You have answered every question.** with **Complete the compass**.
- [ ] Open any category: it opens on the read-back, and it too offers **Complete the compass**.
- [ ] Click it. A dialog says the answers become the record and cannot be changed. **Cancel** — nothing
      happens, no request is sent.
- [ ] Click it again and **Complete**. The offer disappears.

## E — completed, answers still standing

- [ ] Within the minute: **You can take the compass again on …** with a date and time a person can
      read — not `2026-09-05T14:03:22.7`. (It carries no zone from the API and is read as local time,
      so if the API runs in another zone this will be out by that difference.)
- [ ] No **Take the compass again** button yet, and no offer to complete.
- [ ] Open a category. **The answers you committed are still shown** — this is the whole point of the
      change to how answers are read; blank rows here means it regressed.
- [ ] **Revisit answer** is gone: a completed attempt cannot be edited.
- [ ] The category does not throw you back to question 1.

## F — taking it again

Wait a minute, then reload.

- [ ] **Take the compass again** appears, on the compass and on a category screen alike.
- [ ] Click it. The dialog warns that you start blank and these answers will not be shown here again.
      **Cancel** first: nothing changes.
- [ ] Then confirm. `0 of 43 answered`, every card **Start**.
- [ ] Open a category: `question 1 of N`, nothing selected.
- [ ] Check the record was kept, not overwritten:

```shell
psql -h localhost -U th_howibuy tealhelix -c "
SELECT t.status, count(a.*) FROM TH_SFC_ATTEMPT t LEFT JOIN TH_SFC_ANSWER a ON a.attempt_id = t.id
WHERE t.user_id = '72fa53e0-50a9-4bc7-b6ae-07ebe1e28a2d' GROUP BY t.id, t.status"
```

- [ ] Two attempts: `COMPLETED` with 43 answers, `IN_PROGRESS` with 0.

## G — the edges

- [ ] Go to <http://localhost:5175/sfc/not-a-category>: the 404 page, and **no request** for questions
      in the network log.
- [ ] Stop the API and reload SFC: **The compass could not be loaded just now** with **Try again**.
      Start the API, click **Try again**: the compass appears without a page reload.
- [ ] With the API stopped, from a question screen pick an option: **That answer could not be saved
      just now** and you stay on the same question with your place intact.
