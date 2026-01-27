import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PawPrint, Send, Sparkles, ChevronRight, Dog, Cat } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

type AuthMode = 'welcome' | 'login' | 'register'
type RegisterStep = 'name' | 'email' | 'password'

type ChatMessage = { role: 'assistant' | 'user'; content: string }

const REGISTER_PROMPTS: Record<RegisterStep, string> = {
  name: 'Para criar o cadastro informe seu nome ou nome fantasia ✨',
  email: 'Agora informe seu melhor e-mail 📧',
  password: 'Por último, crie uma senha segura 🔐',
}

const TYPING_SPEED_MS = 35

const Auth = () => {
  const navigate = useNavigate()
  const scrollBottomRef = useRef<HTMLDivElement>(null)

  const [mode, setMode] = useState<AuthMode>('welcome')
  const [registerStep, setRegisterStep] = useState<RegisterStep>('name')
  const [registerChatHistory, setRegisterChatHistory] = useState<ChatMessage[]>(
    () => [
      { role: 'assistant', content: 'Crie sua conta' },
      { role: 'assistant', content: REGISTER_PROMPTS.name },
    ],
  )
  const [isTyping, setIsTyping] = useState(false)
  const [typewriterText, setTypewriterText] = useState('')
  const [typewriterVisible, setTypewriterVisible] = useState(0)
  const [pendingNextStep, setPendingNextStep] = useState<RegisterStep | null>(
    null,
  )
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Efeito de digitação (typewriter)
  useEffect(() => {
    if (!typewriterText || typewriterVisible >= typewriterText.length) return
    const t = setTimeout(
      () => setTypewriterVisible((v) => v + 1),
      TYPING_SPEED_MS,
    )
    return () => clearTimeout(t)
  }, [typewriterText, typewriterVisible])

  // Scroll para o fim quando chegam novas mensagens ou digitando
  useEffect(() => {
    scrollBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [registerChatHistory, isTyping, typewriterVisible, mode, registerStep])

  const pushUserAndNextAssistant = (
    userContent: string,
    nextPrompt: string,
    nextStep: RegisterStep,
  ) => {
    setRegisterChatHistory((h) => [
      ...h,
      { role: 'user', content: userContent },
    ])
    setName('')
    setEmail('')
    setPassword('')
    setIsTyping(true)
    setPendingNextStep(nextStep)
    setTimeout(() => {
      setIsTyping(false)
      setTypewriterText(nextPrompt)
      setTypewriterVisible(0)
    }, 700)
  }

  // Quando o typewriter termina, guarda a mensagem no histórico e avança o passo
  useEffect(() => {
    if (!typewriterText || typewriterVisible < typewriterText.length) return
    setRegisterChatHistory((h) => [
      ...h,
      { role: 'assistant', content: typewriterText },
    ])
    setTypewriterText('')
    setTypewriterVisible(0)
    if (pendingNextStep) {
      setRegisterStep(pendingNextStep)
      setPendingNextStep(null)
    }
  }, [typewriterText, typewriterVisible, pendingNextStep])

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setTimeout(() => {
      toast.success('Login realizado com sucesso!')
      navigate('/dashboard')
      setIsLoading(false)
    }, 1000)
  }

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (registerStep === 'name' && name.trim()) {
      pushUserAndNextAssistant(name.trim(), REGISTER_PROMPTS.email, 'email')
      return
    }
    if (registerStep === 'email' && email.trim()) {
      pushUserAndNextAssistant(
        email.trim(),
        REGISTER_PROMPTS.password,
        'password',
      )
      return
    }
    if (registerStep === 'password' && password) {
      setIsCreatingAccount(true)
      setRegisterChatHistory((h) => [
        ...h,
        { role: 'user', content: '••••••••' },
      ])
      setIsTyping(true)
      setTimeout(() => {
        setIsTyping(false)
        setTypewriterText('Perfeito! Criando sua conta... ✨')
        setTypewriterVisible(0)
      }, 600)
      setIsLoading(true)
      setTimeout(() => {
        toast.success('Conta criada com sucesso!')
        navigate('/dashboard')
        setIsLoading(false)
      }, 2200)
    }
  }

  const handleWelcomeChoice = (choice: 'login' | 'register') => {
    setMode(choice)
    if (choice === 'register') {
      setRegisterStep('name')
      setRegisterChatHistory([
        { role: 'assistant', content: 'Crie sua conta' },
        { role: 'assistant', content: REGISTER_PROMPTS.name },
      ])
      setTypewriterText('')
      setTypewriterVisible(0)
      setIsTyping(false)
      setPendingNextStep(null)
      setIsCreatingAccount(false)
    }
  }

  return (
    <div className='min-h-screen flex'>
      {/* Painel esquerdo */}
      <div className='hidden lg:flex lg:w-[45%] xl:w-[50%] bg-primary flex-col relative overflow-hidden'>
        <div className='relative z-10 p-8 flex flex-col min-h-screen'>
          <Link to='/' className='flex items-center gap-2'>
            <div className='h-9 w-9 rounded-lg bg-white/20 flex items-center justify-center'>
              <PawPrint className='h-5 w-5 text-white' />
            </div>
            <span className='font-bold text-xl text-white'>
              Pet Pro <span className='text-white/90'>Suite</span>
            </span>
          </Link>

          <div className='flex-1 flex items-center justify-center'>
            <div className='rounded-3xl bg-white/95 p-10 flex flex-col items-center justify-center gap-6 shadow-2xl border border-white/50'>
              <div className='flex items-center justify-center gap-6'>
                <Dog
                  className='h-14 w-14 text-primary animate-pet-icon-float shrink-0'
                  style={{ animationDelay: '0s' }}
                />
                <PawPrint
                  className='h-20 w-20 text-primary animate-pet-icon-float shrink-0'
                  style={{ animationDelay: '0.5s' }}
                  strokeWidth={2}
                />
                <Cat
                  className='h-14 w-14 text-primary animate-pet-icon-float shrink-0'
                  style={{ animationDelay: '1s' }}
                />
              </div>
              <div className='flex items-center justify-center gap-5'>
                <PawPrint
                  className='h-7 w-7 text-primary animate-pet-icon-float'
                  style={{ animationDelay: '0.2s' }}
                  strokeWidth={2}
                />
                <PawPrint
                  className='h-9 w-9 text-primary animate-pet-icon-float'
                  style={{ animationDelay: '0.7s' }}
                  strokeWidth={2}
                />
                <PawPrint
                  className='h-7 w-7 text-primary animate-pet-icon-float'
                  style={{ animationDelay: '1.2s' }}
                  strokeWidth={2}
                />
              </div>
            </div>
          </div>

          <div className='flex gap-2 items-center text-white/80 text-sm'>
            <div className='h-8 w-8 rounded bg-white/10 flex items-center justify-center'>
              <Sparkles className='h-4 w-4' />
            </div>
            <Link
              to='#'
              className='hover:underline hover:text-white transition-colors'
            >
              Privacidade
            </Link>
            <span className='text-white/50'>–</span>
            <Link
              to='#'
              className='hover:underline hover:text-white transition-colors'
            >
              Termos
            </Link>
          </div>
        </div>
      </div>

      {/* Painel direito - chat */}
      <div className='flex-1 flex flex-col bg-background min-h-screen'>
        <div className='flex-1 flex flex-col max-w-lg w-full mx-auto px-6 py-8'>
          <div className='flex items-center gap-3 mb-6'>
            <Avatar className='h-12 w-12 border-2 border-primary/20'>
              <AvatarFallback className='bg-primary/10 text-primary text-lg'>
                <PawPrint className='h-6 w-6' />
              </AvatarFallback>
            </Avatar>
            <div>
              <p className='font-semibold text-foreground'>
                Pet Pro Assistente
              </p>
              <p className='text-sm text-muted-foreground'>
                Assistente de contas
              </p>
            </div>
          </div>

          <ScrollArea className='flex-1 pr-4 -mr-4 min-h-0'>
            <div className='space-y-4 pb-4'>
              {mode === 'welcome' && (
                <>
                  <div className='flex gap-3'>
                    <div className='animate-chat-bubble-in delay-0 rounded-2xl rounded-tl-sm bg-muted px-4 py-3 text-sm text-foreground max-w-[85%]'>
                      Bem-vindo ao Pet Pro Suite 👋
                    </div>
                  </div>
                  <div className='flex gap-3'>
                    <div className='animate-chat-bubble-in delay-1 rounded-2xl rounded-tl-sm bg-muted px-4 py-3 text-sm text-foreground max-w-[85%]'>
                      Como posso ajudar? Escolha uma opção abaixo.
                    </div>
                  </div>
                </>
              )}

              {mode === 'login' && (
                <div className='flex gap-3'>
                  <div className='animate-chat-bubble-in delay-0 rounded-2xl rounded-tl-sm bg-muted px-4 py-3 text-sm text-foreground max-w-[85%]'>
                    Vamos entrar na sua conta! Digite seu e-mail e senha abaixo.
                  </div>
                </div>
              )}

              {mode === 'register' && (
                <>
                  {registerChatHistory.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
                    >
                      {msg.role === 'assistant' ? (
                        <div className='animate-chat-bubble-in rounded-2xl rounded-tl-sm bg-muted px-4 py-3 text-sm text-foreground max-w-[85%]'>
                          {msg.content}
                        </div>
                      ) : (
                        <div className='animate-chat-bubble-in rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-4 py-3 text-sm max-w-[85%]'>
                          {msg.content}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Indicador "digitando..." */}
                  {isTyping && (
                    <div className='flex gap-3'>
                      <div className='rounded-2xl rounded-tl-sm bg-muted px-4 py-3 flex gap-1.5 items-center min-h-[2.75rem]'>
                        <span className='typing-dot w-2 h-2 rounded-full bg-muted-foreground/70' />
                        <span className='typing-dot w-2 h-2 rounded-full bg-muted-foreground/70' />
                        <span className='typing-dot w-2 h-2 rounded-full bg-muted-foreground/70' />
                      </div>
                    </div>
                  )}

                  {/* Próxima mensagem com efeito de digitação */}
                  {typewriterText && !isTyping && (
                    <div className='flex gap-3'>
                      <div className='rounded-2xl rounded-tl-sm bg-muted px-4 py-3 text-sm text-foreground max-w-[85%]'>
                        {typewriterText.slice(0, typewriterVisible)}
                        <span className='inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse align-middle' />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            <div ref={scrollBottomRef} />
          </ScrollArea>

          <div
            key={`${mode}-${registerStep}`}
            className='pt-6 space-y-4 animate-chat-form-in flex-shrink-0'
          >
            {mode === 'welcome' && (
              <div className='flex flex-col gap-2'>
                <Button
                  variant='outline'
                  className='w-full justify-between h-12 text-muted-foreground font-normal hover:bg-muted/80'
                  onClick={() => handleWelcomeChoice('register')}
                >
                  Criar minha conta <ChevronRight className='h-4 w-4' />
                </Button>
                <Button
                  variant='outline'
                  className='w-full justify-between h-12 text-muted-foreground font-normal hover:bg-muted/80'
                  onClick={() => handleWelcomeChoice('login')}
                >
                  Já tenho uma conta <ChevronRight className='h-4 w-4' />
                </Button>
              </div>
            )}

            {mode === 'login' && (
              <form onSubmit={handleLogin} className='space-y-4'>
                <div className='flex gap-2'>
                  <Input
                    type='email'
                    placeholder='Digite seu e-mail'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className='flex-1 h-11'
                  />
                </div>
                <div className='flex gap-2'>
                  <Input
                    type='password'
                    placeholder='Digite sua senha'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className='flex-1 h-11'
                  />
                </div>
                <Button
                  type='submit'
                  className='w-full h-11 bg-primary hover:bg-primary/90'
                  disabled={isLoading}
                >
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </Button>
                <Button
                  type='button'
                  variant='ghost'
                  className='w-full text-muted-foreground text-sm'
                  onClick={() => setMode('welcome')}
                >
                  Voltar
                </Button>
              </form>
            )}

            {mode === 'register' && !isCreatingAccount && (
              <form onSubmit={handleRegister} className='space-y-4'>
                {registerStep === 'name' && (
                  <div className='flex gap-2'>
                    <Input
                      type='text'
                      placeholder='Digite seu nome'
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className='flex-1 h-11'
                    />
                    <Button
                      type='submit'
                      size='icon'
                      className='h-11 w-11 shrink-0 bg-primary hover:bg-primary/90'
                      disabled={!name.trim()}
                    >
                      <Send className='h-4 w-4' />
                    </Button>
                  </div>
                )}
                {registerStep === 'email' && (
                  <div className='flex gap-2'>
                    <Input
                      type='email'
                      placeholder='Digite seu e-mail'
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className='flex-1 h-11'
                    />
                    <Button
                      type='submit'
                      size='icon'
                      className='h-11 w-11 shrink-0 bg-primary hover:bg-primary/90'
                      disabled={!email.trim()}
                    >
                      <Send className='h-4 w-4' />
                    </Button>
                  </div>
                )}
                {registerStep === 'password' && (
                  <div className='space-y-2'>
                    <div className='flex gap-2'>
                      <Input
                        type='password'
                        placeholder='Digite sua senha'
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className='flex-1 h-11'
                      />
                      <Button
                        type='submit'
                        size='icon'
                        className='h-11 w-11 shrink-0 bg-primary hover:bg-primary/90'
                        disabled={isLoading}
                      >
                        <Send className='h-4 w-4' />
                      </Button>
                    </div>
                    <Button
                      type='button'
                      variant='ghost'
                      className='text-muted-foreground text-sm h-auto py-1'
                      onClick={() => setRegisterStep('email')}
                    >
                      Voltar
                    </Button>
                  </div>
                )}
                <p className='text-xs text-muted-foreground leading-relaxed'>
                  Ao criar uma conta você concorda com nossos{' '}
                  <Link
                    to='#'
                    className='text-primary hover:underline underline-offset-2'
                  >
                    Termos de Uso
                  </Link>{' '}
                  e{' '}
                  <Link
                    to='#'
                    className='text-primary hover:underline underline-offset-2'
                  >
                    Política de Privacidade
                  </Link>
                  .
                </p>
                <Button
                  type='button'
                  variant='ghost'
                  className='w-full text-muted-foreground text-sm h-auto py-1'
                  onClick={() => setMode('welcome')}
                >
                  Já tenho uma conta
                </Button>
              </form>
            )}
            {mode === 'register' && isCreatingAccount && (
              <div className='py-3 text-center text-sm text-muted-foreground'>
                Criando sua conta...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Auth
