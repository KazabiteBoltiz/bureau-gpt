import ChatInterface from '@/app/components/ChatInterface'
import React from 'react'
import SpeechToTextTranslator from '../components/SpeechToText'
import { ThemeToggle } from '../components/ThemeToggle'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

const page = () => {
  return (
    <div>
        <div className="p-4 space-x-3 flex items-center">
            <Button asChild><Link href = '/'><ArrowLeft className = 'mr-2'/>Homepage</Link></Button>
            <ThemeToggle />
        </div>
        <SpeechToTextTranslator/>
    </div>
  )
}

export default page