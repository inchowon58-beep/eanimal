/** 폐업·취소 등 비영업 상태를 목록 뒤로 보내기 위한 판별 */
export function isInactiveStatus(status: string | null | undefined): boolean {
  return /폐업|취소|말소|폐쇄|휴업|정지|종료/.test(status || "");
}
