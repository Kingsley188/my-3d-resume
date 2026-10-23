import type { Profile, Popup } from './profile'
export interface StickerChip { label: string; href?: string }
export const NODE_STICKERS = ['sticker0', 'sticker1', 'sticker5', 'sticker4', 'sticker6'] as const
export function getStickerPopups(profile: Profile): Record<string, {title:string;chips:string[]}> {
  const result: Record<string,{title:string;chips:string[]}> = {}
  const add = (name: string, popup?: Popup) => { result[name] = { title: popup?.title || '', chips: popup?.keywords || [] } }
  for (let i=0;i<15;i++) add(`sticker${i}`,profile.extraStickers[`sticker${i}`])
  NODE_STICKERS.forEach((name,i)=>add(name,profile.nodes[i].popup))
  add('sticker7',profile.forehead.popup)
  return result
}
export const isPopupSticker = (name: string) => /^sticker([0-9]|1[0-4])$/.test(name)
