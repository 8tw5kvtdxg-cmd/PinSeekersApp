export function winnerResponseDueAt(noticeAt: Date) {
  const due = new Date(noticeAt);
  due.setUTCDate(due.getUTCDate() + 10);
  return due;
}

export function prizePaymentTargetAt(finalizedAt: Date) {
  const due = new Date(finalizedAt);
  due.setUTCDate(due.getUTCDate() + 30);
  return due;
}

export function potentialNoticeWeekdayTargetAt(verifiedAt: Date) {
  const target = new Date(verifiedAt);
  let days = 0;
  while (days < 5) {
    target.setUTCDate(target.getUTCDate() + 1);
    if (target.getUTCDay() !== 0 && target.getUTCDay() !== 6) days++;
  }
  return target;
}
