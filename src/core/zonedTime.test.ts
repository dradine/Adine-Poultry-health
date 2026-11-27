import { describe, expect, it } from 'vitest'
import { getTimeZoneOffsetMinutesEast, instantToZonedDateTime, todayIsoDateInTimeZone, zonedDateTimeToIso } from './zonedTime'

describe('IANA timezone date-time conversion',()=>{
  it('converts Tehran wall time to UTC independently of device timezone',()=>expect(zonedDateTimeToIso('2026-11-27','14:00','Asia/Tehran')).toBe('2026-11-27T10:30:00.000Z'))
  it('round-trips an instant to Tehran local date and time',()=>{const iso=zonedDateTimeToIso('2026-11-27','14:00','Asia/Tehran')!;expect(instantToZonedDateTime(iso,'Asia/Tehran')).toEqual({date:'2026-11-27',time:'14:00'})})
  it('stores UTC offset minutes east of UTC',()=>expect(getTimeZoneOffsetMinutesEast('2026-11-27T10:30:00.000Z','Asia/Tehran')).toBe(210))
  it('rejects impossible dates and malformed times',()=>{expect(zonedDateTimeToIso('2026-02-30','14:00','Asia/Tehran')).toBeNull();expect(zonedDateTimeToIso('2026-11-27','24:00','Asia/Tehran')).toBeNull()})
  it('rejects nonexistent wall-clock times during a DST spring-forward gap',()=>expect(zonedDateTimeToIso('2026-03-08','02:30','America/New_York')).toBeNull())
  it('returns a Gregorian storage date for today in the requested timezone',()=>expect(todayIsoDateInTimeZone('Asia/Tehran')).toMatch(/^\d{4}-\d{2}-\d{2}$/))
})
