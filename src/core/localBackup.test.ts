import { describe, expect, it } from 'vitest'
import { createLocalBackup, restoreLocalBackup, validateLocalBackup } from './localBackup'

class MemoryStorage implements Storage {
  private data = new Map<string,string>()
  get length(){return this.data.size}
  clear(){this.data.clear()}
  getItem(k:string){return this.data.get(k) ?? null}
  key(i:number){return [...this.data.keys()][i] ?? null}
  removeItem(k:string){this.data.delete(k)}
  setItem(k:string,v:string){this.data.set(k,String(v))}
}

describe('offline backup',()=>{
  it('exports both local datasets in a versioned envelope',()=>{
    const s=new MemoryStorage()
    s.setItem('adine-vaccine-timing-profiles-v1',JSON.stringify([{id:'p1'}]))
    s.setItem('adine-vaccine-timing-analyses-v1',JSON.stringify([{id:'a1'}]))
    const b=createLocalBackup(s)
    expect(b.schema).toBe('adine-vaccine-timing-backup')
    expect(b.profiles).toHaveLength(1); expect(b.analyses).toHaveLength(1)
  })
  it('rejects unknown schema and malformed arrays',()=>{
    expect(()=>validateLocalBackup({schema:'other',version:1,profiles:[],analyses:[]})).toThrow()
    expect(()=>validateLocalBackup({schema:'adine-vaccine-timing-backup',version:1,profiles:{},analyses:[]})).toThrow()
  })
  it('restores by merge without duplicating record ids',()=>{
    const s=new MemoryStorage()
    s.setItem('adine-vaccine-timing-profiles-v1',JSON.stringify([{id:'p1'}]))
    const result=restoreLocalBackup({schema:'adine-vaccine-timing-backup',version:1,profiles:[{id:'p1'},{id:'p2'}],analyses:[{id:'a1'}]},s)
    expect(result.profiles).toBe(2)
    expect(JSON.parse(s.getItem('adine-vaccine-timing-profiles-v1')!)).toHaveLength(2)
    expect(JSON.parse(s.getItem('adine-vaccine-timing-analyses-v1')!)).toHaveLength(1)
  })
})
