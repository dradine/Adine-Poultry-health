type ZonedParts = { year:number; month:number; day:number; hour:number; minute:number; second:number }
function zonedParts(instantMs:number,timeZone:string):ZonedParts|null {
  if (!Number.isFinite(instantMs)) return null
  try {
    const parts = new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date(instantMs))
    const read=(type:string)=>Number(parts.find(part=>part.type===type)?.value)
    const result={year:read('year'),month:read('month'),day:read('day'),hour:read('hour'),minute:read('minute'),second:read('second')}
    return Object.values(result).every(Number.isFinite)?result:null
  } catch { return null }
}
const pad=(value:number)=>String(value).padStart(2,'0')
/** Convert a wall-clock date/time in an IANA zone to an absolute ISO instant, independent of device timezone. */
export function zonedDateTimeToIso(date:string,time:string,timeZone='Asia/Tehran'):string|null {
  const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(date), clock=/^(\d{2}):(\d{2})$/.exec(time)
  if(!match||!clock)return null
  const [year,month,day,hour,minute]=[Number(match[1]),Number(match[2]),Number(match[3]),Number(clock[1]),Number(clock[2])]
  if(month<1||month>12||day<1||day>31||hour>23||minute>59)return null
  const targetWallMs=Date.UTC(year,month-1,day,hour,minute,0,0), check=new Date(targetWallMs)
  if(check.getUTCFullYear()!==year||check.getUTCMonth()!==month-1||check.getUTCDate()!==day)return null
  let guess=targetWallMs
  for(let i=0;i<5;i++){
    const parts=zonedParts(guess,timeZone);if(!parts)return null
    const representedWallMs=Date.UTC(parts.year,parts.month-1,parts.day,parts.hour,parts.minute,parts.second,0)
    const next=targetWallMs-(representedWallMs-guess);if(next===guess)break;guess=next
  }
  const verified=zonedParts(guess,timeZone)
  if(!verified||verified.year!==year||verified.month!==month||verified.day!==day||verified.hour!==hour||verified.minute!==minute)return null
  return new Date(guess).toISOString()
}
/** Format an absolute instant as a Gregorian ISO date and HH:mm wall clock in the supplied zone. */
export function instantToZonedDateTime(isoInstant:string,timeZone='Asia/Tehran'):{date:string;time:string}|null {
  const parts=zonedParts(Date.parse(isoInstant),timeZone);if(!parts)return null
  return {date:parts.year+'-'+pad(parts.month)+'-'+pad(parts.day),time:pad(parts.hour)+':'+pad(parts.minute)}
}
/** ISO-8601 UTC offset in minutes east of UTC (e.g. Tehran = +210). */
export function getTimeZoneOffsetMinutesEast(isoInstant:string,timeZone='Asia/Tehran'):number|null {
  const instantMs=Date.parse(isoInstant),parts=zonedParts(instantMs,timeZone);if(!parts)return null
  return Math.round((Date.UTC(parts.year,parts.month-1,parts.day,parts.hour,parts.minute,parts.second,0)-instantMs)/60000)
}
export function todayIsoDateInTimeZone(timeZone='Asia/Tehran'):string {
  const parts=zonedParts(Date.now(),timeZone);if(!parts)throw new Error('منطقه زمانی معتبر نیست.')
  return parts.year+'-'+pad(parts.month)+'-'+pad(parts.day)
}
