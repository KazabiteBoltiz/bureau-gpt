"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Mic, Globe, Scan, Copy } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { CustomToast } from "@/custom-toast"
import type { GoogleSpeechResult } from "@/lib/google-speech"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@radix-ui/react-label"

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY

export default function SpeechToTextTranslator() {
  const [text, setText] = useState<string>("")
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [language, setLanguage] = useState<string>("bn")
  const [showToast, setShowToast] = useState<boolean>(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const [recog, setRecog] = useState<string>('en-US')

  const copyTextToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setShowToast(true)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  const startRecording = async () => {
    if (isRecording) {
      stopRecording()
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" })
        const audioChunks: Blob[] = []

        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data)
        }

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunks, { type: "audio/webm" })
          const reader = new FileReader()

          reader.readAsDataURL(audioBlob)
          reader.onloadend = async () => {
            const base64Audio = reader.result?.toString().split(",")[1]

            if (!base64Audio) {
              console.error("Failed to convert audio to Base64")
              return
            }

            const targetLanguage = recog

            const response = await fetch(`https://speech.googleapis.com/v1/speech:recognize?key=AIzaSyBsPswAGebCtqu-HgWtGN1TYlJCl7wWiRU`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                config: {
                  encoding: "WEBM_OPUS",
                  sampleRateHertz: 48000,
                  languageCode: targetLanguage,
                },
                audio: { content: base64Audio },
              }),
            })

            const data = await response.json()
            if (data.results) {
              setText(data.results.map((result: GoogleSpeechResult) => result.alternatives[0].transcript).join(" "))
            } else {
              console.log("No transcription results:", data)
            }
          }
        }

        mediaRecorder.start()
        mediaRecorderRef.current = mediaRecorder
        setIsRecording(true)
      } catch (error) {
        console.error("Microphone access error:", error)
      }
    }
  }

  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const handleSpeak = async () => {
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language }),
      });

      const data = await response.json();

      if (data.audioUrl) {
        setAudioUrl(data.audioUrl);
      } else {
        alert("Failed to generate audio");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const translateText = async (text: string, targetLang: string) => {
    try {
      const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: text,
          target: targetLang,
        }),
      })

      const data = await response.json()
      if (data.data && data.data.translations) {
        return data.data.translations[0].translatedText
      } else {
        console.error("Error with translation:", data)
        return text
      }
    } catch (error) {
      console.error("Error with translation API:", error)
      return text
    }
  }

  const stopRecording = async () => {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)

    if (!text.trim()) {
      console.warn("No transcription available for translation.")
      return
    }

    const translatedText = await translateText(text, language)
    setText(translatedText)
  }

  const speakText = () => {
    if (!text.trim()) return

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'ta-IN'
    window.speechSynthesis.speak(utterance)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center min-h-screen p-4"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="aspect-[1.5] items-center"
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <Card className="w-full items-center">
          <CardContent className="p-6">
            <Select disabled={isRecording} value={recog} onValueChange={setRecog}>
              <SelectTrigger className="w-full shadow-none">
                <SelectValue placeholder={"en-US"} className="shadow-none" />
              </SelectTrigger>
              <SelectContent className="">
                <SelectItem className="" value="en-US">
                  English
                </SelectItem>
                <SelectItem className="" value="bn">
                  Bengali
                </SelectItem>
                <SelectItem className="" value="mr">
                  Marathi
                </SelectItem>
                <SelectItem className="" value="ta">
                  Tamil
                </SelectItem>
                <SelectItem className="" value="ml">
                  Malayalam
                </SelectItem>
                <SelectItem className="" value="it">
                  Italian
                </SelectItem>
                <SelectItem className="" value="de">
                  German
                </SelectItem>
              </SelectContent>
            </Select>
            <div className="space-y-4">
              <div className="relative">
                <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                  <Textarea
                    disabled={true}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Your speech appears here..."
                    className="pr-10 h-[150px] max-h-[300px] overflow-y-auto resize-none"
                  />
                </motion.div>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="absolute right-2 top-2">
                  <Button
                    onClick={startRecording}
                    className={`rounded-full p-2 transition-all duration-300 ease-in-out ${
                      isRecording ? "transition-all animate-bounce" : ''
                    }`}
                  >
                    <Mic className={`h-5 w-5 ${isRecording ? "animate-pulse" : ""}`} />
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="absolute right-2 bottom-2">
                  <Button
                    disabled={isRecording}
                    onClick={copyTextToClipboard}
                    className={`rounded-full p-2 transition-all duration-300 ease-in-out`}
                  >
                    <Copy className={`h-5 w-5`} />
                  </Button>
                </motion.div>
              </div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={startRecording}
                  className={`transition-all w-full`}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={isRecording ? "recording" : "not-recording"}
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -10, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`text-md font-bold`}
                    >
                      {isRecording ? "Finish" : "Start Listening"}
                    </motion.div>
                  </AnimatePresence>
                </Button>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 p-4 border border-dashed border-10 rounded-lg"
            >
              <div className="flex items-center space-x-2">
                <Select disabled={isRecording} value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-full shadow-none">
                    <SelectValue placeholder={"bn"} className="shadow-none" />
                  </SelectTrigger>
                  <SelectContent className="">
                    <SelectItem className="" value="bn">
                      Bengali
                    </SelectItem>
                    <SelectItem className="" value="mr">
                      Marathi
                    </SelectItem>
                    <SelectItem className="" value="ta">
                      Tamil
                    </SelectItem>
                    <SelectItem className="" value="ml">
                      Malayalam
                    </SelectItem>
                    <SelectItem className="" value="it">
                      Italian
                    </SelectItem>
                    <SelectItem className="" value="de">
                      German
                    </SelectItem>
                  </SelectContent>
                </Select>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    disabled={isRecording}
                    onClick={stopRecording}
                    className="transition-all duration-300 ease-in-out transform hover:scale-105 rounded-full"
                  >
                    <Globe className="h-5 w-5" />
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
      {showToast && <CustomToast message="Text copied to clipboard!" onClose={() => setShowToast(false)} />}
      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="mt-4">
        {/* <Button
          onClick={speakText}
          className="w-full transition-all duration-300 ease-in-out transform hover:scale-105"
        >
          Speak Out Loud
        </Button> */}
      </motion.div>
      
      {/* <button onClick={handleSpeak}>Speak</button> */}

      {/* {audioUrl && (
        <audio controls>
          <source src={audioUrl} type="audio/mp3" />
        </audio>
      )} */}
    </motion.div>
  )
}
