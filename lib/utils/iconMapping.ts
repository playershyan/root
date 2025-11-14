/**
 * FontAwesome to Lucide Icon Mapping Utility
 * Provides a mapping from FontAwesome icon classes to Lucide React components
 */

import {
  // Navigation & UI
  Search, Menu, X, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Plus, Minus, Filter, Check, AlertCircle, Info, HelpCircle,
  
  // Communication
  Phone, Mail, MessageSquare, Bell, Send,
  
  // User & Profile
  User, Users, UserPlus, UserCheck, Shield, Crown, Star,
  
  // Automotive
  Car, Truck, Fuel, Gauge, Settings as Cog, Calendar, MapPin,
  
  // Actions & Status
  Heart, Share2, ExternalLink, Download, Upload, Copy, Trash2,
  Edit, Save, Eye, EyeOff, Lock, Unlock,
  
  // Business & Commerce
  CreditCard, ShoppingCart, DollarSign, Tag, TrendingUp, TrendingDown,
  BarChart, PieChart, Activity,
  
  // Media
  Image, Camera, Video, Film, Music, FileText, File, Folder,
  
  // Social
  Facebook, Twitter, Instagram, Linkedin, Youtube, Share,
  
  // Other
  Home, Building, Package, Clock, CheckCircle, XCircle, AlertTriangle,
  Lightbulb, Zap, Flame, Sparkles, Loader, RotateCw, RefreshCw,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ExternalLink as ArrowExternal,
  Headphones, Globe, Briefcase, Award, Gift, Rocket, Target,
} from 'lucide-react'

/**
 * Maps FontAwesome icon class names to Lucide React components
 * Usage: const Icon = iconMap['fa-search'] or iconMap['search']
 */
export const iconMap = {
  // Navigation
  'fa-search': Search,
  'search': Search,
  'fa-bars': Menu,
  'fa-menu': Menu,
  'bars': Menu,
  'fa-times': X,
  'fa-close': X,
  'times': X,
  'fa-chevron-down': ChevronDown,
  'chevron-down': ChevronDown,
  'fa-chevron-up': ChevronUp,
  'chevron-up': ChevronUp,
  'fa-chevron-left': ChevronLeft,
  'chevron-left': ChevronLeft,
  'fa-chevron-right': ChevronRight,
  'chevron-right': ChevronRight,
  'fa-plus': Plus,
  'plus': Plus,
  'fa-minus': Minus,
  'minus': Minus,
  'fa-filter': Filter,
  'filter': Filter,
  
  // Communication
  'fa-phone': Phone,
  'fa-phone-alt': Phone,
  'phone': Phone,
  'fa-envelope': Mail,
  'envelope': Mail,
  'fa-comment': MessageSquare,
  'fa-message': MessageSquare,
  'comment': MessageSquare,
  'fa-bell': Bell,
  'bell': Bell,
  'fa-paper-plane': Send,
  'paper-plane': Send,
  
  // User
  'fa-user': User,
  'user': User,
  'fa-users': Users,
  'users': Users,
  'fa-user-plus': UserPlus,
  'user-plus': UserPlus,
  'fa-user-check': UserCheck,
  'user-check': UserCheck,
  'fa-shield': Shield,
  'fa-shield-alt': Shield,
  'shield': Shield,
  'fa-crown': Crown,
  'crown': Crown,
  'fa-star': Star,
  'star': Star,
  
  // Automotive
  'fa-car': Car,
  'fa-car-side': Car,
  'car': Car,
  'fa-truck': Truck,
  'truck': Truck,
  'fa-gas-pump': Fuel,
  'gas-pump': Fuel,
  'fa-tachometer': Gauge,
  'fa-tachometer-alt': Gauge,
  'tachometer': Gauge,
  'fa-cog': Cog,
  'fa-cogs': Cog,
  'cog': Cog,
  'cogs': Cog,
  'fa-calendar': Calendar,
  'fa-calendar-alt': Calendar,
  'calendar': Calendar,
  'fa-map-marker': MapPin,
  'fa-map-marker-alt': MapPin,
  'map-marker': MapPin,
  
  // Actions
  'fa-heart': Heart,
  'heart': Heart,
  'fa-share': Share2,
  'fa-share-alt': Share2,
  'share': Share2,
  'fa-external-link': ExternalLink,
  'fa-external-link-alt': ExternalLink,
  'external-link': ExternalLink,
  'fa-download': Download,
  'download': Download,
  'fa-upload': Upload,
  'upload': Upload,
  'fa-copy': Copy,
  'copy': Copy,
  'fa-trash': Trash2,
  'fa-trash-alt': Trash2,
  'trash': Trash2,
  'fa-edit': Edit,
  'edit': Edit,
  'fa-save': Save,
  'save': Save,
  'fa-eye': Eye,
  'eye': Eye,
  'fa-eye-slash': EyeOff,
  'eye-slash': EyeOff,
  'fa-lock': Lock,
  'lock': Lock,
  'fa-unlock': Unlock,
  'unlock': Unlock,
  
  // Status
  'fa-check': Check,
  'fa-check-circle': CheckCircle,
  'check': Check,
  'check-circle': CheckCircle,
  'fa-times-circle': XCircle,
  'times-circle': XCircle,
  'fa-exclamation-circle': AlertCircle,
  'fa-exclamation-triangle': AlertTriangle,
  'exclamation-circle': AlertCircle,
  'exclamation-triangle': AlertTriangle,
  'fa-info-circle': Info,
  'info-circle': Info,
  'fa-question-circle': HelpCircle,
  'question-circle': HelpCircle,
  
  // Commerce
  'fa-credit-card': CreditCard,
  'credit-card': CreditCard,
  'fa-shopping-cart': ShoppingCart,
  'shopping-cart': ShoppingCart,
  'fa-dollar-sign': DollarSign,
  'dollar-sign': DollarSign,
  'fa-tag': Tag,
  'tag': Tag,
  'fa-arrow-up': TrendingUp,
  'arrow-up': ArrowUp,
  'fa-arrow-down': TrendingDown,
  'arrow-down': ArrowDown,
  'fa-chart-bar': BarChart,
  'chart-bar': BarChart,
  'fa-chart-pie': PieChart,
  'chart-pie': PieChart,
  'fa-chart-line': Activity,
  'chart-line': Activity,
  
  // Media
  'fa-image': Image,
  'fa-images': Image,
  'image': Image,
  'fa-camera': Camera,
  'camera': Camera,
  'fa-video': Video,
  'video': Video,
  'fa-film': Film,
  'film': Film,
  'fa-music': Music,
  'music': Music,
  'fa-file': File,
  'fa-file-alt': FileText,
  'file': File,
  'fa-folder': Folder,
  'folder': Folder,
  
  // Other
  'fa-home': Home,
  'home': Home,
  'fa-building': Building,
  'building': Building,
  'fa-box': Package,
  'fa-package': Package,
  'box': Package,
  'fa-clock': Clock,
  'clock': Clock,
  'fa-lightbulb': Lightbulb,
  'lightbulb': Lightbulb,
  'fa-bolt': Zap,
  'bolt': Zap,
  'fa-fire': Flame,
  'fire': Flame,
  'fa-sparkles': Sparkles,
  'sparkles': Sparkles,
  'fa-spinner': Loader,
  'fa-sync': RotateCw,
  'fa-redo': RefreshCw,
  'spinner': Loader,
  'fa-arrow-right': ArrowRight,
  'arrow-right': ArrowRight,
  'fa-arrow-left': ArrowLeft,
  'arrow-left': ArrowLeft,
  'fa-headset': Headphones,
  'fa-headphones': Headphones,
  'headset': Headphones,
  'fa-globe': Globe,
  'globe': Globe,
  'fa-briefcase': Briefcase,
  'briefcase': Briefcase,
  'fa-award': Award,
  'award': Award,
  'fa-gift': Gift,
  'gift': Gift,
  'fa-rocket': Rocket,
  'rocket': Rocket,
  'fa-bullseye': Target,
  'bullseye': Target,
  'fa-handshake': Heart, // Using Heart as alternative for handshake
  'handshake': Heart,
  'fa-road': Activity, // Using Activity as alternative for road
  'road': Activity,
}

/**
 * Get a Lucide icon component from a FontAwesome class string
 * @param faClass - FontAwesome class (e.g., 'fas fa-search' or 'fa-search')
 * @returns Lucide icon component or null if not found
 */
export function getLucideIcon(faClass: string) {
  // Extract icon name from class string
  // Handles: 'fas fa-search', 'fa-search', 'search'
  const iconName = faClass
    .split(' ')
    .find(cls => cls.startsWith('fa-'))
    ?.replace('fa-', '') || faClass.replace('fa-', '')
  
  return iconMap[iconName] || iconMap[`fa-${iconName}`] || null
}

/**
 * Helper to replace FontAwesome icon with Lucide in JSX
 * @param faClass - FontAwesome class string
 * @param props - Additional props to pass to the icon component
 */
export function IconReplace({ 
  faClass, 
  className = '', 
  size = 16,
  ...props 
}: { 
  faClass: string
  className?: string
  size?: number
  [key: string]: any
}) {
  const Icon = getLucideIcon(faClass)
  
  if (!Icon) {
    console.warn(`Icon mapping not found for: ${faClass}`)
    return null
  }
  
  return <Icon size={size} className={className} {...props} />
}

export default iconMap

