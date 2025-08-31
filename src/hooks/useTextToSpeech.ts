import { useCallback, useRef, useEffect, useState } from 'react'

interface UseTextToSpeechOptions {
    lang?: string
    rate?: number
    pitch?: number
    volume?: number
}

interface Voice {
    name: string
    lang: string
    localService: boolean
}

export const useTextToSpeech = (options: UseTextToSpeechOptions = {}) => {
    const {
        lang = 'en-US',
        rate = 1,
        pitch = 1,
        volume = 1
    } = options

    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
    const [voices, setVoices] = useState<Voice[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isSpeaking, setIsSpeaking] = useState(false)

    // Load available voices
    useEffect(() => {
        if (!('speechSynthesis' in window)) return

        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices()
            setVoices(availableVoices.map(voice => ({
                name: voice.name,
                lang: voice.lang,
                localService: voice.localService
            })))
        }

        loadVoices()

        // Some browsers load voices asynchronously
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices
        }
    }, [])

    const detectLanguage = useCallback((text: string): string => {
        // Simple language detection based on character patterns
        const hasEnglishChars = /[a-zA-Z]/.test(text)
        const hasCyrillic = /[\u0400-\u04FF]/.test(text)
        const hasArabic = /[\u0600-\u06FF]/.test(text)
        const hasChinese = /[\u4e00-\u9fff]/.test(text)
        const hasJapanese = /[\u3040-\u309f\u30a0-\u30ff]/.test(text)
        const hasKorean = /[\uac00-\ud7af]/.test(text)

        if (hasChinese) return 'zh-CN'
        if (hasJapanese) return 'ja-JP'
        if (hasKorean) return 'ko-KR'
        if (hasCyrillic) return 'uk-UA'
        if (hasArabic) return 'ar-SA'
        if (hasEnglishChars) return 'en-US'

        return lang // fallback to default
    }, [lang])

    const findBestVoice = useCallback((targetLang: string): SpeechSynthesisVoice | null => {
        if (!('speechSynthesis' in window)) return null

        const availableVoices = window.speechSynthesis.getVoices()

        // Try to find exact match
        let voice = availableVoices.find(v => v.lang === targetLang)

        // Try to find language family match (e.g., 'en' for 'en-US')
        if (!voice) {
            const langFamily = targetLang.split('-')[0]
            voice = availableVoices.find(v => v.lang.startsWith(langFamily))
        }

        // Prefer local voices for better quality
        if (voice && availableVoices.some(v => v.lang === voice!.lang && v.localService)) {
            voice = availableVoices.find(v => v.lang === voice!.lang && v.localService) || voice
        }

        return voice || null
    }, [])

    const speak = useCallback((text: string, customLang?: string) => {
        if (!('speechSynthesis' in window)) {
            console.warn('Text-to-speech not supported in this browser')
            return
        }

        if (!text.trim()) return

        setIsLoading(true)

        // Cancel any ongoing speech
        window.speechSynthesis.cancel()

        const targetLang = customLang || detectLanguage(text)
        const utterance = new SpeechSynthesisUtterance(text)

        // Find the best voice for the target language
        const bestVoice = findBestVoice(targetLang)
        if (bestVoice) {
            utterance.voice = bestVoice
            utterance.lang = bestVoice.lang
        } else {
            utterance.lang = targetLang
        }

        utterance.rate = rate
        utterance.pitch = pitch
        utterance.volume = volume

        utterance.onstart = () => {
            setIsLoading(false)
            setIsSpeaking(true)
        }
        utterance.onend = () => {
            setIsLoading(false)
            setIsSpeaking(false)
        }
        utterance.onerror = () => {
            setIsLoading(false)
            setIsSpeaking(false)
        }

        utteranceRef.current = utterance
        window.speechSynthesis.speak(utterance)
    }, [lang, rate, pitch, volume, detectLanguage, findBestVoice])

    const stop = useCallback(() => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel()
            setIsLoading(false)
            setIsSpeaking(false)
        }
    }, [])

    const toggle = useCallback((text: string, customLang?: string) => {
        if (isSpeaking) {
            stop()
        } else {
            speak(text, customLang)
        }
    }, [isSpeaking, stop, speak])

    const isSupported = 'speechSynthesis' in window

    return {
        speak,
        stop,
        toggle,
        isSupported,
        isLoading,
        isSpeaking,
        voices
    }
}