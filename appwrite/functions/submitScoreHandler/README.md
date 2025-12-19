# submitScoreHandler (Appwrite Function)

Node.js 18 function to handle idempotent score submissions.

## Responsibilities
- Validate payload: `event_id`, `team_id`, `game_number`, `points`, optional `clientScoreId`
- Permission check: only event owner can write (compare `event.user_id` with `APPWRITE_FUNCTION_USER_ID`)
- Idempotency via `client_score_id` attribute on scores
- Upsert score by composite (event_id, team_id, game_number)
- Recompute and set `teams.total_points`
- Set document permissions to event owner

## Required Collections
- `events` (must have `user_id`)
- `teams` (must have `total_points`)
- `scores` (must have `event_id`, `team_id`, `game_number`, `points`, `client_score_id` optional)

## Environment (set in Appwrite Console)
- `APPWRITE_API_KEY` (Secret)

## Deploy
1. Create a new Function in Appwrite Console: `submitScoreHandler`
2. Runtime: Node.js 18
3. Entry Point: `index.js`
4. Variables:
   - `APPWRITE_API_KEY`: [Your API key]
5. Commands (Build): `npm install`
6. Triggers: HTTP (enabled)

## Invoke from Frontend
Set env:
- `NEXT_PUBLIC_APPWRITE_FUNCTION_SUBMIT_SCORE` to the function ID

```ts
import { functions } from '@/lib/appwrite';

await functions.createExecution(
  process.env.NEXT_PUBLIC_APPWRITE_FUNCTION_SUBMIT_SCORE!,
  JSON.stringify({ event_id, team_id, game_number, points, clientScoreId }),
  true
);
```

Rely on Appwrite Realtime to update the UI.
