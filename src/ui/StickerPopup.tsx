import { useEffect, useId, useRef } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { isPopupSticker, getStickerPopups, type StickerChip } from '../data/stickerPopups'
import { useStore } from '../store'
import { useProfile } from '../data/profile'

const ease = [0.23, 1, 0.32, 1] as const

function Chip({ label }: StickerChip) {
  return (
    <motion.li
      className="sp-chip"
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
      transition={{ duration: 0.18, ease }}
    >
      {label}
    </motion.li>
  )
}

function PopupCard({ sticker }: { sticker: string }) {
  const { profile } = useProfile()
  const { title, chips } = getStickerPopups(profile)[sticker]
  const setPopup = useStore((s) => s.setPopup)
  const titleId = useId()
  const cardRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const card = cardRef.current!
    // R3F 在 root 上监听原生事件；在卡片 DOM 上截断，避免依赖 root 监听器的注册顺序。
    const stop = (event: Event) => event.stopPropagation()
    const events = ['click', 'dblclick', 'contextmenu', 'pointerdown', 'pointerup', 'pointermove', 'pointerover', 'pointerout']
    events.forEach((name) => card.addEventListener(name, stop))
    const previousFocus = document.activeElement
    closeRef.current?.focus({ preventScroll: true })
    return () => {
      events.forEach((name) => card.removeEventListener(name, stop))
      if (card.contains(document.activeElement) && previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus({ preventScroll: true })
      }
    }
  }, [])

  return (
    <motion.div
      ref={cardRef}
      className="sp-card"
      role="dialog"
      aria-labelledby={titleId}
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={{
        hidden: { opacity: 0, transform: reduceMotion ? 'none' : 'translateY(16px) scale(0.96)' },
        visible: { opacity: 1, transform: reduceMotion ? 'none' : 'translateY(0px) scale(1)', transition: { staggerChildren: reduceMotion ? 0 : 0.05 } },
      }}
      transition={{ duration: 0.22, ease }}
    >
      {/* 在捕获阶段处理关闭，随后卡片原生监听器阻止事件进入 root 的射线检测。 */}
      <button ref={closeRef} className="sp-close" type="button" aria-label="关闭" onClickCapture={() => setPopup(null)}>
        <span aria-hidden="true">×</span>
      </button>
      <h2 className="sp-title" id={titleId}>{title}</h2>
      <motion.ul className="sp-chips">
        {chips.map((label) => <Chip key={label} label={label} />)}
      </motion.ul>
    </motion.div>
  )
}

export default function StickerPopup() {
  const popup = useStore((s) => s.popup)
  const setPopup = useStore((s) => s.setPopup)

  useEffect(() => {
    if (!popup) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPopup(null)
    }
    const onOutsideClick = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest('.sp-card')) return
      // 捕获阶段先收起；若随后射线命中另一贴纸，由其 onClick 直接切换。
      setPopup(null)
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('click', onOutsideClick, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('click', onOutsideClick, true)
    }
  }, [popup, setPopup])

  return (
    <div className="sp-position">
      <AnimatePresence mode="wait">
        {popup && isPopupSticker(popup) && <PopupCard key={popup} sticker={popup} />}
      </AnimatePresence>
    </div>
  )
}
