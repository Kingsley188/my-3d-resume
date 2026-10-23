import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import LoadingScreen from '../ui/LoadingScreen'

export type Lang = 'zh' | 'en'
export interface Popup { title: string; keywords: string[] }
export interface ProfileNode { years: string; org: string; role: string; tags: string[]; desc: string; popup: Popup }
export interface ProfileWork { id: string; title: string; tagline: string; footer: string; items: { name: string; meta: string; image: string; link: string }[] }
export interface Profile {
  lang: Lang; name: string; role: string
  meta: { title: string; description: string }
  intro: { hello: string; lines: string[] }
  corner: { topLeft: string[]; topRight: string; bottomLeft: string; side: string }
  nodes: ProfileNode[]; forehead: { label: string; popup: Popup }
  extraStickers: Record<string, Popup>; works: ProfileWork[]; links: { label: string; url: string }[]
}
type Obj = Record<string, unknown>
const isObject = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v)
export function normalizeProfile(input: unknown): Profile {
  const issues = new Set<string>()
  const warn = (path: string) => issues.add(path)
  const object = (v: unknown, keys: string[], path: string): Obj => {
    if (!isObject(v)) { warn(`${path}: 缺失或应为对象，已使用空值`); return {} }
    for (const key of Object.keys(v)) if (!keys.includes(key)) warn(`${path}.${key}: 多余字段已忽略`)
    return v
  }
  const str = (v: unknown, path: string): string => {
    if (typeof v === 'string') return v
    warn(`${path}: 缺失或应为字符串，已使用空串`); return ''
  }
  const array = (v: unknown, path: string): unknown[] => {
    if (Array.isArray(v)) return v
    warn(`${path}: 缺失或应为数组，已使用空数组`); return []
  }
  const strings = (v: unknown, path: string) => array(v, path).map((x, i) => str(x, `${path}[${i}]`))
  const popup = (v: unknown, path: string): Popup => {
    const p = object(v, ['title', 'keywords'], path)
    return { title: str(p.title, `${path}.title`), keywords: strings(p.keywords, `${path}.keywords`) }
  }
  const p = object(input, ['lang','name','role','meta','intro','corner','nodes','forehead','extraStickers','works','links','en'], 'profile')
  const meta = object(p.meta, ['title','description'], 'meta')
  const intro = object(p.intro, ['hello','lines'], 'intro')
  const corner = object(p.corner, ['topLeft','topRight','bottomLeft','side'], 'corner')
  const forehead = object(p.forehead, ['label','popup'], 'forehead')
  const nodes = array(p.nodes, 'nodes')
  if (nodes.length !== 5) warn(`nodes: 必须正好 5 条，收到 ${nodes.length} 条；已补空或截断`)
  const extras = object(p.extraStickers, ['sticker2','sticker3',...Array.from({length:7}, (_,i)=>`sticker${i+8}`)], 'extraStickers')
  if (p.lang !== 'zh' && p.lang !== 'en') warn('lang: 缺失或无效，已使用 zh')
  if (p.en !== undefined && !isObject(p.en)) warn('en: 应为对象，已忽略并隐藏语言切换')
  if (Array.isArray(corner.topLeft) && corner.topLeft.length > 2) warn('corner.topLeft: 超出两项，已忽略多余内容')
  const result: Profile = {
    lang: p.lang === 'en' ? 'en' : 'zh', name: str(p.name,'name'), role: str(p.role,'role'),
    meta: {title:str(meta.title,'meta.title'),description:str(meta.description,'meta.description')},
    intro: {hello:str(intro.hello,'intro.hello'),lines:strings(intro.lines,'intro.lines')},
    corner: {topLeft:strings(corner.topLeft,'corner.topLeft').slice(0,2),topRight:str(corner.topRight,'corner.topRight'),bottomLeft:str(corner.bottomLeft,'corner.bottomLeft'),side:str(corner.side,'corner.side')},
    nodes: Array.from({length:5},(_,i)=>{
      const n=object(nodes[i],['years','org','role','tags','desc','popup'],`nodes[${i}]`)
      return {years:str(n.years,`nodes[${i}].years`),org:str(n.org,`nodes[${i}].org`),role:str(n.role,`nodes[${i}].role`),tags:strings(n.tags,`nodes[${i}].tags`),desc:str(n.desc,`nodes[${i}].desc`),popup:popup(n.popup,`nodes[${i}].popup`)}
    }),
    forehead:{label:str(forehead.label,'forehead.label'),popup:popup(forehead.popup,'forehead.popup')},
    extraStickers:Object.fromEntries(Object.entries(extras).filter(([key])=>/^sticker(2|3|8|9|1[0-4])$/.test(key)).map(([key,value])=>[key,popup(value,`extraStickers.${key}`)])),
    works:array(p.works,'works').map((v,i)=>{
      const w=object(v,['id','title','tagline','footer','items'],`works[${i}]`)
      return {id:str(w.id,`works[${i}].id`),title:str(w.title,`works[${i}].title`),tagline:str(w.tagline,`works[${i}].tagline`),footer:str(w.footer,`works[${i}].footer`),items:array(w.items,`works[${i}].items`).map((v,j)=>{
        const path=`works[${i}].items[${j}]`, item=object(v,['name','meta','image','link'],path)
        return {name:str(item.name,`${path}.name`),meta:str(item.meta,`${path}.meta`),image:str(item.image,`${path}.image`),link:str(item.link,`${path}.link`)}
      })}
    }),
    links:array(p.links,'links').map((v,i)=>{const l=object(v,['label','url'],`links[${i}]`);return {label:str(l.label,`links[${i}].label`),url:str(l.url,`links[${i}].url`)}}),
  }
  if (issues.size) console.warn('[profile.json] 字段已降级处理:\n'+[...issues].join('\n'))
  return result
}
// 英文覆盖按对象字段、数组位置合并；未提供的英文内容沿用主语言。
export function mergeOverride(base: unknown, override: unknown): unknown {
  if (override === undefined) return base
  if (Array.isArray(base) && Array.isArray(override)) return override.map((v,i)=>mergeOverride(base[i],v))
  if (isObject(base) && isObject(override)) return Object.fromEntries([...new Set([...Object.keys(base),...Object.keys(override)])].map(key=>[key,mergeOverride(base[key],override[key])]))
  return override
}
const ProfileContext = createContext<{profile:Profile;lang:Lang;hasEnglish:boolean;toggle:()=>void} | null>(null)
export function useProfile() {
  const context=useContext(ProfileContext)
  if (!context) throw new Error('ProfileProvider is required')
  return context
}
export function ProfileProvider({children}:{children:ReactNode}) {
  const [data,setData]=useState<{base:Profile;en:Profile|null}|null>(null)
  const [lang,setLang]=useState<Lang>('zh')
  useEffect(()=>{
    const controller=new AbortController()
    async function load() {
      let raw:unknown={}
      try {
        const response=await fetch(`${import.meta.env.BASE_URL}profile.json`,{signal:controller.signal,cache:'no-store'})
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        raw=await response.json()
      } catch(error) {
        if (controller.signal.aborted) return
        console.warn('[profile.json] 加载失败，使用空资料',error)
      }
      if (controller.signal.aborted) return
      const base=normalizeProfile(raw)
      const en=isObject(raw)&&isObject(raw.en)?normalizeProfile(mergeOverride(raw,{...raw.en,lang:'en'})):null
      setLang(base.lang); setData({base,en})
    }
    void load()
    return ()=>controller.abort()
  },[])
  const profile=data && (lang==='en'&&data.en ? data.en : data.base)
  useEffect(()=>{
    if (!profile) return
    document.title=profile.meta.title||profile.name
    document.documentElement.lang=lang
    let description=document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (!description) {description=document.createElement('meta');description.name='description';document.head.appendChild(description)}
    description.content=profile.meta.description
  },[profile,lang])
  if (!profile || !data) return <LoadingScreen pending />
  return <ProfileContext.Provider value={{profile,lang,hasEnglish:!!data.en,toggle:()=>setLang(l=>l==='en'?'zh':'en')}}>{children}</ProfileContext.Provider>
}
