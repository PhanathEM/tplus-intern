import { useMemo } from "react";

export function useMyActivity({ entries, user }) {
  const currentActorId = user?.user_id ?? user?.id ?? null;

  const myEntries = useMemo(
    () => entries.filter((entry) => String(entry.actorId) === String(currentActorId)),
    [entries, currentActorId]
  );

  return { entries: myEntries };
}
