"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Home,
  User2,
  ChevronUp,
  ChevronDown,
  Users,
  UserCircle,
  Newspaper,
  FileText,
  Shield,
  FolderOpen,
  Bell,
  Lightbulb,
  CheckCircle,
  LogOut,
  LogIn,
  Gift,
  Mail,
  UserCheck,
  Edit,
  Key,
  Database,
  Briefcase,
  MapPin,
  Building,
  CalendarClock, // Added for Absensi
  History, // Added for Histori Absensi
  Calendar, // Added for Cuti
  Calculator, // Added for Pemotongan
  Scan, // Added for Face Recognition
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,  SidebarSeparator,
  useSidebar,
} from "./ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import Link from "next/link";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { useAuth } from "@/contexts/AuthContext";
import { useMobile } from "@/hooks/useMobile";
import { useToast } from "@/hooks/use-toast-simple";
import { encodeId } from "@/lib/crypto-utils";
import { imageAPI } from "@/lib/api";

const AppSidebar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const isMobile = useMobile();
  const { setOpenMobile } = useSidebar();
  // State untuk mengatur open/close status setiap section
  const [isMainMenuOpen, setIsMainMenuOpen] = useState(!isMobile);
  const [isAlumniMenuOpen, setIsAlumniMenuOpen] = useState(!isMobile);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(!isMobile);
  // Update state ketika device berubah dari desktop ke mobile atau sebaliknya
  useEffect(() => {
    if (isMobile) {
      setIsMainMenuOpen(false);
      setIsAlumniMenuOpen(false);
      setIsProfileMenuOpen(false);
    } else {
      setIsMainMenuOpen(true);
      setIsAlumniMenuOpen(true);
      setIsProfileMenuOpen(true);
    }
  }, [isMobile]);

  // Helper function untuk menutup sidebar pada mobile ketika menu diklik
  const handleMenuClick = useCallback(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [isMobile, setOpenMobile]);

  // Public items (accessible to everyone)
  const publicItems = [
    {
      title: "Dashboard",
      url: "/",
      icon: Home,
    },
  ];

  // User items (accessible when logged in)
  const userItems = [
    {
      title: "Absensi",
      url: "/pegawai/absensi",
      icon: CalendarClock,
    },
    {
      title: "Histori Absensi",
      url: "/pegawai/histori-absensi",
      icon: History,
    },
    {
      title: "Pengajuan Cuti",
      url: "/pegawai/cuti",
      icon: Calendar,
    },
    {
      title: "Laporan Tukin Pribadi",
      url: "/pegawai/laporan-tukin",
      icon: FileText,
    },
  ];

  // Admin Laporan Absensi items (accessible to admin/verificator)
  const adminLaporanAbsensiItems = [
    {
      title: "Histori Absensi",
      url: "/admin/master-data/histori-absensi",
      icon: History,
    },
    {
      title: "Pengajuan Cuti",
      url: "/admin/master-data/cuti",
      icon: Calendar,
    },
    {
      title: "Pemotongan",
      url: "/admin/master-data/pemotongan",
      icon: Calculator,
    },
    {
      title: "Laporan Tukin",
      url: "/admin/master-data/laporan-tukin",
      icon: FileText,
    },
  ];

  // Admin Pegawai items (accessible to admin/verificator)
  const adminPegawaiItems = [
    {
      title: "Data Pegawai",
      url: "/admin/master-data/pegawai",
      icon: Users,
    },
    {
      title: "Face Recognition",
      url: "/admin/master-data/face-recognition",
      icon: Scan,
    },
    {
      title: "Shift",
      url: "/admin/master-data/shift",
      icon: Users,
    },
    {
      title: "Lokasi Kantor",
      url: "/admin/master-data/lokasi-kantor",
      icon: Building,
    },
    {
      title: "Lokasi Pegawai",
      url: "/admin/master-data/pegawai/lokasi",
      icon: MapPin,
    },
  ];

  // Master Data Absensi items (accessible to admin/verificator)
  const masterDataAbsensiItems = [
    {
      title: "Daftar Cuti",
      url: "/admin/master-data/daftar-cuti",
      icon: FileText,
    },
    {
      title: "Hari Libur",
      url: "/admin/master-data/hari-libur",
      icon: Calendar,
    },
    {
      title: "Pemotongan Absen",
      url: "/admin/master-data/pemotongan-absen",
      icon: Calculator,
    },
    {
      title: "Jabatan",
      url: "/admin/master-data/jabatan",
      icon: Briefcase,
    },
    {
      title: "Role",
      url: "/admin/master-data/role",
      icon: Shield,
    },
  ];

  // Master Data Wilayah items (accessible to admin/verificator)
  const masterDataWilayahItems = [
    {
      title: "Wilayah - Provinsi",
      url: "/admin/master-data/wilayah-provinsi",
      icon: MapPin,
    },
    {
      title: "Wilayah - Kota/Kabupaten",
      url: "/admin/master-data/wilayah-kota",
      icon: Building,
    },
    {
      title: "Wilayah - Kecamatan",
      url: "/admin/master-data/wilayah-kecamatan",
      icon: MapPin,
    },
    {
      title: "Wilayah - Kelurahan",
      url: "/admin/master-data/wilayah-kelurahan",
      icon: MapPin,
    },
  ];

  // Separate role checks for different access levels
  const isAdmin = user?.role?.roleName === 'ADMIN';
  const isVerificator = user?.role?.roleName === 'VERIFICATOR';
  const isAdminOrVerificator = isAdmin || isVerificator;

  return (
    <Sidebar 
      collapsible="icon" 
      className="border-r bg-sidebar data-[state=collapsed]:w-14 md:data-[state=collapsed]:w-16 sidebar-mobile-optimized"
    >      <SidebarHeader className="py-3 md:py-4 px-2 md:px-4">
        <SidebarMenu>
          <SidebarMenuItem>            <SidebarMenuButton asChild className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md">
              <Link href="/" onClick={handleMenuClick} className="flex items-center gap-2 md:gap-3">
                <Image src="/logo.svg" alt="logo" width={24} height={24} className="md:w-8 md:h-8 flex-shrink-0" unoptimized />
                <span className="font-semibold text-sm md:text-base group-data-[collapsible=icon]:group-data-[state=collapsed]:hidden">Absensi Lampung</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarSeparator />      <SidebarContent>
        {/* PUBLIC SECTION - Always visible */}        <Collapsible open={isMainMenuOpen} onOpenChange={setIsMainMenuOpen} className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="w-full flex items-center justify-between hover:bg-sidebar-accent hover:text-sidebar-accent-foreground px-2 py-1.5 text-sm font-medium transition-colors rounded-md">
                <span className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  <span className="hidden md:inline">Menu Utama</span>
                  <span className="md:hidden">Menu</span>
                </span>
                <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">                  {publicItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild className="w-full">
                        <Link 
                          href={item.url}
                          onClick={handleMenuClick}
                          className="flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md group"
                        >
                          <item.icon className="h-4 w-4 flex-shrink-0" />
                          <span className="hidden md:inline truncate">{item.title}</span>
                          <span className="md:hidden text-xs truncate max-w-[80px]">
                            {item.title}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>        {/* USER SECTION - Only visible when authenticated */}
        {isAuthenticated && (
          <Collapsible open={isAlumniMenuOpen} onOpenChange={setIsAlumniMenuOpen} className="group/collapsible">
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="w-full flex items-center justify-between hover:bg-sidebar-accent hover:text-sidebar-accent-foreground px-2 py-1.5 text-sm font-medium transition-colors rounded-md">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="hidden md:inline">Menu Pegawai</span>
                    <span className="md:hidden">Pegawai</span>
                  </span>
                  <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-1">
                    {userItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild className="w-full">
                          <Link 
                            href={item.url}
                            onClick={handleMenuClick}
                            className="flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md group"
                          >
                            <item.icon className="h-4 w-4 flex-shrink-0" />
                            <span className="hidden md:inline truncate">{item.title}</span>
                            <span className="md:hidden text-xs truncate max-w-[80px]">
                              {item.title.split(' ')[0]}
                            </span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}        {/* USER PROFILE SECTION - Only visible when authenticated */}
        {isAuthenticated && (
          <Collapsible open={isProfileMenuOpen} onOpenChange={setIsProfileMenuOpen} className="group/collapsible">
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="w-full flex items-center justify-between hover:bg-sidebar-accent hover:text-sidebar-accent-foreground px-2 py-1.5 text-sm font-medium transition-colors rounded-md">
                  <span className="flex items-center gap-2">
                    <UserCircle className="h-4 w-4" />
                    <span className="hidden md:inline">Profil Saya</span>
                    <span className="md:hidden">Profil</span>
                  </span>
                  <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-1">
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild className="w-full">
                        <Link 
                          href="/pegawai/edit"
                          onClick={handleMenuClick}
                          className="flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md group"
                        >
                          <Edit className="h-4 w-4 flex-shrink-0" />
                          <span className="hidden md:inline truncate">Edit Pegawai</span>
                          <span className="md:hidden text-xs truncate">Edit</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild className="w-full">
                        <Link 
                          href="/pegawai/face-recognition"
                          onClick={handleMenuClick}
                          className="flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md group"
                        >
                          <Scan className="h-4 w-4 flex-shrink-0" />
                          <span className="hidden md:inline truncate">Face Recognition Saya</span>
                          <span className="md:hidden text-xs truncate">Face</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild className="w-full">
                        <Link 
                          href="/reset-password" 
                          target="_blank"
                          onClick={handleMenuClick}
                          className="flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md group"
                        >
                          <Key className="h-4 w-4 flex-shrink-0" />
                          <span className="hidden md:inline truncate">Ganti Password</span>
                          <span className="md:hidden text-xs truncate">Password</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}

        {/* ADMIN LAPORAN ABSENSI SECTION - Only visible for admin/verificator */}
        {isAuthenticated && isAdminOrVerificator && (
          <Collapsible defaultOpen className="group/collapsible">
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger>
                  <FileText className="mr-2 h-4 w-4" />
                  Menu Laporan Absensi
                  <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {adminLaporanAbsensiItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <Link href={item.url} onClick={handleMenuClick}>
                            <item.icon />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}

          {/* ADMIN PEGAWAI SECTION - Only visible for admin */}
        {isAuthenticated && isAdmin && (
          <Collapsible defaultOpen className="group/collapsible">
            <SidebarGroup>              <SidebarGroupLabel asChild>
                <CollapsibleTrigger>
                  <Users className="mr-2 h-4 w-4" />
                  Menu Administrasi Pegawai
                  <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>                    {adminPegawaiItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <Link href={item.url} onClick={handleMenuClick}>
                            <item.icon />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}

        {/* MASTER DATA ABSENSI SECTION - Only visible for admin */}
        {isAuthenticated && isAdmin && (
          <Collapsible defaultOpen className="group/collapsible">
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger>
                  <Database className="mr-2 h-4 w-4" />
                  Menu Master Data Absensi
                  <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {masterDataAbsensiItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <Link href={item.url} onClick={handleMenuClick}>
                            <item.icon />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}

        {/* MASTER DATA WILAYAH SECTION - Only visible for admin */}
        {isAuthenticated && isAdmin && (
          <Collapsible defaultOpen className="group/collapsible">
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger>
                  <MapPin className="mr-2 h-4 w-4" />
                  Menu Master Data Wilayah
                  <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {masterDataWilayahItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <Link href={item.url} onClick={handleMenuClick}>
                            <item.icon />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}
      </SidebarContent>      <SidebarFooter className="p-2 md:p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground p-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
                    <div className="flex items-center space-x-2 min-w-0">                      <Avatar className="h-6 w-6 md:h-8 md:w-8 flex-shrink-0">
                        <AvatarImage 
                          src={user?.avatarUrl || 
                               (user?.biografi?.foto ? imageAPI.getImageUrl(user.biografi.foto) : 
                                user?.biografi?.fotoProfil ? imageAPI.getImageUrl(user.biografi.fotoProfil) : undefined)} 
                          alt={user?.fullName}
                        />
                        <AvatarFallback className="bg-blue-500 text-white text-xs md:text-sm">
                          {user?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left min-w-0 hidden group-data-[collapsible=icon]:group-data-[state=collapsed]:hidden">
                        <div className="font-medium text-xs md:text-sm truncate">{user?.fullName}</div>
                        <div className="text-xs text-muted-foreground hidden md:block">{user?.role?.roleName || 'USER'}</div>
                      </div>
                    </div>
                    <ChevronUp className="ml-auto h-3 w-3 md:h-4 md:w-4 hidden group-data-[collapsible=icon]:group-data-[state=collapsed]:hidden" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>                <DropdownMenuContent align="end" className="w-48 md:w-56">
                  <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Keluar</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (              <SidebarMenuButton asChild className="p-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
                <Link href="/login" onClick={handleMenuClick} className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  <span className="hidden group-data-[collapsible=icon]:group-data-[state=collapsed]:hidden">Masuk</span>
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
