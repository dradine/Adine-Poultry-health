import DatePicker from 'react-multi-date-picker'
import persian from 'react-date-object/calendars/persian'
import persian_fa from 'react-date-object/locales/persian_fa'
import DateObject from 'react-date-object'

type Props = { value: string; onChange: (isoDate: string) => void; placeholder?: string; required?: boolean; disabled?: boolean }

/** Stores Gregorian ISO date-only values while presenting an exclusively Jalali/Persian picker. */
function toPickerValue(value: string): DateObject | '' {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return ''
  const year = Number(match[1]), month = Number(match[2]), day = Number(match[3])
  const date = new Date(year, month - 1, day, 12, 0, 0, 0)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return ''
  return new DateObject({ date, calendar: persian, locale: persian_fa })
}

function toIsoDate(value: DateObject): string {
  const date = value.toDate()
  const pad = (part: number) => String(part).padStart(2, '0')
  return String(date.getFullYear()) + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate())
}

export default function PersianDateInput({ value, onChange, placeholder = 'انتخاب تاریخ شمسی', required = false, disabled = false }: Props) {
  return <DatePicker calendar={persian} locale={persian_fa} value={toPickerValue(value)}
    onChange={(date) => onChange(date && !Array.isArray(date) ? toIsoDate(date) : '')}
    format="YYYY/MM/DD" calendarPosition="bottom-right" placeholder={placeholder}
    inputClass="date-input" inputMode="numeric" required={required} disabled={disabled} />
}
