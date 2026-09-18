type Visit = {
    id: string;
    customerEmail: string;
    reservationStartsAt: Date;
    externalReference: string | null;
    source: string;
};
export function partnerVisitMetrics(visits: Visit[], outcomes: {
    bookingId: string;
    status: string;
    acquisitionSource: string;
}[]) {
    const outcomeMap = new Map(outcomes.map(row => [row.bookingId, row]));
    const seen = new Set<string>(), customers = new Map<string, Set<number>>();
    let completed = 0, attributed = 0;
    for (const visit of visits) {
        const outcome = outcomeMap.get(visit.id);
        if (outcome?.status !== "Completed")
            continue;
        const email = visit.customerEmail.trim().toLowerCase();
        const key = visit.externalReference ? `${visit.source}:${visit.externalReference}` : `${email}:${visit.reservationStartsAt.toISOString()}`;
        if (seen.has(key))
            continue;
        seen.add(key);
        completed++;
        if (outcome.acquisitionSource !== "Unknown")
            attributed++;
        if (email) {
            const dates = customers.get(email) || new Set<number>();
            dates.add(visit.reservationStartsAt.getTime());
            customers.set(email, dates);
        }
    }
    return { completed, attributed, identifiedCustomers: customers.size, repeatCustomers: [...customers.values()].filter(dates => dates.size > 1).length };
}
