import React from 'react';
import {
  Footprints,
  Moon,
  Cookie,
  MessageSquare,
  Settings,
  Play,
  Sliders,
  Bot,
  Eye,
  ChevronDown,
  Minus,
  X,
  Search,
} from 'lucide-react';

export interface IconProps {
  size?: number | string;
  color?: string;
  className?: string;
  id?: string;
  style?: React.CSSProperties;
}

export const AppIcon: React.FC<IconProps> = ({ size = 24, color = '#fbf1c7', ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={color} {...props}>
    <path
      clipRule="evenodd"
      d="M20.998 10.949H24v3.102h-3v3.028h-1.487V20H18v-2.921h-1.487V20H15v-2.921H9V20H7.488v-2.921H6V20H4.487v-2.921H3V14.05H0V10.95h3V5h17.998v5.949zM6 10.949h1.488V8.102H6v2.847zm10.51 0H18V8.102h-1.49v2.847z"
    />
  </svg>
);

export const SearchIcon: React.FC<IconProps> = ({ size = 13, color = 'currentColor', ...props }) => (
  <Search size={typeof size === 'number' ? size : 13} color={color} {...props} />
);

export const MinimizeIcon: React.FC<IconProps> = ({ size = 10, color = 'currentColor', ...props }) => (
  <Minus size={typeof size === 'number' ? size : 10} color={color} {...props} />
);

export const CloseIcon: React.FC<IconProps> = ({ size = 10, color = 'currentColor', ...props }) => (
  <X size={typeof size === 'number' ? size : 10} color={color} {...props} />
);

export const PlayIcon: React.FC<IconProps> = ({ size = 14, color = 'currentColor', ...props }) => (
  <Play size={typeof size === 'number' ? size : 14} color={color} {...props} />
);

export const PetSettingsIcon: React.FC<IconProps> = ({ size = 14, color = 'currentColor', ...props }) => (
  <Sliders size={typeof size === 'number' ? size : 14} color={color} {...props} />
);

export const AIIcon: React.FC<IconProps> = ({ size = 14, color = 'currentColor', ...props }) => (
  <Bot size={typeof size === 'number' ? size : 14} color={color} {...props} />
);

export const SettingsIcon: React.FC<IconProps> = ({ size = 14, color = 'currentColor', ...props }) => (
  <Settings size={typeof size === 'number' ? size : 14} color={color} {...props} />
);

export const ChevronIcon: React.FC<IconProps> = ({ size = 10, color = 'currentColor', ...props }) => (
  <ChevronDown size={typeof size === 'number' ? size : 10} color={color} {...props} />
);

export const EyeIcon: React.FC<IconProps> = ({ size = 14, color = 'currentColor', ...props }) => (
  <Eye size={typeof size === 'number' ? size : 14} color={color} {...props} />
);

export const SleepIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', ...props }) => (
  <Moon size={typeof size === 'number' ? size : 20} color={color} {...props} />
);

export const FeedIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', ...props }) => (
  <Cookie size={typeof size === 'number' ? size : 20} color={color} {...props} />
);

export const WalkIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', ...props }) => (
  <Footprints size={typeof size === 'number' ? size : 20} color={color} {...props} />
);

export const AskIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', ...props }) => (
  <MessageSquare size={typeof size === 'number' ? size : 20} color={color} {...props} />
);
