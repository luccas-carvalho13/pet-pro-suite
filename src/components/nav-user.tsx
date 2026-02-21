"use client"

import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ChevronsUpDown,
  KeyRound,
  LogOut,
  Pencil,
  Settings,
  Trash2,
  Upload,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { toast } from "sonner"
import {
  changePassword,
  getMe,
  removeProfileAvatar,
  signOut,
  updateMyProfile,
  uploadProfileAvatar,
} from "@/lib/api"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar?: string
  }
}) {
  const { isMobile } = useSidebar()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [profileOpen, setProfileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [fullName, setFullName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: getMe, retry: false })

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
  const modalName = me?.user.full_name || user.name
  const modalEmail = me?.user.email || user.email
  const modalAvatar = me?.user.avatar_url ?? user.avatar ?? ""

  useEffect(() => {
    if (!profileOpen) return
    setFullName(modalName)
    setEmail(modalEmail)
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
  }, [profileOpen, modalName, modalEmail])

  const handleLogout = async () => {
    await signOut()
    queryClient.clear()
    toast.success("Logout realizado com sucesso!")
    navigate("/login", { replace: true })
  }

  const handleAvatarUpload = async (file: File | null) => {
    if (!file) return
    try {
      setBusy(true)
      await uploadProfileAvatar(file)
      await queryClient.invalidateQueries({ queryKey: ["me"] })
      await queryClient.invalidateQueries({ queryKey: ["company-users"] })
      toast.success("Foto de perfil atualizada.")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao atualizar foto."
      toast.error(message)
    } finally {
      setBusy(false)
    }
  }

  const handleAvatarRemove = async () => {
    try {
      setBusy(true)
      await removeProfileAvatar()
      await queryClient.invalidateQueries({ queryKey: ["me"] })
      await queryClient.invalidateQueries({ queryKey: ["company-users"] })
      toast.success("Foto removida.")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao remover foto."
      toast.error(message)
    } finally {
      setBusy(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!fullName.trim()) return toast.error("Informe seu nome.")
    if (!email.trim()) return toast.error("Informe seu e-mail.")
    try {
      setBusy(true)
      await updateMyProfile({ full_name: fullName.trim(), email: email.trim() })

      if (currentPassword || newPassword || confirmPassword) {
        if (!currentPassword || !newPassword) {
          toast.error("Para trocar senha, informe senha atual e nova senha.")
          setBusy(false)
          return
        }
        if (newPassword !== confirmPassword) {
          toast.error("A confirmação da senha não confere.")
          setBusy(false)
          return
        }
        await changePassword(currentPassword, newPassword)
      }

      await queryClient.invalidateQueries({ queryKey: ["me"] })
      await queryClient.invalidateQueries({ queryKey: ["company-users"] })
      toast.success("Perfil atualizado.")
      setProfileOpen(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao salvar perfil."
      toast.error(message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={userMenuOpen} onOpenChange={setUserMenuOpen} modal={false}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault()
                  setUserMenuOpen(false)
                  setProfileOpen(true)
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Editar perfil
              </DropdownMenuItem>
              <AnimatedThemeToggler className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                Alterar tema
              </AnimatedThemeToggler>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Editar perfil</DialogTitle>
            <DialogDescription>Atualize sua foto, nome, e-mail e senha sem sair da tela.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 rounded-lg">
                  <AvatarImage src={modalAvatar} alt={modalName} />
                  <AvatarFallback className="rounded-lg">{(modalName || "U").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">Foto do perfil</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG ou WEBP até 8MB</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() => document.getElementById("quickProfilePhotoInput")?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Enviar
                </Button>
                <Button type="button" variant="ghost" size="sm" disabled={busy || !modalAvatar} onClick={handleAvatarRemove}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remover
                </Button>
                <input
                  id="quickProfilePhotoInput"
                  type="file"
                  className="hidden"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null
                    void handleAvatarUpload(file)
                    e.currentTarget.value = ""
                  }}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="quickProfileName">Nome</Label>
                <Input id="quickProfileName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quickProfileEmail">E-mail</Label>
                <Input id="quickProfileEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>

            <div className="rounded-lg border p-3 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <KeyRound className="h-4 w-4" />
                Alterar senha
              </div>
              <div className="space-y-2">
                <Label htmlFor="quickCurrentPassword">Senha atual</Label>
                <Input
                  id="quickCurrentPassword"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="quickNewPassword">Nova senha</Label>
                  <Input
                    id="quickNewPassword"
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quickConfirmPassword">Confirmar nova senha</Label>
                  <Input
                    id="quickConfirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setProfileOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" disabled={busy} onClick={() => void handleSaveProfile()}>
              Salvar perfil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarMenu>
  )
}
