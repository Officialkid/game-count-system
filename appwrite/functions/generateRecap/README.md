# generateRecap (Appwrite Function)

Node.js 18 function to generate a recap snapshot for an event.

## Responsibilities
- Aggregate scores per team for an `event_id`
- Sort by total points and compute ranks
- Save snapshot to `recaps` collection
- Set document permissions to event owner

## Environment
- `APPWRITE_API_KEY` (Secret)

## Deploy
1. Create a new Function in Appwrite Console: `generateRecap`
2. Runtime: Node.js 18
3. Entry Point: `index.js`
4. Variables:
   - `APPWRITE_API_KEY`: [Your API key]
5. Commands (Build): `npm install`
6. Triggers: HTTP (enabled)
   - Optional: Automation trigger when `events.status` becomes `completed`

## Invoke from Frontend or Admin Tool
Set env:
- `NEXT_PUBLIC_APPWRITE_FUNCTION_GENERATE_RECAP` to the function ID

```ts
import { functions } from '@/lib/appwrite';

await functions.createExecution(
  process.env.NEXT_PUBLIC_APPWRITE_FUNCTION_GENERATE_RECAP!,
  JSON.stringify({ event_id }),
  true
);
```
