import ChatInterface from '@/app/components/ChatInterface'
import React from 'react'
import SpeechToTextTranslator from '../components/SpeechToText'
import { ThemeToggle } from '../components/ThemeToggle'

const page = () => {
  return (
    <div>
        <div className="p-4 flex items-center justify-between">
            <ThemeToggle />
        </div>
        <SpeechToTextTranslator/>
    </div>
  )
}

export default page