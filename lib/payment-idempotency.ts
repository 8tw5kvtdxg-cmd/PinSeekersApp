export function isUniqueConstraintError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { code?: string; name?: string };

  return (
    candidate.code === "P2002" ||
    candidate.name === "PrismaClientKnownRequestError" ||
    candidate.name === "UniqueConstraintError"
  );
}

export async function findOrCreateCheckoutEntry<TEntry>({
  findExisting,
  createEntry,
  recoverExisting,
}: {
  findExisting: () => Promise<TEntry | null>;
  createEntry: () => Promise<TEntry>;
  recoverExisting: () => Promise<TEntry | null>;
}): Promise<TEntry> {
  const existing = await findExisting();

  if (existing) {
    return existing;
  }

  try {
    return await createEntry();
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }

    const recovered = await recoverExisting();

    if (recovered) {
      return recovered;
    }

    throw error;
  }
}
