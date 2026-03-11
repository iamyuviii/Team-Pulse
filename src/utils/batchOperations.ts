export async function batchAssignRole(
  memberIds: number[],
  role: string,
  updateFn: (id: number, role: string) => Promise<void>,
  onSuccess: () => void,
  onError: (msg: string) => void
): Promise<void> {
  let failed = 0;
  const results = await Promise.allSettled(
    memberIds.map(id => updateFn(id, role))
  );
  failed = results.filter(r => r.status === 'rejected').length;
  if (failed > 0) {
    onError(`${failed} of ${memberIds.length} updates failed`);
  } else {
    onSuccess();
  }
}
// symptoms - the "All roles updated" success toast appeared instantly when clicking batch role assign even though the API take delay time each.

//root cause - forEach doesn't wait for async callbacks — it fires them all off and moves on. So the success toast ran immediately, and the try/catch never caught any errors because the promises were already detached.

// fix - replaced forEach and setTimeout with promise.allSettled and .map this waits for every update to either resolve or reject, counts the failures, and only then calls onSuccess

export async function batchToggleBookmark(
  memberIds: number[],
  bookmarked: boolean,
  updateFn: (id: number, bookmarked: boolean) => Promise<void>,
  onComplete: (succeeded: number, failed: number) => void
): Promise<void> {
  let succeeded = 0;
  let failed = 0;

  for (const id of memberIds) {
    try {
      await updateFn(id, bookmarked);
      succeeded++;
    } catch {
      failed++;
    }
  }

  onComplete(succeeded, failed);
}
